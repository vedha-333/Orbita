import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`notification-toast ${toast.type}`}>
      <div className="toast-icon">
        {toast.type === 'success' && <CheckCircle2 size={18} />}
        {toast.type === 'error' && <AlertCircle size={18} />}
        {toast.type === 'info' && <Info size={18} />}
      </div>
      <div className="toast-text">{toast.message}</div>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>

      <style>{`
        .notification-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: var(--radius-lg);
          background: var(--bg-secondary);
          border: 1px solid var(--border-hover);
          box-shadow: var(--shadow-lg);
          z-index: 2000;
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          max-width: 440px;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notification-toast.success {
          border-left: 4px solid var(--success);
        }
        .notification-toast.success .toast-icon {
          color: var(--success);
        }

        .notification-toast.error {
          border-left: 4px solid var(--danger);
        }
        .notification-toast.error .toast-icon {
          color: var(--danger);
        }

        .notification-toast.info {
          border-left: 4px solid var(--accent-primary);
        }
        .notification-toast.info .toast-icon {
          color: var(--accent-primary);
        }

        .toast-text {
          font-size: 0.88rem;
          color: var(--text-primary);
          font-weight: 500;
          flex: 1;
        }

        .toast-close {
          color: var(--text-muted);
          padding: 2px;
          border-radius: 4px;
        }
        .toast-close:hover {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};
