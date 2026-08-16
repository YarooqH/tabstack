/**
 * TabStack Storage Helper
 * Wraps chrome.storage.local with defaults and listener capabilities
 */

import { DEFAULT_SETTINGS } from './constants.js';

export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(DEFAULT_SETTINGS, (items) => {
      const merged = { ...DEFAULT_SETTINGS, ...items };
      if (Array.isArray(merged.whitelistDomains)) {
        // Sanitize legacy entries
        merged.whitelistDomains = merged.whitelistDomains.filter(
          d => d !== 'youtube.com' && d !== 'spotify.com' && d !== 'music.youtube.com'
        );
      }
      resolve(merged);
    });
  });
}

export async function setSettings(partialSettings) {
  return new Promise((resolve) => {
    chrome.storage.local.set(partialSettings, () => {
      resolve(partialSettings);
    });
  });
}

export async function getSetting(key) {
  const settings = await getSettings();
  return settings[key];
}

export async function setSetting(key, value) {
  return setSettings({ [key]: value });
}

export async function addStash(stashItem) {
  const settings = await getSettings();
  const stashedSessions = settings.stashedSessions || [];
  stashedSessions.unshift(stashItem);
  await setSettings({ stashedSessions });
  return stashedSessions;
}

export async function removeStash(stashId) {
  const settings = await getSettings();
  const stashedSessions = (settings.stashedSessions || []).filter(s => s.id !== stashId);
  await setSettings({ stashedSessions });
  return stashedSessions;
}
