/**
 * TabStack Landing Engine
 * Native WebGL background shader, authentic Chromium & TabStack simulator, and theme manager
 */

import { initBackgroundShader } from './shader.js';

// Realistic Tab Catalog
const SIMULATOR_TABS = {
  // YouTube Tabs
  'yt-mrbeast': {
    id: 'yt-mrbeast',
    group: 'youtube',
    domain: 'youtube.com',
    url: 'https://www.youtube.com/watch?v=48h57PspBec',
    videoId: '48h57PspBec',
    thumbnailUrl: 'https://i.ytimg.com/vi/48h57PspBec/hqdefault.jpg',
    title: '$1 vs $1,000,000,000 Yacht! - MrBeast',
    type: 'youtube',
    videoTitle: '$1 vs $1,000,000,000 Yacht!',
    channel: 'MrBeast',
    channelAvatarBg: '#00b4d8',
    channelAvatarText: 'MB',
    subscribers: '310M subscribers',
    views: '184,912,408 views · 2 weeks ago',
    duration: '14:22',
    progress: '48%',
    currentTime: '6:52',
    likes: '4.8M',
    isLive: false
  },
  'yt-rick': {
    id: 'yt-rick',
    group: 'youtube',
    domain: 'youtube.com',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    type: 'youtube',
    videoTitle: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    channel: 'Rick Astley',
    channelAvatarBg: '#f59e0b',
    channelAvatarText: 'RA',
    subscribers: '4.2M subscribers',
    views: '1,540,820,119 views · 14 years ago',
    duration: '3:33',
    progress: '32%',
    currentTime: '1:08',
    likes: '16M',
    isLive: false
  },
  'yt-lofi': {
    id: 'yt-lofi',
    group: 'youtube',
    domain: 'youtube.com',
    url: 'https://www.youtube.com/watch?v=5qap5aO4i9A',
    videoId: '5qap5aO4i9A',
    thumbnailUrl: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    title: 'lofi hip hop radio - beats to relax/study to',
    type: 'youtube',
    videoTitle: 'lofi hip hop radio 📚 - beats to relax/study to [LIVE 24/7]',
    channel: 'Lofi Girl',
    channelAvatarBg: '#ec4899',
    channelAvatarText: 'LG',
    subscribers: '14.1M subscribers',
    views: '42,108 watching now · Live stream',
    duration: 'LIVE',
    progress: '100%',
    currentTime: 'LIVE',
    likes: '7.8M',
    isLive: true
  },

  // Pinterest Tabs
  'pin-desk': {
    id: 'pin-desk',
    group: 'pinterest',
    domain: 'pinterest.com',
    url: 'https://www.pinterest.com/search/pins/?q=minimalist+desk+setup',
    title: 'Minimalist Desk Setups & Workspace Inspo',
    type: 'pinterest',
    boardTitle: 'Minimalist Workspace & Hardware Setups',
    curator: 'Design Studio Vault',
    stats: '142 Pins · 18.4k Followers',
    pins: [
      { title: 'Oak Wood Monitor Stand with Ambient Backlight', saves: '12.4k saves', imageUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=400&q=80' },
      { title: 'Matte Black 65% Mechanical Keyboard + Coiled Cable', saves: '8.9k saves', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80' },
      { title: 'Ergonomic Mesh Chair & Warm Lightbar Minimal Desk', saves: '15.2k saves', imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80' },
      { title: 'Ultrawide Curved OLED with Floating Arm Mount', saves: '9.7k saves', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  'pin-arch': {
    id: 'pin-arch',
    group: 'pinterest',
    domain: 'pinterest.com',
    url: 'https://www.pinterest.com/search/pins/?q=brutalist+architecture',
    title: 'Brutalist Architecture & Raw Concrete Horizons',
    type: 'pinterest',
    boardTitle: 'Raw Concrete, Glass & Geometric Horizons',
    curator: 'ArchDaily Archive',
    stats: '88 Pins · 42.1k Followers',
    pins: [
      { title: 'Cantilever Concrete Villa Overlooking Coastal Fog', saves: '24.1k saves', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80' },
      { title: 'Minimalist Spiral Monolith Staircase in Warm Zinc', saves: '11.8k saves', imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80' },
      { title: 'Floor-to-Ceiling Bauhaus Glass Facade & Cedar Beams', saves: '19.5k saves', imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80' },
      { title: 'Sculptural Courtyard with Reflective Water Basin', saves: '14.6k saves', imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80' }
    ]
  },
  'pin-ui': {
    id: 'pin-ui',
    group: 'pinterest',
    domain: 'pinterest.com',
    url: 'https://www.pinterest.com/search/pins/?q=dark+ui+typography',
    title: 'Dark UI Typography & Design System Tokens',
    type: 'pinterest',
    boardTitle: 'Precision Interfaces & Micro-Interactions',
    curator: 'Figma Community Curated',
    stats: '210 Pins · 31.9k Followers',
    pins: [
      { title: 'OLED Glassmorphism Card System with HSL Gradients', saves: '31.2k saves', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80' },
      { title: 'Optical Sizing & Monospace Data Tables for FinTech', saves: '17.4k saves', imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80' },
      { title: 'Bento Grid Dashboard with Micro-Spring Animations', saves: '28.9k saves', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80' },
      { title: 'Zinc & Obsidian Theme Palette Guide v2.4', saves: '22.3k saves', imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80' }
    ]
  },

  // Spotify Tabs
  'spot-hits': {
    id: 'spot-hits',
    group: 'spotify',
    domain: 'spotify.com',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    title: "Today's Top Hits · Playlist",
    type: 'spotify',
    playlistTitle: "Today's Top Hits",
    tag: 'PUBLIC PLAYLIST',
    meta: 'Sabrina Carpenter, Billie Eilish & more · 34.8M likes · 50 songs',
    tracks: [
      { num: '1', title: 'Espresso', artist: 'Sabrina Carpenter', duration: '2:55' },
      { num: '2', title: 'Birds of a Feather', artist: 'Billie Eilish', duration: '3:18' },
      { num: '3', title: 'Good Luck, Babe!', artist: 'Chappell Roan', duration: '3:38' },
      { num: '4', title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', duration: '2:51' }
    ]
  },
  'spot-focus': {
    id: 'spot-focus',
    group: 'spotify',
    domain: 'spotify.com',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ',
    title: 'Deep Focus · Ambient Beats for Coding',
    type: 'spotify',
    playlistTitle: 'Deep Focus',
    tag: 'CURATED BY SPOTIFY',
    meta: 'Post-rock & atmospheric electronics · 4.1M likes · 6 hr 12 min',
    tracks: [
      { num: '1', title: 'Weightless', artist: 'Marconi Union', duration: '8:05' },
      { num: '2', title: 'Substratum', artist: 'Kiasmos', duration: '5:12' },
      { num: '3', title: 'Sunson', artist: 'Nils Frahm', duration: '9:11' },
      { num: '4', title: 'Continuum', artist: 'Ólafur Arnalds', duration: '4:22' }
    ]
  },
  'spot-weekly': {
    id: 'spot-weekly',
    group: 'spotify',
    domain: 'spotify.com',
    url: 'https://open.spotify.com/playlist/37i9dQZEVXcQ9xN3Gh7K8Z',
    title: 'Discover Weekly · Personalized Mix',
    type: 'spotify',
    playlistTitle: 'Discover Weekly',
    tag: 'MADE FOR YOU',
    meta: 'Your weekly mixtape of fresh music · Updated every Monday',
    tracks: [
      { num: '1', title: 'Midnight City (Remix)', artist: 'M83', duration: '4:03' },
      { num: '2', title: 'Genesis', artist: 'Justice', duration: '3:54' },
      { num: '3', title: 'Glue', artist: 'Bicep', duration: '4:29' },
      { num: '4', title: 'Resonance', artist: 'HOME', duration: '3:32' }
    ]
  },

  // Duplicate Tabs (Scattered in Chaos & Grouped before Deduplication)
  'yt-mrbeast-dup': {
    id: 'yt-mrbeast-dup',
    group: 'youtube',
    domain: 'youtube.com',
    url: 'https://www.youtube.com/watch?v=48h57PspBec',
    videoId: '48h57PspBec',
    thumbnailUrl: 'https://i.ytimg.com/vi/48h57PspBec/hqdefault.jpg',
    title: '$1 vs $1,000,000,000 Yacht! - MrBeast',
    type: 'youtube',
    videoTitle: '$1 vs $1,000,000,000 Yacht!',
    channel: 'MrBeast',
    channelAvatarBg: '#00b4d8',
    channelAvatarText: 'MB',
    subscribers: '310M subscribers',
    views: '184,912,408 views · 2 weeks ago',
    duration: '14:22',
    progress: '48%',
    currentTime: '6:52',
    likes: '4.8M',
    isLive: false
  },
  'yt-rick-dup': {
    id: 'yt-rick-dup',
    group: 'youtube',
    domain: 'youtube.com',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    type: 'youtube',
    videoTitle: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
    channel: 'Rick Astley',
    channelAvatarBg: '#f59e0b',
    channelAvatarText: 'RA',
    subscribers: '4.2M subscribers',
    views: '1,540,820,119 views · 14 years ago',
    duration: '3:33',
    progress: '32%',
    currentTime: '1:08',
    likes: '16M',
    isLive: false
  },
  'spot-hits-dup': {
    id: 'spot-hits-dup',
    group: 'spotify',
    domain: 'spotify.com',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    title: "Today's Top Hits · Playlist",
    type: 'spotify',
    playlistTitle: "Today's Top Hits",
    tag: 'PUBLIC PLAYLIST',
    meta: 'Sabrina Carpenter, Billie Eilish & more · 34.8M likes · 50 songs',
    tracks: [
      { num: '1', title: 'Espresso', artist: 'Sabrina Carpenter', duration: '2:55' },
      { num: '2', title: 'Birds of a Feather', artist: 'Billie Eilish', duration: '3:18' },
      { num: '3', title: 'Good Luck, Babe!', artist: 'Chappell Roan', duration: '3:38' },
      { num: '4', title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', duration: '2:51' }
    ]
  }
};

// Simulator & Tour State
let currentActiveTabId = 'yt-mrbeast';
let currentTourStep = 1;
let isTourActive = false;
let hasAutoStartedTour = false;
let isDeduplicated = false;

// DOM Elements
const simChaosStrip = document.getElementById('simChaosStrip');
const simGroupedStrip = document.getElementById('simGroupedStrip');
const simWebpageContext = document.getElementById('simWebpageContext');

const popStatTabs = document.getElementById('popStatTabs');
const popStatStacks = document.getElementById('popStatStacks');
const popStatRam = document.getElementById('popStatRam');

const simToggleAutoGroup = document.getElementById('simToggleAutoGroup');
const simToggleAccordion = document.getElementById('simToggleAccordion');
const simToggleRamSaver = document.getElementById('simToggleRamSaver');
const simSearchInput = document.getElementById('simSearchInput');

const simBtnStackNow = document.getElementById('simBtnStackNow');
const simBtnDeduplicate = document.getElementById('simBtnDeduplicate');
const simBtnCollapseAll = document.getElementById('simBtnCollapseAll');
const simLiveFeedback = document.getElementById('simLiveFeedback');
const simBtnReset = document.getElementById('simBtnReset');

const simYoutubeSleep = document.getElementById('simYoutubeSleep');
const simPinterestSleep = document.getElementById('simPinterestSleep');
const simSpotifySleep = document.getElementById('simSpotifySleep');

const simTourPopover = document.getElementById('simTourPopover');
const simPopTitle = document.getElementById('simPopTitle');
const simPopDesc = document.getElementById('simPopDesc');
const simPopStep = document.getElementById('simPopStep');
const simulatorWindow = document.getElementById('simulatorWindow');

const TOUR_STEPS = [
  {
    stepIndex: 1,
    targetId: 'simBtnStackNow',
    title: 'Stack Tabs',
    desc: 'Click "Stack Now" below to group tabs.',
    stepLabel: '1 of 3'
  },
  {
    stepIndex: 2,
    targetId: 'simBtnDeduplicate',
    title: 'Deduplicate',
    desc: 'Click "Deduplicate" to close 3 duplicate tabs.',
    stepLabel: '2 of 3'
  },
  {
    stepIndex: 3,
    targetId: 'simToggleRamSaverRow',
    title: 'RAM Saver',
    desc: 'Toggle "RAM Saver" to hibernate inactive tabs.',
    stepLabel: '3 of 3'
  }
];

function setLiveFeedback(message) {
  if (!simLiveFeedback) return;
  simLiveFeedback.style.opacity = '0.4';
  setTimeout(() => {
    simLiveFeedback.textContent = message;
    simLiveFeedback.style.opacity = '1';
  }, 80);
}

function clearAllSpotlights() {
  document.querySelectorAll('.sim-spotlight-active').forEach(el => {
    el.classList.remove('sim-spotlight-active');
  });
}

function positionScopedPopover(targetElem) {
  if (!targetElem || !simTourPopover || !simulatorWindow) return;

  const simRect = simulatorWindow.getBoundingClientRect();
  const targetRect = targetElem.getBoundingClientRect();

  const targetTop = targetRect.top - simRect.top;
  const targetLeft = targetRect.left - simRect.left;
  const targetWidth = targetRect.width;
  const targetHeight = targetRect.height;

  const popWidth = simTourPopover.offsetWidth || 200;
  const popHeight = simTourPopover.offsetHeight || 60;

  // By default, place 12px above the target
  let top = targetTop - popHeight - 12;
  // If placing above would overlap the top bar, place 12px below
  if (top < 40) {
    top = targetTop + targetHeight + 12;
  }

  // Center horizontally over the target
  let left = targetLeft + (targetWidth / 2) - (popWidth / 2);

  // Constrain horizontally within simulator
  const minLeft = 12;
  const maxLeft = simRect.width - popWidth - 12;
  if (left < minLeft) left = minLeft;
  if (left > maxLeft) left = maxLeft;

  simTourPopover.style.top = `${Math.round(top)}px`;
  simTourPopover.style.left = `${Math.round(left)}px`;
}

function showTourStep(stepNum) {
  if (stepNum < 1 || stepNum > TOUR_STEPS.length) {
    endSimulatorTour();
    return;
  }

  currentTourStep = stepNum;
  isTourActive = true;

  const step = TOUR_STEPS[stepNum - 1];
  const targetElem = document.getElementById(step.targetId);

  clearAllSpotlights();
  if (targetElem) {
    targetElem.classList.add('sim-spotlight-active');
  }

  if (simTourPopover) {
    if (simPopTitle) simPopTitle.textContent = step.title;
    if (simPopDesc) simPopDesc.textContent = step.desc;
    if (simPopStep) simPopStep.textContent = step.stepLabel;

    simTourPopover.classList.remove('hidden');
    requestAnimationFrame(() => {
      positionScopedPopover(targetElem);
    });
  }
}

function endSimulatorTour() {
  isTourActive = false;
  clearAllSpotlights();
  if (simTourPopover) simTourPopover.classList.add('hidden');
}

function startDriverTour() {
  resetToChaos();
  showTourStep(1);
}

function setupTourObserver() {
  const showcaseElem = document.getElementById('showcase');
  if (!showcaseElem) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAutoStartedTour) {
        hasAutoStartedTour = true;
        setTimeout(() => {
          startDriverTour();
        }, 350);
      }
    });
  }, { threshold: 0.25 });

  observer.observe(showcaseElem);
}

function init() {
  // 1. WebGL Background Shader
  try {
    initBackgroundShader('bgShader');
  } catch (err) {
    console.warn('WebGL shader fallback:', err);
  }

  // 2. Theme Manager
  setupTheme();

  // 3. Setup Copy Button
  setupCopyButton();

  // 4. Setup Hero Interactive 3D Stacking Engine
  setupStackEngine();

  // 5. Setup Interactive Simulator
  setupSimulator();

  // 6. Setup Auto Tour Observer
  setupTourObserver();
}

function setupSimulator() {
  // Initial Viewport Render in Chaos Mode with 9 open tabs
  resetToChaos();

  // 1. Wire up clicks for all tabs in Chaos Strip
  document.querySelectorAll('#simChaosStrip .chrome-tab').forEach(tabElem => {
    tabElem.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabId = tabElem.dataset.tabId;
      if (tabId) {
        activateTab(tabId, false);
        const tab = SIMULATOR_TABS[tabId];
        if (tab) setLiveFeedback(`Focused: ${tab.videoTitle || tab.title}`);
      }
    });
  });

  // 2. Wire up clicks for all tabs in Grouped Strip
  document.querySelectorAll('#simGroupedStrip .chrome-tab').forEach(tabElem => {
    tabElem.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabId = tabElem.dataset.tabId;
      if (tabId) {
        activateTab(tabId, false);
        const tab = SIMULATOR_TABS[tabId];
        if (tab) setLiveFeedback(`Focused: ${tab.videoTitle || tab.title}`);
      }
    });
  });

  // 3. Wire up Group Pill clicks in Grouped Strip (Expand / Collapse)
  document.querySelectorAll('#simGroupedStrip .chrome-group').forEach(groupElem => {
    const pill = groupElem.querySelector('.chrome-group-pill');
    const groupName = groupElem.dataset.group;
    pill?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (groupName) {
        toggleGroup(groupName);
        setLiveFeedback(`Toggled ${groupName} stack`);
      }
    });
  });

  // 4. Wire up Extension Popup Stack Headers (Expand / Collapse)
  document.querySelectorAll('#simPopStacksList .pop-stack-header').forEach(headerElem => {
    headerElem.addEventListener('click', (e) => {
      e.stopPropagation();
      const stackItem = headerElem.closest('.pop-stack-item');
      const groupName = stackItem?.dataset.group;
      if (groupName) {
        toggleGroup(groupName);
        setLiveFeedback(`Toggled ${groupName} stack`);
      }
    });
  });

  // 5. Wire up Extension Popup Tabs
  document.querySelectorAll('#simPopStacksList .pop-tab').forEach(popTab => {
    popTab.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabId = popTab.dataset.tabId;
      if (tabId) {
        activateTab(tabId, true);
        const tab = SIMULATOR_TABS[tabId];
        if (tab) setLiveFeedback(`Focused: ${tab.videoTitle || tab.title}`);
      }
    });
  });

  // 6. Action buttons in Popup
  simBtnStackNow?.addEventListener('click', () => {
    triggerStackNowAction();
    if (isTourActive && currentTourStep === 1) {
      showTourStep(2);
    }
  });

  simBtnCollapseAll?.addEventListener('click', () => {
    collapseAllGroups();
    setLiveFeedback("Collapsed all stacks");
  });

  simBtnDeduplicate?.addEventListener('click', () => {
    triggerDeduplicateAction();
    if (isTourActive && currentTourStep === 2) {
      showTourStep(3);
    }
  });

  // 7. Feature Toggles inside Popup
  simToggleAccordion?.addEventListener('change', () => {
    updateAccordionState(simToggleAccordion.checked);
    setLiveFeedback(simToggleAccordion.checked ? "Accordion mode enabled" : "Accordion mode disabled");
  });

  simToggleRamSaver?.addEventListener('change', () => {
    updateRamSaverState(simToggleRamSaver.checked);
    if (isTourActive && currentTourStep === 3 && simToggleRamSaver.checked) {
      endSimulatorTour();
    }
  });

  simToggleAutoGroup?.addEventListener('change', () => {
    if (simToggleAutoGroup.checked) {
      triggerStackNowAction();
      setLiveFeedback("Auto-stack enabled");
    } else {
      resetToChaos();
    }
  });

  // 8. Search Input inside Popup
  simSearchInput?.addEventListener('input', (e) => {
    filterTabs(e.target.value);
    setLiveFeedback(`Filtered: "${e.target.value}"`);
  });

  // 9. Reset Button
  simBtnReset?.addEventListener('click', () => {
    startDriverTour();
  });

  // 10. Tab Strip Horizontal Scrolling
  const simScrollLeftBtn = document.getElementById('simScrollLeftBtn');
  const simScrollRightBtn = document.getElementById('simScrollRightBtn');
  const chromeTabStrip = document.getElementById('chromeTabStrip');

  simScrollLeftBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    chromeTabStrip?.scrollBy({ left: -140, behavior: 'smooth' });
  });

  simScrollRightBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    chromeTabStrip?.scrollBy({ left: 140, behavior: 'smooth' });
  });

  chromeTabStrip?.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      chromeTabStrip.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  window.addEventListener('resize', () => {
    if (isTourActive) {
      const step = TOUR_STEPS[currentTourStep - 1];
      const targetElem = document.getElementById(step?.targetId);
      if (targetElem) positionScopedPopover(targetElem);
    }
  });

  // 10. Nav Tabs inside Popup (Live Stacks / Saved / Whitelist)
  const popNavBtns = document.querySelectorAll('.pop-nav-btn');
  popNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      popNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const liveView = document.getElementById('simPopLiveView');
      const savedView = document.getElementById('simPopSavedView');
      const whitelistView = document.getElementById('simPopWhitelistView');
      const searchBar = document.getElementById('simPopSearchBar');
      const footer = document.querySelector('.pop-footer');

      if (btn.id === 'simNavLive') {
        liveView?.classList.remove('hidden');
        savedView?.classList.add('hidden');
        whitelistView?.classList.add('hidden');
        if (searchBar) searchBar.style.display = 'flex';
        if (footer) footer.style.display = 'flex';
        setLiveFeedback("⚡ Live Stacks view: Active grouped tabs and browser flyout");
      } else if (btn.id === 'simNavSaved') {
        liveView?.classList.add('hidden');
        savedView?.classList.remove('hidden');
        whitelistView?.classList.add('hidden');
        if (searchBar) searchBar.style.display = 'none';
        if (footer) footer.style.display = 'none';
        setLiveFeedback("💾 Saved Sessions: 3 saved workspace presets ready to restore");
      } else if (btn.id === 'simNavWhitelist') {
        liveView?.classList.add('hidden');
        savedView?.classList.add('hidden');
        whitelistView?.classList.remove('hidden');
        if (searchBar) searchBar.style.display = 'none';
        if (footer) footer.style.display = 'none';
        setLiveFeedback("🛡️ Whitelist Rules: 2 domain bypass exception rules active");
      }
    });
  });

  // 11. Saved Sessions Restore Action
  document.querySelectorAll('.saved-restore-btn').forEach(restoreBtn => {
    restoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const preset = restoreBtn.dataset.preset;
      
      const navLive = document.getElementById('simNavLive');
      navLive?.click();

      triggerStackNowAction();
      if (preset === 'design') {
        activateTab('pin-desk', true);
        toggleGroup('pinterest');
        setLiveFeedback("💾 Restored 'Design Moodboard 2026' workspace preset (5 tabs)");
      } else if (preset === 'audio') {
        activateTab('yt-lofi', true);
        toggleGroup('youtube');
        setLiveFeedback("💾 Restored 'Weekend Audio & Lo-Fi' workspace preset (3 tabs)");
      } else {
        activateTab('yt-mrbeast', true);
        toggleGroup('youtube');
        setLiveFeedback("💾 Restored 'Focus & Dev Workspace' preset (4 tabs)");
      }
      
      restoreBtn.textContent = 'Restored ✓';
      setTimeout(() => { restoreBtn.textContent = 'Restore'; }, 1500);
    });
  });

  // 12. Whitelist Rule Addition
  const btnAddWhitelist = document.getElementById('simBtnAddWhitelist');
  const inputWhitelist = document.getElementById('simWhitelistInput');

  function handleAddWhitelistRule() {
    const val = inputWhitelist?.value?.trim().toLowerCase();
    if (!val) return;

    const container = document.querySelector('.pop-whitelist-wrap');
    const addRow = document.querySelector('.whitelist-add-row');
    if (!container || !addRow) return;

    const newRule = document.createElement('div');
    newRule.className = 'whitelist-rule-item';
    newRule.innerHTML = `
      <div class="whitelist-info">
        <span class="whitelist-domain">${val}</span>
        <span class="whitelist-desc">Custom Rule · Always Keep Pinned</span>
      </div>
      <label class="pop-toggle-row">
        <input type="checkbox" class="pop-switch" checked />
      </label>
    `;
    container.insertBefore(newRule, addRow);
    inputWhitelist.value = '';

    const count = container.querySelectorAll('.whitelist-rule-item').length;
    const navWhitelist = document.getElementById('simNavWhitelist');
    if (navWhitelist) navWhitelist.textContent = `Whitelist (${count})`;
    setLiveFeedback(`🛡️ Added whitelist rule for "${val}" (Always Keep Pinned)`);
  }

  btnAddWhitelist?.addEventListener('click', handleAddWhitelistRule);
  inputWhitelist?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddWhitelistRule();
  });

  // 13. Popup Theme Toggle Button
  document.querySelector('.pop-theme-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem('tabstack_landing_theme', nextTheme);
    setLiveFeedback(`🌓 Theme switched to ${nextTheme} mode`);
  });
}

