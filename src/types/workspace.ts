export interface WorkspacePage {
  id: string;
  url: string;
  title: string;
  position: number;
  savedAt: number;
  pinned?: boolean;
  notes?: string;
  favIconUrl?: string;
  excludedFromLaunch?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon: string; // emoji or icon-name
  color: string; // hex or CSS color
  category?: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
  isPinned?: boolean;
  pages: WorkspacePage[];
}

export interface BrowserTab {
  id: number;
  windowId: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active?: boolean;
  pinned?: boolean;
  groupId?: number;
}

export type LaunchMode = 'new-window' | 'current-window';

export interface UserSettings {
  defaultLaunchMode: LaunchMode;
  autoGroupTabs: boolean;
  confirmBeforeDelete: boolean;
  theme: 'dark' | 'light' | 'system';
  showFavicons: boolean;
  preventDuplicatePages: boolean;
}

export interface StorageData {
  version: number;
  workspaces: Workspace[];
  settings: UserSettings;
  lastSyncTime?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingPage?: WorkspacePage;
}
