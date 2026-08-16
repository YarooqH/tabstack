/**
 * TabStack Theme Manager
 * Handles System, Light, and Dark mode switching and live synchronization
 */

import { getSetting, setSetting } from './storage.js';

let mediaQuery = null;
let currentThemeListener = null;

/**
 * Resolves active theme ('light' or 'dark') based on setting and OS preference
 * @param {'system'|'light'|'dark'} themeSetting 
 * @returns {'light'|'dark'}
 */
export function resolveTheme(themeSetting) {
  if (themeSetting === 'light') return 'light';
  if (themeSetting === 'dark') return 'dark';
  // System mode
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Applies theme attribute to DOM root
 * @param {'system'|'light'|'dark'} themeSetting 
 */
export function applyTheme(themeSetting) {
  const resolved = resolveTheme(themeSetting);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-mode', themeSetting);
}

/**
 * Initializes theme listener and applies current stored theme
 * @param {Function} [onThemeChange] 
 * @returns {Promise<string>} Current theme setting
 */
export async function initTheme(onThemeChange) {
  const theme = (await getSetting('theme')) || 'system';
  applyTheme(theme);

  // Setup OS theme change listener for 'system' mode
  if (!mediaQuery && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', async () => {
      const current = await getSetting('theme');
      if (current === 'system') {
        applyTheme('system');
        if (onThemeChange) onThemeChange('system');
      }
    });
  }

  // Listen for storage changes across popup and options
  if (!currentThemeListener && chrome.storage?.onChanged) {
    currentThemeListener = (changes, area) => {
      if (area === 'local' && changes.theme) {
        applyTheme(changes.theme.newValue);
        if (onThemeChange) onThemeChange(changes.theme.newValue);
      }
    };
    chrome.storage.onChanged.addListener(currentThemeListener);
  }

  return theme;
}

/**
 * Sets and applies a new theme
 * @param {'system'|'light'|'dark'} newTheme 
 */
export async function setTheme(newTheme) {
  await setSetting('theme', newTheme);
  applyTheme(newTheme);
}