function activateTab(tabId, expandGroupIfNeeded = true) {
  const tab = SIMULATOR_TABS[tabId];
  if (!tab) return;
  currentActiveTabId = tabId;

  // 1. Update Omnibox URL
  const omnibox = document.getElementById('simOmniboxUrl');
  if (omnibox) omnibox.textContent = tab.url;

  // 2. Update Chrome Tab Strip active classes
  document.querySelectorAll('#simChaosStrip .chrome-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tabId === tabId);
  });

  document.querySelectorAll('#simGroupedStrip .chrome-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tabId === tabId);
  });

  // 3. If in Grouped mode and requested, ensure group is open
  if (expandGroupIfNeeded) {
    const isAccordion = simToggleAccordion?.checked;
    const groupName = tab.group;

    document.querySelectorAll('#simGroupedStrip .chrome-group').forEach(grp => {
      const match = grp.dataset.group === groupName;
      if (match) {
        grp.classList.remove('collapsed');
        grp.classList.add('active-group');
        const tabsBox = grp.querySelector('.chrome-group-tabs');
        if (tabsBox) tabsBox.classList.remove('hidden');
      } else if (isAccordion) {
        grp.classList.add('collapsed');
        grp.classList.remove('active-group');
        const tabsBox = grp.querySelector('.chrome-group-tabs');
        if (tabsBox) tabsBox.classList.add('hidden');
      }
    });

    document.querySelectorAll('#simPopStacksList .pop-stack-item').forEach(item => {
      const match = item.dataset.group === groupName;
      if (match) {
        item.classList.add('active');
        const tabsBox = item.querySelector('.pop-tabs-container');
        const chev = item.querySelector('.pop-chevron-btn');
        if (tabsBox) tabsBox.classList.remove('hidden');
        if (chev) chev.classList.add('active');
      } else if (isAccordion) {
        item.classList.remove('active');
        const tabsBox = item.querySelector('.pop-tabs-container');
        const chev = item.querySelector('.pop-chevron-btn');
        if (tabsBox) tabsBox.classList.add('hidden');
        if (chev) chev.classList.remove('active');
      }
    });
  }

  // 4. Update Popup active tab rows
  document.querySelectorAll('#simPopStacksList .pop-tab').forEach(pt => {
    const match = pt.dataset.tabId === tabId;
    pt.classList.toggle('active', match);
    const dot = pt.querySelector('.tab-dot');
    if (dot) dot.classList.toggle('active', match);
  });

  // 5. Render Viewport Mockup
  renderViewportForTab(tabId);
  updateMetricsDisplay();
}

