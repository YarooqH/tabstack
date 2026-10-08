/**
 * TabStack Session Snapshots
 * Keeps a persisted mirror of every open window so closed windows, crashes and
 * timed snapshots can be restored later into a fresh window with groups intact.
 */

import { getSettings } from '../shared/storage.js';
import { CHROMIUM_COLORS, SNAPSHOT_KINDS } from '../shared/constants.js';

// CHROMIUM_COLORS drives domain color hashing, so orange is added here instead
const GROUP_COLORS = new Set([...CHROMIUM_COLORS, 'orange']);

export const SNAPSHOT_ALARM = 'tabstack-session-snapshot';

// Stored outside DEFAULT_SETTINGS so "Reset to Defaults" never wipes them
const LIVE_STATE_KEY = 'sessionLiveState';
const SNAPSHOTS_KEY = 'sessionSnapshots';
const LAST_AUTO_KEY = 'sessionLastAutoSnapshotAt';
const BOOT_MARKER_KEY = 'sessionBootMarker';

// Auto-grouping stays paused this long after a restore so late page loads don't regroup it
const RESTORE_GRACE_MS = 3000;

const MAX_CLOSED_WINDOWS = 25;
const MAX_PREVIOUS_SESSIONS = 5;
const MAX_MANUAL_SNAPSHOTS = 50;
const MIN_TABS_FOR_CLOSED_WINDOW = 2;
const LIVE_STATE_REFRESH_MS = 1000;
// A mirrored window missing from the browser this long without a close event is dropped
const GHOST_WINDOW_MS = 60 * 1000;

const IGNORED_URL_PREFIXES = [
  'chrome://newtab', 'brave://newtab', 'edge://newtab', 'opera://startpage',
  'chrome-search://', 'about:blank', 'chrome://new-tab-page'
];

// Windows currently being rebuilt by restoreSnapshot; auto-grouping skips them
const restoringWindowIds = new Set();

// Windows whose tabs are being torn down; their mirrored copy must not be overwritten
const closingWindowIds = new Set();

// All storage read-modify-writes go through this chain so they never interleave
let queue = Promise.resolve();
function enqueue(task) {
  const run = queue.then(task, task);
  queue = run.catch((err) => console.error('[TabStack Snapshots]', err));
  return run;
}

export function isWindowRestoring(windowId) {
  return restoringWindowIds.has(windowId);
}

export function markWindowClosing(windowId) {
  closingWindowIds.add(windowId);
}

function isRestorableUrl(url) {
  if (!url || /^(javascript|data):/i.test(url)) return false;
  return !IGNORED_URL_PREFIXES.some(prefix => url.startsWith(prefix));
}

function serializeWindow(win, groups) {
  const tabs = (win.tabs || [])
    .map(t => ({
      url: t.url || t.pendingUrl || '',
      title: t.title || '',
      pinned: !!t.pinned,
      groupId: t.groupId ?? -1,
      favIconUrl: t.favIconUrl && /^https?:/.test(t.favIconUrl) && t.favIconUrl.length < 400 ? t.favIconUrl : ''
    }))
    .filter(t => isRestorableUrl(t.url));

  const usedGroupIds = new Set(tabs.map(t => t.groupId));
  return {
    windowId: win.id,
    tabs,
    groups: groups
      .filter(g => g.windowId === win.id && usedGroupIds.has(g.id))
      .map(g => ({ id: g.id, title: g.title || '', color: g.color || 'grey', collapsed: !!g.collapsed }))
  };
}

async function captureOpenWindows() {
  const [windows, groups] = await Promise.all([
    chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }),
    chrome.tabGroups.query({})
  ]);
  return windows
    .filter(w => !w.incognito)
    .map(w => serializeWindow(w, groups));
}

function countTabs(windows) {
  return windows.reduce((sum, w) => sum + w.tabs.length, 0);
}

function signatureOf(windows) {
  return JSON.stringify(windows.map(w => w.tabs.map(t => t.url)));
}

async function readSnapshots() {
  const items = await chrome.storage.local.get({ [SNAPSHOTS_KEY]: [] });
  return Array.isArray(items[SNAPSHOTS_KEY]) ? items[SNAPSHOTS_KEY] : [];
}

/**
 * Inserts a snapshot newest-first and trims each kind to its retention cap
 */
