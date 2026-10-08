/**
 * TabStack Popup Controller
 * Renders live tab stacks, search filtering, session stashing, whitelist manager, and quick actions
 */

import { MESSAGE_TYPES, SNAPSHOT_KINDS } from '../shared/constants.js';
import { getSettings, setSetting, removeStash } from '../shared/storage.js';
import { extractDomain, formatDomainTitle, getDomainColor } from '../background/utils.js';
import { initTheme, setTheme } from '../shared/theme.js';

// State
let allTabs = [];
let allGroups = [];
let currentWindowId = null;
let currentSettings = null;
let activeFilterQuery = '';
let currentActiveDomain = null;
let liveListenersAttached = false;
let snapshots = [];
const expandedSnapshotIds = new Set();

// DOM Elements
const themeControl = document.getElementById('themeControl');
const statTotalTabs = document.getElementById('statTotalTabs');
const statTotalGroups = document.getElementById('statTotalGroups');
const statSleepingTabs = document.getElementById('statSleepingTabs');
const statRamSaved = document.getElementById('statRamSaved');
const toggleAutoGroup = document.getElementById('toggleAutoGroup');
const toggleAccordion = document.getElementById('toggleAccordion');
const toggleRamSaver = document.getElementById('toggleRamSaver');
const togglePreserveGroups = document.getElementById('togglePreserveGroups');
const badgeProtectionStatus = document.getElementById('badgeProtectionStatus');
const descProtection = document.getElementById('descProtection');
const groupProtectionCard = document.getElementById('groupProtectionCard');
const autoStackInfoBtn = document.getElementById('autoStackInfoBtn');

const searchContainer = document.getElementById('searchContainer');
const searchInput = document.getElementById('searchInput');
const btnClearSearch = document.getElementById('btnClearSearch');

const stacksList = document.getElementById('stacksList');
const emptyState = document.getElementById('emptyState');
const liveView = document.getElementById('liveView');
const stashView = document.getElementById('stashView');
const stashesList = document.getElementById('stashesList');
const emptyStash = document.getElementById('emptyStash');

const whitelistView = document.getElementById('whitelistView');
const popupWhitelistInput = document.getElementById('popupWhitelistInput');
const btnPopupAddWhitelist = document.getElementById('btnPopupAddWhitelist');
const popupWhitelistTags = document.getElementById('popupWhitelistTags');
const emptyWhitelist = document.getElementById('emptyWhitelist');
const currentDomainSection = document.getElementById('currentDomainSection');
const btnWhitelistCurrent = document.getElementById('btnWhitelistCurrent');
const currentDomainText = document.getElementById('currentDomainText');

const tabNavLive = document.getElementById('tabNavLive');
const tabNavStash = document.getElementById('tabNavStash');
const tabNavWhitelist = document.getElementById('tabNavWhitelist');
const tabNavSessions = document.getElementById('tabNavSessions');
const stashCount = document.getElementById('stashCount');
const sessionsCount = document.getElementById('sessionsCount');

const sessionsView = document.getElementById('sessionsView');
const snapshotsList = document.getElementById('snapshotsList');
const emptySnapshots = document.getElementById('emptySnapshots');
const sessionsScheduleText = document.getElementById('sessionsScheduleText');
const btnSnapshotNow = document.getElementById('btnSnapshotNow');
const whitelistCount = document.getElementById('whitelistCount');

const btnStackNow = document.getElementById('btnStackNow');
const btnDeduplicate = document.getElementById('btnDeduplicate');
const btnCollapseAll = document.getElementById('btnCollapseAll');
const btnOptions = document.getElementById('btnOptions');
const toast = document.getElementById('toast');

/**
 * Initialize Popup
 */
async function init() {
  await initTheme();

  const brandVersion = document.getElementById('brandVersion');
  if (brandVersion) brandVersion.textContent = `v${chrome.runtime.getManifest().version}`;

  // Get active window
  const currentWindow = await chrome.windows.getCurrent();
  currentWindowId = currentWindow.id;

  // Load settings
  currentSettings = await getSettings();

  // Setup theme control active state
  updateThemeButtonsActiveState(currentSettings.theme || 'system');

  // Setup toggle states
  toggleAutoGroup.checked = !!currentSettings.autoGroupEnabled;
  toggleAccordion.checked = !!currentSettings.accordionMode;
  toggleRamSaver.checked = !!currentSettings.autoDiscardEnabled;
  if (togglePreserveGroups) {
    const isPreserve = currentSettings.preserveExistingGroups !== false;
    togglePreserveGroups.checked = isPreserve;
    updatePreserveGroupsUI(isPreserve);
  }

  // Event Listeners
  setupEventListeners();
  setupRealtimeListeners();

  // Initial load
  await refreshData();
  await loadSnapshots();
}