function toggleGroup(groupName) {
  const groupEl = document.querySelector(`#simGroupedStrip .chrome-group[data-group="${groupName}"]`);
  const popStack = document.querySelector(`#simPopStacksList .pop-stack-item[data-group="${groupName}"]`);
  const isAccordion = simToggleAccordion?.checked;

  if (!groupEl) return;

  const isCurrentlyCollapsed = groupEl.classList.contains('collapsed');

  if (isCurrentlyCollapsed) {
    // EXPAND THIS GROUP
    if (isAccordion) {
      document.querySelectorAll('#simGroupedStrip .chrome-group').forEach(grp => {
        if (grp.dataset.group !== groupName) {
          grp.classList.add('collapsed');
          grp.classList.remove('active-group');
          const tBox = grp.querySelector('.chrome-group-tabs');
          if (tBox) tBox.classList.add('hidden');
        }
      });
      document.querySelectorAll('#simPopStacksList .pop-stack-item').forEach(item => {
        if (item.dataset.group !== groupName) {
          item.classList.remove('active');
          const tBox = item.querySelector('.pop-tabs-container');
          const chev = item.querySelector('.pop-chevron-btn');
          if (tBox) tBox.classList.add('hidden');
          if (chev) chev.classList.remove('active');
        }
      });
    }

    groupEl.classList.remove('collapsed');
    groupEl.classList.add('active-group');
    const tabsBox = groupEl.querySelector('.chrome-group-tabs');
    if (tabsBox) tabsBox.classList.remove('hidden');

    if (popStack) {
      popStack.classList.add('active');
      const pTabsBox = popStack.querySelector('.pop-tabs-container');
      const chev = popStack.querySelector('.pop-chevron-btn');
      if (pTabsBox) pTabsBox.classList.remove('hidden');
      if (chev) chev.classList.add('active');
    }

    // Activate the first tab in this group
    const firstTab = Object.values(SIMULATOR_TABS).find(t => t.group === groupName);
    if (firstTab) {
      activateTab(firstTab.id, false);
    }
  } else {
    // COLLAPSE THIS GROUP
    groupEl.classList.add('collapsed');
    groupEl.classList.remove('active-group');
    const tabsBox = groupEl.querySelector('.chrome-group-tabs');
    if (tabsBox) tabsBox.classList.add('hidden');

    if (popStack) {
      popStack.classList.remove('active');
      const pTabsBox = popStack.querySelector('.pop-tabs-container');
      const chev = popStack.querySelector('.pop-chevron-btn');
      if (pTabsBox) pTabsBox.classList.add('hidden');
      if (chev) chev.classList.remove('active');
    }
  }

  updateMetricsDisplay();
  renderViewportForTab(currentActiveTabId);
}

