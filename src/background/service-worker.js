/**
 * TabStack Background Service Worker (Manifest V3)
 * Ultra-lightweight, event-driven, zero persistent memory overhead
 */

import { DEFAULT_SETTINGS, MESSAGE_TYPES } from '../shared/constants.js';
import { getSettings, setSetting, addStash } from '../shared/storage.js';
import { debounce } from './utils.js';
import {
  groupTabsInWindow,
  ungroupAllInWindow,
  deduplicateTabsInWindow,
  getLiveStats
} from './grouper.js';
import {
  handleTabActivation,
  collapseAllGroups,
  expandAllGroups
} from './accordion.js';
import { runTabDiscarder } from './discarder.js';

// Debounced tab group coordinator (150ms) to prevent CPU churn
const debouncedGroupTabs = debounce((windowId) => {
  if (typeof windowId === 'number') {
    groupTabsInWindow(windowId);
  }
}, 150);

// Setup on install / update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[TabStack] Installed / Updated:', details.reason);

  // Initialize storage with defaults if missing
  const current = await getSettings();
  
  // Clean up any legacy whitelist items if present from initial load
  let whitelist = current.whitelistDomains || DEFAULT_SETTINGS.whitelistDomains;
  whitelist = whitelist.filter(d => d !== 'youtube.com' && d !== 'spotify.com' && d !== 'music.youtube.com');

  await chrome.storage.local.set({
    ...DEFAULT_SETTINGS,
    ...current,
    whitelistDomains: whitelist
  });

  // Setup periodic RAM Saver alarm (every 5 minutes)
  await chrome.alarms.create('tabstack-ram-saver', {
    periodInMinutes: 5,
    delayInMinutes: 2
  });

  // Perform initial group on last focused window
  try {
    const win = await chrome.windows.getLastFocused({ populate: false });
    if (win && win.id) {
      await groupTabsInWindow(win.id);
    }
  } catch (err) {
    console.debug('Initial window grouping skipped:', err);
  }
});

// Event Listeners for Tab Life-cycle
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.windowId) debouncedGroupTabs(tab.windowId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only trigger on completed URL navigation
  if (changeInfo.status === 'complete' || changeInfo.url) {
    if (tab.windowId) debouncedGroupTabs(tab.windowId);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (!removeInfo.isWindowClosing && removeInfo.windowId) {
    debouncedGroupTabs(removeInfo.windowId);
  }
});

// Accordion / Focus Mode trigger on active tab switch
chrome.tabs.onActivated.addListener((activeInfo) => {
  handleTabActivation(activeInfo);
});

// Periodic RAM saver alarm trigger
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tabstack-ram-saver') {
    runTabDiscarder();
  }
});

// Keyboard shortcut commands
chrome.commands.onCommand.addListener(async (command) => {
  const currentWindow = await chrome.windows.getCurrent();
  if (!currentWindow || !currentWindow.id) return;

  if (command === 'stack-current-window') {
    await groupTabsInWindow(currentWindow.id, true);
  } else if (command === 'toggle-accordion') {
    const settings = await getSettings();
    const nextState = !settings.accordionMode;
    await setSetting('accordionMode', nextState);
    if (nextState) {
      const activeTabs = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
      if (activeTabs.length > 0) {
        await handleTabActivation({ tabId: activeTabs[0].id, windowId: currentWindow.id });
      }
    }
  }
});

// Message hub for Popup and Options communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleAsyncMessage = async () => {
    let windowId = message.windowId || sender.tab?.windowId;
    if (!windowId) {
      try {
        const lastFocused = await chrome.windows.getLastFocused({ populate: false });
        windowId = lastFocused?.id;
      } catch {
        windowId = null;
      }
    }

    switch (message.type) {
      case MESSAGE_TYPES.GET_STATS: {
        const stats = await getLiveStats();
        return { success: true, data: stats };
      }

      case MESSAGE_TYPES.STACK_NOW: {
        if (windowId) await groupTabsInWindow(windowId, true);
        return { success: true };
      }

      case MESSAGE_TYPES.UNGROUP_ALL: {
        if (windowId) await ungroupAllInWindow(windowId);
        return { success: true };
      }

      case MESSAGE_TYPES.DEDUPLICATE_TABS: {
        const count = windowId ? await deduplicateTabsInWindow(windowId) : 0;
        return { success: true, count };
      }

      case MESSAGE_TYPES.COLLAPSE_ALL: {
        if (windowId) await collapseAllGroups(windowId);
        return { success: true };
      }

      case MESSAGE_TYPES.EXPAND_ALL: {
        if (windowId) await expandAllGroups(windowId);
        return { success: true };
      }

      case MESSAGE_TYPES.STASH_GROUP: {
        const { groupId } = message;
        if (!groupId) return { success: false, error: 'No groupId specified' };

        const [group, groupTabs] = await Promise.all([
          chrome.tabGroups.get(groupId),
          chrome.tabs.query({ groupId })
        ]);

        if (!group || groupTabs.length === 0) {
          return { success: false, error: 'Group is empty or not found' };
        }

        const stashItem = {
          id: `stash_${Date.now()}`,
          title: group.title || 'Untitled Stack',
          color: group.color || 'blue',
          date: new Date().toISOString(),
          tabs: groupTabs.map(t => ({
            title: t.title || 'Untitled Tab',
            url: t.url,
            favIconUrl: t.favIconUrl
          }))
        };

        await addStash(stashItem);

        // Close grouped tabs to free space
        const tabIdsToClose = groupTabs.map(t => t.id).filter(Boolean);
        await chrome.tabs.remove(tabIdsToClose);

        return { success: true, stashItem };
      }

      case MESSAGE_TYPES.RESTORE_STASH: {
        const { stash } = message;
        if (!stash || !stash.tabs || stash.tabs.length === 0) {
          return { success: false, error: 'No tabs in stash' };
        }

        // Open tabs
        const createdTabIds = [];
        for (const tabInfo of stash.tabs) {
          const tab = await chrome.tabs.create({
            url: tabInfo.url,
            active: false
          });
          if (tab.id) createdTabIds.push(tab.id);
        }

        if (createdTabIds.length > 0) {
          const newGroupId = await chrome.tabs.group({ tabIds: createdTabIds });
          await chrome.tabGroups.update(newGroupId, {
            title: stash.title,
            color: stash.color || 'blue',
            collapsed: false
          });
        }

        return { success: true };
      }

      default:
        return { success: false, error: 'Unknown message type' };
    }
  };

  handleAsyncMessage().then(sendResponse);
  return true; // Keep message channel open for async response
});
