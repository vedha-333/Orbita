import { Workspace, WorkspacePage, UserSettings, StorageData } from '../types/workspace';
import { normalizeUrl, getFaviconUrl } from '../utils/normalize-url';

const STORAGE_KEY = 'my_task_browser_data';
const CURRENT_STORAGE_VERSION = 1;

export const DEFAULT_SETTINGS: UserSettings = {
  defaultLaunchMode: 'new-window',
  autoGroupTabs: true,
  confirmBeforeDelete: true,
  theme: 'light',
  showFavicons: true,
  preventDuplicatePages: true,
};

export const INITIAL_PRESETS: Workspace[] = [
  {
    id: 'dsa-practice',
    name: 'DSA Practice',
    description: 'Algorithms, LeetCode grind, and time complexity references',
    icon: '💻',
    color: '#3B82F6', // Blue
    category: 'Learning',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000 * 2,
    lastOpenedAt: Date.now() - 3600000 * 2,
    isPinned: true,
    pages: [
      {
        id: 'p-dsa-1',
        title: 'LeetCode Problemset',
        url: 'https://leetcode.com/problemset/all/',
        position: 0,
        savedAt: Date.now() - 86400000 * 3,
        pinned: true,
        notes: 'Target: 2 medium problems daily',
        favIconUrl: 'https://leetcode.com/favicon.ico',
      },
      {
        id: 'p-dsa-2',
        title: 'NeetCode 150 Practice Roadmap',
        url: 'https://neetcode.io/practice',
        position: 1,
        savedAt: Date.now() - 86400000 * 3,
        pinned: false,
        favIconUrl: 'https://neetcode.io/favicon.ico',
      },
      {
        id: 'p-dsa-3',
        title: 'VisuAlgo - Visualising Data Structures and Algorithms',
        url: 'https://visualgo.net/en',
        position: 2,
        savedAt: Date.now() - 86400000 * 2,
        pinned: false,
      },
      {
        id: 'p-dsa-4',
        title: 'Big-O Algorithm Complexity Cheat Sheet',
        url: 'https://www.bigocheatsheet.com/',
        position: 3,
        savedAt: Date.now() - 86400000 * 2,
        pinned: false,
      },
    ],
  },
  {
    id: 'open-source',
    name: 'Open Source',
    description: 'Active pull requests, issue trackers, and contribution repos',
    icon: '🐙',
    color: '#8B5CF6', // Purple
    category: 'Development',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000,
    lastOpenedAt: Date.now() - 86400000,
    isPinned: true,
    pages: [
      {
        id: 'p-oss-1',
        title: 'GitHub: Your Pull Requests',
        url: 'https://github.com/pulls',
        position: 0,
        savedAt: Date.now() - 86400000 * 5,
        pinned: true,
      },
      {
        id: 'p-oss-2',
        title: 'Good First Issue - Explore Beginner Friendly Projects',
        url: 'https://goodfirstissue.dev/',
        position: 1,
        savedAt: Date.now() - 86400000 * 4,
      },
      {
        id: 'p-oss-3',
        title: 'GitHub Trending Repositories',
        url: 'https://github.com/trending',
        position: 2,
        savedAt: Date.now() - 86400000 * 3,
      },
    ],
  },
  {
    id: 'ai-ml-learning',
    name: 'AI / ML Learning',
    description: 'Models, papers, PyTorch docs, and transformer benchmarks',
    icon: '🧠',
    color: '#EC4899', // Pink
    category: 'Research',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 7200000,
    lastOpenedAt: Date.now() - 7200000,
    isPinned: false,
    pages: [
      {
        id: 'p-ai-1',
        title: 'Hugging Face – The AI community building the future',
        url: 'https://huggingface.co/models',
        position: 0,
        savedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'p-ai-2',
        title: 'arXiv Computer Science - Machine Learning',
        url: 'https://arxiv.org/list/cs.LG/recent',
        position: 1,
        savedAt: Date.now() - 86400000 * 2,
      },
      {
        id: 'p-ai-3',
        title: 'PyTorch Documentation & Tutorials',
        url: 'https://pytorch.org/docs/stable/index.html',
        position: 2,
        savedAt: Date.now() - 86400000,
      },
    ],
  },
  {
    id: 'college-work',
    name: 'College Assignments',
    description: 'Course portal, lecture slides, submissions, and research',
    icon: '🎓',
    color: '#10B981', // Emerald Green
    category: 'Academia',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 2,
    lastOpenedAt: Date.now() - 86400000 * 2,
    isPinned: false,
    pages: [
      {
        id: 'p-col-1',
        title: 'Canvas Learning Management System',
        url: 'https://canvas.instructure.com/',
        position: 0,
        savedAt: Date.now() - 86400000 * 6,
      },
      {
        id: 'p-col-2',
        title: 'Google Scholar Research Articles',
        url: 'https://scholar.google.com/',
        position: 1,
        savedAt: Date.now() - 86400000 * 5,
      },
    ],
  },
];