function collapseAllGroups() {
  document.querySelectorAll('#simGroupedStrip .chrome-group').forEach(grp => {
    grp.classList.add('collapsed');
    grp.classList.remove('active-group');
    const tBox = grp.querySelector('.chrome-group-tabs');
    if (tBox) tBox.classList.add('hidden');
  });

  document.querySelectorAll('#simPopStacksList .pop-stack-item').forEach(item => {
    item.classList.remove('active');
    const tBox = item.querySelector('.pop-tabs-container');
    const chev = item.querySelector('.pop-chevron-btn');
    if (tBox) tBox.classList.add('hidden');
    if (chev) chev.classList.remove('active');
  });

  updateMetricsDisplay();
  renderViewportForTab(currentActiveTabId);
}

function renderViewportForTab(tabId) {
  const tab = SIMULATOR_TABS[tabId] || SIMULATOR_TABS['yt-mrbeast'];
  const container = document.getElementById('simWebpageContext');
  if (!container) return;

  let mockupHtml = '';

  if (tab.type === 'youtube') {
    mockupHtml = `
      <div class="webpage-mockup-wrap">
        <div class="yt-player-box">
          <img src="${tab.thumbnailUrl}" alt="${tab.videoTitle}" class="yt-thumbnail-img" loading="lazy" onerror="if (!this.dataset.tried) { this.dataset.tried = '1'; this.src = 'https://img.youtube.com/vi/${tab.videoId}/hqdefault.jpg'; }" />
          <div class="yt-player-overlay"></div>
          ${tab.isLive ? `
            <div class="yt-badge-corner"><span class="yt-live-dot"></span> LIVE 24/7</div>
          ` : `
            <div class="yt-badge-corner">HD 4K</div>
          `}
          <div class="yt-center-play-btn" title="YouTube Video Preview">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <div class="yt-player-controls-bar">
            <div class="yt-progress-line">
              <div class="yt-progress-filled" style="width: ${tab.progress}"></div>
            </div>
            <div class="yt-control-row">
              <span>${tab.currentTime} / ${tab.duration}</span>
              <span>1080p60 · Stereo</span>
            </div>
          </div>
        </div>

        <div class="yt-video-info-block">
          <h3 class="yt-video-title">${tab.videoTitle}</h3>
          <div class="yt-channel-bar">
            <div class="yt-channel-meta">
              <div class="yt-channel-avatar" style="background: ${tab.channelAvatarBg}">${tab.channelAvatarText}</div>
              <div class="yt-channel-text">
                <span class="yt-channel-name">${tab.channel}</span>
                <span class="yt-channel-subs">${tab.subscribers}</span>
              </div>
            </div>
            <button class="yt-sub-btn">Subscribe</button>
          </div>
          <div class="yt-actions-pill-group">
            <span class="yt-action-pill">👍 ${tab.likes}</span>
            <span class="yt-action-pill">↗ Share</span>
            <span class="yt-action-pill">📥 Download</span>
            <span class="yt-action-pill">🔖 Save</span>
          </div>
        </div>
      </div>
    `;
  } else if (tab.type === 'pinterest') {
    mockupHtml = `
      <div class="webpage-mockup-wrap">
        <div class="pin-board-header">
          <div class="pin-board-meta-col">
            <h3 class="pin-board-title">${tab.boardTitle}</h3>
            <span class="pin-board-meta">${tab.curator} · ${tab.stats}</span>
          </div>
          <button class="pin-save-all-btn">Save All</button>
        </div>
        <div class="pin-masonry-grid">
          ${tab.pins.map(p => `
            <div class="pin-card-item">
              <div class="pin-thumb-box">
                <img src="${p.imageUrl}" alt="${p.title}" class="pin-thumb-img" loading="lazy" />
                <div class="pin-thumb-overlay"></div>
                <span class="pin-save-badge">Save</span>
              </div>
              <div class="pin-card-info">
                <span class="pin-card-name">${p.title}</span>
                <span class="pin-card-saves">📌 ${p.saves}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (tab.type === 'spotify') {
    mockupHtml = `
      <div class="webpage-mockup-wrap">
        <div class="spot-player-hero">
          <div class="spot-cover-art">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.495 17.305c-.215.352-.674.464-1.026.248-2.812-1.718-6.353-2.107-10.523-1.155-.401.092-.802-.16-.893-.561-.092-.402.16-.803.561-.894 4.568-1.043 8.49-.604 11.633 1.314.353.216.465.674.248 1.048zm1.467-3.262c-.27.441-.85.58-1.29.31-3.22-1.979-8.13-2.55-11.94-1.393-.497.151-1.028-.135-1.179-.633-.151-.498.135-1.028.633-1.179 4.354-1.321 9.774-.683 13.466 1.584.44.27.58.85.31 1.311zm.126-3.41c-3.86-2.292-10.23-2.503-13.916-1.385-.59.18-1.218-.16-1.397-.751-.18-.592.16-1.219.751-1.398 4.238-1.286 11.272-1.042 15.698 1.587.531.315.706 1.002.391 1.533-.314.53-.997.705-1.527.414z"/></svg>
          </div>
          <div class="spot-playlist-info">
            <span class="spot-tag">${tab.tag}</span>
            <h3 class="spot-playlist-title">${tab.playlistTitle}</h3>
            <span class="spot-playlist-meta">${tab.meta}</span>
          </div>
        </div>

        <div class="spot-action-row">
          <div class="spot-play-circle-btn" title="Play Playlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </div>
          <span style="font-size: 15px; color: var(--text-secondary); cursor: pointer;" title="Liked">💚</span>
          <span style="font-size: 15px; color: var(--text-secondary); cursor: pointer;" title="Download">⬇</span>
          <span style="font-size: 15px; color: var(--text-secondary); cursor: pointer;" title="Options">⋯</span>
        </div>

        <div class="spot-tracklist-table">
          ${tab.tracks.map((t, idx) => `
            <div class="spot-track-row ${idx === 0 ? 'active' : ''}">
              <div class="spot-track-left">
                <span class="spot-track-num">${t.num}</span>
                <div class="spot-track-title-block">
                  <span class="spot-track-title">${t.title}</span>
                  <span class="spot-track-artist">${t.artist}</span>
                </div>
              </div>
              <span class="spot-track-duration">${t.duration}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Live Performance & RAM Metrics
  const isGrouped = !simGroupedStrip?.classList.contains('hidden');
  const isAccordion = simToggleAccordion?.checked;
  const isRamSaver = simToggleRamSaver?.checked;

  let memText = isGrouped ? (isRamSaver ? '142 MB (-86% RAM Saved)' : '420 MB (Clustered)') : '1,890 MB (Ungrouped Chaos)';
  let memClass = isRamSaver ? 'stat-val text-green' : (isGrouped ? 'stat-val' : 'stat-val text-red');
  let focusText = isGrouped ? (isAccordion ? `${tab.group.toUpperCase()} Stack Focused` : '3 Stacks Open') : 'Scattered (9 tabs)';

  container.innerHTML = mockupHtml;
}

function updateMetricsDisplay() {
  const isGrouped = !simGroupedStrip?.classList.contains('hidden');
  const isRamSaver = simToggleRamSaver?.checked;

  const tagStatusDot = document.getElementById('tagStatusDot');
  const tagStatusText = document.getElementById('tagStatusText');
  const tagRamValue = document.getElementById('tagRamValue');
  const tagSavedBadge = document.getElementById('tagSavedBadge');

  const totalTabCount = isDeduplicated ? '9' : '12';

  if (isRamSaver && isGrouped) {
    if (simYoutubeSleep) simYoutubeSleep.classList.remove('hidden');
    if (simPinterestSleep) simPinterestSleep.classList.remove('hidden');
    if (simSpotifySleep) simSpotifySleep.classList.remove('hidden');

    if (popStatRam) {
      popStatRam.textContent = '1,748 MB';
      popStatRam.className = 'chip-val text-green';
    }

    if (tagStatusDot) tagStatusDot.className = 'tag-indicator green';
    if (tagStatusText) tagStatusText.textContent = '3 Stacks · Sleep';
    if (tagRamValue) {
      tagRamValue.textContent = '142 MB';
      tagRamValue.className = 'tag-value text-green';
    }
    if (tagSavedBadge) tagSavedBadge.classList.remove('hidden');
  } else if (isGrouped) {
    if (simYoutubeSleep) simYoutubeSleep.classList.add('hidden');
    if (simPinterestSleep) simPinterestSleep.classList.add('hidden');
    if (simSpotifySleep) simSpotifySleep.classList.add('hidden');

    const ramText = isDeduplicated ? '420 MB' : '510 MB';
    if (popStatRam) {
      popStatRam.textContent = ramText;
      popStatRam.className = 'chip-val text-green';
    }

    if (tagStatusDot) tagStatusDot.className = 'tag-indicator green';
    if (tagStatusText) tagStatusText.textContent = isDeduplicated ? '3 Stacks' : '3 Stacks (12 Tabs)';
    if (tagRamValue) {
      tagRamValue.textContent = ramText;
      tagRamValue.className = 'tag-value text-green';
    }
    if (tagSavedBadge) tagSavedBadge.classList.add('hidden');
  } else {
    if (simYoutubeSleep) simYoutubeSleep.classList.add('hidden');
    if (simPinterestSleep) simPinterestSleep.classList.add('hidden');
    if (simSpotifySleep) simSpotifySleep.classList.add('hidden');

    if (popStatRam) {
      popStatRam.textContent = '0 MB';
      popStatRam.className = 'chip-val';
    }

    if (tagStatusDot) tagStatusDot.className = 'tag-indicator';
    if (tagStatusText) tagStatusText.textContent = isDeduplicated ? '9 Tabs' : '12 Tabs (3 Duplicates)';
    if (tagRamValue) {
      tagRamValue.textContent = isDeduplicated ? '1,890 MB' : '2,240 MB';
      tagRamValue.className = 'tag-value text-red';
    }
    if (tagSavedBadge) tagSavedBadge.classList.add('hidden');
  }

  if (popStatTabs) popStatTabs.textContent = totalTabCount;
  if (popStatStacks) popStatStacks.textContent = isGrouped ? '3' : '0';

  // Update Chromium Top Window Bar Metadata Badge
  const chromeTopTabCount = document.getElementById('chromeTopTabCount');
  const chromeTopDupTag = document.getElementById('chromeTopDupTag');

  if (chromeTopTabCount) {
    if (isRamSaver && isGrouped) {
      chromeTopTabCount.textContent = '9 tabs · Sleep';
    } else if (isGrouped) {
      chromeTopTabCount.textContent = isDeduplicated ? '9 tabs · 3 stacks' : '12 tabs · 3 stacks';
    } else {
      chromeTopTabCount.textContent = isDeduplicated ? '9 tabs' : '12 tabs';
    }
  }

  if (chromeTopDupTag) {
    if (!isDeduplicated) {
      chromeTopDupTag.classList.remove('hidden');
    } else {
      chromeTopDupTag.classList.add('hidden');
    }
  }
}

function resetToChaos() {
  isDeduplicated = false;
  document.querySelectorAll('.sim-duplicate-tab').forEach(el => {
    el.classList.remove('removing', 'hidden');
  });

  const simYtGroupCount = document.getElementById('simYtGroupCount');
  const simSpotGroupCount = document.getElementById('simSpotGroupCount');
  const simPopYtCount = document.getElementById('simPopYtCount');
  const simPopSpotCount = document.getElementById('simPopSpotCount');
  
  if (simYtGroupCount) simYtGroupCount.textContent = '5';
  if (simSpotGroupCount) simSpotGroupCount.textContent = '4';
  if (simPopYtCount) simPopYtCount.textContent = '5';
  if (simPopSpotCount) simPopSpotCount.textContent = '4';

  if (simChaosStrip) simChaosStrip.classList.remove('hidden');
  if (simGroupedStrip) simGroupedStrip.classList.add('hidden');

  if (simToggleAutoGroup) simToggleAutoGroup.checked = false;
  if (simToggleAccordion) simToggleAccordion.checked = false;
  if (simToggleRamSaver) simToggleRamSaver.checked = false;

  updateMetricsDisplay();
  renderViewportForTab(currentActiveTabId);
}

function triggerStackNowAction() {
  if (simChaosStrip) simChaosStrip.classList.add('hidden');
  if (simGroupedStrip) simGroupedStrip.classList.remove('hidden');
  if (simToggleAutoGroup) simToggleAutoGroup.checked = true;

  activateTab(currentActiveTabId, true);
  updateMetricsDisplay();
}

function triggerDeduplicateAction() {
  if (isDeduplicated) {
    setLiveFeedback("Tabs already deduplicated · 0 duplicates");
    return;
  }

  isDeduplicated = true;
  const dupTabs = document.querySelectorAll('.sim-duplicate-tab');
  dupTabs.forEach(el => el.classList.add('removing'));

  setTimeout(() => {
    dupTabs.forEach(el => el.classList.add('hidden'));

    const simYtGroupCount = document.getElementById('simYtGroupCount');
    const simSpotGroupCount = document.getElementById('simSpotGroupCount');
    const simPopYtCount = document.getElementById('simPopYtCount');
    const simPopSpotCount = document.getElementById('simPopSpotCount');

    if (simYtGroupCount) simYtGroupCount.textContent = '3';
    if (simSpotGroupCount) simSpotGroupCount.textContent = '3';
    if (simPopYtCount) simPopYtCount.textContent = '3';
    if (simPopSpotCount) simPopSpotCount.textContent = '3';

    setLiveFeedback("Closed 3 duplicate tabs · 380 MB memory freed");
    updateMetricsDisplay();
  }, 220);
}

function updateAccordionState(isAccordion) {
  if (isAccordion) {
    const currentTab = SIMULATOR_TABS[currentActiveTabId] || SIMULATOR_TABS['yt-mrbeast'];
    toggleGroup(currentTab.group);
  }
  renderViewportForTab(currentActiveTabId);
}

function updateRamSaverState(isRamSaver) {
  updateMetricsDisplay();
  renderViewportForTab(currentActiveTabId);
}

function filterTabs(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('#simPopStacksList .pop-stack-item').forEach(item => {
    const domain = item.dataset.domain || '';
    const text = item.textContent.toLowerCase();
    const match = domain.includes(q) || text.includes(q) || !q;
    item.style.display = match ? 'block' : 'none';
  });
}

function setupTheme() {
  const themeSwitcher = document.getElementById('themeSwitcher');
  const saved = localStorage.getItem('tabstack_landing_theme') || 'dark';
  applyTheme(saved);

  themeSwitcher?.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.themeVal;
      applyTheme(theme);
      localStorage.setItem('tabstack_landing_theme', theme);
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (localStorage.getItem('tabstack_landing_theme') === 'system') {
      applyTheme('system');
    }
  });
}

