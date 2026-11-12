import React, { useState, useRef } from 'react';
import { X, Download, Upload, RefreshCw, Settings, Sparkles, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { UserSettings, LaunchMode } from '../types/workspace';
import { exportDataToJson, importDataFromJson } from '../storage/workspace-storage';
import { isExtensionEnvironment, addMockTab } from '../services/browser-adapter';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  onReloadData: () => Promise<void>;
  onResetPresets: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onReloadData,
  onResetPresets,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dev tab generator state
  const [mockTabTitle, setMockTabTitle] = useState('');
  const [mockTabUrl, setMockTabUrl] = useState('');
  const [mockTabAdded, setMockTabAdded] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const json = await exportDataToJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbita-workspaces-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const result = await importDataFromJson(text);
        setImportStatus(`Successfully imported ${result.count} workspaces!`);
        await onReloadData();
      } catch (err: any) {
        setImportError(err.message || 'Failed to import JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleAddMockTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockTabUrl.trim()) return;

    addMockTab({
      title: mockTabTitle.trim() || mockTabUrl.trim(),
      url: mockTabUrl.trim().startsWith('http') ? mockTabUrl.trim() : `https://${mockTabUrl.trim()}`,
      active: false,
    });

    setMockTabTitle('');
    setMockTabUrl('');
    setMockTabAdded(true);
    setTimeout(() => setMockTabAdded(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="settings-header-title">
            <div className="header-icon-box">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="modal-title">Settings & Preferences</h2>
              <p className="modal-subtitle">Configure browsing behavior, backups, and appearance</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-body-scroll">
          {/* Default Launch Behavior */}
          <div className="settings-section">
            <div className="section-header">
              <h3 className="section-title">Workspace Launching</h3>
              <p className="section-subtitle">
                Configure whether workspaces open in a dedicated new browser window or your current window
              </p>
            </div>

            {/* Toggle: Open in New Window (ON / OFF) */}
            <div className="setting-toggle-card">
              <label htmlFor="toggle-new-window" className="toggle-label-group">
                <div className="toggle-title-row">
                  <span className="toggle-name">Open in New Window</span>
                  <span className={`status-badge-pill ${settings.defaultLaunchMode === 'new-window' ? 'badge-on' : 'badge-off'}`}>
                    {settings.defaultLaunchMode === 'new-window' ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="toggle-desc">
                  {settings.defaultLaunchMode === 'new-window'
                    ? 'Workspaces will open in a fresh, focused new browser window without disturbing your current tabs.'
                    : 'Workspaces will open directly inside your current browser window.'}
                </span>
              </label>
              <label className="switch-toggle" htmlFor="toggle-new-window">
                <input
                  id="toggle-new-window"
                  type="checkbox"
                  checked={settings.defaultLaunchMode === 'new-window'}
                  onChange={(e) =>
                    onUpdateSettings({
                      defaultLaunchMode: e.target.checked ? 'new-window' : 'current-window',
                    })
                  }
                />
                <span className="slider-round" />
              </label>
            </div>

            {/* Toggle: Native Tab Grouping (ON / OFF) */}
            <div className="setting-toggle-card">
              <label htmlFor="toggle-auto-group" className="toggle-label-group">
                <div className="toggle-title-row">
                  <span className="toggle-name">Native Tab Grouping</span>
                  <span className={`status-badge-pill ${settings.autoGroupTabs ? 'badge-on' : 'badge-off'}`}>
                    {settings.autoGroupTabs ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="toggle-desc">
                  Automatically group launched workspace tabs under the workspace title and matching color badge.
                </span>
              </label>
              <label className="switch-toggle" htmlFor="toggle-auto-group">
                <input
                  id="toggle-auto-group"
                  type="checkbox"
                  checked={settings.autoGroupTabs}
                  onChange={(e) => onUpdateSettings({ autoGroupTabs: e.target.checked })}
                />
                <span className="slider-round" />
              </label>
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="settings-section">
            <div className="section-header">
              <h3 className="section-title">Data Backup & Portability</h3>
              <p className="section-subtitle">
                Export your workspaces to a portable JSON file to back up or transfer between Opera, Chrome, and Brave.
              </p>
            </div>

            <div className="backup-actions">
              <button className="btn btn-secondary backup-action-btn" onClick={handleExport}>
                <Download size={16} />
                <span>Export Workspaces (JSON)</span>
              </button>

              <button
                className="btn btn-secondary backup-action-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                <span>Import Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {importStatus && <div className="status-success"><Check size={14} /> {importStatus}</div>}
            {importError && <div className="status-error"><AlertTriangle size={14} /> {importError}</div>}
          </div>

          {/* Dev Mode Tab Injector */}
          {!isExtensionEnvironment() && (
            <div className="settings-section dev-tools-section">
              <div className="dev-header">
                <Sparkles size={16} className="dev-sparkle-icon" />
                <h3 className="section-title dev-title">Dev Preview Tab Simulator</h3>
              </div>
              <p className="section-subtitle">
                Since you are previewing in web dev mode, add simulated browser tabs below to test tab assignment and drop-to-workspace functionality.
              </p>

              <form onSubmit={handleAddMockTab} className="mock-tab-form">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Simulated Tab Title (e.g. LeetCode 75)"
                  value={mockTabTitle}
                  onChange={(e) => setMockTabTitle(e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="URL (e.g. https://leetcode.com/problemset)"
                  value={mockTabUrl}
                  onChange={(e) => setMockTabUrl(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary mock-add-btn">
                  <span>Add Simulated Tab</span>
                </button>
              </form>

              {mockTabAdded && (
                <div className="status-success">
                  <Check size={14} /> Added simulated tab! Click "Assign Tabs" to view it.
                </div>
              )}
            </div>
          )}

          {/* Reset to Presets */}
          <div className="settings-section danger-zone">
            <div className="section-header">
              <h3 className="section-title">Reset to Starter Workspaces</h3>
              <p className="section-subtitle">
                Restore the default starter workspaces (DSA Practice, Open Source, AI/ML, College Work).
              </p>
            </div>

            {showResetConfirm ? (
              <div className="reset-confirm-box">
                <div className="alert-text">
                  <AlertTriangle size={16} />
                  <span>Are you sure? This will replace your current workspaces with the starter presets.</span>
                </div>
                <div className="confirm-btn-row">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      await onResetPresets();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                  >
                    Yes, Reset to Presets
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="btn btn-secondary restore-btn"
                onClick={() => setShowResetConfirm(true)}
              >
                <RefreshCw size={14} />
                <span>Restore Starter Workspaces</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="footer-left">
            <ShieldCheck size={14} className="privacy-icon" />
            <span className="extension-version">Orbita v0.1.0 · Manifest V3 • Private & Local-First</span>
          </div>
          <button className="btn btn-secondary modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        .settings-modal {
          max-width: 640px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          border-radius: 24px;
          border: 1px solid var(--border-hover);
          background: var(--bg-secondary);
          box-shadow: var(--shadow-lg);
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

        .settings-header-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          color: var(--accent-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .modal-subtitle {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin-top: 3px;
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

        .settings-body-scroll {
          padding: 22px 26px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 22px;
          background: var(--bg-secondary);
        }

        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 22px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .section-header {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .section-title {
          font-size: 0.98rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .section-subtitle {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .launch-options-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 4px;
        }

        .launch-option-card {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          background: var(--bg-card);
          border: 1.5px solid var(--border-subtle);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
        }

        .launch-option-card:hover {
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
          transform: translateY(-1px);
        }

        .launch-option-card.active {
          border-color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.08);
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.12);
        }

        .option-radio {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--border-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          flex-shrink: 0;
          transition: var(--transition);
        }

        .launch-option-card.active .option-radio {
          border-color: var(--accent-primary);
        }

        .radio-inner {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--accent-primary);
        }

        .option-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
        }

        .option-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .option-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .recommended-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: #2563EB;
          background: rgba(37, 99, 235, 0.1);
          border: 1px solid rgba(37, 99, 235, 0.2);
          padding: 1px 7px;
          border-radius: 9999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .option-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .setting-toggle-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          margin-top: 10px;
          gap: 18px;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
        }

        .setting-toggle-card:hover {
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
          box-shadow: var(--shadow-md);
        }

        .toggle-label-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          flex: 1;
        }

        .toggle-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toggle-name {
          font-size: 0.94rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .status-badge-pill {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .status-badge-pill.badge-on {
          color: #059669;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.28);
        }

        .status-badge-pill.badge-off {
          color: var(--text-muted);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
        }

        .toggle-desc {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        /* Modern iOS-style ON/OFF switch */
        .switch-toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .switch-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider-round {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: var(--border-hover);
          transition: 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 26px;
        }

        .slider-round:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: #FFFFFF;
          transition: 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
        }

        .switch-toggle input:checked + .slider-round {
          background-color: var(--accent-primary);
        }

        .switch-toggle input:checked + .slider-round:before {
          transform: translateX(22px);
        }

        .theme-selector-row {
          display: flex;
          gap: 12px;
          margin-top: 4px;
        }

        .theme-chip {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 44px;
          border-radius: 12px;
          background: var(--bg-card);
          border: 1.5px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
        }

        .theme-chip:hover {
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .theme-chip.active {
          border-color: var(--accent-primary);
          color: #FFFFFF !important;
          background: var(--accent-primary);
          box-shadow: 0 4px 14px var(--accent-glow);
        }

        .backup-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .backup-action-btn {
          height: 40px;
          padding: 0 18px;
          border-radius: 12px;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .restore-btn {
          align-self: flex-start;
          height: 38px;
          padding: 0 16px;
          border-radius: 12px;
          font-size: 0.86rem;
          color: var(--danger);
          border-color: rgba(239, 68, 68, 0.25);
        }
        .restore-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }

        .dev-tools-section {
          background: rgba(59, 130, 246, 0.05);
          border: 1px dashed rgba(59, 130, 246, 0.3);
          border-radius: 16px;
          padding: 18px;
        }

        .dev-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dev-title {
          color: #2563EB;
        }
        [data-theme='dark'] .dev-title {
          color: #60A5FA;
        }

        .mock-tab-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }

        .mock-add-btn {
          align-self: flex-start;
          height: 36px;
          padding: 0 16px;
          border-radius: 10px;
        }

        .reset-confirm-box {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alert-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          color: var(--danger);
          font-weight: 500;
        }

        .confirm-btn-row {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .status-success {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          color: #059669;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 10px 14px;
          border-radius: 10px;
        }

        .status-error {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          padding: 10px 14px;
          border-radius: 10px;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 26px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-card);
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
        }

        .privacy-icon {
          color: #10B981;
        }

        .extension-version {
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .modal-close-btn {
          height: 38px;
          padding: 0 20px;
          border-radius: 10px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