async function insertSnapshot(kind, windows) {
  if (windows.length === 0) return null;

  const settings = await getSettings();
  const snapshots = await readSnapshots();

  // Skip automatic snapshots that are identical to the newest one of the same kind
  if (kind === SNAPSHOT_KINDS.AUTO || kind === SNAPSHOT_KINDS.PREVIOUS_SESSION) {
    const latest = snapshots.find(s => s.kind === kind);
    if (latest && signatureOf(latest.windows) === signatureOf(windows)) return null;
  }

  const snapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    kind,
    createdAt: new Date().toISOString(),
    tabCount: countTabs(windows),
    windows: windows.map(({ tabs, groups }) => ({ tabs, groups }))
  };

  const caps = {
    [SNAPSHOT_KINDS.AUTO]: settings.snapshotKeepCount || 24,
    [SNAPSHOT_KINDS.CLOSED_WINDOW]: MAX_CLOSED_WINDOWS,
    [SNAPSHOT_KINDS.PREVIOUS_SESSION]: MAX_PREVIOUS_SESSIONS,
    [SNAPSHOT_KINDS.MANUAL]: MAX_MANUAL_SNAPSHOTS
  };
  const seen = {};
  const trimmed = [snapshot, ...snapshots].filter(s => {
    seen[s.kind] = (seen[s.kind] || 0) + 1;
    return seen[s.kind] <= (caps[s.kind] ?? MAX_MANUAL_SNAPSHOTS);
  });

  await chrome.storage.local.set({ [SNAPSHOTS_KEY]: trimmed });
  return snapshot;
}

/**
 * On the first event of a new browser session, archive whatever the mirror held
 * when the previous session ended (crash, power loss, or a restore that failed).
 * chrome.storage.session survives service worker restarts but not browser restarts.
 */
async function archivePreviousSessionIfNeeded() {
  const marker = await chrome.storage.session.get(BOOT_MARKER_KEY);
  if (marker[BOOT_MARKER_KEY]) return;

  const items = await chrome.storage.local.get({ [LIVE_STATE_KEY]: {} });
  const previous = Object.values(items[LIVE_STATE_KEY] || {}).filter(w => w.tabs?.length > 0);
  if (previous.length > 0) {
    await insertSnapshot(SNAPSHOT_KINDS.PREVIOUS_SESSION, previous);
  }

  // Window ids are reused across browser sessions, so the old mirror must go
  await chrome.storage.local.set({ [LIVE_STATE_KEY]: {} });
  await chrome.storage.session.set({ [BOOT_MARKER_KEY]: Date.now() });
}

/**
 * Refreshes the persisted mirror of open windows. Windows are only removed from
 * the mirror by handleWindowClosed, so a refresh racing a window close can't
 * erase the copy we need to archive.
 */
export function refreshLiveState() {
  return enqueue(async () => {
    await archivePreviousSessionIfNeeded();

    const windows = await captureOpenWindows();
    const items = await chrome.storage.local.get({ [LIVE_STATE_KEY]: {} });
    const liveState = items[LIVE_STATE_KEY] || {};
    const now = Date.now();

    for (const win of windows) {
      if (closingWindowIds.has(win.windowId)) continue;
      liveState[win.windowId] = { ...win, updatedAt: now };
    }

    const openIds = new Set(windows.map(w => String(w.windowId)));
    for (const [id, entry] of Object.entries(liveState)) {
      if (openIds.has(id)) continue;
      if (!entry.missingSince) {
        entry.missingSince = now;
      } else if (now - entry.missingSince > GHOST_WINDOW_MS) {
        delete liveState[id];
      }
    }

    await chrome.storage.local.set({ [LIVE_STATE_KEY]: liveState });
  });
}

let refreshTimer = null;

/**
 * Coalesces bursts of tab events into one refresh at most every second.
 * Unlike a debounce, a page that keeps changing its title can't postpone it forever.
 */
export function scheduleLiveStateRefresh() {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    refreshLiveState();
  }, LIVE_STATE_REFRESH_MS);
}

/**
 * Archives a window's last known tabs when it closes
 * @param {number} windowId
 */
