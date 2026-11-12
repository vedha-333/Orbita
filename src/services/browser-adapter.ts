import { BrowserTab, LaunchMode, Workspace } from '../types/workspace';

// Native Chrome Tab Group supported colors
export type ChromeGroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange';

/**
 * Maps arbitrary hex color or preset color to closest native Chrome tab group color
 */
export function mapToChromeGroupColor(colorHex: string): ChromeGroupColor {
  const lower = (colorHex || '').toLowerCase();
  if (lower.includes('blue') || lower === '#3b82f6' || lower === '#2563eb' || lower === '#3674dd') return 'blue';
  if (lower.includes('purple') || lower === '#8b5cf6' || lower === '#7c3aed') return 'purple';
  if (lower.includes('green') || lower === '#10b981' || lower === '#059669') return 'green';
  if (lower.includes('pink') || lower === '#ec4899' || lower === '#db2777') return 'pink';
  if (lower.includes('red') || lower === '#ef4444' || lower === '#dc2626') return 'red';
  if (lower.includes('yellow') || lower === '#eab308' || lower === '#f59e0b') return 'yellow';
  if (lower.includes('cyan') || lower === '#06b6d4' || lower === '#0891b2') return 'cyan';
  if (lower.includes('orange') || lower === '#f97316' || lower === '#ea580c') return 'orange';
  return 'blue';
}

/**
 * Normalizes a URL so that external links always include protocol
 */
export function ensureAbsoluteUrl(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Checks if the code is running inside a real Chromium browser extension
 */
export function isExtensionEnvironment(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.runtime?.id &&
    !!chrome.windows &&
    typeof chrome.windows.create === 'function' &&
    !!chrome.tabs &&
    typeof chrome.tabs.create === 'function'
  );
}

/**
 * Checks if browser natively supports Chromium tab groups.
 * Opera uses its own "Tab Islands" engine and does not support chrome.tabGroups;
 * calling chrome.tabs.group in Opera causes erratic snapping and tab movement.
 */
export function supportsNativeGrouping(): boolean {
  const isOpera = typeof navigator !== 'undefined' && /\bOPR\//.test(navigator.userAgent);
  return (
    !isOpera &&
    typeof chrome !== 'undefined' &&
    typeof chrome.tabs?.group === 'function' &&
    !!chrome.tabGroups
  );
}

// Simulated active tabs for testing/previewing in Vite web dev mode
let mockBrowserTabs: BrowserTab[] = [
  {
    id: 101,
    windowId: 1,
    title: 'LeetCode 75 - Study Plan - LeetCode',
    url: 'https://leetcode.com/studyplan/leetcode-75/',
    favIconUrl: 'https://leetcode.com/favicon.ico',
    active: true,
  },
  {
    id: 102,
    windowId: 1,
    title: 'Pull Request #412: Refactor storage adapter · facebook/react',
    url: 'https://github.com/facebook/react/pull/412',
    favIconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
    active: false,
  },
  {
    id: 103,
    windowId: 1,
    title: 'Deep Learning with PyTorch: A 60 Minute Blitz — PyTorch tutorials',
    url: 'https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html',
    favIconUrl: 'https://pytorch.org/favicon.ico',
    active: false,
  },
  {
    id: 104,
    windowId: 1,
    title: 'CS 3410: Computer System Organization & Architecture Courseware',
    url: 'https://www.cs.cornell.edu/courses/cs3410/',
    favIconUrl: 'https://www.cornell.edu/favicon.ico',
    active: false,
  },
  {
    id: 105,
    windowId: 1,
    title: 'Attention Is All You Need - arXiv:1706.03762',
    url: 'https://arxiv.org/abs/1706.03762',
    favIconUrl: 'https://arxiv.org/favicon.ico',
    active: false,
  },
  {
    id: 106,
    windowId: 1,
    title: 'NeetCode Roadmap - Interactive Algorithm Tree',
    url: 'https://neetcode.io/roadmap',
    favIconUrl: 'https://neetcode.io/favicon.ico',
    active: false,
  },
];

/**
 * Returns current window tabs or all open browser tabs
 */
