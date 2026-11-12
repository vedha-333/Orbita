import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <div className="confirm-icon-badge">
            <AlertTriangle size={20} className="warning-icon" />
          </div>
          <button className="btn-close" onClick={onCancel} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="confirm-body">
          <h3 className="confirm-title">{title}</h3>
          <p className="confirm-message">{message}</p>
        </div>

        <div className="confirm-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        .confirm-modal {
          max-width: 440px;
          padding: 20px;
        }

        .confirm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .confirm-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: rgba(239, 68, 68, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .warning-icon {
          color: var(--danger);
        }

        .confirm-body {
          margin-top: 14px;
        }

        .confirm-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .confirm-message {
          font-size: 0.86rem;
          color: var(--text-muted);
          margin-top: 6px;
          line-height: 1.45;
        }

        .confirm-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};