function updateThemeButtonsActiveState(theme) {
  themeControl?.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });
}

function updatePreserveGroupsUI(isActive) {
  if (!badgeProtectionStatus || !descProtection) return;
  if (isActive) {
    badgeProtectionStatus.textContent = 'Protected';
    badgeProtectionStatus.className = 'badge-protection-status active';
    groupProtectionCard?.classList.add('active');
    descProtection.textContent = 'Only clusters ungrouped tabs. Existing or custom groups are protected and will never be modified or merged.';
  } else {
    badgeProtectionStatus.textContent = 'Off';
    badgeProtectionStatus.className = 'badge-protection-status inactive';
    groupProtectionCard?.classList.remove('active');
    descProtection.textContent = 'Group protection disabled. Auto-Stack will merge tabs matching the same domain across all groups.';
  }
}

/**
 * Register live Chromium tab and tabGroup listeners so popup updates in real-time
 */
function setupRealtimeListeners() {
  if (liveListenersAttached) return;
  liveListenersAttached = true;

  // Debounced refresh helper for tab updates
  let refreshTimer = null;
  const triggerLiveRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshData();
    }, 120);
  };

  chrome.tabs.onUpdated?.addListener((tabId, changeInfo) => {
    if (changeInfo.discarded !== undefined || changeInfo.title || changeInfo.status === 'complete' || changeInfo.url) {
      triggerLiveRefresh();
    }
  });

  chrome.tabs.onActivated?.addListener(triggerLiveRefresh);
  chrome.tabs.onCreated?.addListener(triggerLiveRefresh);
  chrome.tabs.onRemoved?.addListener(triggerLiveRefresh);
  chrome.tabGroups.onUpdated?.addListener(triggerLiveRefresh);
  chrome.tabGroups.onCreated?.addListener(triggerLiveRefresh);
  chrome.tabGroups.onRemoved?.addListener(triggerLiveRefresh);
}

/**
 * Register all event handlers
 */
