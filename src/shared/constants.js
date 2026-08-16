/**
 * TabStack Shared Constants
 */

export const CHROMIUM_COLORS = [
  'blue',
  'cyan',
  'green',
  'yellow',
  'pink',
  'purple',
  'red',
  'grey'
];

export const DEFAULT_SETTINGS = {
  theme: 'system',               // 'system' | 'light' | 'dark'
  autoGroupEnabled: false,       // Off by default
  accordionMode: true,           // Auto-expand active group, collapse all other groups
  minTabsToGroup: 2,             // Minimum tabs from same domain to form a group (e.g. 2 tabs)
  domainMode: 'root',            // 'root' (e.g., github.com) or 'subdomain' (e.g., docs.github.com)
  groupNaming: 'domain-title',   // 'domain-title' (e.g., "GitHub (3)") or 'domain-only' ("github.com")
  showTabCountInTitle: true,
  autoDiscardEnabled: true,      // Free RAM for background tabs in collapsed groups
  discardTimeoutMinutes: 20,     // Time before inactive collapsed tab is discarded
  whitelistDomains: [
    'localhost',
    '127.0.0.1'
  ],
  customDomainColors: {},        // e.g. { "github.com": "purple" }
  customDomainNames: {},         // e.g. { "github.com": "GitHub Projects" }
  stashedSessions: []            // Array of saved stacks: [{ id, domain, title, color, date, tabs: [{ title, url, favIconUrl }] }]
};

export const MESSAGE_TYPES = {
  GET_STATS: 'GET_STATS',
  STACK_NOW: 'STACK_NOW',
  UNGROUP_ALL: 'UNGROUP_ALL',
  DEDUPLICATE_TABS: 'DEDUPLICATE_TABS',
  COLLAPSE_ALL: 'COLLAPSE_ALL',
  EXPAND_ALL: 'EXPAND_ALL',
  STASH_GROUP: 'STASH_GROUP',
  RESTORE_STASH: 'RESTORE_STASH',
  DELETE_STASH: 'DELETE_STASH',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED'
};
