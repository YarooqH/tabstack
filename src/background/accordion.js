/**
 * TabStack Accordion & Focus Mode Engine
 * Manages auto-expanding the active tab's stack and collapsing inactive stacks
 */

import { getSettings } from '../shared/storage.js';

/**
 * Handles tab activation to apply Accordion / Focus mode
 * @param {chrome.tabs.TabActiveInfo} activeInfo 
 */
export async function handleTabActivation(activeInfo) {
  const settings = await getSettings();
  if (!settings.accordionMode) return;

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab || tab.pinned) return;

    const windowId = tab.windowId;
    const activeGroupId = tab.groupId;

    // Fetch all tab groups in the current window
    const groups = await chrome.tabGroups.query({ windowId });
    if (!groups || groups.length === 0) return;

    for (const group of groups) {
      if (activeGroupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && group.id === activeGroupId) {
        // Expand the active group if collapsed
        if (group.collapsed) {
          await chrome.tabGroups.update(group.id, { collapsed: false });
        }
      } else {
        // Collapse all other groups
        if (!group.collapsed) {
          await chrome.tabGroups.update(group.id, { collapsed: true });
        }
      }
    }
  } catch (err) {
    // Tab or group might have been closed during async transition
    console.debug('Accordion transition skipped:', err?.message);
  }
}

/**
 * Collapse all groups in the given window
 * @param {number} windowId 
 */
export async function collapseAllGroups(windowId) {
  try {
    const groups = await chrome.tabGroups.query({ windowId });
    for (const group of groups) {
      await chrome.tabGroups.update(group.id, { collapsed: true });
    }
  } catch (err) {
    console.error('Failed to collapse all groups:', err);
  }
}

/**
 * Expand all groups in the given window
 * @param {number} windowId 
 */
export async function expandAllGroups(windowId) {
  try {
    const groups = await chrome.tabGroups.query({ windowId });
    for (const group of groups) {
      await chrome.tabGroups.update(group.id, { collapsed: false });
    }
  } catch (err) {
    console.error('Failed to expand all groups:', err);
  }
}
