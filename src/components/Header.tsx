import React from 'react';
import { Search, Settings, Plus, Sparkles } from 'lucide-react';
import { isExtensionEnvironment } from '../services/browser-adapter';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateWorkspace: () => void;
  onOpenTabAssign: () => void;
  onOpenSettings: () => void;
  onOpenGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onCreateWorkspace,
  onOpenTabAssign,
  onOpenSettings,
}) => {
  const isExtension = isExtensionEnvironment();

  return (
    <header className="suncealand-navbar">
      {/* Left: orbita brand text + search bar directly beside it */}
      <div className="navbar-left">
        <div className="brand-logo" onClick={() => onSearchChange('')} title="orbita">
          <span className="brand-text">orbita</span>
        </div>

        <div className="navbar-search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            id="workspace-search-input"
            type="text"
            className="navbar-search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const targetElement =
                  document.getElementById('workspaces-toolbar') ||
                  document.getElementById('workspaces-section');
                if (targetElement) {
                  const navHeight = 76;
                  const rect = targetElement.getBoundingClientRect();
                  const absoluteTop = rect.top + window.pageYOffset;
                  window.scrollTo({
                    top: Math.max(0, absoluteTop - navHeight),
                    behavior: 'smooth',
                  });
                }
              }
            }}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {!isExtension && (
          <div className="dev-pill" title="Running in dev preview mode with simulated tabs">
            <Sparkles size={11} />
            <span>Dev Preview</span>
          </div>
        )}
      </div>

      {/* Right: Quick Assign Tabs, Outlined Action Button (+ New Workspace), Theme & Settings */}
      <div className="navbar-right">
        {/* Quick Assign Tabs button */}
        <button
          id="btn-assign-tabs"
          className="nav-link assign-link"
          onClick={onOpenTabAssign}
          title="Select open browser tabs and save to a workspace"
        >
          Assign Tabs
        </button>

        {/* Outlined Action Button styled like 'Login' in the reference */}
        <button
          id="btn-create-workspace"
          className="nav-btn-outlined"
          onClick={onCreateWorkspace}
          title="Create a new task workspace (Alt+N)"
        >
          <Plus size={15} />
          <span>New Workspace</span>
        </button>

        {/* Utility actions: Settings */}
        <div className="nav-utilities">
          <button
            id="btn-settings"
            className="nav-icon-btn"
            onClick={onOpenSettings}
            title="Settings and Backup"
            aria-label="Settings"
          >
            <Settings size={17} />
          </button>
        </div>
      </div>

      <style>{`
        .suncealand-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 44px;
          background: #000000;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: sticky;
          top: 0;
          z-index: 50;
          gap: 24px;
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        [data-theme='light'] .suncealand-navbar {
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 32px;
          flex: 1;
          min-width: 0;
        }

        .brand-logo {
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
          transition: opacity 0.2s ease;
        }
        .brand-logo:hover {
          opacity: 0.85;
        }

        .brand-text {
          font-family: var(--font-sans);
          font-size: 1.3rem;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.035em;
          line-height: 1;
          display: inline-block;
        }

        [data-theme='light'] .brand-text {
          color: #0F172A;
        }

        .navbar-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 320px;
          max-width: 100%;
          height: 40px;
          background: #12151D;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          transition: all 0.2s ease;
          outline: none !important;
        }

        [data-theme='light'] .navbar-search-wrapper {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
        }

        .navbar-search-wrapper:focus-within {
          border-color: rgba(255, 255, 255, 0.28);
          background: #171B26;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
          outline: none !important;
        }

        [data-theme='light'] .navbar-search-wrapper:focus-within {
          border-color: #94A3B8;
          background: #FFFFFF;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          outline: none !important;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: #64748B;
          pointer-events: none;
        }

        .navbar-search-input {
          width: 100%;
          height: 100%;
          padding: 0 34px 0 38px;
          border: none;
          background: transparent;
          color: #FFFFFF;
          font-size: 0.9rem;
          font-family: inherit;
          outline: none !important;
          box-shadow: none !important;
        }

        .navbar-search-input:focus,
        .navbar-search-input:focus-visible {
          outline: none !important;
          outline-offset: 0 !important;
          box-shadow: none !important;
        }

        [data-theme='light'] .navbar-search-input {
          color: #0F172A;
        }

        .navbar-search-input::placeholder {
          color: #64748B;
          font-weight: 400;
        }

        .search-clear-btn {
          position: absolute;
          right: 10px;
          font-size: 1.1rem;
          color: #64748B;
          padding: 2px 6px;
          border-radius: 4px;
          line-height: 1;
        }
        .search-clear-btn:hover {
          color: #FFFFFF;
        }
        [data-theme='light'] .search-clear-btn:hover {
          color: #0F172A;
        }

        .dev-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          color: #60A5FA;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-shrink: 0;
        }

        .nav-link {
          font-size: 0.92rem;
          font-weight: 500;
          color: #CBD5E1;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.18s ease;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 0;
        }

        [data-theme='light'] .nav-link {
          color: #475569;
        }

        .nav-link:hover {
          color: #FFFFFF;
        }

        [data-theme='light'] .nav-link:hover {
          color: #0F172A;
        }

        /* The Outlined Button matching 'Login' in the reference image */
        .nav-btn-outlined {
          height: 38px;
          padding: 0 18px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #FFFFFF;
          font-size: 0.9rem;
          font-weight: 500;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        [data-theme='light'] .nav-btn-outlined {
          border: 1px solid rgba(0, 0, 0, 0.28);
          color: #0F172A;
        }

        .nav-btn-outlined:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.8);
          transform: translateY(-1px);
        }

        [data-theme='light'] .nav-btn-outlined:hover {
          background: rgba(0, 0, 0, 0.05);
          border-color: rgba(0, 0, 0, 0.65);
        }

        .nav-utilities {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 6px;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
        }

        [data-theme='light'] .nav-utilities {
          border-left: 1px solid #E2E8F0;
        }

        .nav-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.18s ease;
          cursor: pointer;
        }

        .nav-icon-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
        }

        [data-theme='light'] .nav-icon-btn {
          color: #64748B;
        }

        [data-theme='light'] .nav-icon-btn:hover {
          color: #0F172A;
          background: rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 860px) {
          .suncealand-navbar {
            padding: 14px 20px;
            gap: 16px;
          }
          .navbar-left {
            gap: 16px;
          }
          .navbar-search-wrapper {
            width: 220px;
          }
          .navbar-right {
            gap: 16px;
          }
        }

        @media (max-width: 640px) {
          .suncealand-navbar {
            flex-wrap: wrap;
          }
          .navbar-search-wrapper {
            order: 3;
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
};
