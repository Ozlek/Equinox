import { useState, useEffect, useCallback } from "react";

/**
 * Toast notification system.
 * 
 * Usage:
 *   const { showToast, ToastContainer } = useToast();
 *   showToast("Question approved!", "success");
 *   <ToastContainer />
 * 
 * Types: 'success', 'error', 'info', 'warning'
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const colors = {
    success: { bg: "#065f46", border: "#10b981" },
    error: { bg: "#7f1d1d", border: "#ef4444" },
    info: { bg: "#1e3a5f", border: "#3b82f6" },
    warning: { bg: "#78350f", border: "#f59e0b" },
  };

  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };

  const color = colors[toast.type] || colors.info;

  return (
    <div
      style={{
        ...styles.toast,
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "translateX(100%)" : "translateX(0)",
      }}
    >
      <span style={{ fontSize: "1.1rem", marginRight: "8px" }}>
        {icons[toast.type] || icons.info}
      </span>
      <span style={styles.message}>{toast.message}</span>
      <button
        style={styles.closeBtn}
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
      >
        ✕
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxWidth: "400px",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    borderRadius: "8px",
    color: "#f8fafc",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    transition: "all 0.3s ease",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: "0.85rem",
    wordBreak: "break-word",
  },
  message: {
    flex: 1,
    fontWeight: "500",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginLeft: "8px",
    padding: "0 2px",
    flexShrink: 0,
  },
};