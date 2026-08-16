/**
 * TabStack RAM Saver & Tab Hibernation Engine
 * Frees browser memory by safely discarding idle background tabs in collapsed stacks
 */

import { getSettings } from '../shared/storage.js';

/**
 * Runs a check across open tabs and hibernates idle tabs in collapsed groups
 */
export async function runTabDiscarder() {
  const settings = await getSettings();
  if (!settings.autoDiscardEnabled) return;

  try {
    const windows = await chrome.windows.getAll({ populate: true });
    const now = Date.now();
    const timeoutMs = (settings.discardTimeoutMinutes || 20) * 60 * 1000;

    let discardedCount = 0;

    for (const win of windows) {
      if (!win.tabs || win.tabs.length === 0) continue;

      // Map group collapsed states
      const groups = await chrome.tabGroups.query({ windowId: win.id });
      const collapsedGroupIds = new Set(
        groups.filter(g => g.collapsed).map(g => g.id)
      );

      for (const tab of win.tabs) {
        // Safety checks: never discard active, pinned, audible, or already discarded tabs
        if (
          tab.active ||
          tab.pinned ||
          tab.audible ||
          tab.discarded ||
          !tab.id
        ) {
          continue;
        }

        // Prioritize tabs inside collapsed groups OR tabs idle for > timeoutMs
        const isInCollapsedGroup = tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && collapsedGroupIds.has(tab.groupId);
        const isIdleLongEnough = tab.lastAccessed && (now - tab.lastAccessed > timeoutMs);

        if (isInCollapsedGroup || isIdleLongEnough) {
          try {
            await chrome.tabs.discard(tab.id);
            discardedCount++;
          } catch {
            // Some internal pages cannot be discarded
          }
        }
      }
    }

    if (discardedCount > 0) {
      console.log(`[TabStack RAM Saver] Discarded ${discardedCount} idle tabs to free memory.`);
    }
  } catch (err) {
    console.error('[TabStack RAM Saver] Error during discard cycle:', err);
  }
}