export function handleWindowClosed(windowId) {
  return enqueue(async () => {
    closingWindowIds.delete(windowId);
    await archivePreviousSessionIfNeeded();

    const items = await chrome.storage.local.get({ [LIVE_STATE_KEY]: {} });
    const liveState = items[LIVE_STATE_KEY] || {};
    const closed = liveState[windowId];
    if (!closed?.tabs) return;

    delete liveState[windowId];
    await chrome.storage.local.set({ [LIVE_STATE_KEY]: liveState });

    const settings = await getSettings();
    if (settings.snapshotClosedWindows && closed.tabs.length >= MIN_TABS_FOR_CLOSED_WINDOW) {
      await insertSnapshot(SNAPSHOT_KINDS.CLOSED_WINDOW, [closed]);
    }
  });
}

/**
 * Saves every open window as one snapshot
 * @param {'auto'|'manual'} kind
 */
export function takeSnapshot(kind = SNAPSHOT_KINDS.MANUAL) {
  return enqueue(async () => {
    await archivePreviousSessionIfNeeded();
    const windows = (await captureOpenWindows()).filter(w => w.tabs.length > 0);
    if (kind === SNAPSHOT_KINDS.AUTO) {
      await chrome.storage.local.set({ [LAST_AUTO_KEY]: Date.now() });
    }
    return insertSnapshot(kind, windows);
  });
}

export async function getSnapshots() {
  await queue;
  return readSnapshots();
}

export function deleteSnapshot(snapshotId) {
  return enqueue(async () => {
    const snapshots = await readSnapshots();
    await chrome.storage.local.set({ [SNAPSHOTS_KEY]: snapshots.filter(s => s.id !== snapshotId) });
  });
}

export function clearSnapshots() {
  return enqueue(() => chrome.storage.local.set({ [SNAPSHOTS_KEY]: [] }));
}

/**
 * Merges snapshots from an exported JSON file, skipping ids already present
 * @param {Array} incoming
 * @returns {Promise<number>} Count of imported snapshots
 */
export function importSnapshots(incoming) {
  return enqueue(async () => {
    const snapshots = await readSnapshots();
    const existingIds = new Set(snapshots.map(s => s.id));
    const valid = (Array.isArray(incoming) ? incoming : [])
      .filter(s => s && s.id && !existingIds.has(s.id) && Array.isArray(s.windows))
      .map(s => ({
        id: String(s.id),
        kind: Object.values(SNAPSHOT_KINDS).includes(s.kind) ? s.kind : SNAPSHOT_KINDS.MANUAL,
        createdAt: s.createdAt || new Date().toISOString(),
        windows: s.windows
          .map(w => ({
            tabs: (Array.isArray(w.tabs) ? w.tabs : [])
              .filter(t => t && typeof t.url === 'string' && isRestorableUrl(t.url))
              .map(t => ({
                url: t.url,
                title: String(t.title || ''),
                pinned: !!t.pinned,
                groupId: Number.isInteger(t.groupId) ? t.groupId : -1,
                favIconUrl: typeof t.favIconUrl === 'string' && /^https?:/.test(t.favIconUrl) ? t.favIconUrl : ''
              })),
            groups: (Array.isArray(w.groups) ? w.groups : [])
              .filter(g => g && Number.isInteger(g.id))
              .map(g => ({
                id: g.id,
                title: String(g.title || ''),
                color: GROUP_COLORS.has(g.color) ? g.color : 'grey',
                collapsed: !!g.collapsed
              }))
          }))
          .filter(w => w.tabs.length > 0)
      }))
      .filter(s => s.windows.length > 0)
      .map(s => ({ ...s, tabCount: countTabs(s.windows) }));

    const merged = [...snapshots, ...valid]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    await chrome.storage.local.set({ [SNAPSHOTS_KEY]: merged });
    return valid.length;
  });
}

/**
 * (Re)creates the periodic snapshot alarm from current settings
 */
export async function syncSnapshotAlarm() {
  const settings = await getSettings();
  const existing = await chrome.alarms.get(SNAPSHOT_ALARM);
  const period = Number(settings.snapshotIntervalMinutes) || 360;

  if (!settings.snapshotsEnabled) {
    if (existing) await chrome.alarms.clear(SNAPSHOT_ALARM);
    return;
  }

  if (!existing || existing.periodInMinutes !== period) {
    // Chrome may drop alarms on browser restart, so count from the last auto snapshot
    // rather than from now; otherwise frequent restarts could postpone it forever
    const items = await chrome.storage.local.get({ [LAST_AUTO_KEY]: 0 });
    const elapsedMinutes = (Date.now() - items[LAST_AUTO_KEY]) / 60000;
    const delayInMinutes = Math.max(1, Math.min(period, period - elapsedMinutes));
    await chrome.alarms.create(SNAPSHOT_ALARM, { periodInMinutes: period, delayInMinutes });
  }
}

