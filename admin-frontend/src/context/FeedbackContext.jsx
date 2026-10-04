import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

let globalFeedback = {
  toast: null,
  confirm: null,
  alert: null,
};

export const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [alertState, setAlertState] = useState(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 280);
  }, []);

  const addToast = useCallback((type, message, customTitle, duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 6);
    const defaultTitles = {
      success: 'Success!',
      error: 'Error!',
      info: 'Info!',
      warning: 'Warning!',
    };
    const title = customTitle || defaultTitles[type] || 'Thông báo';

    const newToast = {
      id,
      type,
      title,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      duration,
      isExiting: false,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const toast = useRef({
    success: (msg, title, duration) => addToast('success', msg, title, duration),
    error: (msg, title, duration) => addToast('error', msg, title, duration),
    info: (msg, title, duration) => addToast('info', msg, title, duration),
    warning: (msg, title, duration) => addToast('warning', msg, title, duration),
    dismiss: (id) => removeToast(id),
  }).current;

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      let opts = {};
      if (typeof options === 'string') {
        opts = { message: options };
      } else {
        opts = options || {};
      }

      setConfirmState({
        isOpen: true,
        title: opts.title || 'Xác nhận thao tác',
        message: opts.message || 'Bạn có chắc chắn muốn thực hiện thao tác này?',
        type: opts.type || 'warning',
        confirmText: opts.confirmText || 'Xác nhận',
        cancelText: opts.cancelText || 'Huỷ',
        resolve: (val) => {
          setConfirmState(null);
          resolve(val);
        },
      });
    });
  }, []);

  const showAlert = useCallback((options) => {
    return new Promise((resolve) => {
      let opts = {};
      if (typeof options === 'string') {
        opts = { message: options };
      } else {
        opts = options || {};
      }

      setAlertState({
        isOpen: true,
        title: opts.title || 'Thông báo',
        message: opts.message || '',
        type: opts.type || 'info',
        confirmText: opts.confirmText || 'Đã hiểu',
        resolve: () => {
          setAlertState(null);
          resolve();
        },
      });
    });
  }, []);

  useEffect(() => {
    globalFeedback.toast = toast;
    globalFeedback.confirm = confirm;
    globalFeedback.alert = showAlert;

    window.$toast = toast;
    window.$confirm = confirm;
    window.$alert = showAlert;

    const originalAlert = window.alert;
    window.alert = (msg) => {
      const str = String(msg || '');
      if (str.includes('\n') || str.length > 80) {
        showAlert({ title: 'Thông báo', message: str, type: 'info' });
      } else {
        toast.info(str, 'Thông báo');
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [toast, confirm, showAlert]);

  return (
    <FeedbackContext.Provider value={{ toast, confirm, showAlert }}>
      {children}

      {confirmState && (
        <ConfirmModalDialog
          state={confirmState}
          onClose={() => confirmState.resolve(false)}
          onConfirm={() => confirmState.resolve(true)}
        />
      )}

      {alertState && (
        <AlertModalDialog
          state={alertState}
          onClose={() => alertState.resolve()}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(110%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(115%); opacity: 0; }
        }
        @keyframes modalBackdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPopIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .toast-animate-in {
          animation: toastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .toast-animate-out {
          animation: toastSlideOut 0.28s cubic-bezier(0.7, 0, 0.84, 0) forwards;
        }
        .modal-backdrop-animate {
          animation: modalBackdropFadeIn 0.2s ease-out forwards;
        }
        .modal-card-animate {
          animation: modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    return {
      toast,
      confirm: confirmDialog,
      showAlert: alertDialog,
    };
  }
  return ctx;
}

export function useToast() {
  const { toast } = useFeedback();
  return toast;
}

export function useConfirm() {
  const { confirm } = useFeedback();
  return confirm;
}

export const toast = {
  success: (msg, title, duration) => globalFeedback.toast?.success(msg, title, duration),
  error: (msg, title, duration) => globalFeedback.toast?.error(msg, title, duration),
  info: (msg, title, duration) => globalFeedback.toast?.info(msg, title, duration),
  warning: (msg, title, duration) => globalFeedback.toast?.warning(msg, title, duration),
  dismiss: (id) => globalFeedback.toast?.dismiss(id),
};

export const confirmDialog = (options) => {
  if (globalFeedback.confirm) {
    return globalFeedback.confirm(options);
  }
  const msg = typeof options === 'string' ? options : options?.message || '';
  return Promise.resolve(window.confirm(msg));
};

export const alertDialog = (options) => {
  if (globalFeedback.alert) {
    return globalFeedback.alert(options);
  }
  const msg = typeof options === 'string' ? options : options?.message || '';
  window.alert(msg);
  return Promise.resolve();
};

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const timerRef = useRef(null);
  const remainingRef = useRef(toast.duration);
  const startTimeRef = useRef(Date.now());

  const startTimer = useCallback(() => {
    if (toast.duration <= 0) return;
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, remainingRef.current);
  }, [toast.duration, onDismiss]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const elapsed = Date.now() - startTimeRef.current;
      remainingRef.current = Math.max(500, remainingRef.current - elapsed);
    }
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const stylesConfig = {
    success: {
      backgroundColor: '#22c55e',
      icon: (
        <svg
          viewBox="0 0 24 24"
          style={{ width: '32px', height: '32px', flexShrink: 0 }}
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ),
    },
    error: {
      backgroundColor: '#ef4444',
      icon: (
        <svg
          viewBox="0 0 24 24"
          style={{ width: '32px', height: '32px', flexShrink: 0 }}
          fill="#ffffff"
        >
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
        </svg>
      ),
    },
    info: {
      backgroundColor: '#288ce4',
      icon: (
        <svg
          viewBox="0 0 24 24"
          style={{ width: '32px', height: '32px', flexShrink: 0 }}
          fill="#ffffff"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l4.93-1.38C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
        </svg>
      ),
    },
    warning: {
      backgroundColor: '#f59e0b',
      icon: (
        <svg
          viewBox="0 0 24 24"
          style={{ width: '32px', height: '32px', flexShrink: 0 }}
          fill="#ffffff"
        >
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
        </svg>
      ),
    },
  };

  const currentStyle = stylesConfig[toast.type] || stylesConfig.info;

  return (
    <div
      className={toast.isExiting ? 'toast-animate-out' : 'toast-animate-in'}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      onClick={onDismiss}
      style={{
        pointerEvents: 'auto',
        backgroundColor: currentStyle.backgroundColor,
        borderRadius: '10px',
        padding: '16px 20px',
        color: '#ffffff',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative',
        transition: 'transform 0.15s ease, filter 0.15s ease',
      }}
      title="Bấm để đóng"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {currentStyle.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
        <div
          style={{
            fontSize: '18px',
            fontWeight: '700',
            lineHeight: '1.25',
            color: '#ffffff',
            letterSpacing: '0.2px',
          }}
        >
          {toast.title}
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '400',
            color: 'rgba(255, 255, 255, 0.95)',
            marginTop: '3px',
            lineHeight: '1.35',
            wordBreak: 'break-word',
          }}
        >
          {toast.message}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '18px',
          lineHeight: '1',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </button>
    </div>
  );
}

function ConfirmModalDialog({ state, onClose, onConfirm }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const typeConfig = {
    warning: { badgeBg: '#fef3c7', badgeColor: '#d97706', iconClass: 'bi bi-exclamation-triangle-fill', btnBg: '#f59e0b' },
    danger: { badgeBg: '#fee2e2', badgeColor: '#dc2626', iconClass: 'bi bi-trash3-fill', btnBg: '#dc2626' },
    success: { badgeBg: '#dcfce7', badgeColor: '#16a34a', iconClass: 'bi bi-check-circle-fill', btnBg: '#16a34a' },
    info: { badgeBg: '#e0f2fe', badgeColor: '#0284c7', iconClass: 'bi bi-info-circle-fill', btnBg: '#0284c7' },
  };
  const cfg = typeConfig[state.type] || typeConfig.warning;

  return (
    <div
      className="modal-backdrop-animate"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999990,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        className="modal-card-animate"
        style={{
          width: '100%', maxWidth: '440px', backgroundColor: '#ffffff',
          borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9',
            border: 'none', borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b', fontSize: '16px',
          }}
        >
          ✕
        </button>

        <div style={{ padding: '28px 24px 20px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: cfg.badgeBg, color: cfg.badgeColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', margin: '0 auto 18px auto',
              boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.08)',
            }}
          >
            <i className={cfg.iconClass}></i>
          </div>

          <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px 0' }}>
            {state.title}
          </h4>

          <p style={{ fontSize: '15px', color: '#475569', margin: 0, lineHeight: '1.55', whiteSpace: 'pre-line' }}>
            {state.message}
          </p>
        </div>

        <div style={{ padding: '16px 24px 24px 24px', display: 'flex', gap: '12px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 18px', fontSize: '15px', fontWeight: '600',
              color: '#475569', backgroundColor: '#ffffff', border: '1px solid #cbd5e1',
              borderRadius: '12px', cursor: 'pointer',
            }}
          >
            {state.cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1.2, padding: '11px 18px', fontSize: '15px', fontWeight: '600',
              color: '#ffffff', backgroundColor: cfg.btnBg, border: 'none',
              borderRadius: '12px', cursor: 'pointer', boxShadow: '0 6px 16px -4px rgba(0, 0, 0, 0.2)',
            }}
          >
            {state.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function AlertModalDialog({ state, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop-animate"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999992,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        className="modal-card-animate"
        style={{
          width: '100%', maxWidth: '460px', backgroundColor: '#ffffff',
          borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9',
            border: 'none', borderRadius: '50%', width: '32px', height: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b', fontSize: '16px',
          }}
        >
          ✕
        </button>

        <div style={{ padding: '28px 24px 20px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#e0f2fe', color: '#0284c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '30px', margin: '0 auto 18px auto',
            }}
          >
            <i className="bi bi-info-circle-fill"></i>
          </div>

          <h4 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 10px 0' }}>
            {state.title}
          </h4>

          <p style={{ fontSize: '15px', color: '#475569', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-line', textAlign: 'left', padding: '0 8px' }}>
            {state.message}
          </p>
        </div>

        <div style={{ padding: '16px 24px 24px 24px', display: 'flex', justifyContent: 'center', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              minWidth: '140px', padding: '11px 24px', fontSize: '15px', fontWeight: '600',
              color: '#ffffff', backgroundColor: '#0284c7', border: 'none', borderRadius: '12px',
              cursor: 'pointer', boxShadow: '0 6px 16px -4px rgba(2, 132, 199, 0.4)',
            }}
          >
            {state.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
