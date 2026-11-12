import React from 'react';
import { 
  X, 
  Layers, 
  MousePointer, 
  Sparkles, 
  Compass, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Command, 
  Search, 
  FolderPlus, 
  CheckSquare, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrySampleWorkspace?: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="guide-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
      >
        {/* Top Floating Badge Bar */}
        <div className="guide-header">
          <div className="guide-badge">
            <span className="badge-dot" />
            <span>ORBITA ARCHITECTURE • HOW IT WORKS & STORY</span>
          </div>
          <button className="guide-close-btn" onClick={onClose} aria-label="Close guide">
            <X size={20} />
          </button>
        </div>

        {/* Hero Banner with editorial headline */}
        <div className="guide-hero-editorial">
          <div className="editorial-tag">• EXPLORE INTENTIONAL BROWSING</div>
          <h2 id="guide-title" className="editorial-headline">
            Organize your web. <br />
            <em>Focus on what matters.</em>
          </h2>
          <p className="editorial-subtext">
            Modern web browsing has an open-tab problem: dozens of tabs compete for attention, slow down your machine, and vanish into browser history. <strong>Orbita</strong> reimagines tabs as <strong>purpose-driven workspaces</strong> — cleanly isolated, instantly searchable, and launched with one click.
          </p>
        </div>

        {/* 4-Step Interactive Story Grid */}
        <div className="guide-steps-grid">
          {/* Step 1 */}
          <div className="guide-card">
            <div className="step-num-pill">01 • ORGANIZE</div>
            <div className="step-graphic step-graphic-bars">
              <div className="bar bar-1" />
              <div className="bar bar-2" />
              <div className="bar bar-3" />
              <div className="bar bar-4" />
            </div>
            <h3 className="step-title">Create Purposeful Workspaces</h3>
            <p className="step-desc">
              Group related projects, research topics, course work, or entertainment into distinct cards with custom emoji badges, colors, and category tags. Press <kbd>Alt + N</kbd> anytime to create a workspace on the fly.
            </p>
          </div>

          {/* Step 2 */}
          <div className="guide-card">
            <div className="step-num-pill light">02 • CAPTURE</div>
            <div className="step-avatar-bubble">
              <div className="avatar-chip">
                <span>📌</span>
                <div>
                  <strong>Drag active tab</strong>
                  <small>Drop onto any workspace card</small>
                </div>
              </div>
            </div>
            <h3 className="step-title">Effortless Tab Assignment</h3>
            <p className="step-desc">
              Never copy-paste URLs. Grab any active tab from the top tray and drop it directly onto a workspace card, or click <strong>Assign Tabs</strong> to batch-save multiple open pages without losing your place.
            </p>
          </div>

          {/* Step 3 */}
          <div className="guide-card">
            <div className="step-num-pill gradient">03 • LAUNCH</div>
            <div className="step-soundwave">
              <span className="wave wave-blue">Clean New Window</span>
              <span className="wave wave-green">Independent Context</span>
            </div>
            <h3 className="step-title">1-Click Launch & Isolation</h3>
            <p className="step-desc">
              Click <strong>Open Workspace</strong> to restore all pages in a dedicated new window or your current window. Uncheck specific pages inside <strong>Manage Pages</strong> to selectively open only what you need today.
            </p>
          </div>

          {/* Step 4 */}
          <div className="guide-card">
            <div className="step-num-pill purple">04 • FIND</div>
            <div className="step-search-preview">
              <Search size={14} className="preview-search-icon" />
              <span>Search workspaces...</span>
            </div>
            <h3 className="step-title">Smart Search & Auto-Scroll</h3>
            <p className="step-desc">
              Search by title, category, or saved page content. Type terms like <em>"Movies"</em>, <em>"MOVIES"</em>, or <em>"DSA"</em> — Orbita intelligently finds the workspace and smoothly scrolls directly to the card.
            </p>
          </div>
        </div>

        {/* Shortcuts & Pro-Tips Bar */}
        <div className="guide-shortcuts-banner">
          <div className="shortcuts-title-group">
            <Command size={18} className="shortcut-icon" />
            <span className="shortcut-heading">Keyboard Shortcuts & Pro Tips</span>
          </div>
          <div className="shortcuts-items-row">
            <div className="shortcut-item">
              <kbd>Alt + D</kbd>
              <span>Open Dashboard (Window)</span>
            </div>
            <div className="shortcut-item">
              <kbd>Alt + N</kbd>
              <span>Create Workspace</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl + N</kbd>
              <span>Browser New Window (Native)</span>
            </div>
            <div className="shortcut-item">
              <kbd>Enter in Search</kbd>
              <span>Scroll to Workspaces</span>
            </div>
            <div className="shortcut-item">
              <kbd>Drag & Drop</kbd>
              <span>Add Tab to Card</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights Section */}
        <div className="guide-features-row">
          <div className="feature-pill-item">
            <CheckCircle2 size={16} className="pill-check" />
            <span>Zero RAM Waste — saved tabs remain suspended until launched</span>
          </div>
          <div className="feature-pill-item">
            <CheckCircle2 size={16} className="pill-check" />
            <span>Dual Browser Support — optimized for both Chrome & Opera windows</span>
          </div>
          <div className="feature-pill-item">
            <CheckCircle2 size={16} className="pill-check" />
            <span>Rust WebAssembly Core — ultra-fast indexing and sync</span>
          </div>
          <div className="feature-pill-item">
            <CheckCircle2 size={16} className="pill-check" />
            <span>100% Private & Local — all data stays entirely on your device</span>
          </div>
        </div>

        {/* Footer Call to Action */}
        <div className="guide-footer-action">
          <button className="btn-get-started" onClick={onClose}>
            <span>Got It — Explore Workspaces</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .guide-modal-content {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 28px;
          max-width: 920px;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 34px 38px;
          box-shadow: 0 24px 50px -8px rgba(15, 23, 42, 0.16), 0 8px 20px -4px rgba(15, 23, 42, 0.08);
          color: #0F172A;
          font-family: var(--font-sans);
          position: relative;
          animation: scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .guide-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .guide-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          background: rgba(37, 99, 235, 0.08);
          border: 1px solid rgba(37, 99, 235, 0.18);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #2563EB;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2563EB;
          box-shadow: 0 0 8px rgba(37, 99, 235, 0.6);
        }

        .guide-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        .guide-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
          transform: rotate(90deg);
        }

        .guide-hero-editorial {
          margin-bottom: 30px;
          text-align: left;
        }

        .editorial-tag {
          font-size: 0.74rem;
          color: #2563EB;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 10px;
        }

        .editorial-headline {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 2.5rem;
          line-height: 1.15;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #0F172A;
          margin-bottom: 14px;
        }

        .editorial-headline em {
          font-style: italic;
          color: #2563EB;
          font-weight: 400;
        }

        .editorial-subtext {
          font-size: 0.95rem;
          color: #334155;
          max-width: 760px;
          line-height: 1.6;
        }

        .guide-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .guide-card {
          border-radius: 20px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .guide-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
          border-color: #CBD5E1;
        }

        .step-num-pill {
          align-self: flex-start;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(37, 99, 235, 0.12);
          color: #2563EB;
          margin-bottom: 16px;
        }
        .step-num-pill.light {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }
        .step-num-pill.gradient {
          background: rgba(139, 92, 246, 0.14);
          color: #7C3AED;
        }
        .step-num-pill.purple {
          background: rgba(236, 72, 153, 0.12);
          color: #DB2777;
        }

        .step-graphic-bars {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 44px;
          margin-bottom: 16px;
        }
        .bar {
          width: 12px;
          border-radius: 4px;
          background: #38BDF8;
        }
        .bar-1 { height: 65%; }
        .bar-2 { height: 100%; background: #2563EB; }
        .bar-3 { height: 45%; }
        .bar-4 { height: 80%; background: #818CF8; }

        .step-avatar-bubble {
          height: 44px;
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        .avatar-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          padding: 5px 12px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          border: 1px solid #E2E8F0;
        }
        .avatar-chip span { font-size: 1rem; }
        .avatar-chip div { display: flex; flex-direction: column; text-align: left; }
        .avatar-chip strong { font-size: 0.74rem; color: #0F172A; }
        .avatar-chip small { font-size: 0.65rem; color: #64748B; }

        .step-soundwave {
          height: 44px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          justify-content: center;
          margin-bottom: 16px;
        }
        .wave {
          display: block;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.66rem;
          font-weight: 700;
          width: fit-content;
        }
        .wave-blue { background: #DBEAFE; color: #1E40AF; }
        .wave-green { background: #D1FAE5; color: #065F46; }

        .step-search-preview {
          height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.74rem;
          color: #64748B;
          margin-bottom: 16px;
        }
        .preview-search-icon { color: #94A3B8; }

        .step-title {
          font-size: 1.02rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .step-desc {
          font-size: 0.82rem;
          color: #475569;
          line-height: 1.5;
        }
        .step-desc kbd {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 4px;
          padding: 1px 5px;
          font-family: var(--font-mono);
          font-size: 0.74rem;
          color: #0F172A;
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
        }

        .guide-shortcuts-banner {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          padding: 16px 20px;
          margin-bottom: 20px;
        }
        .shortcuts-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .shortcut-icon { color: #2563EB; }
        .shortcut-heading {
          font-size: 0.84rem;
          font-weight: 700;
          color: #0F172A;
        }
        .shortcuts-items-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }
        .shortcut-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #334155;
        }
        .shortcut-item kbd {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          padding: 3px 8px;
          font-family: var(--font-mono);
          font-size: 0.74rem;
          font-weight: 600;
          color: #0F172A;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .guide-features-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
          padding: 16px 20px;
          background: #F8FAFC;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          margin-bottom: 24px;
        }

        .feature-pill-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #334155;
          line-height: 1.4;
        }
        .pill-check { color: #10B981; flex-shrink: 0; }

        .guide-footer-action {
          display: flex;
          justify-content: flex-end;
        }

        .btn-get-started {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 26px;
          border-radius: 14px;
          background: #2563EB;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.92rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.25);
          transition: all 0.2s;
        }
        .btn-get-started:hover {
          background: #1D4ED8;
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(37, 99, 235, 0.35);
        }

        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