export async function getOpenBrowserTabs(currentWindowOnly = true): Promise<BrowserTab[]> {
  if (isExtensionEnvironment()) {
    try {
      const queryOptions: chrome.tabs.QueryInfo = currentWindowOnly
        ? { currentWindow: true }
        : {};
      const chromeTabs = await chrome.tabs.query(queryOptions);

      // Filter out internal extension dashboard tab if possible so user doesn't re-save dashboard itself
      const extId = typeof chrome !== 'undefined' && chrome.runtime?.id ? chrome.runtime.id : '';
      return chromeTabs
        .filter((t) => {
          if (!t.id || !t.url) return false;
          if (
            t.url.startsWith('chrome://newtab') ||
            t.url.startsWith('opera://startpage') ||
            t.url.startsWith('edge://newtab')
          ) {
            return false;
          }
          if (extId && t.url.includes(extId)) return false;
          if (
            (t.url.includes('dashboard.html') || t.url.includes('index.html')) &&
            (t.url.includes('chrome-extension://') || t.url.includes('opera://'))
          ) {
            return false;
          }
          return true;
        })
        .map((t) => ({
          id: t.id!,
          windowId: t.windowId,
          title: t.title || t.url || 'Untitled Tab',
          url: t.url!,
          favIconUrl: t.favIconUrl,
          active: t.active,
          pinned: t.pinned,
          groupId: (t as any).groupId,
        }));
    } catch (err) {
      console.error('Failed to query chrome.tabs:', err);
    }
  }

  // Fallback in web dev preview mode
  return [...mockBrowserTabs];
}

/**
 * Adds a simulated tab for testing the dev preview
 */
export function addMockTab(tab: Omit<BrowserTab, 'id' | 'windowId'>): BrowserTab {
  const newTab: BrowserTab = {
    ...tab,
    url: ensureAbsoluteUrl(tab.url),
    id: Math.floor(Math.random() * 10000) + 200,
    windowId: 1,
  };
  mockBrowserTabs.unshift(newTab);
  return newTab;
}

export interface LaunchWorkspaceResult {
  success: boolean;
  windowId?: number;
  groupId?: number;
  openedUrlsCount: number;
  message: string;
}

/**
 * Launches a workspace:
 * - Option A (Default): Opens in a new window with a native tab group.
 * - Option B: Opens in the current window with a native tab group.
 * Preserves the user's original tabs completely!
 */
export async function launchWorkspace(
  workspace: Workspace,
  mode: LaunchMode = 'new-window',
  autoGroup = true
): Promise<LaunchWorkspaceResult> {
  const pagesToOpen = workspace.pages.filter(
    (p) => !p.excludedFromLaunch && p.url && p.url.trim().length > 0
  );

  if (pagesToOpen.length === 0) {
    const hasAnyPages = workspace.pages.length > 0;
    return {
      success: false,
      openedUrlsCount: 0,
      message: hasAnyPages
        ? 'All pages in this workspace are currently excluded. Click "Manage" to select pages to open.'
        : 'Workspace has no saved pages to open. Add some pages first!',
    };
  }

  const urls = pagesToOpen.map((p) => ensureAbsoluteUrl(p.url));

  if (isExtensionEnvironment()) {
    try {
      if (mode === 'new-window') {
        // Fix 2: NO TAB GROUPING IN NEW WINDOW!
        // The window itself is already the isolated container.
        // Calling tabs.group across windows is what triggered Chromium to pull tabs back into caller's window.
        const newWindow = (await chrome.windows.create({
          url: urls[0],
          type: 'normal',
          focused: true,
        })) as chrome.windows.Window;

        const newWinId = newWindow?.id;

        if (newWinId) {
          // Open any remaining workspace pages directly inside this new window
          for (let i = 1; i < urls.length; i++) {
            await chrome.tabs.create({
              windowId: newWinId,
              url: urls[i],
              active: false,
            });
          }

          // Ensure the new window is brought to front
          try {
            await chrome.windows.update(newWinId, { focused: true });
          } catch (_) {}
        } else {
          // Fallback if window creation did not return an id
          for (const url of urls) {
            await chrome.tabs.create({ url, active: false });
          }
        }

        return {
          success: true,
          windowId: newWinId,
          openedUrlsCount: urls.length,
          message: `Opened all ${urls.length} pages in a new window.`,
        };
      }

      // CURRENT WINDOW MODE
      // Capture currently active tab so focus stays anchored
      const [currentActiveTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const createdTabs = await Promise.all(
        urls.map((url) => chrome.tabs.create({ url, active: false }))
      );
      const tabIds = createdTabs
        .map((t) => t.id)
        .filter((id): id is number => typeof id === 'number');

      // Fix 4: Native tab grouping ONLY in current window and ONLY if supported (Chrome/Brave, NOT Opera)
      let groupId: number | undefined;
      if (autoGroup && supportsNativeGrouping() && tabIds.length > 0) {
        try {
          groupId = await chrome.tabs.group({
            tabIds,
          });

          await chrome.tabGroups.update(groupId, {
            title: `${workspace.icon ? workspace.icon + ' ' : ''}${workspace.name}`,
            color: mapToChromeGroupColor(workspace.color),
          });
        } catch (groupErr) {
          console.warn('Native tab grouping failed or not supported in this Chromium browser:', groupErr);
        }
      }

      // Reaffirm focus on original tab
      if (currentActiveTab?.id) {
        try {
          await chrome.tabs.update(currentActiveTab.id, { active: true });
        } catch (_) {}
      }

      return {
        success: true,
        groupId,
        openedUrlsCount: urls.length,
        message: `Opened all ${urls.length} pages in the current window${
          groupId ? ' under tab group "' + workspace.name + '"' : ''
        }.`,
      };
    } catch (err: any) {
      console.error('Error during workspace launch:', err);
      return {
        success: false,
        openedUrlsCount: 0,
        message: `Failed to open workspace: ${err.message}`,
      };
    }
  }

  // Web dev preview mode (running directly on localhost or outside extension context):
  let openedCount = 0;
  if (mode === 'new-window') {
    // Open a dedicated separate browser window with standard window features
    window.open(
      urls[0],
      '_blank',
      'width=1280,height=820,menubar=yes,toolbar=yes,location=yes,status=yes,resizable=yes,scrollbars=yes'
    );
    openedCount++;

    for (let i = 1; i < urls.length; i++) {
      const a = document.createElement('a');
      a.href = urls[i];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      openedCount++;
    }
  } else {
    for (const url of urls) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      openedCount++;
    }
  }

  // Force window focus back to this dashboard
  window.focus();
  setTimeout(() => window.focus(), 50);

  return {
    success: true,
    openedUrlsCount: openedCount,
    message: `Opened ${urls.length} pages in ${mode === 'new-window' ? 'a new window' : 'background tabs'}!`,
  };
}

