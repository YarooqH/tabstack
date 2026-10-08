/**
 * TabStack Options Controller
 */

import { DEFAULT_SETTINGS, MESSAGE_TYPES } from '../shared/constants.js';
import { getSettings, setSettings, setSetting } from '../shared/storage.js';
import { initTheme, setTheme } from '../shared/theme.js';

// DOM Elements
const optTheme = document.getElementById('optTheme');
const optAutoGroup = document.getElementById('optAutoGroup');
const optAccordion = document.getElementById('optAccordion');
const optMinTabs = document.getElementById('optMinTabs');
const optDomainMode = document.getElementById('optDomainMode');
const optShowCount = document.getElementById('optShowCount');
const optRamSaver = document.getElementById('optRamSaver');
const optDiscardTimeout = document.getElementById('optDiscardTimeout');
const optSnapshotClosed = document.getElementById('optSnapshotClosed');
const optSnapshotsEnabled = document.getElementById('optSnapshotsEnabled');
const optSnapshotInterval = document.getElementById('optSnapshotInterval');
const optSnapshotKeep = document.getElementById('optSnapshotKeep');

const snapshotStatusText = document.getElementById('snapshotStatusText');
const btnExportSnapshots = document.getElementById('btnExportSnapshots');
const btnImportSnapshots = document.getElementById('btnImportSnapshots');
const btnClearSnapshots = document.getElementById('btnClearSnapshots');
const snapshotImportInput = document.getElementById('snapshotImportInput');

const whitelistInput = document.getElementById('whitelistInput');
const btnAddWhitelist = document.getElementById('btnAddWhitelist');
const whitelistTags = document.getElementById('whitelistTags');

const stashStatusText = document.getElementById('stashStatusText');
const btnExportData = document.getElementById('btnExportData');
const btnClearStashes = document.getElementById('btnClearStashes');
const btnResetDefaults = document.getElementById('btnResetDefaults');
const statusMessage = document.getElementById('statusMessage');

let currentSettings = { ...DEFAULT_SETTINGS };

async function init() {
  await initTheme((theme) => {
    if (optTheme) optTheme.value = theme;
  });
  currentSettings = await getSettings();
  populateForm(currentSettings);
  setupListeners();
  await updateSnapshotStatus();
}

function populateForm(settings) {
  if (optTheme) optTheme.value = settings.theme || 'system';
  optAutoGroup.checked = !!settings.autoGroupEnabled;
  optAccordion.checked = !!settings.accordionMode;
  optMinTabs.value = String(settings.minTabsToGroup || 2);
  optDomainMode.value = settings.domainMode || 'root';
  optShowCount.checked = settings.showTabCountInTitle !== false;
  optRamSaver.checked = !!settings.autoDiscardEnabled;
  optDiscardTimeout.value = String(settings.discardTimeoutMinutes || 20);
  optSnapshotClosed.checked = settings.snapshotClosedWindows !== false;
  optSnapshotsEnabled.checked = settings.snapshotsEnabled !== false;
  optSnapshotInterval.value = String(settings.snapshotIntervalMinutes || 360);
  optSnapshotKeep.value = String(settings.snapshotKeepCount || 24);
  optSnapshotInterval.disabled = !optSnapshotsEnabled.checked;
  optSnapshotKeep.disabled = !optSnapshotsEnabled.checked;

  renderWhitelistTags(settings.whitelistDomains || []);
  updateStashStatus(settings.stashedSessions || []);
}

function setupListeners() {
  // Theme change
  optTheme?.addEventListener('change', async (e) => {
    await setTheme(e.target.value);
    showStatus(`Theme set to ${e.target.options[e.target.selectedIndex].text}`);
  });

  // Direct Input Listeners
  const autoSaveHandler = async () => {
    const updated = {
      theme: optTheme ? optTheme.value : 'system',
      autoGroupEnabled: optAutoGroup.checked,
      accordionMode: optAccordion.checked,
      minTabsToGroup: parseInt(optMinTabs.value, 10),
      domainMode: optDomainMode.value,
      showTabCountInTitle: optShowCount.checked,
      autoDiscardEnabled: optRamSaver.checked,
      discardTimeoutMinutes: parseInt(optDiscardTimeout.value, 10),
      snapshotClosedWindows: optSnapshotClosed.checked,
      snapshotsEnabled: optSnapshotsEnabled.checked,
      snapshotIntervalMinutes: parseInt(optSnapshotInterval.value, 10),
      snapshotKeepCount: parseInt(optSnapshotKeep.value, 10)
    };
    optSnapshotInterval.disabled = !optSnapshotsEnabled.checked;
    optSnapshotKeep.disabled = !optSnapshotsEnabled.checked;

    await setSettings(updated);
    currentSettings = { ...currentSettings, ...updated };
    showStatus('Settings saved automatically');

    // Notify service worker
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SETTINGS_UPDATED });
  };

  [optAutoGroup, optAccordion, optMinTabs, optDomainMode, optShowCount, optRamSaver, optDiscardTimeout,
    optSnapshotClosed, optSnapshotsEnabled, optSnapshotInterval, optSnapshotKeep]
    .forEach(el => el.addEventListener('change', autoSaveHandler));

  // Snapshot backup handlers
  btnExportSnapshots.addEventListener('click', exportSnapshots);
  btnImportSnapshots.addEventListener('click', () => snapshotImportInput.click());
  snapshotImportInput.addEventListener('change', importSnapshotsFromFile);
  btnClearSnapshots.addEventListener('click', clearAllSnapshots);

  // Whitelist Handlers
  btnAddWhitelist.addEventListener('click', addWhitelistDomain);
  whitelistInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addWhitelistDomain();
    }
  });

  // Stash Handlers
  btnExportData.addEventListener('click', exportSettingsAndStashes);
  btnClearStashes.addEventListener('click', clearAllStashes);

  // Reset to Defaults
  btnResetDefaults.addEventListener('click', async () => {
    if (confirm('Reset all settings to default values?')) {
      await setSettings(DEFAULT_SETTINGS);
      currentSettings = { ...DEFAULT_SETTINGS };
      populateForm(currentSettings);
      showStatus('Settings reset to defaults');
    }
  });

  // Sidebar navigation scroll spy
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

