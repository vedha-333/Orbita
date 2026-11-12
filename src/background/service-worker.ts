import { mapToChromeGroupColor } from '../services/browser-adapter';

// Chrome extension service worker
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[My Task Browser] Extension installed or updated:', details.reason);
  if (details.reason === 'install') {
    // Optionally open the welcome/dashboard page
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
});

/**
 * Opens or focuses the Orbita dashboard scoped specifically to the CURRENT window.
 * Ensures the dashboard is a regular full tab, not a restricted popup.
 */
async function openOrFocusDashboardInCurrentWindow(): Promise<void> {
  const indexUrl = chrome.runtime.getURL('index.html');
  const dashboardUrl = chrome.runtime.getURL('dashboard.html');

  try {
    // Look for an existing dashboard tab ONLY in the active, current window
    const tabsInCurrentWindow = await chrome.tabs.query({ currentWindow: true });
    const existing = tabsInCurrentWindow.find(
      (t) =>
        t.url === indexUrl ||
        t.url === dashboardUrl ||
        (t.url && (t.url.includes('index.html') || t.url.includes('dashboard.html')))
    );

    if (existing && existing.id) {
      await chrome.tabs.update(existing.id, { active: true });
      return;
    }

    // Open a fresh dashboard tab in the current window
    await chrome.tabs.create({
      url: dashboardUrl,
      active: true,
    });
  } catch (err) {
    console.warn('Failed to open dashboard in current window:', err);
    // Fallback: create tab without explicit constraints
    await chrome.tabs.create({ url: indexUrl, active: true });
  }
}

// When user clicks the extension action icon in the toolbar, open or switch to dashboard in current window
chrome.action.onClicked.addListener(async () => {
  await openOrFocusDashboardInCurrentWindow();
});

// Handle Alt + D keyboard shortcut from chrome.commands API
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-dashboard') {
    await openOrFocusDashboardInCurrentWindow();
  }
});

// Handle incoming messages from dashboard UI or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'LAUNCH_WORKSPACE') {
    handleLaunchWorkspace(request.payload)
      .then((res) => sendResponse({ status: 'ok', data: res }))
      .catch((err) => sendResponse({ status: 'error', error: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.type === 'CAPTURE_CURRENT_WINDOW') {
    chrome.tabs.query({ currentWindow: true })
      .then((tabs) => sendResponse({ status: 'ok', tabs }))
      .catch((err) => sendResponse({ status: 'error', error: err.message }));
    return true;
  }
});

async function handleLaunchWorkspace(payload: {
  urls: string[];
  name: string;
  color: string;
  icon?: string;
  mode?: 'new-window' | 'current-window';
  autoGroup?: boolean;
}) {
  const { urls, name, color, icon, mode = 'new-window', autoGroup = true } = payload;
  let createdTabIds: number[] = [];
  let targetWindowId: number | undefined;

  if (mode === 'new-window') {
    try {
      // Step 1: Create standard normal window with about:blank first (bypasses Chrome pop-up blocker)
      const newWindow = (await chrome.windows.create({
        url: 'about:blank',
        type: 'normal',
        focused: true,
      })) as chrome.windows.Window;
      targetWindowId = newWindow?.id;

      if (targetWindowId) {
        // Find initial blank tab
        const initialTabs = newWindow.tabs || (await chrome.tabs.query({ windowId: targetWindowId }));
        const blankTabId =
          initialTabs.find((t) => t.url === 'about:blank' || t.title === 'about:blank')?.id ||
          initialTabs[0]?.id;

        // Step 2: Populate with workspace tabs
        for (let i = 0; i < urls.length; i++) {
          await chrome.tabs.create({
            windowId: targetWindowId,
            url: urls[i],
            active: i === 0,
          });
        }

        // Step 3: Remove initial about:blank tab
        if (blankTabId) {
          try {
            await chrome.tabs.remove(blankTabId);
          } catch (_) {}
        }

        try {
          await chrome.windows.update(targetWindowId, { focused: true });
        } catch (_) {}

        return { success: true, windowId: targetWindowId, count: urls.length };
      }
    } catch (winErr) {
      console.warn('Background new window creation failed/blocked; falling back to current window:', winErr);
      for (const url of urls) {
        await chrome.tabs.create({ url, active: false });
      }
      return { success: true, count: urls.length };
    }
  }

  // Current window mode
  for (const url of urls) {
    const tab = await chrome.tabs.create({ url, active: false });
    if (tab.id) createdTabIds.push(tab.id);
  }

  // Native tab grouping in current window only (skip Opera)
  let groupId: number | undefined;
  const isOpera = typeof navigator !== 'undefined' && /\bOPR\//.test(navigator.userAgent);
  if (!isOpera && autoGroup && createdTabIds.length > 0 && typeof chrome.tabs.group === 'function' && chrome.tabGroups) {
    try {
      groupId = await chrome.tabs.group({
        tabIds: createdTabIds,
      });

      await chrome.tabGroups.update(groupId, {
        title: `${icon ? icon + ' ' : ''}${name}`,
        color: mapToChromeGroupColor(color),
      });
    } catch (e) {
      console.warn('Tab grouping failed:', e);
    }
  }

  return { success: true, windowId: targetWindowId, groupId, count: urls.length };
}
