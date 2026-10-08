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
  stashedSessions: [],           // Array of saved stacks: [{ id, domain, title, color, date, tabs: [{ title, url, favIconUrl }] }]
  snapshotsEnabled: true,        // Periodically save every open window so it can be restored later
  snapshotIntervalMinutes: 360,  // 60 | 180 | 360 | 1440 | 10080
  snapshotKeepCount: 24,         // Number of periodic snapshots to keep
  snapshotClosedWindows: true    // Save a window's tabs when it is closed
};

export const SNAPSHOT_KINDS = {
  AUTO: 'auto',
  MANUAL: 'manual',
  CLOSED_WINDOW: 'closed-window',
  PREVIOUS_SESSION: 'previous-session'
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
  DISCARD_NOW: 'DISCARD_NOW',
  DISCARD_TAB: 'DISCARD_TAB',
  GET_SNAPSHOTS: 'GET_SNAPSHOTS',
  TAKE_SNAPSHOT: 'TAKE_SNAPSHOT',
  RESTORE_SNAPSHOT: 'RESTORE_SNAPSHOT',
  DELETE_SNAPSHOT: 'DELETE_SNAPSHOT',
  CLEAR_SNAPSHOTS: 'CLEAR_SNAPSHOTS',
  IMPORT_SNAPSHOTS: 'IMPORT_SNAPSHOTS',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED'
};