/**
 * Checks if the browser extension chrome.storage API is available
 */
function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
}

/**
 * Loads raw data from chrome.storage.local or localStorage fallback
 */
export async function getStorageData(): Promise<StorageData> {
  let raw: StorageData | null = null;

  if (isChromeStorageAvailable()) {
    try {
      const res = await chrome.storage.local.get(STORAGE_KEY);
      raw = res[STORAGE_KEY] as StorageData;
    } catch (e) {
      console.warn('Failed to load from chrome.storage.local, trying localStorage fallback:', e);
    }
  }

  if (!raw && typeof window !== 'undefined' && window.localStorage) {
    try {
      const localStr = window.localStorage.getItem(STORAGE_KEY);
      if (localStr) {
        raw = JSON.parse(localStr);
      }
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
    }
  }

  // If no data exists, initialize with initial presets and default settings
  if (!raw || !Array.isArray(raw.workspaces)) {
    const initialData: StorageData = {
      version: CURRENT_STORAGE_VERSION,
      workspaces: INITIAL_PRESETS,
      settings: DEFAULT_SETTINGS,
      lastSyncTime: Date.now(),
    };
    await saveStorageData(initialData);
    return initialData;
  }

  // Apply migrations if version is older
  if (raw.version < CURRENT_STORAGE_VERSION) {
    raw.version = CURRENT_STORAGE_VERSION;
    raw.settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
    await saveStorageData(raw);
  }

  return raw;
}

/**
 * Saves entire storage data to chrome.storage.local and/or localStorage
 */
export async function saveStorageData(data: StorageData): Promise<void> {
  data.lastSyncTime = Date.now();

  if (isChromeStorageAvailable()) {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: data });
    } catch (e) {
      console.error('Error saving to chrome.storage.local:', e);
    }
  }

  // Always mirror in localStorage for rapid access & dev environments
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }
}

/**
 * Returns all workspaces sorted with pinned first, then last updated
 */
export async function getWorkspaces(): Promise<Workspace[]> {
  const data = await getStorageData();
  return [...data.workspaces].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

/**
 * Returns a single workspace by ID
 */
export async function getWorkspaceById(id: string): Promise<Workspace | undefined> {
  const data = await getStorageData();
  return data.workspaces.find((w) => w.id === id);
}

/**
 * Creates a new workspace and saves it
 */
export async function createWorkspace(
  workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'pages'> & {
    pages?: WorkspacePage[];
    id?: string;
  }
): Promise<Workspace> {
  const data = await getStorageData();
  const now = Date.now();

  const newWorkspace: Workspace = {
    id: workspaceData.id || `ws-${now}-${Math.random().toString(36).substring(2, 7)}`,
    name: workspaceData.name.trim(),
    description: workspaceData.description?.trim(),
    icon: workspaceData.icon || '📁',
    color: workspaceData.color || '#3B82F6',
    category: workspaceData.category?.trim() || 'General',
    createdAt: now,
    updatedAt: now,
    isPinned: !!workspaceData.isPinned,
    pages: (workspaceData.pages || []).map((p, idx) => ({
      ...p,
      id: p.id || `p-${now}-${idx}`,
      position: idx,
      savedAt: p.savedAt || now,
      favIconUrl: getFaviconUrl(p.url, p.favIconUrl),
    })),
  };

  data.workspaces.unshift(newWorkspace);
  await saveStorageData(data);
  return newWorkspace;
}

/**
 * Updates an existing workspace
 */
export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<Omit<Workspace, 'id' | 'createdAt'>>
): Promise<Workspace> {
  const data = await getStorageData();
  const index = data.workspaces.findIndex((w) => w.id === workspaceId);

  if (index === -1) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }

  const existing = data.workspaces[index];
  const updated: Workspace = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };

  data.workspaces[index] = updated;
  await saveStorageData(data);
  return updated;
}

/**
 * Deletes a workspace by ID without closing any browser tabs
 */
export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const data = await getStorageData();
  data.workspaces = data.workspaces.filter((w) => w.id !== workspaceId);
  await saveStorageData(data);
}

/**
 * Adds one or more pages to an existing workspace
 */
export async function addPagesToWorkspace(
  workspaceId: string,
  newPages: Array<Omit<WorkspacePage, 'id' | 'position' | 'savedAt'>>
): Promise<Workspace> {
  const data = await getStorageData();
  const workspace = data.workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }

  const now = Date.now();
  let currentPos = workspace.pages.length;

  for (const page of newPages) {
    workspace.pages.push({
      id: `p-${now}-${Math.random().toString(36).substring(2, 7)}`,
      url: page.url.trim(),
      title: page.title.trim() || page.url.trim(),
      position: currentPos++,
      savedAt: now,
      pinned: !!page.pinned,
      notes: page.notes?.trim(),
      favIconUrl: getFaviconUrl(page.url, page.favIconUrl),
    });
  }

  workspace.updatedAt = now;
  await saveStorageData(data);
  return workspace;
}

