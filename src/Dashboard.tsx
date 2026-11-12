import React, { useState, useEffect, useMemo } from 'react';
import {
  getWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addPagesToWorkspace,
  removePageFromWorkspace,
  reorderPages,
  updatePage,
  getUserSettings,
  updateUserSettings,
  INITIAL_PRESETS,
  saveStorageData,
} from './storage/workspace-storage';
import { Workspace, WorkspacePage, UserSettings, LaunchMode } from './types/workspace';
import { launchWorkspace } from './services/browser-adapter';
import { Header } from './components/Header';
import { WorkspaceCard } from './components/WorkspaceCard';
import { WorkspaceDetailsModal } from './components/WorkspaceDetailsModal';
import { CreateWorkspaceModal } from './components/CreateWorkspaceModal';
import { TabAssignModal } from './components/TabAssignModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { NotificationToast, ToastData } from './components/NotificationToast';
import { GuideModal } from './components/GuideModal';
import { Plus, Search, Filter, Compass, Layers, CheckCircle, ExternalLink, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { initRustCore, syncWorkspacesToRust, searchViaRust } from './services/rust-core';
import { getOpenBrowserTabs } from './services/browser-adapter';
import { BrowserTab } from './types/workspace';

export const Dashboard: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    defaultLaunchMode: 'new-window',
    autoGroupTabs: true,
    confirmBeforeDelete: true,
    theme: 'light',
    showFavicons: true,
    preventDuplicatePages: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [detailsWorkspaceId, setDetailsWorkspaceId] = useState<string | null>(null);
  const [isTabAssignOpen, setIsTabAssignOpen] = useState(false);
  const [initialTargetWorkspaceId, setInitialTargetWorkspaceId] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
  const [openTabsList, setOpenTabsList] = useState<BrowserTab[]>([]);

  // Toast notification
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ id: `${Date.now()}`, type, message });
  };

  // Load initial data
  const loadData = async () => {
    try {
      const [loadedWorkspaces, loadedSettings] = await Promise.all([
        getWorkspaces(),
        getUserSettings(),
      ]);
      setWorkspaces(loadedWorkspaces);
      setSettings(loadedSettings);
      document.documentElement.setAttribute('data-theme', 'light');
      // Fetch open browser tabs for drag-and-drop dock
      getOpenBrowserTabs(true).then((tabs) => setOpenTabsList(tabs)).catch(() => {});
      // Initialize Rust Wasm core & sync initial state
      initRustCore().then(() => {
        syncWorkspacesToRust(loadedWorkspaces);
      }).catch(err => console.warn('[Rust Wasm] Core initialization skipped:', err));
    } catch (err) {
      console.error('Error loading workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time tab auto-update: debounced re-fetch when tabs open, close, update, or activate
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const refreshTabs = async () => {
      try {
        const tabs = await getOpenBrowserTabs(true);
        setOpenTabsList(tabs);
      } catch (err) {
        console.warn('Real-time tab sync warning:', err);
      }
    };

    const handleTabChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refreshTabs();
      }, 250);
    };

    // Initial load
    refreshTabs();

    if (
      typeof chrome !== 'undefined' &&
      chrome.tabs &&
      typeof chrome.tabs.onCreated !== 'undefined'
    ) {
      chrome.tabs.onCreated.addListener(handleTabChange);
      chrome.tabs.onRemoved.addListener(handleTabChange);
      chrome.tabs.onUpdated.addListener(handleTabChange);
      chrome.tabs.onActivated.addListener(handleTabChange);

      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        chrome.tabs.onCreated.removeListener(handleTabChange);
        chrome.tabs.onRemoved.removeListener(handleTabChange);
        chrome.tabs.onUpdated.removeListener(handleTabChange);
        chrome.tabs.onActivated.removeListener(handleTabChange);
      };
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('workspace-search-input');
        searchInput?.focus();
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEditingWorkspace(null);
        setIsCreateModalOpen(true);
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const searchInput = document.getElementById('workspace-search-input');
        searchInput?.focus();
      }
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setEditingWorkspace(null);
        setDetailsWorkspaceId(null);
        setIsTabAssignOpen(false);
        setIsSettingsOpen(false);
        setDeletingWorkspaceId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = await updateUserSettings({ ...newSettings, theme: 'light' });
    setSettings(updated);
    document.documentElement.setAttribute('data-theme', 'light');
    showToast('success', 'Preferences updated');
  };

  // Compute categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    workspaces.forEach((w) => {
      if (w.category) set.add(w.category);
    });
    return ['All', ...Array.from(set)];
  }, [workspaces]);

  // Filter workspaces based on search query and selected category
  const filteredWorkspaces = useMemo(() => {
    // Sync latest workspaces to Rust core
    syncWorkspacesToRust(workspaces);

    const trimmedQuery = searchQuery.trim().toLowerCase();

    return workspaces.filter((ws) => {
      // 1. Category match (when a search query is active, search across all workspaces so results are never hidden)
      if (!trimmedQuery && selectedCategory !== 'All' && ws.category !== selectedCategory) {
        return false;
      }

      // 2. If no search query, match all in category
      if (!trimmedQuery) return true;

      // 3. Normalized multi-token case-insensitive matching
      // Seamlessly handles "Movies ", "MOVIES", "MoVies", "movie ", or multiple terms
      const searchTokens = trimmedQuery.split(/\s+/).filter(Boolean);

      const wsName = (ws.name || '').toLowerCase();
      const wsDesc = (ws.description || '').toLowerCase();
      const wsCat = (ws.category || '').toLowerCase();
      const pageTexts = ws.pages.map((p) =>
        `${p.title || ''} ${p.url || ''} ${p.notes || ''}`.toLowerCase()
      );

      // Check if a single token matches a target text (including singular/plural handling)
      const tokenMatches = (token: string, text: string) => {
        if (!text) return false;
        if (text.includes(token)) return true;
        // Singular / plural tolerance: e.g. "movies" <-> "movie"
        if (token.length > 3 && token.endsWith('s') && text.includes(token.slice(0, -1))) {
          return true;
        }
        if (text.length > 3 && text.endsWith('s') && token.includes(text.slice(0, -1))) {
          return true;
        }
        return false;
      };

      // Every token must match somewhere in the workspace name, desc, category, or pages
      return searchTokens.every((token) => {
        if (tokenMatches(token, wsName)) return true;
        if (tokenMatches(token, wsDesc)) return true;
        if (tokenMatches(token, wsCat)) return true;
        return pageTexts.some((pt) => tokenMatches(token, pt));
      });
    });
  }, [workspaces, selectedCategory, searchQuery]);

  // Automatically scroll down to matching workspace card/results when searching
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const timer = setTimeout(() => {
      // When searching, smoothly bring the top matching card directly into view center
      let targetElement: HTMLElement | null = null;
      if (filteredWorkspaces.length > 0) {
        targetElement = document.getElementById(`workspace-card-${filteredWorkspaces[0].id}`);
      }
      if (!targetElement) {
        targetElement =
          document.getElementById('workspaces-toolbar') ||
          document.getElementById('workspaces-section');
      }

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [searchQuery, filteredWorkspaces]);

  // Total pages count
  const totalPagesCount = useMemo(() => {
    return workspaces.reduce((sum, ws) => sum + ws.pages.length, 0);
  }, [workspaces]);

  // Helper: Check if running inside Chrome extension context with active window/tab APIs
  const isExtensionContext = (): boolean =>
    typeof chrome !== 'undefined' &&
    !!chrome.runtime?.id &&
    !!chrome.windows &&
    typeof chrome.windows.create === 'function' &&
    !!chrome.tabs &&
    typeof chrome.tabs.create === 'function';

  // Helper: Check if browser supports Chromium native tab groups (skips Opera's proprietary Tab Islands)
  const supportsNativeGrouping = (): boolean => {
    const isOpera = typeof navigator !== 'undefined' && /\bOPR\//.test(navigator.userAgent);
    return (
      !isOpera &&
      typeof chrome !== 'undefined' &&
      typeof chrome.tabs?.group === 'function' &&
      !!chrome.tabGroups
    );
  };

  // Helper: Open dashboard in a new window ensuring a regular tab in a standard browser window (not a restricted popup)
  const openDashboardInNewWindow = async (): Promise<void> => {
    if (isExtensionContext()) {
      try {
        const newWin = (await chrome.windows.create({
          url: 'about:blank',
          focused: true,
          type: 'normal',
        })) as chrome.windows.Window;
        const windowId = newWin?.id;
        const dashboardUrl = chrome.runtime.getURL('index.html');
        if (windowId) {
          await chrome.tabs.create({ url: dashboardUrl, windowId });
          const winTabs = await chrome.tabs.query({ windowId });
          const blankTab = winTabs.find((t) => t.url === 'about:blank' || t.title === 'about:blank');
          if (blankTab?.id && winTabs.length > 1) {
            await chrome.tabs.remove(blankTab.id);
          }
        }
        return;
      } catch (err) {
        console.warn('Failed to open dashboard via chrome API:', err);
      }
    }
    window.open(window.location.href, '_blank');
  };

  // Core workspace launcher with decoupled window creation and Opera grouping protection
  const openWorkspace = async (
    workspace: Workspace,
    mode: LaunchMode = 'new-window'
  ): Promise<{ success: boolean; message: string }> => {
    const pagesToOpen = workspace.pages.filter(
      (p) => !p.excludedFromLaunch && p.url && p.url.trim().length > 0
    );
    const urls = pagesToOpen.map((p) => {
      const raw = p.url.trim();
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)) return raw;
      return `https://${raw}`;
    });

    if (urls.length === 0) {
      return {
        success: false,
        message: 'No valid pages to open in this workspace.',
      };
    }

    if (mode === 'new-window') {
      // Action (New Window): Do NOT call chrome.tabs.group.
      // The window itself is the container. Calling tabs.group across windows pulls tabs into original window!
      await chrome.windows.create({
        url: urls,
        focused: true,
        type: 'normal',
      });
      return {
        success: true,
        message: `Opened all ${urls.length} pages in a new window.`,
      };
    }

    // Action (Current Window): Open tabs with chrome.tabs.create, then group them using chrome.tabs.group
    const createdTabs = await Promise.all(
      urls.map((url) => chrome.tabs.create({ url, active: false }))
    );
    const tabIds = createdTabs
      .map((t) => t.id)
      .filter((id): id is number => typeof id === 'number');

    if (supportsNativeGrouping() && tabIds.length > 0) {
      try {
        const groupId = await chrome.tabs.group({ tabIds });
        if (chrome.tabGroups) {
          await chrome.tabGroups.update(groupId, {
            title: `${workspace.icon ? workspace.icon + ' ' : ''}${workspace.name}`,
          });
        }
      } catch (groupErr) {
        console.warn('Native tab grouping failed or not supported in this browser:', groupErr);
      }
    }

    return {
      success: true,
      message: `Opened all ${urls.length} pages in current window.`,
    };
  };

  // Safe wrapper for localhost/web preview and extension context
  const openWorkspaceSafe = async (
    workspace: Workspace,
    mode: LaunchMode = 'new-window'
  ): Promise<{ success: boolean; message: string }> => {
    const pagesToOpen = workspace.pages.filter(
      (p) => !p.excludedFromLaunch && p.url && p.url.trim().length > 0
    );
    const urls = pagesToOpen.map((p) => {
      const raw = p.url.trim();
      if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw)) return raw;
      return `https://${raw}`;
    });

    if (urls.length === 0) {
      return {
        success: false,
        message: 'Workspace has no saved pages to open. Add some pages first!',
      };
    }

    if (!isExtensionContext()) {
      // Web fallback for localhost / file:// — no OS window APIs available
      if (mode === 'new-window') {
        window.open(urls[0], '_blank');
        for (let i = 1; i < urls.length; i++) {
          window.open(urls[i], '_blank');
        }
      } else {
        urls.forEach((url) => window.open(url, '_blank'));
      }
      return {
        success: true,
        message: `Web preview mode: opened ${urls.length} pages in browser tabs.`,
      };
    }

    return await openWorkspace(workspace, mode);
  };

  // Launch workspace handler
  const handleLaunch = async (workspace: Workspace, mode: LaunchMode) => {
    try {
      const result = await openWorkspaceSafe(workspace, mode);
      if (result.success) {
        showToast('success', result.message);
        // Update last opened timestamp
        const updated = await updateWorkspace(workspace.id, {
          lastOpenedAt: Date.now(),
        });
        setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      } else {
        showToast('error', result.message);
      }
    } catch (err: any) {
      showToast('error', `Failed to open workspace: ${err.message}`);
    }
  };

  // Create or save workspace
  const handleSaveWorkspace = async (data: {
    id?: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    category?: string;
    isPinned?: boolean;
  }) => {
    try {
      if (data.id) {
        const updated = await updateWorkspace(data.id, data);
        setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
        showToast('success', `Updated workspace "${updated.name}"`);
      } else {
        const created = await createWorkspace(data);
        setWorkspaces((prev) => [created, ...prev]);
        showToast('success', `Created workspace "${created.name}"`);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Toggle pin
  const handleTogglePin = async (workspace: Workspace) => {
    const updated = await updateWorkspace(workspace.id, {
      isPinned: !workspace.isPinned,
    });
    setWorkspaces((prev) =>
      prev
        .map((w) => (w.id === updated.id ? updated : w))
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.updatedAt - a.updatedAt;
        })
    );
  };

  // Delete workspace
  const handleConfirmDelete = async () => {
    if (!deletingWorkspaceId) return;
    try {
      if (detailsWorkspaceId === deletingWorkspaceId) {
        setDetailsWorkspaceId(null);
      }
      await deleteWorkspace(deletingWorkspaceId);
      setWorkspaces((prev) => prev.filter((w) => w.id !== deletingWorkspaceId));
      setDeletingWorkspaceId(null);
      showToast('info', 'Workspace deleted. Original browser tabs were not closed.');
    } catch (err: any) {
      showToast('error', `Failed to delete: ${err.message}`);
    }
  };

  // Assign open tabs
  const handleAssignTabs = async (
    targetWorkspaceId: string,
    tabsToSave: Array<Omit<WorkspacePage, 'id' | 'position' | 'savedAt'>>
  ) => {
    try {
      const updated = await addPagesToWorkspace(targetWorkspaceId, tabsToSave);
      setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      showToast(
        'success',
        `Saved ${tabsToSave.length} ${tabsToSave.length === 1 ? 'page' : 'pages'} to "${updated.name}" without closing tabs.`
      );
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  const handleCreateWorkspaceWithTabs = async (
    name: string,
    tabsToSave: Array<Omit<WorkspacePage, 'id' | 'position' | 'savedAt'>>
  ) => {
    try {
      const created = await createWorkspace({
        name,
        icon: '📁',
        color: '#3B82F6',
        category: 'General',
        pages: tabsToSave.map((p, idx) => ({
          ...p,
          id: `p-${Date.now()}-${idx}`,
          position: idx,
          savedAt: Date.now(),
        })),
      });
      setWorkspaces((prev) => [created, ...prev]);
      showToast('success', `Created workspace "${created.name}" with ${tabsToSave.length} pages.`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Pages operations in workspace details modal
  const handleAddPageToWorkspace = async (
    workspaceId: string,
    page: Omit<WorkspacePage, 'id' | 'position' | 'savedAt'>
  ) => {
    const updated = await addPagesToWorkspace(workspaceId, [page]);
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    showToast('success', `Added "${page.title}"`);
  };

  const handleRemovePage = async (workspaceId: string, pageId: string) => {
    const updated = await removePageFromWorkspace(workspaceId, pageId);
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    showToast('info', 'Page removed from workspace');
  };

  const handleReorderPages = async (workspaceId: string, orderedPageIds: string[]) => {
    const updated = await reorderPages(workspaceId, orderedPageIds);
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  const handleUpdatePage = async (
    workspaceId: string,
    pageId: string,
    updates: Partial<Omit<WorkspacePage, 'id' | 'savedAt'>>
  ) => {
    const updated = await updatePage(workspaceId, pageId, updates);
    setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  // Reset to default presets
  const handleResetPresets = async () => {
    const resetData = {
      version: 1,
      workspaces: INITIAL_PRESETS,
      settings,
      lastSyncTime: Date.now(),
    };
    await saveStorageData(resetData);
    setWorkspaces(INITIAL_PRESETS);
    showToast('success', 'Restored starter workspaces');
  };

  // Active workspace for details modal
  const activeDetailsWorkspace = workspaces.find((w) => w.id === detailsWorkspaceId) || null;

  return (
    <div className="dashboard-layout">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateWorkspace={() => {
          setEditingWorkspace(null);
          setIsCreateModalOpen(true);
        }}
        onOpenTabAssign={() => {
          setInitialTargetWorkspaceId(undefined);
          setIsTabAssignOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenInNewWindow={openDashboardInNewWindow}
      />

      {/* Main Content Area */}
      <main className="main-content-container">
        {/* Hero / Quick Stat Bar */}
        <div className="dashboard-hero">
          <div className="hero-text-col">
            <div className="editorial-pill">
              <span className="pill-dot" />
              <span>THE WORKSPACE ARCHITECTURE</span>
            </div>
            <h1 className="hero-heading">
              Organize your web. <br />
              <em>Focus on what matters.</em>
            </h1>
            <p className="hero-subheading">
              Group your tabs into clean, purpose-driven workspaces. Switch between work, projects, study, and daily browsing in one click — without losing open tabs or slowing down your browser.
            </p>
            <div className="hero-actions-group">
              <button className="btn-story-guide" onClick={() => setIsGuideOpen(true)}>
                <BookOpen size={16} />
                <span>How It Works & Story</span>
              </button>
            </div>
          </div>

          <div className="hero-stats-badge">
            <div className="stat-item">
              <span className="stat-num">{workspaces.length}</span>
              <span className="stat-label">Workspaces</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num">{totalPagesCount}</span>
              <span className="stat-label">Saved Pages</span>
            </div>
          </div>
        </div>

        {/* Drag-and-Drop Open Tabs Tray */}
        {openTabsList.length > 0 && (
          <div className="open-tabs-dock glass-panel">
            <div className="tabs-dock-header">
              <div className="dock-title-group">
                <span className="dock-pin-icon">📌</span>
                <span className="dock-title">Open Browser Tabs</span>
                <span className="dock-hint">Drag any tab directly onto a workspace below</span>
              </div>
              <button
                className="btn btn-secondary dock-assign-all-btn"
                onClick={() => {
                  setInitialTargetWorkspaceId(undefined);
                  setIsTabAssignOpen(true);
                }}
              >
                Batch Assign All
              </button>
            </div>

            <div className="tabs-dock-scroll">
              {openTabsList.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      title: t.title,
                      url: t.url,
                      favIconUrl: t.favIconUrl,
                    }));
                    e.dataTransfer.setData('text/plain', t.url);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="draggable-tab-chip"
                  title={`Drag to add to a workspace:\n${t.title}\n${t.url}`}
                >
                  {t.favIconUrl ? (
                    <img src={t.favIconUrl} alt="" className="tab-chip-fav" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  ) : (
                    <span className="tab-chip-globe">🌐</span>
                  )}
                  <span className="tab-chip-title">
                    {t.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Bar & Quick Action */}
        <div className="categories-toolbar" id="workspaces-toolbar">
          <div className="category-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {searchQuery.trim() && (
            <div className="search-status-label">
              Showing results for "<strong>{searchQuery.trim()}</strong>" (
              {filteredWorkspaces.length} found)
            </div>
          )}
        </div>

        {/* Workspaces Grid */}
        {loading ? (
          <div className="loading-state-container">Loading your task workspaces...</div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="empty-workspaces-box glass-panel" id="workspaces-section">
            <Compass size={48} className="empty-compass" />
            <h2 className="empty-title">
              {searchQuery.trim() ? `No workspaces matching "${searchQuery.trim()}"` : 'No workspaces in this category'}
            </h2>
            <p className="empty-desc">
              {searchQuery.trim()
                ? 'Try searching with a different term, or create a new workspace for this task.'
                : 'Create a new task workspace or select "All" to view your existing collections.'}
            </p>
            <div className="empty-action-row">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingWorkspace(null);
                  setIsCreateModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Create New Workspace</span>
              </button>
              {searchQuery.trim() && (
                <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="workspaces-grid" id="workspaces-section">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onLaunch={handleLaunch}
                onViewDetails={(ws) => setDetailsWorkspaceId(ws.id)}
                onEdit={(ws) => {
                  setEditingWorkspace(ws);
                  setIsCreateModalOpen(true);
                }}
                onDelete={(id) => setDeletingWorkspaceId(id)}
                onTogglePin={handleTogglePin}
                defaultLaunchMode={settings.defaultLaunchMode}
                onDropTab={(workspaceId, tabData) => {
                  handleAddPageToWorkspace(workspaceId, {
                    title: tabData.title,
                    url: tabData.url,
                    favIconUrl: tabData.favIconUrl,
                  });
                  showToast('success', `Added "${tabData.title}" to workspace!`);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingWorkspace(null);
        }}
        onSave={handleSaveWorkspace}
        editingWorkspace={editingWorkspace}
      />

      <TabAssignModal
        isOpen={isTabAssignOpen}
        onClose={() => setIsTabAssignOpen(false)}
        workspaces={workspaces}
        onAssignTabs={handleAssignTabs}
        onCreateWorkspaceWithTabs={handleCreateWorkspaceWithTabs}
        initialTargetWorkspaceId={initialTargetWorkspaceId}
      />

      <WorkspaceDetailsModal
        workspace={activeDetailsWorkspace}
        isOpen={!!detailsWorkspaceId}
        onClose={() => setDetailsWorkspaceId(null)}
        onLaunch={handleLaunch}
        onAddPage={handleAddPageToWorkspace}
        onRemovePage={handleRemovePage}
        onReorderPages={handleReorderPages}
        onUpdatePage={handleUpdatePage}
        defaultLaunchMode={settings.defaultLaunchMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onReloadData={loadData}
        onResetPresets={handleResetPresets}
      />

      <ConfirmDialog
        isOpen={!!deletingWorkspaceId}
        title="Delete Workspace?"
        message="Are you sure you want to delete this workspace? Your saved page shortcuts in this workspace will be removed, but your current browser tabs and sessions will not be closed."
        confirmLabel="Delete Workspace"
        cancelLabel="Keep Workspace"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingWorkspaceId(null)}
      />

      {/* Toast Notification */}
      <NotificationToast toast={toast} onDismiss={() => setToast(null)} />

      {/* Editorial Story / Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <style>{`
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .main-content-container {
          max-width: 1240px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 32px 64px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .dashboard-hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          padding: 8px 0 16px;
        }

        .hero-text-col {
          max-width: 680px;
        }

        .editorial-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #94A3B8;
          margin-bottom: 14px;
        }

        .pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3B82F6;
          box-shadow: 0 0 8px #3B82F6;
        }

        .hero-heading {
          font-family: var(--font-serif);
          font-size: 2.8rem;
          line-height: 1.15;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .hero-heading em {
          font-style: italic;
          color: #93C5FD;
          font-weight: 400;
        }

        .hero-subheading {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-top: 14px;
          line-height: 1.6;
          max-width: 580px;
        }

        .hero-actions-group {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 22px;
        }

        .btn-story-guide {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-story-guide:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-1px);
        }

        .btn-create-editorial {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: var(--radius-md);
          background: #FFFFFF;
          color: #0F172A;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 14px rgba(255, 255, 255, 0.15);
          transition: var(--transition);
        }
        .btn-create-editorial:hover {
          background: #F1F5F9;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.22);
        }

        .hero-stats-badge {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(10px);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-num {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .stat-divider {
          width: 1px;
          height: 32px;
          background: var(--border-subtle);
        }

        /* Dedicated Open Tabs Dock */
        .open-tabs-dock {
          margin: 0 0 24px 0;
          padding: 16px 20px;
          border-radius: var(--radius-lg);
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
        }

        .tabs-dock-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dock-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dock-pin-icon {
          font-size: 1rem;
        }

        .dock-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .dock-hint {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .dock-assign-all-btn {
          padding: 5px 12px;
          font-size: 0.76rem;
          border-radius: var(--radius-sm);
        }

        .tabs-dock-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .draggable-tab-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          cursor: grab;
          white-space: nowrap;
          max-width: 230px;
          user-select: none;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }

        .draggable-tab-chip:hover {
          transform: translateY(-2px);
          border-color: var(--accent-primary);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .draggable-tab-chip:active {
          cursor: grabbing;
          transform: scale(0.97);
        }

        .tab-chip-fav {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .tab-chip-globe {
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .tab-chip-title {
          font-size: 0.8rem;
          color: var(--text-primary);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .categories-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 12px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .category-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-card);
          padding: 4px;
          border-radius: 14px;
          border: 1px solid var(--border-subtle);
          overflow-x: auto;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .category-tab-btn {
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 6px 16px;
          border-radius: 10px;
          background: transparent;
          border: none;
          transition: all 0.18s ease;
          white-space: nowrap;
          cursor: pointer;
        }

        .category-tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card-hover);
        }

        .category-tab-btn.active {
          color: #FFFFFF;
          background: var(--accent-primary);
          box-shadow: 0 2px 10px var(--accent-glow);
        }

        .search-status-label {
          font-size: 0.84rem;
          color: var(--text-muted);
        }

        .workspaces-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 22px;
        }

        .empty-workspaces-box {
          text-align: center;
          padding: 64px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 540px;
          margin: 40px auto;
        }

        .empty-compass {
          color: var(--accent-primary);
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .empty-desc {
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-top: 8px;
          line-height: 1.5;
        }

        .empty-action-row {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .loading-state-container {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-muted);
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .main-content-container {
            padding: 20px 16px 40px;
          }
          .workspaces-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