function setupEventListeners() {
  // Auto-Stack Info Button caution notice popover
  autoStackInfoBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    autoStackInfoBtn.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#autoStackInfoBtn')) {
      autoStackInfoBtn?.classList.remove('active');
    }
  });

  // Theme segmented buttons
  themeControl?.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const themeVal = btn.dataset.themeVal;
      await setTheme(themeVal);
      updateThemeButtonsActiveState(themeVal);
      showToast(`Theme: ${themeVal.charAt(0).toUpperCase() + themeVal.slice(1)}`);
    });
  });

  // Toggles
  toggleAutoGroup.addEventListener('change', async (e) => {
    await setSetting('autoGroupEnabled', e.target.checked);
    if (e.target.checked) {
      await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.STACK_NOW, windowId: currentWindowId });
    }
    showToast(e.target.checked ? 'Auto-Stack Enabled' : 'Auto-Stack Disabled (Manual mode)');
    setTimeout(refreshData, 200);
  });

  toggleAccordion.addEventListener('change', async (e) => {
    await setSetting('accordionMode', e.target.checked);
    showToast(e.target.checked ? 'Accordion Focus Enabled' : 'Accordion Focus Disabled');
  });

  // RAM Saver Toggle: triggers real-time discard across all eligible tabs when turned ON
  toggleRamSaver.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    await setSetting('autoDiscardEnabled', isEnabled);

    if (isEnabled) {
      showToast('💤 RAM Saver ON — Hibernating background tabs...');
      const res = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.DISCARD_NOW,
        windowId: currentWindowId,
        forceImmediate: true
      });
      const count = res?.count || 0;
      if (count > 0) {
        showToast(`Freed RAM: Hibernated ${count} tab(s)`);
      }
    } else {
      showToast('RAM Saver Disabled');
    }

    await refreshData();
  });

  // Preserve Existing Groups Toggle
  togglePreserveGroups?.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    await setSetting('preserveExistingGroups', isEnabled);
    updatePreserveGroupsUI(isEnabled);
    showToast(isEnabled
      ? '🛡️ Existing groups protected (Only ungrouped tabs stack)'
      : '⚠️ Group protection OFF (Tabs may merge into same-site stacks)'
    );
  });

  // Navigation tab switching
  tabNavLive.addEventListener('click', () => switchView('live'));
  tabNavStash.addEventListener('click', () => switchView('stash'));
  tabNavWhitelist.addEventListener('click', () => switchView('whitelist'));
  tabNavSessions.addEventListener('click', async () => {
    switchView('sessions');
    await loadSnapshots();
  });

  btnSnapshotNow.addEventListener('click', async () => {
    btnSnapshotNow.disabled = true;
    const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TAKE_SNAPSHOT });
    btnSnapshotNow.disabled = false;
    showToast(res?.success ? `Saved ${res.snapshot.tabCount} tab(s)` : 'No tabs to save');
    await loadSnapshots();
  });

  // Search input
  searchInput.addEventListener('input', (e) => {
    activeFilterQuery = e.target.value.trim().toLowerCase();
    btnClearSearch.classList.toggle('hidden', activeFilterQuery === '');
    renderStacks();
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    activeFilterQuery = '';
    btnClearSearch.classList.add('hidden');
    renderStacks();
  });

  // Whitelist handlers inside popup
  btnWhitelistCurrent.addEventListener('click', async () => {
    if (!currentActiveDomain) return;
    await addWhitelistDomain(currentActiveDomain);
  });

  btnPopupAddWhitelist.addEventListener('click', () => {
    const val = popupWhitelistInput.value.trim();
    if (val) addWhitelistDomain(val);
  });

  popupWhitelistInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = popupWhitelistInput.value.trim();
      if (val) addWhitelistDomain(val);
    }
  });

  // Quick Action Buttons
  btnStackNow.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.STACK_NOW, windowId: currentWindowId });
    showToast('Grouped active window tabs!');
    setTimeout(refreshData, 250);
  });

  btnDeduplicate.addEventListener('click', async () => {
    const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DEDUPLICATE_TABS, windowId: currentWindowId });
    const count = res?.count || 0;
    showToast(count > 0 ? `Removed ${count} duplicate tab(s)!` : 'No duplicate tabs found');
    setTimeout(refreshData, 200);
  });

  btnCollapseAll.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.COLLAPSE_ALL, windowId: currentWindowId });
    showToast('Collapsed all groups');
    setTimeout(refreshData, 200);
  });

  btnOptions.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('src/options/options.html'));
    }
  });
}

/**
 * Fetch live tabs, groups, and metrics
 */
async function refreshData() {
  try {
    const [tabs, groups, statsRes, settings] = await Promise.all([
      chrome.tabs.query({ windowId: currentWindowId }),
      chrome.tabGroups.query({ windowId: currentWindowId }),
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_STATS }),
      getSettings()
    ]);

    allTabs = tabs;
    allGroups = groups;
    currentSettings = settings;

    // Sync preserve groups toggle if changed externally
    if (togglePreserveGroups && document.activeElement !== togglePreserveGroups) {
      const isPreserve = settings.preserveExistingGroups !== false;
      togglePreserveGroups.checked = isPreserve;
      updatePreserveGroupsUI(isPreserve);
    }

    // Detect active tab domain for 1-click whitelist button
    const activeTab = tabs.find(t => t.active);
    currentActiveDomain = activeTab ? extractDomain(activeTab.url || activeTab.pendingUrl, settings.domainMode) : null;

    if (currentActiveDomain && !(settings.whitelistDomains || []).includes(currentActiveDomain.toLowerCase())) {
      currentDomainSection.classList.remove('hidden');
      currentDomainText.textContent = currentActiveDomain;
    } else {
      currentDomainSection.classList.add('hidden');
    }

    // Calculate real-time sleeping tabs count in current window
    const windowSleepingCount = tabs.filter(t => t.discarded).length;
    const globalSleepingCount = statsRes?.data?.discardedTabs || windowSleepingCount;
    const ramSavedMb = statsRes?.data?.estimatedRamSavedMb || Math.round(globalSleepingCount * 65);

    // Update metrics bar in real time
    statTotalTabs.textContent = tabs.length;
    statTotalGroups.textContent = groups.length;
    if (statSleepingTabs) {
      statSleepingTabs.textContent = windowSleepingCount;
    }
    statRamSaved.textContent = `${ramSavedMb} MB`;

    // Update badges
    stashCount.textContent = (settings.stashedSessions || []).length;
    whitelistCount.textContent = (settings.whitelistDomains || []).length;

    renderStacks();
    renderStashes();
    renderWhitelist();
  } catch (err) {
    console.error('Error refreshing popup data:', err);
  }
}