/**
 * Removes a page from a workspace
 */
export async function removePageFromWorkspace(workspaceId: string, pageId: string): Promise<Workspace> {
  const data = await getStorageData();
  const workspace = data.workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }

  workspace.pages = workspace.pages
    .filter((p) => p.id !== pageId)
    .map((p, idx) => ({ ...p, position: idx }));

  workspace.updatedAt = Date.now();
  await saveStorageData(data);
  return workspace;
}

/**
 * Reorders pages in a workspace
 */
export async function reorderPages(workspaceId: string, orderedPageIds: string[]): Promise<Workspace> {
  const data = await getStorageData();
  const workspace = data.workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }

  const pageMap = new Map(workspace.pages.map((p) => [p.id, p]));
  const reordered: WorkspacePage[] = [];

  orderedPageIds.forEach((id, index) => {
    const page = pageMap.get(id);
    if (page) {
      reordered.push({ ...page, position: index });
    }
  });

  // Append any pages that weren't in the ordered list just in case
  workspace.pages.forEach((p) => {
    if (!orderedPageIds.includes(p.id)) {
      reordered.push({ ...p, position: reordered.length });
    }
  });

  workspace.pages = reordered;
  workspace.updatedAt = Date.now();
  await saveStorageData(data);
  return workspace;
}

/**
 * Updates an individual page within a workspace (notes, title, pinned status)
 */
export async function updatePage(
  workspaceId: string,
  pageId: string,
  updates: Partial<Omit<WorkspacePage, 'id' | 'savedAt'>>
): Promise<Workspace> {
  const data = await getStorageData();
  const workspace = data.workspaces.find((w) => w.id === workspaceId);

  if (!workspace) {
    throw new Error(`Workspace with id ${workspaceId} not found`);
  }

  const pageIndex = workspace.pages.findIndex((p) => p.id === pageId);
  if (pageIndex === -1) {
    throw new Error(`Page with id ${pageId} not found in workspace`);
  }

  workspace.pages[pageIndex] = {
    ...workspace.pages[pageIndex],
    ...updates,
    favIconUrl: updates.url ? getFaviconUrl(updates.url, updates.favIconUrl) : workspace.pages[pageIndex].favIconUrl,
  };

  workspace.updatedAt = Date.now();
  await saveStorageData(data);
  return workspace;
}

/**
 * Exports all workspace data as a JSON string for backup
 */
export async function exportDataToJson(): Promise<string> {
  const data = await getStorageData();
  return JSON.stringify(data, null, 2);
}

/**
 * Imports workspace data from a JSON string with validation
 */
export async function importDataFromJson(jsonStr: string): Promise<{ count: number }> {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.workspaces)) {
      throw new Error('Invalid JSON format: missing "workspaces" array.');
    }

    const currentData = await getStorageData();
    const importedWorkspaces: Workspace[] = [];

    for (const item of parsed.workspaces) {
      if (typeof item.name === 'string' && Array.isArray(item.pages)) {
        importedWorkspaces.push({
          id: item.id || `ws-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: item.name,
          description: item.description || '',
          icon: item.icon || '📁',
          color: item.color || '#3B82F6',
          category: item.category || 'Imported',
          createdAt: item.createdAt || Date.now(),
          updatedAt: Date.now(),
          lastOpenedAt: item.lastOpenedAt,
          isPinned: !!item.isPinned,
          pages: item.pages.map((p: any, idx: number) => ({
            id: p.id || `p-${Date.now()}-${idx}`,
            url: p.url || '',
            title: p.title || p.url || 'Untitled',
            position: typeof p.position === 'number' ? p.position : idx,
            savedAt: p.savedAt || Date.now(),
            pinned: !!p.pinned,
            notes: p.notes,
            favIconUrl: getFaviconUrl(p.url, p.favIconUrl),
          })),
        });
      }
    }

    // Merge or replace: add new ones, update if matching ID
    const existingMap = new Map(currentData.workspaces.map((w) => [w.id, w]));
    importedWorkspaces.forEach((imp) => {
      existingMap.set(imp.id, imp);
    });

    currentData.workspaces = Array.from(existingMap.values());
    if (parsed.settings) {
      currentData.settings = { ...currentData.settings, ...parsed.settings };
    }

    await saveStorageData(currentData);
    return { count: importedWorkspaces.length };
  } catch (err: any) {
    throw new Error(`Failed to import data: ${err.message}`);
  }
}

/**
 * Retrieves user preferences
 */
export async function getUserSettings(): Promise<UserSettings> {
  const data = await getStorageData();
  return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
}

/**
 * Updates user preferences
 */
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const data = await getStorageData();
  data.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}), ...settings };
  await saveStorageData(data);
  return data.settings;
}