function applyTheme(theme) {
  const themeSwitcher = document.getElementById('themeSwitcher');
  let effective = theme;
  if (theme === 'system') {
    effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', effective);

  themeSwitcher?.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });

  const popThemeBtn = document.querySelector('.pop-theme-btn');
  if (popThemeBtn) {
    if (effective === 'light') {
      popThemeBtn.setAttribute('title', 'Light theme (Click for dark theme)');
      popThemeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
    } else {
      popThemeBtn.setAttribute('title', 'Dark theme (Click for light theme)');
      popThemeBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }
}

function setupCopyButton() {
  const btnCopyGitCommand = document.getElementById('btnCopyGitCommand');
  btnCopyGitCommand?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('git clone https://github.com/qray/tabstack.git');
      btnCopyGitCommand.textContent = 'Copied';
      setTimeout(() => { btnCopyGitCommand.textContent = 'Copy'; }, 2000);
    } catch {
      btnCopyGitCommand.textContent = 'Copied';
    }
  });
}

function setupStackEngine() {
  const stage = document.getElementById('iconEngineStage');
  const glow = document.querySelector('.hero-logo-glow');

  const slabLayer1 = document.getElementById('slabLayer1');
  const slabLayer2 = document.getElementById('slabLayer2');
  const slabLayer3 = document.getElementById('slabLayer3');

  const slabBody1 = document.getElementById('slabBody1');
  const slabBody2 = document.getElementById('slabBody2');
  const slabBody3 = document.getElementById('slabBody3');

  const tabs1 = document.getElementById('slabTabs1')?.querySelectorAll('.incoming-tab-card');
  const tabs2 = document.getElementById('slabTabs2')?.querySelectorAll('.incoming-tab-card');
  const tabs3 = document.getElementById('slabTabs3')?.querySelectorAll('.incoming-tab-card');

  if (!stage) return;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let animTimer = null;

  function setSlabGrowth(slabBody, stageNum) {
    if (!slabBody) return;
    slabBody.classList.remove('grow-0', 'grow-1', 'grow-2', 'grow-3');
    slabBody.classList.add(`grow-${stageNum}`);
    slabBody.style.opacity = '1';
  }

  function resetAll() {
    slabLayer1?.classList.remove('unified');
    slabLayer2?.classList.remove('unified');
    slabLayer3?.classList.remove('unified');

    // Reset slab bodies
    [slabBody1, slabBody2, slabBody3].forEach(body => {
      if (body) {
        body.classList.remove('grow-0', 'grow-1', 'grow-2', 'grow-3');
        body.style.opacity = '0';
      }
    });

    // Reset all tabs
    [tabs1, tabs2, tabs3].forEach(tabSet => {
      tabSet?.forEach(tab => {
        tab.classList.remove('dropping', 'absorbed');
      });
    });
  }

  function cascadeTier(tabs, slabBody, onComplete) {
    // 1. Initialize slab body as thin platform
    setSlabGrowth(slabBody, 0);

    const tabList = tabs ? Array.from(tabs) : [];
    if (!tabList.length) {
      setSlabGrowth(slabBody, 3);
      if (onComplete) onComplete();
      return;
    }

    // Sequence each tab dropping, impacting, and thickening the slab with deliberate pacing
    let delay = 250;
    const tabInterval = 680;

    tabList.forEach((tab, idx) => {
      // Drop tab
      setTimeout(() => {
        tab.classList.add('dropping');

        // On impact with top face: absorb & grow slab thickness
        setTimeout(() => {
          tab.classList.add('absorbed');
          setSlabGrowth(slabBody, idx + 1);
        }, 460);

      }, delay);

      delay += tabInterval;
    });

    // Complete tier cascade after last absorption with a comfortable pause
    setTimeout(() => {
      if (onComplete) onComplete();
    }, delay + 550);
  }

  function runStep(step) {
    clearTimeout(animTimer);

    if (prefersReducedMotion) {
      if (step === 1) {
        resetAll();
        setSlabGrowth(slabBody1, 3);
      } else if (step === 2) {
        setSlabGrowth(slabBody1, 3);
        setSlabGrowth(slabBody2, 3);
      } else if (step === 3) {
        setSlabGrowth(slabBody1, 3);
        setSlabGrowth(slabBody2, 3);
        setSlabGrowth(slabBody3, 3);
      } else if (step === 4) {
        setSlabGrowth(slabBody1, 3);
        setSlabGrowth(slabBody2, 3);
        setSlabGrowth(slabBody3, 3);
        slabLayer1?.classList.add('unified');
        slabLayer2?.classList.add('unified');
        slabLayer3?.classList.add('unified');
        animTimer = setTimeout(() => runStep(1), 3000);
      }
      return;
    }

    // Normal non-stop continuous impact & morph cascade
    if (step === 1) {
      resetAll();

      cascadeTier(tabs1, slabBody1, () => {
        runStep(2);
      });

    } else if (step === 2) {
      // Ensure Layer 1 is solid
      setSlabGrowth(slabBody1, 3);
      tabs1?.forEach(t => t.classList.add('dropping', 'absorbed'));

      cascadeTier(tabs2, slabBody2, () => {
        runStep(3);
      });

    } else if (step === 3) {
      // Ensure Layers 1 & 2 are solid
      setSlabGrowth(slabBody1, 3);
      setSlabGrowth(slabBody2, 3);
      tabs1?.forEach(t => t.classList.add('dropping', 'absorbed'));
      tabs2?.forEach(t => t.classList.add('dropping', 'absorbed'));

      cascadeTier(tabs3, slabBody3, () => {
        runStep(4);
      });

    } else if (step === 4) {
      // All 3 slabs are solid and stacked
      setSlabGrowth(slabBody1, 3);
      setSlabGrowth(slabBody2, 3);
      setSlabGrowth(slabBody3, 3);
      tabs1?.forEach(t => t.classList.add('dropping', 'absorbed'));
      tabs2?.forEach(t => t.classList.add('dropping', 'absorbed'));
      tabs3?.forEach(t => t.classList.add('dropping', 'absorbed'));

      // Smooth color morph wave across the 3 unified slabs
      setTimeout(() => slabLayer1?.classList.add('unified'), 150);
      setTimeout(() => slabLayer2?.classList.add('unified'), 300);
      setTimeout(() => slabLayer3?.classList.add('unified'), 450);

      // Hold the completed TabStack icon and loop back
      animTimer = setTimeout(() => {
        runStep(1);
      }, 4200);
    }
  }

  // Start continuous engine loop
  runStep(1);
}

document.addEventListener('DOMContentLoaded', init);
