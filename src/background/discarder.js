/**
 * TabStack RAM Saver & Tab Hibernation Engine
 * Frees browser memory by safely discarding idle background tabs in collapsed stacks
 */

import { getSettings } from '../shared/storage.js';
import { extractDomain } from './utils.js';

/**
 * Checks if a specific tab is safe and eligible to be discarded
 * @param {chrome.tabs.Tab} tab 
 * @param {Set<number>} collapsedGroupIds 
 * @param {Array<string>} whitelist 
 * @param {'root'|'subdomain'} domainMode 
 * @param {number} timeoutMs 
 * @param {boolean} forceImmediate 
 * @returns {boolean}
 */
export function isTabEligibleForDiscard(tab, collapsedGroupIds, whitelist = [], domainMode = 'root', timeoutMs = 20 * 60 * 1000, forceImmediate = false) {
  // Never discard active, pinned, audible, or already discarded tabs
  if (
    tab.active ||
    tab.pinned ||
    tab.audible ||
    tab.discarded ||
    !tab.id
  ) {
    return false;
  }

  // Check domain whitelist
  const url = tab.url || tab.pendingUrl;
  if (url) {
    const domain = extractDomain(url, domainMode);
    if (domain && whitelist.includes(domain.toLowerCase())) {
      return false;
    }
  }

  // If force immediate is triggered (e.g. user enabled RAM saver toggle or clicked Sleep Stack)
  if (forceImmediate) {
    return true;
  }

  const now = Date.now();
  const isInCollapsedGroup = tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && collapsedGroupIds.has(tab.groupId);
  const isIdleLongEnough = tab.lastAccessed && (now - tab.lastAccessed > timeoutMs);

  return isInCollapsedGroup || isIdleLongEnough;
}

/**
 * Runs a check across open tabs and hibernates idle tabs in collapsed groups
 */
export async function runTabDiscarder() {
  const settings = await getSettings();
  if (!settings.autoDiscardEnabled) return 0;

  return await discardEligibleTabs({ forceImmediate: false });
}

/**
 * Immediately discards all eligible background tabs (used when user toggles RAM saver ON)
 * @param {{ windowId?: number, groupId?: number, forceImmediate?: boolean }} options 
 * @returns {Promise<number>} Count of newly discarded tabs
 */
export async function discardEligibleTabs(options = {}) {
  const { windowId = null, groupId = null, forceImmediate = false } = options;
  const settings = await getSettings();

  try {
    const queryFilter = windowId ? { windowId } : {};
    const [allTabs, groups] = await Promise.all([
      chrome.tabs.query(queryFilter),
      chrome.tabGroups.query(queryFilter)
    ]);

    const timeoutMs = (settings.discardTimeoutMinutes || 20) * 60 * 1000;
    const whitelist = (settings.whitelistDomains || []).map(d => d.toLowerCase());
    const domainMode = settings.domainMode || 'root';

    // Map collapsed group IDs
    const collapsedGroupIds = new Set(
      groups.filter(g => g.collapsed).map(g => g.id)
    );

    let discardedCount = 0;

    for (const tab of allTabs) {
      if (groupId !== null && tab.groupId !== groupId) {
        continue;
      }

      if (isTabEligibleForDiscard(tab, collapsedGroupIds, whitelist, domainMode, timeoutMs, forceImmediate)) {
        try {
          await chrome.tabs.discard(tab.id);
          discardedCount++;
        } catch {
          // Internal browser tabs (chrome://, devtools) cannot be discarded
        }
      }
    }

    if (discardedCount > 0) {
      console.log(`[TabStack RAM Saver] Discarded ${discardedCount} tab(s).`);
    }

    return discardedCount;
  } catch (err) {
    console.error('[TabStack RAM Saver] Error during discard cycle:', err);
    return 0;
  }
}

/**
 * Discards a single tab by ID
 * @param {number} tabId 
 * @returns {Promise<boolean>}
 */
export async function discardSingleTab(tabId) {
  try {
    await chrome.tabs.discard(tabId);
    return true;
  } catch (err) {
    console.warn(`[TabStack RAM Saver] Could not discard tab ${tabId}:`, err);
    return false;
  }
}
