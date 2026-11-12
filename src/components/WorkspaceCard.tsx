import React, { useState } from 'react';
import { Play, ExternalLink, MoreVertical, Edit2, Trash2, Pin, ChevronDown, Check, Globe, Plus } from 'lucide-react';
import { Workspace, LaunchMode } from '../types/workspace';
import { extractDomain } from '../utils/normalize-url';
import { suggestWorkspaceMeta } from './CreateWorkspaceModal';

interface WorkspaceCardProps {
  workspace: Workspace;
  onLaunch: (workspace: Workspace, mode: LaunchMode) => void;
  onViewDetails: (workspace: Workspace) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
  onTogglePin: (workspace: Workspace) => void;
  defaultLaunchMode: LaunchMode;
  onDropTab?: (workspaceId: string, tabData: { title: string; url: string; favIconUrl?: string }) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  onLaunch,
  onViewDetails,
  onEdit,
  onDelete,
  onTogglePin,
  defaultLaunchMode,
  onDropTab,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLaunchDropdown, setShowLaunchDropdown] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const formatTimestamp = (ts?: number) => {
    if (!ts) return 'Never opened';
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const effectiveDesc =
    workspace.description?.trim() ||
    suggestWorkspaceMeta(workspace.name, workspace.category).description;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      // Check for internal tab data transfer
      const rawCustom = e.dataTransfer.getData('application/json');
      if (rawCustom) {
        const parsed = JSON.parse(rawCustom);
        if (parsed.url) {
          onDropTab?.(workspace.id, {
            title: parsed.title || parsed.url,
            url: parsed.url,
            favIconUrl: parsed.favIconUrl,
          });
          return;
        }
      }

      // Check standard text/uri-list (e.g. dragged browser tab or URL link)
      const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (uri && (uri.startsWith('http://') || uri.startsWith('https://'))) {
        onDropTab?.(workspace.id, {
          title: uri,
          url: uri,
        });
      }
    } catch (err) {
      console.warn('Error handling drop on workspace card:', err);
    }
  };

  return (
    <div
      id={`workspace-card-${workspace.id}`}
      className={`workspace-card glass-panel ${workspace.isPinned ? 'is-pinned' : ''} ${isDragOver ? 'drag-over' : ''}`}
      style={{
        '--ws-color': workspace.color,
        outline: isDragOver ? `2px dashed ${workspace.color}` : undefined,
        outlineOffset: isDragOver ? '4px' : undefined,
        transition: 'all 0.2s ease',
      } as React.CSSProperties}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Accent Strip */}
      <div
        className="card-top-accent"
        style={{
          background: `linear-gradient(90deg, ${workspace.color} 0%, ${workspace.color}99 65%, transparent 100%)`,
        }}
      />

      {/* Card Header */}
      <div className="card-header">
        <div className="header-icon-title">
          <div
            className="workspace-icon-box"
            style={{
              borderColor: `${workspace.color}50`,
              background: `${workspace.color}16`,
              boxShadow: `0 4px 14px ${workspace.color}22`,
            }}
          >
            <span className="workspace-emoji">{workspace.icon || '📁'}</span>
          </div>
          <div className="title-area">
            <div className="title-row">
              <h3 className="workspace-title" onClick={() => onViewDetails(workspace)} title="View workspace pages">
                {workspace.name}
              </h3>
              {workspace.category && (
                <span className="category-pill">{workspace.category}</span>
              )}
            </div>
            <p className="workspace-desc" title={effectiveDesc}>
              {effectiveDesc}
            </p>
          </div>
        </div>

        <div className="card-top-actions">
          <button
            className={`pin-btn ${workspace.isPinned ? 'pinned' : ''}`}
            onClick={() => onTogglePin(workspace)}
            title={workspace.isPinned ? 'Unpin workspace' : 'Pin to top'}
            aria-label="Pin"
          >
            <Pin size={16} />
          </button>

          <div className="menu-container">
            <button
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More actions"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <>
                <div className="menu-backdrop" onClick={() => setShowMenu(false)} />
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowMenu(false);
                      onViewDetails(workspace);
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Manage Pages ({workspace.pages.length})</span>
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(workspace);
                    }}
                  >
                    <Edit2 size={14} />
                    <span>Edit Workspace</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(workspace.id);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Workspace</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Quick Meta Bar (Uniform Height & Perfect Grid Alignment) */}
      <div
        className="pages-preview"
        onClick={() => onViewDetails(workspace)}
        title="Click to view and manage saved pages"
      >
        <div className="pages-count-row">
          <div className="pages-meta-left">
            {workspace.pages.length > 0 ? (
              <div className="favicon-stack">
                {(workspace.pages.filter((p) => !p.excludedFromLaunch).length > 0
                  ? workspace.pages.filter((p) => !p.excludedFromLaunch)
                  : workspace.pages
                )
                  .slice(0, 4)
                  .map((page, idx) => (
                    <div
                      key={page.id}
                      className="stack-favicon-bubble"
                      style={{ zIndex: 10 - idx }}
                      title={page.title || extractDomain(page.url)}
                    >
                      {page.favIconUrl ? (
                        <img
                          src={page.favIconUrl}
                          alt=""
                          className="stack-favicon-img"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Globe size={11} className="stack-globe-icon" />
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="empty-slot-dot" />
            )}
            <span className="pages-count-text">
              {workspace.pages.filter((p) => !p.excludedFromLaunch).length < workspace.pages.length ? (
                <>
                  <strong>{workspace.pages.filter((p) => !p.excludedFromLaunch).length}</strong> of{' '}
                  {workspace.pages.length} pages
                </>
              ) : (
                <>
                  <strong>{workspace.pages.length}</strong>{' '}
                  {workspace.pages.length === 1 ? 'page saved' : 'pages saved'}
                </>
              )}
            </span>
          </div>

          <span className="last-opened">
            {workspace.lastOpenedAt ? `Opened ${formatTimestamp(workspace.lastOpenedAt)}` : 'Not opened yet'}
          </span>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="card-footer">
        {(() => {
          const activePages = workspace.pages.filter((p) => !p.excludedFromLaunch);
          const activeCount = activePages.length;
          const totalCount = workspace.pages.length;
          const hasExclusions = activeCount < totalCount;

          return (
            <div className="split-launch-group">
              <button
                className="btn btn-primary launch-main-btn"
                onClick={() => onLaunch({ ...workspace, pages: activePages }, defaultLaunchMode || 'new-window')}
                disabled={activeCount === 0}
                title={
                  totalCount === 0
                    ? 'Add pages first to open'
                    : activeCount === 0
                    ? 'All pages are excluded. Click Manage to select pages to open.'
                    : `Open ${hasExclusions ? `${activeCount} selected` : `all ${totalCount}`} ${
                        (hasExclusions ? activeCount : totalCount) === 1 ? 'page' : 'pages'
                      } in ${
                        (defaultLaunchMode || 'new-window') === 'new-window'
                          ? 'a new window'
                          : 'current window'
                      }`
                }
              >
                <Play size={14} fill="currentColor" />
                <span>Open Workspace</span>
              </button>

              <div className="launch-dropdown-wrapper">
                <button
                  className="launch-dropdown-trigger"
                  onClick={() => setShowLaunchDropdown(!showLaunchDropdown)}
                  disabled={activeCount === 0}
                  aria-label="Launch options"
                >
                  <ChevronDown size={14} />
                </button>

                {showLaunchDropdown && (
                  <>
                    <div className="menu-backdrop" onClick={() => setShowLaunchDropdown(false)} />
                    <div className="launch-menu dropdown-menu">
                      <div className="menu-header">Open Mode</div>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowLaunchDropdown(false);
                          onLaunch({ ...workspace, pages: activePages }, 'new-window');
                        }}
                      >
                        <ExternalLink size={14} />
                        <div className="item-text-group">
                          <span className="main-label">New Window</span>
                          <span className="sub-label">
                            Opens {activeCount} selected in a fresh window
                          </span>
                        </div>
                        {defaultLaunchMode === 'new-window' && <Check size={14} className="active-check" />}
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowLaunchDropdown(false);
                          onLaunch({ ...workspace, pages: activePages }, 'current-window');
                        }}
                      >
                        <Play size={14} />
                        <div className="item-text-group">
                          <span className="main-label">Current Window</span>
                          <span className="sub-label">
                            Opens {activeCount} selected in current window
                          </span>
                        </div>
                        {defaultLaunchMode === 'current-window' && <Check size={14} className="active-check" />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        <button
          className="btn btn-secondary view-pages-btn"
          onClick={() => onViewDetails(workspace)}
          title="Open workspace manager to view and organize saved pages"
        >
          <span>Manage</span>
        </button>
      </div>

      <style>{`
        .workspace-card {
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          border-radius: 24px;
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.05);
        }

        .workspace-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 42px -6px rgba(0, 0, 0, 0.10), 0 0 24px rgba(59, 130, 246, 0.12);
          border-color: var(--border-hover);
        }

        .workspace-card.is-pinned {
          border-color: rgba(59, 130, 246, 0.4);
        }

        .card-top-accent {
          height: 3.5px;
          width: 100%;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 22px 14px;
          gap: 14px;
        }

        .header-icon-title {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }

        .workspace-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid;
          flex-shrink: 0;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .workspace-card:hover .workspace-icon-box {
          transform: scale(1.05);
        }

        .workspace-emoji {
          font-size: 1.6rem;
          line-height: 1;
        }

        .title-area {
          flex: 1;
          min-width: 0;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .workspace-title {
          font-size: 1.18rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: var(--transition);
        }

        .workspace-title:hover {
          color: var(--accent-primary);
        }

        .category-pill {
          background: var(--bg-input);
          color: var(--text-secondary);
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 9px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border: 1px solid var(--border-subtle);
        }

        .workspace-desc {
          font-size: 0.84rem;
          color: var(--text-muted);
          margin-top: 6px;
          line-height: 1.45;
          min-height: 2.9em;
          max-height: 2.9em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-top-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pin-btn, .menu-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          transition: var(--transition);
        }

        .pin-btn:hover, .menu-btn:hover {
          color: var(--text-primary);
          background: var(--bg-input);
          border-color: var(--border-subtle);
        }

        .pin-btn.pinned {
          color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.1);
        }

        .menu-container {
          position: relative;
        }

        .menu-backdrop {
          position: fixed;
          inset: 0;
          z-index: 90;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-hover);
          border-radius: 14px;
          box-shadow: var(--shadow-lg);
          min-width: 200px;
          z-index: 100;
          padding: 6px;
          animation: scaleUp 0.15s ease-out;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-primary);
          text-align: left;
        }

        .dropdown-item:hover {
          background: var(--bg-card-hover);
        }

        .dropdown-item.text-danger {
          color: var(--danger);
        }
        .dropdown-item.text-danger:hover {
          background: rgba(239, 68, 68, 0.12);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 4px 0;
        }

        .pages-preview {
          padding: 12px 22px;
          cursor: pointer;
          background: var(--bg-input);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          transition: background 0.18s ease;
          display: flex;
          align-items: center;
        }

        .pages-preview:hover {
          background: var(--bg-card-hover);
        }

        .pages-count-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.82rem;
          min-height: 26px;
        }

        .pages-meta-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .favicon-stack {
          display: flex;
          align-items: center;
          padding-left: 2px;
        }

        .stack-favicon-bubble {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 2px solid var(--bg-input);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          margin-left: -7px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }
        .stack-favicon-bubble:first-child {
          margin-left: 0;
        }
        .pages-preview:hover .stack-favicon-bubble {
          border-color: var(--bg-card-hover);
          transform: translateY(-1px);
        }

        .stack-favicon-img {
          width: 13px;
          height: 13px;
          border-radius: 2px;
          object-fit: contain;
        }

        .stack-globe-icon {
          color: var(--text-muted);
        }

        .empty-slot-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--border-hover);
        }

        .pages-count-text {
          color: var(--text-secondary);
          font-size: 0.82rem;
        }
        .pages-count-text strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        .last-opened {
          color: var(--text-muted);
          font-size: 0.76rem;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 22px;
          gap: 12px;
          background: var(--bg-card);
        }

        .split-launch-group {
          display: inline-flex;
          align-items: center;
          position: relative;
          box-shadow: 0 2px 8px var(--accent-glow);
          border-radius: 12px;
        }

        .launch-main-btn {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          height: 38px;
          padding: 0 18px;
          gap: 8px;
          display: inline-flex;
          align-items: center;
          font-weight: 700;
          font-size: 0.88rem;
          border-radius: 12px 0 0 12px;
        }

        .launch-dropdown-trigger {
          background: var(--accent-primary);
          color: #FFFFFF;
          border: none;
          border-left: 1px solid rgba(255, 255, 255, 0.25);
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
          height: 38px;
          width: 32px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          cursor: pointer;
        }
        .launch-dropdown-trigger:hover {
          background: var(--accent-primary-hover);
        }

        .launch-dropdown-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .launch-menu {
          min-width: 260px;
          top: calc(100% + 6px);
          left: 0;
          right: auto;
        }

        .menu-header {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-muted);
          font-weight: 700;
          padding: 4px 8px 6px;
          letter-spacing: 0.05em;
        }

        .item-text-group {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .main-label {
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .sub-label {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .active-check {
          color: var(--accent-primary);
        }

        .view-pages-btn {
          height: 38px;
          padding: 0 18px;
          font-size: 0.86rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          border-radius: 12px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          transition: var(--transition);
        }
        .view-pages-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};