/**
 * Switches between views
 * @param {'live'|'stash'|'whitelist'|'sessions'} view 
 */
function switchView(view) {
  tabNavLive.classList.toggle('active', view === 'live');
  tabNavStash.classList.toggle('active', view === 'stash');
  tabNavWhitelist.classList.toggle('active', view === 'whitelist');
  tabNavSessions.classList.toggle('active', view === 'sessions');

  liveView.classList.toggle('hidden', view !== 'live');
  stashView.classList.toggle('hidden', view !== 'stash');
  whitelistView.classList.toggle('hidden', view !== 'whitelist');
  sessionsView.classList.toggle('hidden', view !== 'sessions');

  searchContainer.classList.toggle('hidden', view !== 'live');
}

/**
 * Render Live Tab Stacks
 */
function renderStacks() {
  stacksList.innerHTML = '';
  let totalVisibleItems = 0;

  const whitelistSet = new Set((currentSettings?.whitelistDomains || []).map(d => d.toLowerCase()));

  // Map of tabs by groupId
  const groupTabsMap = new Map();
  const ungroupedTabs = [];

  for (const tab of allTabs) {
    if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      if (!groupTabsMap.has(tab.groupId)) {
        groupTabsMap.set(tab.groupId, []);
      }
      groupTabsMap.get(tab.groupId).push(tab);
    } else {
      ungroupedTabs.push(tab);
    }
  }

  // Render grouped stacks
  for (const group of allGroups) {
    const groupTabs = groupTabsMap.get(group.id) || [];
    
    // Filter tabs by active search query
    const filteredTabs = activeFilterQuery 
      ? groupTabs.filter(t => 
          (t.title && t.title.toLowerCase().includes(activeFilterQuery)) ||
          (t.url && t.url.toLowerCase().includes(activeFilterQuery)) ||
          (group.title && group.title.toLowerCase().includes(activeFilterQuery))
        )
      : groupTabs;

    if (filteredTabs.length === 0) continue;
    totalVisibleItems++;

    const card = document.createElement('div');
    card.className = `stack-card ${group.collapsed && !activeFilterQuery ? 'collapsed' : ''}`;

    const groupFavicon = groupTabs.find(t => t.favIconUrl)?.favIconUrl || DEFAULT_FAVICON;
    const anyAwakeTabs = groupTabs.some(t => !t.discarded && !t.active);

    card.innerHTML = `
      <div class="stack-header" data-group-id="${group.id}">
        <div class="stack-info">
          <img class="group-domain-favicon" src="${escapeHtml(groupFavicon)}" alt="">
          <span class="stack-title" title="${escapeHtml(group.title || 'Group')}">${escapeHtml(group.title || 'Untitled Stack')}</span>
          <span class="stack-count">${filteredTabs.length}</span>
        </div>
        <div class="stack-actions">
          ${anyAwakeTabs ? `
            <button class="mini-btn btn-sleep-group" title="Sleep all tabs in stack to free RAM" data-group-id="${group.id}">
              <span style="font-size: 11px;">💤</span>
            </button>
          ` : ''}
          <button class="mini-btn btn-stash" title="Stash Stack (Save & Close)" data-group-id="${group.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
          </button>
          <button class="mini-btn danger btn-close-group" title="Close entire stack" data-group-id="${group.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div class="mini-btn chevron-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
      </div>
      <div class="tab-items-container">
        ${filteredTabs.map(t => renderTabItemHtml(t, false)).join('')}
      </div>
    `;

    // Header click toggles collapse
    const header = card.querySelector('.stack-header');
    header.addEventListener('click', async (e) => {
      if (e.target.closest('.btn-stash') || e.target.closest('.btn-close-group') || e.target.closest('.btn-sleep-group')) return;
      const nextCollapsed = !card.classList.contains('collapsed');
      card.classList.toggle('collapsed', nextCollapsed);
      await chrome.tabGroups.update(group.id, { collapsed: nextCollapsed });
    });

    // 1-Click Sleep Stack
    const btnSleepGroup = card.querySelector('.btn-sleep-group');
    btnSleepGroup?.addEventListener('click', async (e) => {
      e.stopPropagation();
      const res = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.DISCARD_NOW,
        groupId: group.id,
        forceImmediate: true
      });
      showToast(`Hibernated tabs in ${group.title || 'Stack'}`);
      await refreshData();
    });

    // Stash stack click
    const btnStash = card.querySelector('.btn-stash');
    btnStash.addEventListener('click', async (e) => {
      e.stopPropagation();
      const res = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.STASH_GROUP,
        groupId: group.id
      });
      if (res?.success) {
        showToast('Stack stashed!');
        await refreshData();
      }
    });

    // Close group click
    const btnCloseGroup = card.querySelector('.btn-close-group');
    btnCloseGroup.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tabIds = groupTabs.map(t => t.id);
      await chrome.tabs.remove(tabIds);
      showToast('Stack closed');
      await refreshData();
    });

    stacksList.appendChild(card);
  }

  // Render ungrouped tabs SECTIONIZED BY DOMAIN
  if (ungroupedTabs.length > 0) {
    const domainMap = new Map();

    for (const tab of ungroupedTabs) {
      const domain = extractDomain(tab.url || tab.pendingUrl, currentSettings?.domainMode) || 'Browser Pages';
      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }
      domainMap.get(domain).push(tab);
    }

    // Sort domains by tab count descending
    const sortedDomains = Array.from(domainMap.entries()).sort((a, b) => b[1].length - a[1].length);

    for (const [domain, domainTabs] of sortedDomains) {
      const filteredDomainTabs = activeFilterQuery
        ? domainTabs.filter(t => 
            (t.title && t.title.toLowerCase().includes(activeFilterQuery)) ||
            (t.url && t.url.toLowerCase().includes(activeFilterQuery)) ||
            domain.toLowerCase().includes(activeFilterQuery)
          )
        : domainTabs;

      if (filteredDomainTabs.length === 0) continue;
      totalVisibleItems++;

      const isWhitelisted = domain && whitelistSet.has(domain.toLowerCase());
      const title = formatDomainTitle(domain);
      const domainFavicon = domainTabs.find(t => t.favIconUrl)?.favIconUrl || DEFAULT_FAVICON;

      const sectionCard = document.createElement('div');
      sectionCard.className = 'stack-card unstacked-domain';

      sectionCard.innerHTML = `
        <div class="stack-header">
          <div class="stack-info">
            <img class="group-domain-favicon" src="${escapeHtml(domainFavicon)}" alt="">
            <span class="stack-title" title="${escapeHtml(domain)}">${escapeHtml(title)}</span>
            <span class="stack-count">${filteredDomainTabs.length}</span>
            ${isWhitelisted ? '<span class="badge-whitelisted">Protected</span>' : ''}
          </div>
          <div class="stack-actions">
            ${filteredDomainTabs.length >= 2 && !isWhitelisted ? `
              <button class="mini-text-btn btn-stack-single-domain" title="Stack this domain now" data-domain="${escapeHtml(domain)}">
                + Stack
              </button>
            ` : ''}
            <div class="mini-btn chevron-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
        </div>
        <div class="tab-items-container">
          ${filteredDomainTabs.map(t => renderTabItemHtml(t, isWhitelisted)).join('')}
        </div>
      `;

      // Header click toggles collapse
      const header = sectionCard.querySelector('.stack-header');
      header.addEventListener('click', (e) => {
        if (e.target.closest('.mini-text-btn')) return;
        sectionCard.classList.toggle('collapsed');
      });

      // 1-Click Stack this specific domain
      const btnStackSingle = sectionCard.querySelector('.btn-stack-single-domain');
      btnStackSingle?.addEventListener('click', async (e) => {
        e.stopPropagation();
        const tabIds = domainTabs.map(t => t.id);
        const groupId = await chrome.tabs.group({ tabIds });
        const color = getDomainColor(domain, currentSettings?.customDomainColors);
        await chrome.tabGroups.update(groupId, {
          title: currentSettings?.customDomainNames?.[domain] || title,
          color
        });
        showToast(`Stacked ${title}!`);
        await refreshData();
      });

      stacksList.appendChild(sectionCard);
    }
  }

  // Tab Item Event Delegation
  attachTabItemEvents(stacksList);

  emptyState.classList.toggle('hidden', totalVisibleItems > 0);
}

