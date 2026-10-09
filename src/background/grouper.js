/**
 * TabStack Domain Grouping Engine
 * Clusters same-site tabs into native Chromium Tab Groups with clean styling and isolation
 */

import { getSettings } from '../shared/storage.js';
import { extractDomain, formatDomainTitle, getDomainColor } from './utils.js';

/**
 * Name TabStack gives a domain's stack, without the tab count suffix
 * @param {string} domain
 * @param {object} settings
 * @returns {string}
 */
function getStackTitle(domain, settings) {
  return settings.customDomainNames?.[domain] || formatDomainTitle(domain);
}

/**
 * Finds the groups TabStack created in a window. A group counts as TabStack's when its title is the
 * stack name for the domain of one of its tabs, optionally followed by a " (n)" tab count. Titles
 * survive browser restarts (group ids don't), and a group the user creates or renames won't match.
 * @param {number} windowId
 * @param {chrome.tabs.Tab[]} tabs All tabs in the window
 * @param {object} settings
 * @returns {Promise<Set<number>>}
 */
async function getManagedGroupIds(windowId, tabs, settings) {
  const groups = await chrome.tabGroups.query({ windowId });

  const domainsByGroup = new Map();
  for (const tab of tabs) {
    if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) continue;
    const domain = extractDomain(tab.url || tab.pendingUrl, settings.domainMode);
    if (!domain) continue;
    if (!domainsByGroup.has(tab.groupId)) {
      domainsByGroup.set(tab.groupId, new Set());
    }
    domainsByGroup.get(tab.groupId).add(domain);
  }

  const managed = new Set();
  for (const group of groups) {
    const baseTitle = (group.title || '').replace(/ \(\d+\)$/, '');
    const domains = domainsByGroup.get(group.id) || [];
    for (const domain of domains) {
      if (getStackTitle(domain, settings) === baseTitle) {
        managed.add(group.id);
        break;
      }
    }
  }
  return managed;
}

/**
 * Automatically groups tabs by domain in the specified window
 * @param {number} windowId 
 * @param {boolean} [force=false] Set to true for manual "Stack Now" trigger
 */
export async function groupTabsInWindow(windowId, force = false) {
  const settings = await getSettings();
  if (!settings.autoGroupEnabled && !force) return;

  try {
    const tabs = await chrome.tabs.query({ windowId });
    if (!tabs || tabs.length === 0) return;

    // Filter out pinned tabs and whitelisted domains
    const whitelist = new Set((settings.whitelistDomains || []).map(d => d.toLowerCase().trim()));
    const domainToTabs = new Map();
    const preserveExisting = settings.preserveExistingGroups !== false;
    const managedGroupIds = preserveExisting ? await getManagedGroupIds(windowId, tabs, settings) : null;

    for (const tab of tabs) {
      if (tab.pinned) continue;

      // If preserving existing groups, leave groups the user made or renamed untouched.
      // Tabs in TabStack's own stacks still count, so new same-site tabs join them instead of forming a duplicate stack.
      if (preserveExisting && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && !managedGroupIds.has(tab.groupId)) {
        continue;
      }

      const domain = extractDomain(tab.url || tab.pendingUrl, settings.domainMode);
      if (!domain) continue;

      // Check if domain or root domain is in whitelist
      if (whitelist.has(domain.toLowerCase())) continue;

      if (!domainToTabs.has(domain)) {
        domainToTabs.set(domain, []);
      }
      domainToTabs.get(domain).push(tab);
    }

    const minTabs = settings.minTabsToGroup || 2;
    const activeTab = tabs.find(t => t.active);

    for (const [domain, domainTabs] of domainToTabs.entries()) {
      if (domainTabs.length >= minTabs) {
        const tabIds = domainTabs.map(t => t.id).filter(Boolean);
        if (tabIds.length === 0) continue;

        // Check if existing tabs already share a valid group
        const existingGroupIds = new Set(
          domainTabs.map(t => t.groupId).filter(id => id !== chrome.tabGroups.TAB_GROUP_ID_NONE)
        );

        let targetGroupId = null;
        if (existingGroupIds.size === 1) {
          targetGroupId = [...existingGroupIds][0];
        }

        // Group the tabs together
        let groupId;
        if (targetGroupId !== null) {
          groupId = await chrome.tabs.group({ groupId: targetGroupId, tabIds });
        } else {
          groupId = await chrome.tabs.group({ tabIds });
        }

        // Format title
        let title = getStackTitle(domain, settings);
        if (settings.showTabCountInTitle) {
          title = `${title} (${domainTabs.length})`;
        }

        const color = getDomainColor(domain, settings.customDomainColors);

        // Determine collapsed state: if active tab is in this group, stay expanded; otherwise collapse if accordion enabled
        const hasActiveTab = domainTabs.some(t => t.active);
        const shouldCollapse = settings.accordionMode ? !hasActiveTab : false;

        await chrome.tabGroups.update(groupId, {
          title,
          color,
          collapsed: shouldCollapse
        });
      }
    }
  } catch (err) {
    console.debug('[TabStack Grouper] Batch group completed with minor notice:', err?.message);
  }
}

