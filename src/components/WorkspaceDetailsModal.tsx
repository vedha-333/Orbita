import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Play,
  ExternalLink,
  Trash2,
  Pin,
  Globe,
  Edit2,
  Check,
  Search,
  BookOpen,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { Workspace, WorkspacePage, LaunchMode } from '../types/workspace';
import { extractDomain, isValidWebUrl } from '../utils/normalize-url';
import { openSinglePage, ensureAbsoluteUrl } from '../services/browser-adapter';

interface WorkspaceDetailsModalProps {
  workspace: Workspace | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (workspace: Workspace, mode: LaunchMode) => void;
  onAddPage: (
    workspaceId: string,
    page: Omit<WorkspacePage, 'id' | 'position' | 'savedAt'>
  ) => Promise<void>;
  onRemovePage: (workspaceId: string, pageId: string) => Promise<void>;
  onReorderPages: (workspaceId: string, orderedPageIds: string[]) => Promise<void>;
  onUpdatePage: (
    workspaceId: string,
    pageId: string,
    updates: Partial<Omit<WorkspacePage, 'id' | 'savedAt'>>
  ) => Promise<void>;
  defaultLaunchMode: LaunchMode;
}

export const WorkspaceDetailsModal: React.FC<WorkspaceDetailsModalProps> = ({
  workspace,
  isOpen,
  onClose,
  onLaunch,
  onAddPage,
  onRemovePage,
  onReorderPages,
  onUpdatePage,
  defaultLaunchMode,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [urlError, setUrlError] = useState('');
  const [showLaunchDropdown, setShowLaunchDropdown] = useState(false);

  // Excluded page IDs: sync with workspace.pages (persisted across sessions & cards)
  const [excludedPageIds, setExcludedPageIds] = useState<Set<string>>(() => {
    return new Set(workspace?.pages.filter((p) => p.excludedFromLaunch).map((p) => p.id) || []);
  });

  // Sync exclusions when opening or when workspace pages update
  useEffect(() => {
    if (workspace) {
      const persistedExcluded = new Set(
        workspace.pages.filter((p) => p.excludedFromLaunch).map((p) => p.id)
      );
      setExcludedPageIds(persistedExcluded);
    }
  }, [workspace?.id, workspace?.pages]);

  // Drag and drop arrangement state
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  // Sort: pinned first, then by position
  const sortedPages = useMemo(() => {
    if (!workspace) return [];
    return [...workspace.pages].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.position - b.position;
    });
  }, [workspace]);

  // Filter with search
  const filteredPages = useMemo(() => {
    if (!searchFilter.trim()) return sortedPages;
    const q = searchFilter.toLowerCase();
    return sortedPages.filter((page) => {
      return (
        page.title.toLowerCase().includes(q) ||
        page.url.toLowerCase().includes(q) ||
        (page.notes && page.notes.toLowerCase().includes(q))
      );
    });
  }, [sortedPages, searchFilter]);

  if (!isOpen || !workspace) return null;

  const totalCount = workspace.pages.length;
  const selectedCount = workspace.pages.filter((p) => !excludedPageIds.has(p.id)).length;

  const togglePageSelection = async (pageId: string) => {
    const isCurrentlyExcluded = excludedPageIds.has(pageId);
    const willBeExcluded = !isCurrentlyExcluded;

    setExcludedPageIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyExcluded) {
        next.delete(pageId); // Re-include / check
      } else {
        next.add(pageId); // Exclude / uncheck
      }
      return next;
    });

    // Persist exclusion state directly to storage
    if (workspace) {
      await onUpdatePage(workspace.id, pageId, {
        excludedFromLaunch: willBeExcluded,
      });
    }
  };

  const handleToggleSelectAll = async () => {
    if (!workspace) return;
    if (selectedCount === totalCount) {
      // All are currently checked -> uncheck all (exclude all)
      const allIds = new Set(workspace.pages.map((p) => p.id));
      setExcludedPageIds(allIds);
      await Promise.all(
        workspace.pages.map((p) =>
          onUpdatePage(workspace.id, p.id, { excludedFromLaunch: true })
        )
      );
    } else {
      // Some or all are unchecked -> check all (clear exclusions)
      setExcludedPageIds(new Set());
      await Promise.all(
        workspace.pages.map((p) =>
          onUpdatePage(workspace.id, p.id, { excludedFromLaunch: false })
        )
      );
    }
  };

  const handleLaunchSelection = (mode: LaunchMode) => {
    const pagesToOpen = workspace.pages.filter((p) => !excludedPageIds.has(p.id));
    if (pagesToOpen.length === 0) return;
    onLaunch({ ...workspace, pages: pagesToOpen }, mode || defaultLaunchMode || 'new-window');
  };

  const handleAddNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    const formattedUrl = ensureAbsoluteUrl(newUrl);

    if (!isValidWebUrl(formattedUrl)) {
      setUrlError('Please enter a valid website address (e.g. leetcode.com or https://github.com)');
      return;
    }

    const title = newTitle.trim() || extractDomain(formattedUrl);
    await onAddPage(workspace.id, {
      url: formattedUrl,
      title,
      notes: newNotes.trim() || undefined,
      pinned: false,
    });

    setNewUrl('');
    setNewTitle('');
    setNewNotes('');
    setShowAddForm(false);
  };

  // Drag and drop arrangement handlers
  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
  };

  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedPageId === pageId) {
      setDragOverPageId(null);
      setDropPosition(null);
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'above' : 'below';

    setDragOverPageId(pageId);
    setDropPosition(pos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !(e.currentTarget as HTMLElement).contains(relatedTarget)) {
      setDragOverPageId(null);
      setDropPosition(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    const sourceId = draggedPageId || e.dataTransfer.getData('text/plain');

    if (!sourceId || sourceId === targetPageId) {
      setDraggedPageId(null);
      setDragOverPageId(null);
      setDropPosition(null);
      return;
    }

    const currentOrder = [...workspace.pages];
    const sourceIndex = currentOrder.findIndex((p) => p.id === sourceId);
    const targetIndex = currentOrder.findIndex((p) => p.id === targetPageId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedPageId(null);
      setDragOverPageId(null);
      setDropPosition(null);
      return;
    }

    const [movedPage] = currentOrder.splice(sourceIndex, 1);
    let newIndex = currentOrder.findIndex((p) => p.id === targetPageId);
    if (dropPosition === 'below') {
      newIndex += 1;
    }
    currentOrder.splice(newIndex, 0, movedPage);

    setDraggedPageId(null);
    setDragOverPageId(null);
    setDropPosition(null);

    await onReorderPages(
      workspace.id,
      currentOrder.map((p) => p.id)
    );
  };

  const handleDragEnd = () => {
    setDraggedPageId(null);
    setDragOverPageId(null);
    setDropPosition(null);
  };

  const startEditing = (page: WorkspacePage) => {
    setEditingPageId(page.id);
    setEditTitle(page.title);
    setEditNotes(page.notes || '');
  };

  const saveEditing = async (pageId: string) => {
    await onUpdatePage(workspace.id, pageId, {
      title: editTitle.trim(),
      notes: editNotes.trim() || undefined,
    });
    setEditingPageId(null);
  };

  const togglePinPage = async (page: WorkspacePage) => {
    await onUpdatePage(workspace.id, page.id, {
      pinned: !page.pinned,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content workspace-details-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="details-header" style={{ borderTop: `4px solid ${workspace.color}` }}>
          <div className="header-meta">
            <div
              className="ws-avatar"
              style={{
                borderColor: `${workspace.color}60`,
                background: `${workspace.color}15`,
                boxShadow: `0 4px 14px ${workspace.color}20`,
              }}
            >
              <span>{workspace.icon || '📁'}</span>
            </div>
            <div>
              <div className="header-title-row">
                <h2 className="ws-name">{workspace.name}</h2>
                {workspace.category && <span className="category-tag">{workspace.category}</span>}
              </div>
              <p className="ws-desc">{workspace.description || 'No description provided'}</p>
            </div>
          </div>

          <div className="header-right-actions">
            <div className="split-launch-group">
              <button
                className="btn btn-primary launch-ws-btn"
                onClick={() => handleLaunchSelection(defaultLaunchMode || 'new-window')}
                disabled={selectedCount === 0}
                title={
                  selectedCount === 0
                    ? 'Select at least one page to open'
                    : `Open ${selectedCount} selected ${selectedCount === 1 ? 'page' : 'pages'} in ${(defaultLaunchMode || 'new-window') === 'new-window' ? 'a new window' : 'current window'}`
                }
              >
                <Play size={14} fill="currentColor" />
                <span>
                  {selectedCount === totalCount
                    ? `Open All (${totalCount})`
                    : `Open Selected (${selectedCount})`}
                </span>
              </button>

              <div className="launch-dropdown-wrapper">
                <button
                  className="launch-dropdown-trigger"
                  onClick={() => setShowLaunchDropdown(!showLaunchDropdown)}
                  disabled={selectedCount === 0}
                  aria-label="Launch options"
                >
                  <ChevronDown size={14} />
                </button>

                {showLaunchDropdown && (
                  <>
                    <div className="menu-backdrop" onClick={() => setShowLaunchDropdown(false)} />
                    <div className="launch-menu dropdown-menu">
                      <button
                        className="dropdown-item"
                        disabled={selectedCount === 0}
                        onClick={() => {
                          setShowLaunchDropdown(false);
                          handleLaunchSelection('new-window');
                        }}
                      >
                        <ExternalLink size={14} />
                        <div className="item-text-group">
                          <span className="main-label">New Window + Tab Group</span>
                          <span className="sub-label">
                            Opens {selectedCount} selected in separate window
                          </span>
                        </div>
                      </button>
                      <button
                        className="dropdown-item"
                        disabled={selectedCount === 0}
                        onClick={() => {
                          setShowLaunchDropdown(false);
                          handleLaunchSelection('current-window');
                        }}
                      >
                        <Play size={14} />
                        <div className="item-text-group">
                          <span className="main-label">Current Window</span>
                          <span className="sub-label">
                            Opens {selectedCount} selected in current window
                          </span>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button className="btn-close" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Select All & Add Page Toggle */}
        <div className="details-toolbar">
          <div className="toolbar-left-group">
            {workspace.pages.length > 0 && (
              <button
                type="button"
                className={`select-all-btn ${selectedCount === totalCount ? 'all-selected' : ''}`}
                onClick={handleToggleSelectAll}
                title={selectedCount === totalCount ? 'Deselect all pages' : 'Select all pages to open'}
              >
                <div className={`checkbox-custom-box ${selectedCount > 0 ? 'active' : ''}`}>
                  {selectedCount === totalCount ? (
                    <Check size={11} strokeWidth={3} />
                  ) : selectedCount > 0 ? (
                    <span className="minus-indicator" />
                  ) : null}
                </div>
                <span>
                  {selectedCount === totalCount
                    ? 'All Selected'
                    : `${selectedCount}/${totalCount} Selected`}
                </span>
              </button>
            )}

            <div className="toolbar-search">
              <Search size={14} className="search-icon-small" />
              <input
                type="text"
                className="toolbar-search-input"
                placeholder="Search pages by title, URL or note..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              {searchFilter && (
                <button className="search-clear-sm" onClick={() => setSearchFilter('')}>×</button>
              )}
            </div>
          </div>

          <button
            className={`btn btn-secondary ${showAddForm ? 'active' : ''}`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={16} />
            <span>Add Web Page</span>
          </button>
        </div>

        {/* Add Page Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddNewPage} className="add-page-panel">
            <div className="add-form-row">
              <div className="form-group flex-2">
                <label className="form-label">Page URL *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. leetcode.com/explore or https://github.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group flex-2">
                <label className="form-label">Custom Title (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Two Sum Problem, Roadmap"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Task Context / Notes (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Why is this page open? (e.g. daily practice, review syntax, assignment 2)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>

            {urlError && <div className="error-message">{urlError}</div>}

            <div className="add-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Plus size={14} />
                <span>Save to Workspace</span>
              </button>
            </div>
          </form>
        )}

        {/* Saved Pages List */}
        <div className="pages-list-container">
          {workspace.pages.length === 0 ? (
            <div className="no-pages-empty">
              <BookOpen size={36} className="empty-icon" />
              <h3>No pages saved in this workspace yet</h3>
              <p>Add URLs manually above or click "Assign Open Tabs" on the dashboard to save tabs from your current session.</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="no-pages-empty">
              <p>No pages match "{searchFilter}".</p>
            </div>
          ) : (
            filteredPages.map((page) => {
              const isEditing = editingPageId === page.id;
              const isSelected = !excludedPageIds.has(page.id);
              const isDragging = draggedPageId === page.id;
              const isTarget = dragOverPageId === page.id;

              return (
                <div
                  key={page.id}
                  className={`page-card ${page.pinned ? 'is-page-pinned' : ''} ${!isSelected ? 'is-page-excluded' : ''} ${isDragging ? 'is-page-dragging' : ''} ${isTarget ? `drag-over-${dropPosition}` : ''}`}
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, page.id)}
                  onDragOver={(e) => handleDragOver(e, page.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, page.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="page-main-row">
                    {/* Drag Handle Grip */}
                    <div
                      className="drag-handle-grip"
                      title="Drag up or down to arrange order"
                      aria-label="Drag to rearrange"
                    >
                      <GripVertical size={16} />
                    </div>

                    {/* Checkbox to include/exclude for opening */}
                    <label
                      className="page-checkbox-wrap"
                      title={isSelected ? 'Included when opening workspace' : 'Excluded from open workspace'}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePageSelection(page.id)}
                        className="checkbox-native-hidden"
                      />
                      <div className={`page-checkbox-visual ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </label>

                    {/* Page Favicon */}
                    <div className="page-favicon-box">
                      {page.favIconUrl ? (
                        <img
                          src={page.favIconUrl}
                          alt=""
                          className="page-favicon"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Globe size={18} className="page-globe-icon" />
                      )}
                    </div>

                    <div className="page-body">
                      {isEditing ? (
                        <form
                          className="inline-edit-fields"
                          onSubmit={(e) => {
                            e.preventDefault();
                            saveEditing(page.id);
                          }}
                        >
                          <input
                            type="text"
                            className="form-input inline-input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Page title"
                            autoFocus
                          />
                          <input
                            type="text"
                            className="form-input inline-input"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Context / notes"
                          />
                        </form>
                      ) : (
                        <>
                          <div className="page-title-row">
                            <span
                              className="page-title-text"
                              onClick={() => openSinglePage(page.url)}
                              title="Click to open page in new tab"
                            >
                              {page.title}
                            </span>
                            <span className="page-domain-badge">{extractDomain(page.url)}</span>
                            {page.pinned && (
                              <span className="pinned-badge" title="Pinned to top">
                                <Pin size={10} fill="currentColor" /> Pinned
                              </span>
                            )}
                            {!isSelected && (
                              <span className="excluded-badge" title="Will not open when launching workspace">
                                Excluded on Open
                              </span>
                            )}
                          </div>

                          <div className="page-url-row" title={page.url}>
                            <span className="page-url-text">{page.url}</span>
                          </div>

                          {page.notes && (
                            <div className="page-notes-tag" title="Task notes">
                              <span>💡 {page.notes}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div className="page-actions">
                      {isEditing ? (
                        <button
                          className="action-icon-btn save-btn"
                          onClick={() => saveEditing(page.id)}
                          title="Save changes"
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <>
                          <button
                            className={`action-icon-btn ${page.pinned ? 'active-pin' : ''}`}
                            onClick={() => togglePinPage(page)}
                            title={page.pinned ? 'Unpin page' : 'Pin page to top'}
                          >
                            <Pin size={14} />
                          </button>

                          <button
                            className="action-icon-btn"
                            onClick={() => startEditing(page)}
                            title="Edit title & notes"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            className="action-icon-btn"
                            onClick={() => openSinglePage(page.url)}
                            title="Open single page in new tab"
                          >
                            <ExternalLink size={14} />
                          </button>

                          <button
                            className="action-icon-btn delete-btn"
                            onClick={() => onRemovePage(workspace.id, page.id)}
                            title="Remove from workspace"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="details-footer">
          <span className="footer-summary">
            <strong>{selectedCount}</strong> of <strong>{totalCount}</strong> {totalCount === 1 ? 'page' : 'pages'} selected to open · Drag rows to arrange order
          </span>
          <button className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      <style>{`
        .workspace-details-modal {
          max-width: 780px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          border-radius: 24px;
          border: 1px solid var(--border-hover);
          background: var(--bg-secondary);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 26px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
          gap: 16px;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .ws-avatar {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          border: 1.5px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.7rem;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .ws-avatar:hover {
          transform: scale(1.04);
        }

        .header-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ws-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .category-tag {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .ws-desc {
          font-size: 0.84rem;
          color: var(--text-muted);
          margin-top: 3px;
          line-height: 1.4;
        }

        .header-right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .split-launch-group {
          display: inline-flex;
          align-items: stretch;
          position: relative;
          box-shadow: 0 4px 14px var(--accent-glow);
          border-radius: 12px;
        }

        .launch-ws-btn {
          height: 38px;
          padding: 0 16px;
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
          font-weight: 600;
          font-size: 0.88rem;
          gap: 8px;
        }

        .launch-dropdown-trigger {
          background: var(--accent-primary);
          color: #FFFFFF;
          border-left: 1px solid rgba(255, 255, 255, 0.25);
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
          padding: 0 10px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }
        .launch-dropdown-trigger:hover {
          background: var(--accent-primary-hover);
        }

        .launch-dropdown-wrapper {
          position: relative;
        }

        .menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
        }

        .launch-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-hover);
          border-radius: 14px;
          box-shadow: var(--shadow-lg);
          min-width: 270px;
          z-index: 100;
          padding: 6px;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.85rem;
          color: var(--text-primary);
          text-align: left;
        }
        .dropdown-item:hover {
          background: var(--bg-input);
        }

        .item-text-group {
          display: flex;
          flex-direction: column;
        }
        .main-label {
          font-size: 0.84rem;
          font-weight: 600;
        }
        .sub-label {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .btn-close {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          transition: var(--transition);
        }
        .btn-close:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
          transform: translateY(-1px);
        }

        .details-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 26px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-subtle);
          gap: 14px;
        }

        .toolbar-left-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .select-all-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          height: 38px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .select-all-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          color: var(--text-primary);
        }
        .select-all-btn.all-selected {
          color: var(--accent-primary);
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.08);
        }

        .checkbox-custom-box {
          width: 17px;
          height: 17px;
          border-radius: 5px;
          border: 1.5px solid var(--border-hover);
          background: var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          transition: var(--transition);
        }
        .checkbox-custom-box.active {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          box-shadow: 0 2px 6px var(--accent-glow);
        }

        .minus-indicator {
          width: 7px;
          height: 2px;
          background: #FFFFFF;
          border-radius: 1px;
        }

        .toolbar-search {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 340px;
        }

        .search-icon-small {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .toolbar-search-input {
          width: 100%;
          height: 38px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 0 32px 0 36px;
          color: var(--text-primary);
          font-size: 0.86rem;
          transition: var(--transition);
        }
        .toolbar-search-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--bg-secondary);
        }

        .search-clear-sm {
          position: absolute;
          right: 10px;
          font-size: 1.1rem;
          color: var(--text-muted);
          padding: 2px 4px;
        }

        .add-page-panel {
          padding: 18px 22px;
          margin: 14px 26px 4px 26px;
          background: var(--bg-card);
          border: 1px solid var(--border-hover);
          border-radius: 16px;
          box-shadow: var(--shadow-sm);
          animation: fadeIn 0.15s ease-out;
        }

        .add-form-row {
          display: flex;
          gap: 14px;
        }

        .flex-2 {
          flex: 1;
        }

        .add-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 12px;
        }

        .error-message {
          color: var(--danger);
          font-size: 0.8rem;
          margin-bottom: 8px;
        }

        .pages-list-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px 26px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--bg-secondary);
        }

        .page-card {
          position: relative;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 12px 16px;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
          box-shadow: var(--shadow-sm);
        }

        .page-card:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          box-shadow: var(--shadow-md);
        }

        .page-card.is-page-pinned {
          border-color: rgba(59, 130, 246, 0.45);
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, var(--bg-card) 60%);
        }

        .page-card.is-page-dragging {
          opacity: 0.35;
          transform: scale(0.99);
          border: 1.5px dashed var(--accent-primary);
        }

        .page-card.drag-over-above {
          border-top: 2.5px solid var(--accent-primary);
          box-shadow: 0 -4px 12px rgba(59, 130, 246, 0.22);
        }

        .page-card.drag-over-below {
          border-bottom: 2.5px solid var(--accent-primary);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.22);
        }

        .page-card.is-page-excluded {
          opacity: 0.65;
          background: var(--bg-input);
        }
        .page-card.is-page-excluded:hover {
          opacity: 0.92;
        }

        .page-main-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .drag-handle-grip {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 32px;
          color: var(--text-muted);
          cursor: grab;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
          user-select: none;
        }
        .drag-handle-grip:hover {
          color: var(--text-primary);
          background: var(--bg-input);
        }
        .page-card:active .drag-handle-grip {
          cursor: grabbing;
        }

        .page-checkbox-wrap {
          display: flex;
          align-items: center;
          cursor: pointer;
          flex-shrink: 0;
          user-select: none;
        }

        .checkbox-native-hidden {
          position: absolute;
          opacity: 0;
          pointer-events: none;
          width: 0;
          height: 0;
        }

        .page-checkbox-visual {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1.5px solid var(--border-hover);
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .page-checkbox-wrap:hover .page-checkbox-visual {
          border-color: var(--accent-primary);
        }
        .page-checkbox-visual.checked {
          background: var(--accent-primary);
          border-color: var(--accent-primary);
          box-shadow: 0 2px 6px var(--accent-glow);
        }

        .page-favicon-box {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }

        .page-favicon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
        }

        .page-globe-icon {
          color: var(--text-muted);
        }

        .page-body {
          flex: 1;
          min-width: 0;
        }

        .page-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .page-title-text {
          font-size: 0.94rem;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .page-title-text:hover {
          color: var(--accent-primary);
        }

        .page-domain-badge {
          font-size: 0.72rem;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          padding: 2px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .pinned-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .excluded-badge {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          padding: 2px 7px;
          border-radius: 6px;
        }

        .page-url-row {
          margin-top: 3px;
        }

        .page-url-text {
          font-size: 0.76rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }

        .page-notes-tag {
          margin-top: 6px;
          font-size: 0.76rem;
          color: #B45309;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.25);
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
        }
        [data-theme='dark'] .page-notes-tag {
          color: #FBBF24;
        }

        .inline-edit-fields {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .inline-input {
          padding: 6px 12px;
          font-size: 0.85rem;
          border-radius: 8px;
        }

        .page-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .action-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          transition: var(--transition);
        }

        .action-icon-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
          transform: translateY(-1px);
        }

        .action-icon-btn.active-pin {
          color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.14);
          border-color: rgba(59, 130, 246, 0.35);
        }

        .action-icon-btn.delete-btn:hover {
          color: var(--danger);
          background: rgba(239, 68, 68, 0.12);
          border-color: rgba(239, 68, 68, 0.25);
        }

        .no-pages-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
        }

        .empty-icon {
          color: var(--border-hover);
          margin-bottom: 12px;
        }

        .no-pages-empty h3 {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .details-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 26px;
          background: var(--bg-card);
          border-top: 1px solid var(--border-subtle);
        }

        .footer-summary {
          font-size: 0.84rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