const DEFAULT_FAVICON = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888888"><circle cx="12" cy="12" r="8"/></svg>';

/**
 * Generate tab item HTML
 * @param {chrome.tabs.Tab} tab 
 * @param {boolean} isWhitelisted
 */
function renderTabItemHtml(tab, isWhitelisted = false) {
  const favicon = tab.favIconUrl || DEFAULT_FAVICON;
  const isSleeping = tab.discarded;

  return `
    <div class="tab-item ${tab.active ? 'active' : ''} ${isSleeping ? 'sleeping' : ''}" data-tab-id="${tab.id}">
      <div class="tab-main">
        <img class="tab-favicon" src="${escapeHtml(favicon)}" alt="">
        <span class="tab-title-text" title="${escapeHtml(tab.title || tab.url)}">${escapeHtml(tab.title || 'Untitled Tab')}</span>
      </div>
      <div class="tab-item-badges">
        ${isWhitelisted ? '<span class="badge-whitelisted" title="Domain is in your whitelist">🛡️ Protected</span>' : ''}
        ${isSleeping ? '<span class="badge-sleeping" title="Hibernated: RAM freed">💤 Sleeping</span>' : ''}
        ${!isSleeping && !tab.active ? `<button class="tab-sleep-btn" data-tab-id="${tab.id}" title="Hibernate tab to free RAM">💤</button>` : ''}
        <button class="tab-close-btn" data-tab-id="${tab.id}" title="Close tab">&times;</button>
      </div>
    </div>
  `;
}