/**
 * Waits until a freshly created tab has committed its URL so it can be discarded
 * without losing the page it should come back to
 */
function waitForCommit(tabId, timeoutMs = 15000) {
  const isCommitted = (tab) => tab.status === 'complete' || (tab.url && tab.title && tab.title !== tab.url);

  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };
    const listener = (id, changeInfo, tab) => {
      if (id === tabId && isCommitted(tab)) done();
    };
    const timer = setTimeout(done, timeoutMs);
    chrome.tabs.onUpdated.addListener(listener);

    // Fast pages may have finished before the listener was attached
    chrome.tabs.get(tabId).then(tab => { if (isCommitted(tab)) done(); }, done);
  });
}

/**
 * Opens a stored window in a new browser window, recreating pins and tab groups
 * @param {{ tabs: Array, groups: Array }} storedWindow
 * @param {boolean} sleepBackgroundTabs
 * @returns {Promise<{ opened: number, skipped: number }>}
 */
async function restoreWindow(storedWindow, sleepBackgroundTabs) {
  const tabs = storedWindow.tabs.filter(t => isRestorableUrl(t.url));
  if (tabs.length === 0) return { opened: 0, skipped: 0 };

  const win = await chrome.windows.create({ focused: true });
  restoringWindowIds.add(win.id);
  const placeholderTabIds = (win.tabs || []).map(t => t.id);

  const createdByOldGroup = new Map();
  const backgroundTabIds = [];
  let opened = 0;
  let skipped = 0;

  try {
    for (const stored of tabs) {
      try {
        const tab = await chrome.tabs.create({
          windowId: win.id,
          url: stored.url,
          pinned: stored.pinned,
          active: opened === 0
        });
        opened++;
        if (opened > 1) backgroundTabIds.push(tab.id);

        if (!stored.pinned && stored.groupId !== -1) {
          if (!createdByOldGroup.has(stored.groupId)) createdByOldGroup.set(stored.groupId, []);
          createdByOldGroup.get(stored.groupId).push(tab.id);
        }
      } catch {
        // file:// or other URLs the extension isn't allowed to open
        skipped++;
      }
    }

    if (opened > 0 && placeholderTabIds.length > 0) {
      await chrome.tabs.remove(placeholderTabIds).catch(() => {});
    }

    for (const group of storedWindow.groups || []) {
      const tabIds = createdByOldGroup.get(group.id);
      if (!tabIds || tabIds.length === 0) continue;
      try {
        const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: win.id } });
        await chrome.tabGroups.update(groupId, {
          title: group.title,
          color: group.color,
          collapsed: group.collapsed
        });
      } catch (err) {
        console.warn('[TabStack Snapshots] Could not recreate group:', err);
      }
    }
  } finally {
    setTimeout(() => restoringWindowIds.delete(win.id), RESTORE_GRACE_MS);
  }

  if (sleepBackgroundTabs) {
    // Not awaited: discarding waits on page commits and shouldn't hold up the reply
    Promise.all(backgroundTabIds.map(async (tabId) => {
      await waitForCommit(tabId);
      await chrome.tabs.discard(tabId).catch(() => {});
    }));
  }

  return { opened, skipped };
}

/**
 * Restores a snapshot (or one window of it) into new browser windows
 * @param {string} snapshotId
 * @param {number|null} windowIndex Restore only this window when set
 */
export async function restoreSnapshot(snapshotId, windowIndex = null) {
  const snapshots = await getSnapshots();
  const snapshot = snapshots.find(s => s.id === snapshotId);
  if (!snapshot) return { success: false, error: 'Snapshot not found' };

  const settings = await getSettings();
  const targets = windowIndex === null ? snapshot.windows : [snapshot.windows[windowIndex]].filter(Boolean);

  let opened = 0;
  let skipped = 0;
  for (const storedWindow of targets) {
    const result = await restoreWindow(storedWindow, !!settings.autoDiscardEnabled);
    opened += result.opened;
    skipped += result.skipped;
  }

  return { success: opened > 0, opened, skipped };
}
