# TabStack 🗂️⚡

> **The ultra-lightweight, high-performance browser extension that auto-clusters same-site tabs into native collapsible groups, auto-collapses inactive stacks (Accordion Mode), and saves RAM.**

![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)
![Zero Bloat](https://img.shields.io/badge/Memory_Overhead-~5MB-blue.svg)
![Chromium Compatible](https://img.shields.io/badge/Compatible-Brave%20%7C%20Chrome%20%7C%20Edge%20%7C%20Arc-orange.svg)

---

## ✨ Key Features

- ⚡ **Auto-Stack by Domain:** Automatically organizes tabs from the same site into native Chromium tab groups.
- 🪗 **Accordion / Focus Mode:** Automatically expands the stack for the tab you're currently viewing and collapses all other domain stacks to keep your tab strip clean.
- 💤 **Smart RAM Saver (Tab Hibernation):** Frees memory by automatically discarding background tabs in collapsed stacks using native `chrome.tabs.discard()` without losing history or place.
- 🎨 **Deterministic Color Coding:** Gives each domain a consistent, aesthetically matched tab group color.
- 🔍 **Instant Search & Command Palette:** Search across all open tabs and stacks in real time from the popup.
- 🧹 **Duplicate Tab Cleaner:** Detects and closes duplicate tabs with a single click.
- 📦 **Stack Stashing (Session Saver):** Save an entire domain group to local storage and close it; restore it anytime with one click.
- 🛑 **Domain Whitelist & Pin Protection:** Whitelist specific domains (e.g., `localhost`, Spotify, YouTube) or pin tabs to prevent them from being grouped or collapsed.
- 🌗 **System / Light / Dark Themes:** Live synchronization across OS appearance preferences with a minimal high-contrast monochrome aesthetic.

---

## 🌐 Interactive Landing Page

A dedicated interactive landing page with a live working browser simulator is included in [`landing/`](file:///f:/Just%20Some%20Files/opensource/tabstack/landing/):
- **Live Simulator:** Test domain stacking, accordion mode, and RAM calculation in real time.
- **Preview locally:** Run `python -m http.server 3333 --directory landing` and open `http://localhost:3333`.

---

## 🚀 Installation Guide

TabStack is zero-build and ready to run immediately in any Chromium browser:

### **In Brave Browser**
1. Open Brave and navigate to `brave://extensions/`.
2. Toggle **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select this directory (`tabstack`).

### **In Google Chrome / Microsoft Edge / Arc**
1. Navigate to `chrome://extensions/` (or `edge://extensions/`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this directory.

---

## ⌨️ Default Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd> | Open TabStack Popup Dashboard |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Group & Stack all tabs in current window |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd> | Toggle Accordion / Focus Mode on/off |

*Shortcuts can be customized at `chrome://extensions/shortcuts`.*

---

## 🛠️ Architecture & Performance

Unlike heavy tab managers that inject massive DOM trees or replace your browser interface:
- **Zero Injected Content Scripts:** TabStack does not inject scripts into user web pages, ensuring total privacy and 0% page load delay.
- **Event-Driven Service Worker:** The background service worker sleeps when idle, using event triggers and a **150ms debouncer** to batch operations with zero CPU spikes.
- **Native Browser Groups:** Uses Chromium's native `chrome.tabGroups` API directly.

---

## ⚙️ Configuration Options

Access the Options page anytime by clicking the gear icon in the popup or via `chrome://extensions`:
- **Auto-Stack Toggle:** Enable or disable automatic grouping.
- **Accordion Focus Mode:** Auto-collapse inactive groups on tab switch.
- **Minimum Tabs to Group:** Set threshold (1, 2, 3, or 4 tabs per domain).
- **Domain Granularity:** Choose between **Root Domain** (`github.com`) or **Subdomain** (`docs.github.com`).
- **RAM Saver Threshold:** Adjust idle hibernation timeout (5m, 15m, 20m, 30m, 60m).
- **Domain Whitelist:** Add domains to bypass grouping entirely.
- **Backup & Export:** Export your stashed sessions and preferences to JSON.

---

## 📄 License
MIT License. Free and open source.
