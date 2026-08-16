/**
 * TabStack Popup Controller
 * Renders live tab stacks, search filtering, session stashing, whitelist manager, and quick actions
 */

import { MESSAGE_TYPES } from '../shared/constants.js';
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

// DOM Elements
const themeControl = document.getElementById('themeControl');
const statTotalTabs = document.getElementById('statTotalTabs');
const statTotalGroups = document.getElementById('statTotalGroups');
const statRamSaved = document.getElementById('statRamSaved');
const toggleAutoGroup = document.getElementById('toggleAutoGroup');
const toggleAccordion = document.getElementById('toggleAccordion');
const toggleRamSaver = document.getElementById('toggleRamSaver');

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
const stashCount = document.getElementById('stashCount');
const whitelistCount = document.getElementById('whitelistCount');

const btnStackNow = document.getElementById('btnStackNow');
const btnDeduplicate = document.getElementById('btnDeduplicate');
const btnCollapseAll = document.getElementById('btnCollapseAll');
const btnOptions = document.getElementById('btnOptions');
const toast = document.getElementById('toast');

/**
 * Initialize popup
 */
async function init() {
  // Initialize Theme
  const activeTheme = await initTheme(updateThemeButtonsActiveState);
  updateThemeButtonsActiveState(activeTheme);

  try {
    let win = await chrome.windows.getCurrent();
    if (!win || win.type === 'popup') {
      win = await chrome.windows.getLastFocused({ populate: false });
    }
    currentWindowId = win ? win.id : null;
  } catch {
    const lastFocused = await chrome.windows.getLastFocused({ populate: false });
    currentWindowId = lastFocused?.id;
  }

  currentSettings = await getSettings();

  // Setup toggle states
  toggleAutoGroup.checked = !!currentSettings.autoGroupEnabled;
  toggleAccordion.checked = !!currentSettings.accordionMode;
  toggleRamSaver.checked = !!currentSettings.autoDiscardEnabled;

  // Event Listeners
  setupEventListeners();

  // Initial load
  await refreshData();
}

function updateThemeButtonsActiveState(theme) {
  themeControl?.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });
}

/**
 * Register all event handlers
 */
function setupEventListeners() {
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

  toggleRamSaver.addEventListener('change', async (e) => {
    await setSetting('autoDiscardEnabled', e.target.checked);
    showToast(e.target.checked ? 'RAM Saver Enabled' : 'RAM Saver Disabled');
  });

  // Navigation tab switching
  tabNavLive.addEventListener('click', () => switchView('live'));
  tabNavStash.addEventListener('click', () => switchView('stash'));
  tabNavWhitelist.addEventListener('click', () => switchView('whitelist'));

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

    // Detect active tab domain for 1-click whitelist button
    const activeTab = tabs.find(t => t.active);
    currentActiveDomain = activeTab ? extractDomain(activeTab.url || activeTab.pendingUrl, settings.domainMode) : null;

    if (currentActiveDomain && !(settings.whitelistDomains || []).includes(currentActiveDomain.toLowerCase())) {
      currentDomainSection.classList.remove('hidden');
      currentDomainText.textContent = currentActiveDomain;
    } else {
      currentDomainSection.classList.add('hidden');
    }

    // Update metrics bar
    statTotalTabs.textContent = tabs.length;
    statTotalGroups.textContent = groups.length;
    statRamSaved.textContent = `${statsRes?.data?.estimatedRamSavedMb || 0} MB`;

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
 * @param {'live'|'stash'|'whitelist'} view 
 */
function switchView(view) {
  tabNavLive.classList.toggle('active', view === 'live');
  tabNavStash.classList.toggle('active', view === 'stash');
  tabNavWhitelist.classList.toggle('active', view === 'whitelist');

  liveView.classList.toggle('hidden', view !== 'live');
  stashView.classList.toggle('hidden', view !== 'stash');
  whitelistView.classList.toggle('hidden', view !== 'whitelist');

  searchContainer.classList.toggle('hidden', view !== 'live');

  if (view === 'stash') renderStashes();
  if (view === 'whitelist') renderWhitelist();
}

/**
 * Render Live Stacks and ungrouped tabs
 */
function renderStacks() {
  stacksList.innerHTML = '';

  const groupMap = new Map();
  const ungroupedTabs = [];
  const whitelistSet = new Set((currentSettings?.whitelistDomains || []).map(d => d.toLowerCase()));

  // Group tabs by groupId
  for (const tab of allTabs) {
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
      if (!groupMap.has(tab.groupId)) {
        groupMap.set(tab.groupId, []);
      }
      groupMap.get(tab.groupId).push(tab);
    } else {
      ungroupedTabs.push(tab);
    }
  }

  let totalVisibleItems = 0;

  // Render grouped stacks
  for (const group of allGroups) {
    const groupTabs = groupMap.get(group.id) || [];
    if (groupTabs.length === 0) continue;

    // Filter tabs if search query is present
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

    card.innerHTML = `
      <div class="stack-header" data-group-id="${group.id}">
        <div class="stack-info">
          <img class="group-domain-favicon" src="${escapeHtml(groupFavicon)}" alt="">
          <span class="stack-title" title="${escapeHtml(group.title || 'Group')}">${escapeHtml(group.title || 'Untitled Stack')}</span>
          <span class="stack-count">${filteredTabs.length}</span>
        </div>
        <div class="stack-actions">
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
      if (e.target.closest('.btn-stash') || e.target.closest('.btn-close-group')) return;
      const nextCollapsed = !card.classList.contains('collapsed');
      card.classList.toggle('collapsed', nextCollapsed);
      await chrome.tabGroups.update(group.id, { collapsed: nextCollapsed });
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

      // Quick Stack single domain button
      const btnStackDomain = sectionCard.querySelector('.btn-stack-single-domain');
      if (btnStackDomain) {
        btnStackDomain.addEventListener('click', async (e) => {
          e.stopPropagation();
          const tabIds = domainTabs.map(t => t.id).filter(Boolean);
          if (tabIds.length > 0) {
            const newGroupId = await chrome.tabs.group({ tabIds });
            let groupTitle = currentSettings?.customDomainNames?.[domain] || formatDomainTitle(domain);
            if (currentSettings?.showTabCountInTitle) {
              groupTitle = `${groupTitle} (${tabIds.length})`;
            }
            await chrome.tabGroups.update(newGroupId, {
              title: groupTitle,
              color: getDomainColor(domain, currentSettings?.customDomainColors),
              collapsed: false
            });
            showToast(`Stacked ${title}!`);
            await refreshData();
          }
        });
      }

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
    <div class="tab-item ${tab.active ? 'active' : ''}" data-tab-id="${tab.id}">
      <div class="tab-main">
        <img class="tab-favicon" src="${escapeHtml(favicon)}" alt="">
        <span class="tab-title-text" title="${escapeHtml(tab.title || tab.url)}">${escapeHtml(tab.title || 'Untitled Tab')}</span>
      </div>
      <div class="tab-item-badges">
        ${isWhitelisted ? '<span class="badge-whitelisted" title="Domain is in your whitelist">🛡️ Whitelisted</span>' : ''}
        ${isSleeping ? '<span class="badge-sleeping" title="Hibernated to save RAM">💤 Sleeping</span>' : ''}
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
      if (e.target.closest('.tab-close-btn')) return;
      const tabId = parseInt(el.dataset.tabId, 10);
      if (tabId) {
        await chrome.tabs.update(tabId, { active: true });
        window.close();
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