/**
 * Attach click handlers to tab rows
 * @param {HTMLElement} container 
 */
function attachTabItemEvents(container) {
  // Handle broken favicons safely without inline event handlers
  container.querySelectorAll('.tab-favicon, .group-domain-favicon').forEach(img => {
    img.addEventListener('error', () => {
      img.src = DEFAULT_FAVICON;
    }, { once: true });
  });

  container.querySelectorAll('.tab-item').forEach(el => {
    el.addEventListener('click', async (e) => {
      if (e.target.closest('.tab-close-btn') || e.target.closest('.tab-sleep-btn')) return;
      const tabId = parseInt(el.dataset.tabId, 10);
      if (tabId) {
        await chrome.tabs.update(tabId, { active: true });
        window.close();
      }
    });
  });

  // 1-Click single tab sleep button
  container.querySelectorAll('.tab-sleep-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tabId = parseInt(btn.dataset.tabId, 10);
      if (tabId) {
        await chrome.runtime.sendMessage({
          type: MESSAGE_TYPES.DISCARD_TAB,
          tabId
        });
        showToast('Tab hibernated to save RAM');
        await refreshData();
      }
    });
  });

  container.querySelectorAll('.tab-close-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const tabId = parseInt(btn.dataset.tabId, 10);
      if (tabId) {
        await chrome.tabs.remove(tabId);
        await refreshData();
      }
    });
  });
}

/**
 * Render Stashed Sessions
 */
function renderStashes() {
  const stashes = currentSettings?.stashedSessions || [];
  stashesList.innerHTML = '';

  if (stashes.length === 0) {
    emptyStash.classList.remove('hidden');
    return;
  }

  emptyStash.classList.add('hidden');

  for (const stash of stashes) {
    const card = document.createElement('div');
    card.className = 'stash-card';
    const dateFormatted = new Date(stash.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    card.innerHTML = `
      <div class="stash-meta">
        <span class="stash-title">${escapeHtml(stash.title)} (${stash.tabs?.length || 0} tabs)</span>
        <span class="stash-date">Saved ${dateFormatted}</span>
      </div>
      <div class="stash-actions">
        <button class="action-btn action-primary btn-restore-stash" data-stash-id="${stash.id}">
          Restore
        </button>
        <button class="mini-btn danger btn-delete-stash" data-stash-id="${stash.id}" title="Delete Stash">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `;

    card.querySelector('.btn-restore-stash').addEventListener('click', async () => {
      await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.RESTORE_STASH,
        stash
      });
      await removeStash(stash.id);
      showToast('Stack restored!');
      await refreshData();
      switchView('live');
    });

    card.querySelector('.btn-delete-stash').addEventListener('click', async () => {
      await removeStash(stash.id);
      showToast('Stash deleted');
      await refreshData();
    });

    stashesList.appendChild(card);
  }
}