async function addWhitelistDomain() {
  let domain = whitelistInput.value.trim().toLowerCase();
  if (!domain) return;

  // Clean domain protocol if pasted as full url
  try {
    if (domain.includes('://')) {
      domain = new URL(domain).hostname;
    }
  } catch {
    // Keep as is
  }

  const list = new Set(currentSettings.whitelistDomains || []);
  list.add(domain);
  const updated = Array.from(list);

  await setSetting('whitelistDomains', updated);
  currentSettings.whitelistDomains = updated;
  whitelistInput.value = '';
  renderWhitelistTags(updated);
  showStatus(`Added ${domain} to whitelist`);
}

async function removeWhitelistDomain(domain) {
  const list = (currentSettings.whitelistDomains || []).filter(d => d !== domain);
  await setSetting('whitelistDomains', list);
  currentSettings.whitelistDomains = list;
  renderWhitelistTags(list);
  showStatus(`Removed ${domain} from whitelist`);
}

function renderWhitelistTags(domains) {
  whitelistTags.innerHTML = '';
  for (const domain of domains) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      <span>${escapeHtml(domain)}</span>
      <button class="tag-remove" title="Remove">&times;</button>
    `;
    tag.querySelector('.tag-remove').addEventListener('click', () => removeWhitelistDomain(domain));
    whitelistTags.appendChild(tag);
  }
}

function updateStashStatus(stashes) {
  const count = (stashes || []).length;
  stashStatusText.textContent = `${count} stashed session(s) saved in local storage`;
  btnClearStashes.disabled = count === 0;
}

function exportSettingsAndStashes() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentSettings, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `tabstack-backup-${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showStatus('Exported configuration JSON');
}

async function clearAllStashes() {
  if (confirm('Are you sure you want to delete all saved stashes?')) {
    await setSetting('stashedSessions', []);
    currentSettings.stashedSessions = [];
    updateStashStatus([]);
    showStatus('Cleared all stashes');
  }
}

async function fetchSnapshots() {
  const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_SNAPSHOTS });
  return res?.snapshots || [];
}

async function updateSnapshotStatus() {
  const snapshots = await fetchSnapshots();
  const tabCount = snapshots.reduce((sum, s) => sum + (s.tabCount || 0), 0);
  snapshotStatusText.textContent = snapshots.length === 0
    ? 'No snapshots saved yet. Restore them from the Sessions tab in the popup.'
    : `${snapshots.length} snapshot(s) holding ${tabCount} tabs. Restore them from the Sessions tab in the popup.`;
  btnExportSnapshots.disabled = snapshots.length === 0;
  btnClearSnapshots.disabled = snapshots.length === 0;
}

async function exportSnapshots() {
  const snapshots = await fetchSnapshots();
  const payload = JSON.stringify({ type: 'tabstack-snapshots', version: 1, snapshots }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `tabstack-snapshots-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showStatus(`Exported ${snapshots.length} snapshot(s)`);
}

async function importSnapshotsFromFile() {
  const file = snapshotImportInput.files?.[0];
  snapshotImportInput.value = '';
  if (!file) return;

  try {
    const parsed = JSON.parse(await file.text());
    const incoming = Array.isArray(parsed) ? parsed : parsed?.snapshots;
    if (!Array.isArray(incoming)) throw new Error('No snapshots in file');

    const res = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.IMPORT_SNAPSHOTS, snapshots: incoming });
    showStatus(`Imported ${res?.count || 0} snapshot(s)`);
    await updateSnapshotStatus();
  } catch (err) {
    showStatus(`Import failed: ${err.message}`);
  }
}

async function clearAllSnapshots() {
  if (confirm('Delete every saved snapshot? Closed windows saved so far can no longer be restored.')) {
    await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.CLEAR_SNAPSHOTS });
    await updateSnapshotStatus();
    showStatus('Deleted all snapshots');
  }
}

function showStatus(msg) {
  statusMessage.textContent = `✓ ${msg}`;
  setTimeout(() => {
    if (statusMessage.textContent === `✓ ${msg}`) {
      statusMessage.textContent = '';
    }
  }, 2500);
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
