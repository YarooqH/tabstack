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
      discardTimeoutMinutes: parseInt(optDiscardTimeout.value, 10)
    };

    await setSettings(updated);
    currentSettings = { ...currentSettings, ...updated };
    showStatus('Settings saved automatically');

    // Notify service worker
    chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SETTINGS_UPDATED });
  };

  [optAutoGroup, optAccordion, optMinTabs, optDomainMode, optShowCount, optRamSaver, optDiscardTimeout]
    .forEach(el => el.addEventListener('change', autoSaveHandler));

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