/**
 * Opens a single individual page
 */
export async function openSinglePage(url: string): Promise<void> {
  const fullUrl = ensureAbsoluteUrl(url);
  if (isExtensionEnvironment()) {
    await chrome.tabs.create({ url: fullUrl, active: true });
  } else {
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Chrome-Safe Window Opening Logic
 * Creates an empty normal window first, opens the dashboard, and cleans up about:blank
 * to completely bypass Chrome's aggressive popup blocker.
 */
export async function openDashboardInNewWindow(): Promise<void> {
  const dashboardUrl =
    typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('dashboard.html')
      : 'index.html';

  if (!isExtensionEnvironment()) {
    window.open(window.location.href, '_blank');
    return;
  }

  try {
    // 1. Create a standard blank window (bypasses the popup blocker)
    const newWindow = (await chrome.windows.create({
      url: 'about:blank',
      type: 'normal', // Crucial: explicitly set to 'normal', not 'popup'
      focused: true,
    })) as chrome.windows.Window;

    const windowId = newWindow?.id;

    if (windowId) {
      // 2. Open the dashboard inside that specific window
      await chrome.tabs.create({
        url: dashboardUrl,
        windowId: windowId,
        active: true,
      });

      // 3. Remove the initial 'about:blank' tab so the user doesn't see a blank flash
      if (newWindow.tabs && newWindow.tabs[0] && newWindow.tabs[0].id) {
        await chrome.tabs.remove(newWindow.tabs[0].id);
      } else {
        const tabs = await chrome.tabs.query({ windowId });
        const blankTab = tabs.find((t) => t.url === 'about:blank' || t.title === 'about:blank');
        if (blankTab?.id && tabs.length > 1) {
          await chrome.tabs.remove(blankTab.id);
        }
      }

      try {
        await chrome.windows.update(windowId, { focused: true });
      } catch (_) {}
    }
  } catch (error) {
    console.error('Failed to open dashboard in new window:', error);
    // Optional fallback: open in current window if Chrome absolutely refuses
    try {
      await chrome.tabs.create({ url: dashboardUrl, active: true });
    } catch (_) {
      window.open(dashboardUrl, '_blank');
    }
  }
}
