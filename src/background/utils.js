/**
 * TabStack Background Utilities
 */

import { CHROMIUM_COLORS } from '../shared/constants.js';

// Common two-part TLDs to ensure accurate root domain extraction without huge PSL dependencies
const MULTIPART_TLDS = new Set([
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.nz', 'net.nz', 'org.nz', 'govt.nz',
  'co.jp', 'ne.jp', 'or.jp', 'go.jp', 'ac.jp',
  'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in',
  'com.br', 'net.br', 'org.br', 'gov.br',
  'com.sg', 'edu.sg', 'gov.sg', 'net.sg', 'org.sg',
  'co.za', 'net.za', 'org.za', 'gov.za',
  'com.tr', 'net.tr', 'org.tr', 'gov.tr',
  'com.mx', 'net.mx', 'org.mx', 'gob.mx',
  'co.kr', 'ne.kr', 'or.kr', 're.kr', 'pe.kr'
]);

/**
 * Extracts normalized domain or subdomain from a URL string
 * @param {string} urlString 
 * @param {'root'|'subdomain'} mode 
 * @returns {string|null}
 */
export function extractDomain(urlString, mode = 'root') {
  if (!urlString) return null;

  try {
    const parsedUrl = new URL(urlString);
    const protocol = parsedUrl.protocol;

    // Exclude internal/unsupported protocols
    if (['chrome:', 'brave:', 'edge:', 'opera:', 'about:', 'chrome-extension:', 'moz-extension:', 'file:', 'data:', 'javascript:'].includes(protocol)) {
      return null;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (!hostname) return null;

    // Handle localhost and IP addresses
    if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')) {
      return hostname;
    }

    if (mode === 'subdomain') {
      return hostname;
    }

    // Root domain extraction
    const parts = hostname.split('.');
    if (parts.length <= 2) {
      return hostname;
    }

    // Check if the last two parts match a known multi-part TLD (e.g., example.co.uk)
    const lastTwo = parts.slice(-2).join('.');
    if (MULTIPART_TLDS.has(lastTwo) && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }

    // Standard root domain (e.g., docs.github.com -> github.com)
    return parts.slice(-2).join('.');
  } catch {
    return null;
  }
}

/**
 * Converts a domain into a readable, polished label
 * @param {string} domain 
 * @returns {string}
 */
export function formatDomainTitle(domain) {
  if (!domain) return '';

  // Well known friendly brands
  const BRAND_MAP = {
    'github.com': 'GitHub',
    'gitlab.com': 'GitLab',
    'google.com': 'Google',
    'youtube.com': 'YouTube',
    'reddit.com': 'Reddit',
    'stackoverflow.com': 'Stack Overflow',
    'notion.so': 'Notion',
    'figma.com': 'Figma',
    'twitter.com': 'X / Twitter',
    'x.com': 'X / Twitter',
    'linkedin.com': 'LinkedIn',
    'wikipedia.org': 'Wikipedia',
    'amazon.com': 'Amazon',
    'netflix.com': 'Netflix',
    'spotify.com': 'Spotify',
    'slack.com': 'Slack',
    'discord.com': 'Discord',
    'medium.com': 'Medium',
    'chatgpt.com': 'ChatGPT',
    'openai.com': 'OpenAI',
    'gemini.google.com': 'Gemini',
    'claude.ai': 'Claude'
  };

  if (BRAND_MAP[domain]) {
    return BRAND_MAP[domain];
  }

  // Strip common TLDs for display (e.g., "linear.app" -> "Linear", "stripe.com" -> "Stripe")
  const namePart = domain.split('.')[0];
  if (namePart && namePart.length > 1) {
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }

  return domain;
}

/**
 * Deterministically generates a Chromium tabGroup color from a domain string
 * @param {string} domain 
 * @param {Record<string, string>} customColors
 * @returns {string}
 */
export function getDomainColor(domain, customColors = {}) {
  if (customColors && customColors[domain]) {
    return customColors[domain];
  }

  if (!domain) return 'grey';

  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % CHROMIUM_COLORS.length;
  return CHROMIUM_COLORS[index];
}

/**
 * Creates a debounced function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait = 150) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