const SNAPSHOT_LABELS = {
  [SNAPSHOT_KINDS.CLOSED_WINDOW]: 'Closed window',
  [SNAPSHOT_KINDS.AUTO]: 'Auto snapshot',
  [SNAPSHOT_KINDS.MANUAL]: 'Saved snapshot',
  [SNAPSHOT_KINDS.PREVIOUS_SESSION]: 'Before browser restart'
};

const INTERVAL_LABELS = {
  60: 'every hour',
  180: 'every 3 hours',
  360: 'every 6 hours',
  1440: 'every 24 hours',
  10080: 'every 7 days'
};

async function loadSnapshots() {
  const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SNAPSHOTS });
  snapshots = res?.snapshots || [];
  sessionsCount.textContent = snapshots.length;
  renderSnapshots();
}

function formatSnapshotDate(isoString) {
  const date = new Date(isoString);
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

/**
 * Names the most common sites in a snapshot so similar entries can be told apart
 */
function summarizeSnapshotSites(snapshot) {
  const counts = new Map();
  for (const win of snapshot.windows) {
    for (const tab of win.tabs) {
      const domain = extractDomain(tab.url, currentSettings?.domainMode);
      if (domain) counts.set(domain, (counts.get(domain) || 0) + 1);
    }
  }
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([d]) => (/^[\d.]+$/.test(d) || d.includes(':') ? d : formatDomainTitle(d)));
  if (top.length === 0) return '';
  return top.length > 3 ? `${top.slice(0, 3).join(', ')} +${top.length - 3}` : top.join(', ');
}

function renderSnapshotScheduleText() {
  if (!currentSettings?.snapshotsEnabled) {
    sessionsScheduleText.textContent = 'Periodic snapshots off';
    return;
  }
  const interval = INTERVAL_LABELS[currentSettings.snapshotIntervalMinutes] || `every ${currentSettings.snapshotIntervalMinutes} min`;
  sessionsScheduleText.textContent = `Auto ${interval}, keeps ${currentSettings.snapshotKeepCount}`;
}

function renderSnapshots() {
  renderSnapshotScheduleText();
  snapshotsList.innerHTML = '';
  emptySnapshots.classList.toggle('hidden', snapshots.length > 0);

  for (const snapshot of snapshots) {
    const windowCount = snapshot.windows.length;
    const isExpanded = expandedSnapshotIds.has(snapshot.id);
    const sites = summarizeSnapshotSites(snapshot);

    const card = document.createElement('div');
    card.className = `snapshot-card ${isExpanded ? 'expanded' : ''}`;
    card.innerHTML = `
      <div class="snapshot-header">
        <div class="snapshot-meta">
          <span class="snapshot-kind">${escapeHtml(SNAPSHOT_LABELS[snapshot.kind] || 'Snapshot')}</span>
          <span class="snapshot-counts">
            ${escapeHtml(formatSnapshotDate(snapshot.createdAt))} · ${windowCount > 1 ? `${windowCount} windows, ` : ''}${snapshot.tabCount} tab${snapshot.tabCount === 1 ? '' : 's'}
          </span>
          ${sites ? `<span class="snapshot-sites" title="${escapeHtml(sites)}">${escapeHtml(sites)}</span>` : ''}
        </div>
        <div class="stash-actions">
          <button class="action-btn action-primary btn-restore-snapshot" title="Open ${windowCount > 1 ? 'these windows' : 'this window'} again">Restore</button>
          <button class="mini-btn danger btn-delete-snapshot" title="Delete snapshot">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div class="mini-btn chevron-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
      </div>
      <div class="snapshot-details">${isExpanded ? renderSnapshotDetailsHtml(snapshot) : ''}</div>
    `;

    card.querySelector('.snapshot-header').addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const details = card.querySelector('.snapshot-details');
      if (expandedSnapshotIds.has(snapshot.id)) {
        expandedSnapshotIds.delete(snapshot.id);
        card.classList.remove('expanded');
        details.innerHTML = '';
      } else {
        expandedSnapshotIds.add(snapshot.id);
        card.classList.add('expanded');
        details.innerHTML = renderSnapshotDetailsHtml(snapshot);
        attachSnapshotDetailEvents(card, snapshot);
      }
    });

    card.querySelector('.btn-restore-snapshot').addEventListener('click', () => restoreSnapshot(snapshot.id, null));

    card.querySelector('.btn-delete-snapshot').addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DELETE_SNAPSHOT, snapshotId: snapshot.id });
      expandedSnapshotIds.delete(snapshot.id);
      showToast('Snapshot deleted');
      await loadSnapshots();
    });

    if (isExpanded) attachSnapshotDetailEvents(card, snapshot);
    snapshotsList.appendChild(card);
  }
}

