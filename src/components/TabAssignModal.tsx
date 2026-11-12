import React, { useState, useEffect } from 'react';
import { X, Search, CheckSquare, Square, Layers, Globe, Plus, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { Workspace, BrowserTab, WorkspacePage } from '../types/workspace';
import { getOpenBrowserTabs } from '../services/browser-adapter';
import { extractDomain, normalizeUrl } from '../utils/normalize-url';

interface TabAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  onAssignTabs: (
    targetWorkspaceId: string,
    tabsToSave: Array<Omit<WorkspacePage, 'id' | 'position' | 'savedAt'>>
  ) => Promise<void>;
  onCreateWorkspaceWithTabs: (
    name: string,
    tabsToSave: Array<Omit<WorkspacePage, 'id' | 'position' | 'savedAt'>>
  ) => Promise<void>;
  initialTargetWorkspaceId?: string;
}

export const TabAssignModal: React.FC<TabAssignModalProps> = ({
  isOpen,
  onClose,
  workspaces,
  onAssignTabs,
  onCreateWorkspaceWithTabs,
  initialTargetWorkspaceId,
}) => {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [selectedTabIds, setSelectedTabIds] = useState<Set<number>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>(
    initialTargetWorkspaceId || (workspaces[0]?.id ?? '')
  );
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTabs();
      if (initialTargetWorkspaceId) {
        setTargetWorkspaceId(initialTargetWorkspaceId);
      } else if (workspaces.length > 0) {
        setTargetWorkspaceId(workspaces[0].id);
      }
    }
  }, [isOpen, initialTargetWorkspaceId, workspaces]);

  const loadTabs = async () => {
    setLoading(true);
    try {
      const openTabs = await getOpenBrowserTabs(true);
      setTabs(openTabs);
      // Select all by default
      const allIds = new Set(openTabs.map((t) => t.id));
      setSelectedTabIds(allIds);
    } catch (err) {
      console.error('Failed to load tabs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredTabs = tabs.filter((t) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q);
  });

  const toggleTabSelection = (tabId: number) => {
    const next = new Set(selectedTabIds);
    if (next.has(tabId)) {
      next.delete(tabId);
    } else {
      next.add(tabId);
    }
    setSelectedTabIds(next);
  };

  const handleSelectAll = () => {
    setSelectedTabIds(new Set(filteredTabs.map((t) => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedTabIds(new Set());
  };

  // Find target workspace to check duplicates
  const targetWorkspace = workspaces.find((w) => w.id === targetWorkspaceId);
  const existingUrls = new Set(targetWorkspace?.pages.map((p) => normalizeUrl(p.url)) || []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTabIds.size === 0) return;

    let selectedTabs = tabs.filter((t) => selectedTabIds.has(t.id));

    if (skipDuplicates) {
      selectedTabs = selectedTabs.filter((t) => !existingUrls.has(normalizeUrl(t.url)));
    }

    if (selectedTabs.length === 0) {
      alert('All selected tabs are already saved in this workspace.');
      return;
    }

    const pagesToSave = selectedTabs.map((t) => ({
      title: t.title,
      url: t.url,
      favIconUrl: t.favIconUrl,
      pinned: false,
    }));

    setIsSubmitting(true);
    try {
      await onAssignTabs(targetWorkspaceId, pagesToSave);
      onClose();
    } catch (err) {
      console.error('Error assigning tabs:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tab-assign-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="icon-badge">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="modal-title">Assign Open Tabs to Workspace</h2>
              <p className="modal-subtitle">
                Select pages from your current browser session. Original tabs will remain open and untouched.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Target Workspace Selector */}
          <div className="destination-panel">
            <label className="form-label">Save into workspace:</label>
            <div className="destination-controls">
              <div className="custom-ws-select-wrapper">
                <button
                  type="button"
                  id="target-workspace-select-btn"
                  className={`custom-ws-select-trigger ${isDropdownOpen ? 'is-open' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                >
                  <div className="trigger-left">
                    <div
                      className="ws-trigger-icon-box"
                      style={{
                        backgroundColor: `${targetWorkspace?.color || '#3B82F6'}18`,
                        borderColor: `${targetWorkspace?.color || '#3B82F6'}35`,
                      }}
                    >
                      <span className="ws-emoji">{targetWorkspace?.icon || '📁'}</span>
                    </div>
                    <span className="ws-trigger-name">
                      {targetWorkspace?.name || 'Select Workspace'}
                    </span>
                    {targetWorkspace && (
                      <span className="ws-trigger-count-badge">
                        {targetWorkspace.pages.length === 1 ? '1 page' : `${targetWorkspace.pages.length} pages`}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={16} className={`trigger-chevron ${isDropdownOpen ? 'rotated' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="custom-select-backdrop" onClick={() => setIsDropdownOpen(false)} />
                    <div className="custom-ws-options-menu" role="listbox">
                      <div className="options-menu-header">Select Workspace</div>
                      <div className="options-scroll-list">
                        {workspaces.map((ws) => {
                          const isSelected = ws.id === targetWorkspaceId;
                          return (
                            <button
                              key={ws.id}
                              type="button"
                              className={`custom-ws-option-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setTargetWorkspaceId(ws.id);
                                setIsDropdownOpen(false);
                              }}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <div className="option-left">
                                <div
                                  className="ws-option-icon-box"
                                  style={{
                                    backgroundColor: `${ws.color || '#3B82F6'}18`,
                                    borderColor: `${ws.color || '#3B82F6'}35`,
                                  }}
                                >
                                  <span className="ws-emoji">{ws.icon || '📁'}</span>
                                </div>
                                <div className="ws-option-info">
                                  <span className="ws-option-name">{ws.name}</span>
                                  {ws.category && <span className="ws-option-category">{ws.category}</span>}
                                </div>
                              </div>
                              <div className="option-right">
                                <span className="ws-option-count-pill">
                                  {ws.pages.length === 1 ? '1 page' : `${ws.pages.length} pages`}
                                </span>
                                {isSelected && <Check size={16} className="ws-option-check" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="skip-dup-row">
              <input
                id="skip-dup-check"
                type="checkbox"
                className="custom-checkbox-sm"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
                <label htmlFor="skip-dup-check" className="skip-dup-label">
                  Skip tabs that are already saved in this workspace
                </label>
              </div>
          </div>

          {/* Tab Filter & Batch Selection Controls */}
          <div className="tabs-selection-toolbar">
            <div className="search-filter-box">
              <Search size={14} className="filter-search-icon" />
              <input
                type="text"
                className="filter-search-input"
                placeholder="Filter open tabs..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <div className="batch-actions">
              <button
                type="button"
                className="btn-filter-pill"
                onClick={handleSelectAll}
                disabled={filteredTabs.length === 0}
              >
                <CheckSquare size={14} />
                <span>Select All ({filteredTabs.length})</span>
              </button>
              <button
                type="button"
                className="btn-filter-pill"
                onClick={handleDeselectAll}
                disabled={selectedTabIds.size === 0}
              >
                <Square size={14} />
                <span>Deselect All</span>
              </button>
            </div>
          </div>

          {/* Tabs List */}
          <div className="tabs-scroll-list">
            {loading ? (
              <div className="loading-state">Querying active browser tabs...</div>
            ) : filteredTabs.length === 0 ? (
              <div className="empty-tabs-notice">No matching tabs found.</div>
            ) : (
              filteredTabs.map((tab) => {
                const isSelected = selectedTabIds.has(tab.id);
                const isDuplicate = existingUrls.has(normalizeUrl(tab.url));

                return (
                  <div
                    key={tab.id}
                    className={`tab-item-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleTabSelection(tab.id)}
                  >
                    <input
                      type="checkbox"
                      className="tab-checkbox"
                      checked={isSelected}
                      onChange={() => toggleTabSelection(tab.id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="tab-favicon-box">
                      {tab.favIconUrl ? (
                        <img
                          src={tab.favIconUrl}
                          alt=""
                          className="tab-favicon"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Globe size={14} className="tab-globe" />
                      )}
                    </div>

                    <div className="tab-info">
                      <div className="tab-title-line">
                        <span className="tab-title" title={tab.title}>
                          {tab.title}
                        </span>
                        {isDuplicate && (
                          <span
                            className="duplicate-tag"
                            title="This page is already saved in this workspace"
                          >
                            <AlertCircle size={10} /> Already saved
                          </span>
                        )}
                      </div>
                      <span className="tab-domain">{extractDomain(tab.url)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <div className="selection-count">
              <span>
                <strong>{selectedTabIds.size}</strong> of {tabs.length} tabs selected
              </span>
            </div>

            <div className="footer-buttons">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={selectedTabIds.size === 0 || isSubmitting}
              >
                <Plus size={16} />
                <span>
                  {isSubmitting
                    ? 'Saving...'
                    : `Add ${selectedTabIds.size} ${selectedTabIds.size === 1 ? 'Tab' : 'Tabs'} to Workspace`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .tab-assign-modal {
          max-width: 680px;
          height: 82vh;
          display: flex;
          flex-direction: column;
          border-radius: 24px;
          border: 1px solid var(--border-hover);
          box-shadow: var(--shadow-lg);
          background: var(--bg-secondary);
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 26px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }

        .modal-title-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(59, 130, 246, 0.12);
          border: 1.5px solid rgba(59, 130, 246, 0.25);
          color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          flex-shrink: 0;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .modal-subtitle {
          font-size: 0.84rem;
          color: var(--text-muted);
          margin-top: 3px;
          line-height: 1.4;
        }

        .btn-close {
          width: 36px;
          height: 36px;
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

        .modal-form {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: visible;
        }

        .destination-panel {
          padding: 18px 26px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-subtle);
          position: relative;
          z-index: 50;
        }

        .destination-controls {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          position: relative;
        }

        .custom-ws-select-wrapper {
          position: relative;
          flex: 1;
        }

        .custom-ws-select-trigger {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          background-color: var(--bg-secondary);
          border: 1.5px solid var(--border-hover);
          color: var(--text-primary);
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
          outline: none;
        }

        .custom-ws-select-trigger:hover {
          border-color: var(--border-focus);
          background-color: var(--bg-card);
        }

        .custom-ws-select-trigger.is-open {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background-color: var(--bg-card);
        }

        .trigger-left {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          flex: 1;
        }

        .ws-trigger-icon-box {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1rem;
        }

        .ws-trigger-icon-box.new-ws-badge {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
          color: var(--accent-primary);
        }

        .ws-trigger-name {
          font-weight: 600;
          font-size: 0.92rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ws-trigger-count-badge {
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          padding: 2px 8px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .trigger-chevron {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .trigger-chevron.rotated {
          transform: rotate(180deg);
          color: var(--accent-primary);
        }

        .custom-select-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 90;
        }

        .custom-ws-options-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 100;
          background: var(--bg-card);
          border: 1px solid var(--border-hover);
          border-radius: 14px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
          padding: 6px;
          animation: dropSlide 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dropSlide {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .options-menu-header {
          padding: 8px 12px 6px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }

        .options-scroll-list {
          max-height: 240px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .custom-ws-option-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .custom-ws-option-item:hover {
          background: var(--bg-card-hover);
        }

        .custom-ws-option-item.selected {
          background: rgba(59, 130, 246, 0.08);
        }

        .option-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          overflow: hidden;
        }

        .ws-option-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.95rem;
        }

        .ws-option-icon-box.new-ws-badge {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.3);
          color: var(--accent-primary);
        }

        .ws-option-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow: hidden;
        }

        .ws-option-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ws-option-name.highlight {
          color: var(--accent-primary);
        }

        .ws-option-category {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .option-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .ws-option-count-pill {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-input);
          padding: 2px 7px;
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
        }

        .custom-ws-option-item.selected .ws-option-count-pill {
          background: rgba(59, 130, 246, 0.12);
          color: var(--accent-primary);
          border-color: rgba(59, 130, 246, 0.25);
        }

        .ws-option-check {
          color: var(--accent-primary);
          flex-shrink: 0;
        }

        .options-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 4px 6px;
        }

        .create-new-option {
          margin-top: 2px;
        }

        .create-new-option:hover {
          background: rgba(59, 130, 246, 0.08);
        }

        .new-ws-input {
          flex: 1;
          height: 48px;
          border-radius: 12px;
          background: var(--bg-secondary);
          border: 1.5px solid var(--border-hover);
          color: var(--text-primary);
          padding: 0 16px;
          font-size: 0.9rem;
          transition: var(--transition);
        }
        .new-ws-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .skip-dup-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
        }

        .custom-checkbox-sm {
          width: 17px;
          height: 17px;
          accent-color: var(--accent-primary);
          cursor: pointer;
          border-radius: 4px;
        }

        .skip-dup-label {
          font-size: 0.82rem;
          color: var(--text-secondary);
          cursor: pointer;
          user-select: none;
        }

        .tabs-selection-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 26px;
          border-bottom: 1px solid var(--border-subtle);
          gap: 14px;
          background: var(--bg-secondary);
        }

        .search-filter-box {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 360px;
        }

        .filter-search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .filter-search-input {
          width: 100%;
          height: 38px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: 12px;
          padding: 0 14px 0 36px;
          color: var(--text-primary);
          font-size: 0.85rem;
          transition: var(--transition);
        }
        .filter-search-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-glow);
          background: var(--bg-secondary);
        }

        .batch-actions {
          display: flex;
          gap: 10px;
        }

        .btn-filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 36px;
          padding: 0 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          transition: var(--transition);
        }
        .btn-filter-pill:hover:not(:disabled) {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
          transform: translateY(-1px);
        }
        .btn-filter-pill:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tabs-scroll-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px 26px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--bg-secondary);
        }

        .tab-item-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: var(--transition);
          box-shadow: var(--shadow-sm);
        }

        .tab-item-row:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .tab-item-row.selected {
          border-color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.08);
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.12);
        }

        .tab-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: var(--accent-primary);
          border-radius: 4px;
          flex-shrink: 0;
        }

        .tab-favicon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }

        .tab-favicon {
          width: 18px;
          height: 18px;
          border-radius: 4px;
        }

        .tab-globe {
          color: var(--text-muted);
        }

        .tab-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .tab-title-line {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tab-title {
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .duplicate-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(245, 158, 11, 0.14);
          color: #B45309;
          border: 1px solid rgba(245, 158, 11, 0.25);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }
        [data-theme='dark'] .duplicate-tag {
          color: #FBBF24;
        }

        .tab-domain {
          font-size: 0.74rem;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          padding: 1px 6px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 3px;
          width: fit-content;
        }

        .loading-state, .empty-tabs-notice {
          padding: 50px;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 26px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }

        .selection-count {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .footer-buttons {
          display: flex;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};
