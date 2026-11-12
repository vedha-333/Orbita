import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Workspace } from '../types/workspace';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    category?: string;
    isPinned?: boolean;
  }) => Promise<void>;
  editingWorkspace?: Workspace | null;
}

const PRESET_COLORS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Cyan', hex: '#06B6D4' },
];

export const PRESET_EMOJIS = [
  // Tech & Code
  '💻', '🐙', '🧠', '⚡', '🚀', '🛠️', '🤖', '🌐',
  // Entertainment & Media
  '🍿', '🎬', '📺', '🎧', '🎵', '🎮', '🕹️', '🎨',
  // Study & Learning
  '📚', '🎓', '📝', '🔬', '💡', '🧪', '📐', '📖',
  // Work & Productivity
  '💼', '📊', '📈', '📋', '🎯', '📌', '⏱️', '🗂️',
  // Lifestyle & Personal
  '☕', '✈️', '🛒', '💰', '🍕', '⚽', '🏖️', '✨',
];

const PRESET_CATEGORIES = [
  'Learning',
  'Development',
  'Research',
  'Entertainment',
  'Academia',
  'Work',
  'Personal',
];

export const suggestWorkspaceMeta = (
  nameInput: string,
  categoryInput?: string
): { description: string; icon?: string; category?: string; color?: string } => {
  const lower = nameInput.toLowerCase().trim();
  if (!lower) {
    return { description: '' };
  }

  if (
    lower.includes('movie') ||
    lower.includes('film') ||
    lower.includes('cinema') ||
    lower.includes('netflix') ||
    lower.includes('stream') ||
    lower.includes('anime') ||
    lower.includes('show')
  ) {
    return {
      description: 'Streaming portals, movie watchlists, film reviews, and cinema sessions',
      icon: '🍿',
      category: 'Entertainment',
      color: '#EC4899',
    };
  }

  if (
    lower.includes('dsa') ||
    lower.includes('leetcode') ||
    lower.includes('algo') ||
    lower.includes('code') ||
    lower.includes('python') ||
    lower.includes('react') ||
    lower.includes('rust')
  ) {
    return {
      description: 'Algorithms, LeetCode problemsets, roadmap checklists, and syntax docs',
      icon: '💻',
      category: 'Learning',
      color: '#3B82F6',
    };
  }

  if (
    lower.includes('ai') ||
    lower.includes('ml') ||
    lower.includes('gpt') ||
    lower.includes('model') ||
    lower.includes('research') ||
    lower.includes('paper')
  ) {
    return {
      description: 'Models, research papers, PyTorch docs, and transformer benchmarks',
      icon: '🧠',
      category: 'Research',
      color: '#8B5CF6',
    };
  }

  if (
    lower.includes('college') ||
    lower.includes('assign') ||
    lower.includes('study') ||
    lower.includes('school') ||
    lower.includes('exam') ||
    lower.includes('course')
  ) {
    return {
      description: 'Course portal, lecture slides, assignment submissions, and reference materials',
      icon: '🎓',
      category: 'Academia',
      color: '#10B981',
    };
  }

  if (
    lower.includes('open source') ||
    lower.includes('github') ||
    lower.includes('pr') ||
    lower.includes('repo')
  ) {
    return {
      description: 'Active pull requests, issue trackers, and open source contribution repos',
      icon: '🐙',
      category: 'Development',
      color: '#3B82F6',
    };
  }

  if (
    lower.includes('music') ||
    lower.includes('audio') ||
    lower.includes('song') ||
    lower.includes('spotify')
  ) {
    return {
      description: 'Playlists, albums, audio production resources, and track references',
      icon: '🎵',
      category: 'Entertainment',
      color: '#EC4899',
    };
  }

  if (
    lower.includes('game') ||
    lower.includes('gaming') ||
    lower.includes('steam') ||
    lower.includes('play')
  ) {
    return {
      description: 'Game guides, live streams, community patches, and gaming wikis',
      icon: '🎮',
      category: 'Entertainment',
      color: '#F97316',
    };
  }

  if (
    lower.includes('work') ||
    lower.includes('job') ||
    lower.includes('office') ||
    lower.includes('client') ||
    lower.includes('sprint')
  ) {
    return {
      description: 'Daily sprint tasks, client deliverables, meeting agendas, and team docs',
      icon: '💼',
      category: 'Work',
      color: '#06B6D4',
    };
  }

  if (
    lower.includes('shop') ||
    lower.includes('buy') ||
    lower.includes('cart') ||
    lower.includes('wishlist')
  ) {
    return {
      description: 'Wishlists, price comparisons, product reviews, and shopping orders',
      icon: '🛒',
      category: 'Personal',
      color: '#EAB308',
    };
  }

  if (
    lower.includes('travel') ||
    lower.includes('trip') ||
    lower.includes('flight') ||
    lower.includes('hotel')
  ) {
    return {
      description: 'Flight itineraries, hotel bookings, route maps, and travel recommendations',
      icon: '✈️',
      category: 'Personal',
      color: '#06B6D4',
    };
  }

  // Category fallback
  if (categoryInput === 'Entertainment') {
    return { description: 'Watchlists, streaming links, media releases, and entertainment context' };
  }
  if (categoryInput === 'Development') {
    return { description: 'Code repositories, development tools, issue trackers, and API docs' };
  }
  if (categoryInput === 'Learning') {
    return { description: 'Study notes, tutorials, interactive sandboxes, and learning resources' };
  }
  if (categoryInput === 'Research') {
    return { description: 'Articles, whitepapers, data documentation, and academic sources' };
  }

  return {
    description: `Dedicated workspace for ${nameInput} tabs, shortcuts, and resources`,
  };
};

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingWorkspace,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hasCustomDesc, setHasCustomDesc] = useState(false);
  const [icon, setIcon] = useState('💻');
  const [color, setColor] = useState('#3B82F6');
  const [category, setCategory] = useState('Learning');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingWorkspace) {
      setName(editingWorkspace.name);
      setDescription(editingWorkspace.description || '');
      setHasCustomDesc(!!editingWorkspace.description);
      setIcon(editingWorkspace.icon || '💻');
      setColor(editingWorkspace.color || '#3B82F6');
      setCategory(editingWorkspace.category || 'General');
      setIsPinned(!!editingWorkspace.isPinned);
    } else {
      setName('');
      setDescription('');
      setHasCustomDesc(false);
      setIcon('💻');
      setColor('#3B82F6');
      setCategory('Learning');
      setIsPinned(false);
    }
  }, [editingWorkspace, isOpen]);

  if (!isOpen) return null;

  // Handle workspace name input and auto-generate description if not customized
  const handleNameChange = (val: string) => {
    setName(val);
    if (!hasCustomDesc) {
      const meta = suggestWorkspaceMeta(val, category);
      if (meta.description) {
        setDescription(meta.description);
      }
      if (!editingWorkspace && meta.icon && icon === '💻') {
        setIcon(meta.icon);
      }
      if (!editingWorkspace && meta.color && color === '#3B82F6') {
        setColor(meta.color);
      }
      if (!editingWorkspace && meta.category && category === 'Learning') {
        setCategory(meta.category);
      }
    }
  };

  const handleManualAutoGenerate = () => {
    if (!name.trim()) return;
    const meta = suggestWorkspaceMeta(name.trim(), category);
    setDescription(meta.description);
    if (meta.icon) setIcon(meta.icon);
    if (meta.color) setColor(meta.color);
    if (meta.category) setCategory(meta.category);
    setHasCustomDesc(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // If description is empty, auto-generate a smart description so cards never look empty
    const finalDesc = description.trim() || suggestWorkspaceMeta(name.trim(), category).description;

    setIsSubmitting(true);
    try {
      await onSave({
        id: editingWorkspace?.id,
        name: name.trim(),
        description: finalDesc,
        icon,
        color,
        category: category.trim() || 'General',
        isPinned,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save workspace:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-ws-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-title-box">
            <div
              className="preview-avatar"
              style={{
                borderColor: `${color}60`,
                background: `${color}18`,
                boxShadow: `0 4px 14px ${color}24`,
              }}
            >
              <span>{icon}</span>
            </div>
            <div>
              <h2 className="modal-title">
                {editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}
              </h2>
              <p className="modal-subtitle">
                Organize related tabs, websites, and context under a dedicated task workspace.
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="ws-form">
          <div className="form-body-scroll">
            {/* Workspace Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="workspace-name-input">
                Workspace Name *
              </label>
              <input
                id="workspace-name-input"
                type="text"
                className="form-input ws-name-input"
                placeholder="e.g. Movies, DSA Practice, Open Source, System Design..."
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Description with Auto-Generation UX */}
            <div className="form-group">
              <div className="label-with-action">
                <label className="form-label">Description (Auto-Generated)</label>
                {name.trim().length > 0 && (
                  <button
                    type="button"
                    className="btn-auto-desc"
                    onClick={handleManualAutoGenerate}
                    title="Generate a smart description based on the name"
                  >
                    <Sparkles size={12} />
                    <span>Auto-Generate</span>
                  </button>
                )}
              </div>
              <textarea
                className="form-textarea desc-textarea"
                rows={2}
                placeholder="What is this workspace for? Auto-filled when you type name..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setHasCustomDesc(true);
                }}
              />
            </div>

            {/* Icon / Emoji Picker (Expanded) */}
            <div className="form-group">
              <label className="form-label">
                Workspace Icon / Emoji <span className="label-count">({PRESET_EMOJIS.length} options)</span>
              </label>
              <div className="emoji-grid">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-btn ${icon === emoji ? 'selected' : ''}`}
                    onClick={() => setIcon(emoji)}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Accent Picker */}
            <div className="form-group">
              <label className="form-label">Tab Group Accent Color</label>
              <div className="color-grid">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`color-pill ${color === c.hex ? 'selected' : ''}`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setColor(c.hex)}
                    title={c.name}
                  >
                    {color === c.hex && <Check size={14} color="#FFFFFF" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="category-chips">
                {PRESET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`chip-btn ${category === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="form-input custom-cat-input"
                placeholder="Or type custom category..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            {/* Pin to Top */}
            <div className="checkbox-row">
              <input
                id="pin-ws-check"
                type="checkbox"
                className="custom-checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              <label htmlFor="pin-ws-check" className="checkbox-label">
                Pin this workspace to the top of your dashboard
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              id="btn-save-workspace"
              type="submit"
              className="btn btn-primary modal-save-btn"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingWorkspace ? 'Save Changes' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .create-ws-modal {
          max-width: 580px;
          height: 88vh;
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

        .header-title-box {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .preview-avatar {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.7rem;
          border: 1.5px solid;
          flex-shrink: 0;
          transition: transform 0.2s ease;
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

        .ws-form {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }

        .form-body-scroll {
          padding: 22px 26px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: var(--bg-secondary);
        }

        .label-with-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .label-count {
          font-size: 0.76rem;
          color: var(--text-muted);
          font-weight: normal;
        }

        .btn-auto-desc {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 6px;
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
          color: var(--accent-primary);
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-auto-desc:hover {
          background: var(--accent-primary);
          color: #FFFFFF;
        }

        .ws-name-input {
          height: 42px;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .desc-textarea {
          resize: none;
          line-height: 1.45;
          font-size: 0.88rem;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px;
          background: var(--bg-card);
          padding: 10px;
          border-radius: 14px;
          border: 1px solid var(--border-subtle);
        }

        .emoji-btn {
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.35rem;
          border-radius: 10px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .emoji-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-hover);
          transform: scale(1.12);
        }

        .emoji-btn.selected {
          border-color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 0 2px var(--accent-primary);
        }

        .color-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          padding: 4px 0;
        }

        .color-pill {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid transparent;
          transition: transform 0.18s ease;
        }

        .color-pill:hover {
          transform: scale(1.15);
        }

        .color-pill.selected {
          border-color: var(--text-primary);
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        }
        [data-theme='dark'] .color-pill.selected {
          border-color: #FFFFFF;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .category-chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .chip-btn {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 9999px;
          background: var(--bg-input);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: var(--transition);
        }
        .chip-btn:hover {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .chip-btn.active {
          background: var(--accent-primary);
          color: #FFFFFF;
          border-color: var(--accent-primary);
          box-shadow: 0 2px 8px var(--accent-glow);
        }

        .custom-cat-input {
          font-size: 0.85rem;
          padding: 8px 14px;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--accent-primary);
          cursor: pointer;
          border-radius: 4px;
        }

        .checkbox-label {
          font-size: 0.86rem;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 16px 26px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-card);
          gap: 12px;
        }

        .modal-cancel-btn {
          height: 40px;
          padding: 0 20px;
          border-radius: 12px;
        }

        .modal-save-btn {
          height: 40px;
          padding: 0 22px;
          border-radius: 12px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};