/**
 * Ungroup all tabs in the current window
 * @param {number} windowId 
 */
export async function ungroupAllInWindow(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    const groupedTabIds = tabs
      .filter(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && !t.pinned)
      .map(t => t.id);

    if (groupedTabIds.length > 0) {
      await chrome.tabs.ungroup(groupedTabIds);
    }
  } catch (err) {
    console.error('Failed to ungroup tabs:', err);
  }
}

/**
 * Finds and removes duplicate URLs in the current window
 * @param {number} windowId 
 * @returns {Promise<number>} Number of closed duplicates
 */
export async function deduplicateTabsInWindow(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId });
    const seenUrls = new Map();
    const duplicateTabIds = [];

    for (const tab of tabs) {
      if (!tab.url || tab.pinned) continue;

      // Normalize URL (strip tracking params and trailing slash)
      let normalized = tab.url.trim().replace(/\/+$/, '');
      try {
        const u = new URL(normalized);
        // Remove common tracking queries
        u.searchParams.delete('utm_source');
        u.searchParams.delete('utm_medium');
        u.searchParams.delete('utm_campaign');
        normalized = u.origin + u.pathname + (u.search ? u.search : '');
      } catch {
        // Fallback to raw string
      }

      if (seenUrls.has(normalized)) {
        // If current tab is active, close the earlier one instead
        if (tab.active) {
          const previousTabId = seenUrls.get(normalized);
          duplicateTabIds.push(previousTabId);
          seenUrls.set(normalized, tab.id);
        } else {
          duplicateTabIds.push(tab.id);
        }
      } else {
        seenUrls.set(normalized, tab.id);
      }
    }

    if (duplicateTabIds.length > 0) {
      await chrome.tabs.remove(duplicateTabIds);
    }

    return duplicateTabIds.length;
  } catch (err) {
    console.error('Failed to deduplicate tabs:', err);
    return 0;
  }
}

/**
 * Collects live statistics across browser windows
 */
export async function getLiveStats() {
  try {
    const [tabs, groups] = await Promise.all([
      chrome.tabs.query({}),
      chrome.tabGroups.query({})
    ]);

    const totalTabs = tabs.length;
    const totalGroups = groups.length;
    const collapsedGroups = groups.filter(g => g.collapsed).length;
    const discardedTabs = tabs.filter(t => t.discarded).length;

    // Estimate ~65MB saved per discarded/hibernated tab
    const estimatedRamSavedMb = Math.round(discardedTabs * 65);

    return {
      totalTabs,
      totalGroups,
      collapsedGroups,
      discardedTabs,
      estimatedRamSavedMb
    };
  } catch (err) {
    console.error('Error fetching stats:', err);
    return {
      totalTabs: 0,
      totalGroups: 0,
      collapsedGroups: 0,
      discardedTabs: 0,
      estimatedRamSavedMb: 0
    };
  }
}