function renderSnapshotDetailsHtml(snapshot) {
  const multiWindow = snapshot.windows.length > 1;

  return snapshot.windows.map((win, index) => {
    const groupsById = new Map((win.groups || []).map(g => [g.id, g]));
    const tabsHtml = win.tabs.map(tab => {
      const group = groupsById.get(tab.groupId);
      return `
        <a class="snapshot-tab" href="${escapeHtml(tab.url)}" data-url="${escapeHtml(tab.url)}" title="${escapeHtml(tab.url)}">
          <img class="tab-favicon" src="${escapeHtml(tab.favIconUrl || DEFAULT_FAVICON)}" alt="">
          <span class="tab-title-text">${escapeHtml(tab.title || tab.url)}</span>
          ${tab.pinned ? '<span class="snapshot-tab-badge">Pinned</span>' : ''}
          ${group ? `<span class="snapshot-group-chip group-${escapeHtml(group.color)}">${escapeHtml(group.title || 'Group')}</span>` : ''}
        </a>
      `;
    }).join('');

    return `
      <div class="snapshot-window">
        ${multiWindow ? `
          <div class="snapshot-window-header">
            <span>Window ${index + 1} · ${win.tabs.length} tab${win.tabs.length === 1 ? '' : 's'}</span>
            <button class="mini-text-btn btn-restore-window" data-window-index="${index}">Open window</button>
          </div>
        ` : ''}
        ${tabsHtml}
      </div>
    `;
  }).join('');
}

function attachSnapshotDetailEvents(card, snapshot) {
  card.querySelectorAll('.snapshot-details .tab-favicon').forEach(img => {
    img.addEventListener('error', () => {
      img.src = DEFAULT_FAVICON;
    }, { once: true });
  });

  card.querySelectorAll('.btn-restore-window').forEach(btn => {
    btn.addEventListener('click', () => restoreSnapshot(snapshot.id, parseInt(btn.dataset.windowIndex, 10)));
  });

  // Open a single remembered tab in the current window
  card.querySelectorAll('.snapshot-tab').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      await chrome.tabs.create({ url: link.dataset.url, windowId: currentWindowId, active: true });
    });
  });
}

function restoreSnapshot(snapshotId, windowIndex) {
  showToast('Restoring tabs...');
  // The new window takes focus and closes this popup; the service worker finishes the restore
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.RESTORE_SNAPSHOT, snapshotId, windowIndex });
}

/**
 * Render Whitelist in Popup
 */
function renderWhitelist() {
  const domains = currentSettings?.whitelistDomains || [];
  popupWhitelistTags.innerHTML = '';

  if (domains.length === 0) {
    emptyWhitelist.classList.remove('hidden');
    return;
  }

  emptyWhitelist.classList.add('hidden');

  for (const domain of domains) {
    const tag = document.createElement('div');
    tag.className = 'popup-tag';
    tag.innerHTML = `
      <span>${escapeHtml(domain)}</span>
      <button class="popup-tag-remove" title="Remove">&times;</button>
    `;
    tag.querySelector('.popup-tag-remove').addEventListener('click', () => removeWhitelistDomain(domain));
    popupWhitelistTags.appendChild(tag);
  }
}

async function addWhitelistDomain(domain) {
  domain = domain.trim().toLowerCase();
  if (!domain) return;

  try {
    if (domain.includes('://')) {
      domain = new URL(domain).hostname;
    }
  } catch {
    // Keep as is
  }

  const list = new Set(currentSettings?.whitelistDomains || []);
  list.add(domain);
  const updated = Array.from(list);

  await setSetting('whitelistDomains', updated);
  currentSettings.whitelistDomains = updated;
  popupWhitelistInput.value = '';
  showToast(`Whitelisted ${domain}`);
  await refreshData();
}

async function removeWhitelistDomain(domain) {
  const list = (currentSettings?.whitelistDomains || []).filter(d => d !== domain);
  await setSetting('whitelistDomains', list);
  currentSettings.whitelistDomains = list;
  showToast(`Removed ${domain}`);
  await refreshData();
}

/**
 * Helper to display temporary feedback toast
 * @param {string} msg 
 */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2200);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', init);
