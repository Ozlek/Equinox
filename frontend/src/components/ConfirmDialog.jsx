import { useState } from "react";
import { playNotification, playClick } from "../utils/sounds";

/**
 * ConfirmDialog hook — replaces window.confirm() with a themed modal.
 * 
 * Usage:
 *   const { confirm, ConfirmDialogComponent } = useConfirmDialog();
 *   const ok = await confirm("Are you sure?", { title: "Delete", confirmText: "Delete", danger: true });
 *   if (ok) { ... }
 *   // ... render <ConfirmDialogComponent /> somewhere in the JSX
 * 
 * Options:
 *   title: Modal title (default: "Confirm")
 *   confirmText: Button text (default: "Confirm")
 *   cancelText: Button text (default: "Cancel")
 *   danger: Red accent if true (default: false)
 */
export function useConfirmDialog() {
  const [state, setState] = useState(null); // { message, options, resolve }

  const confirm = (message, options = {}) => {
    return new Promise((resolve) => {
      setState({ message, options, resolve });
    });
  };

  const handleConfirm = () => {
    if (state) {
      state.resolve(true);
      setState(null);
    }
  };

  const handleCancel = () => {
    if (state) {
      state.resolve(false);
      setState(null);
    }
  };

  const ConfirmDialogComponent = () => {
    if (!state) return null;

    const { message, options } = state;
    const title = options.title || "Confirm";
    const confirmText = options.confirmText || "Confirm";
    const cancelText = options.cancelText || "Cancel";
    const isDanger = options.danger || false;
    const borderColor = isDanger ? "#dc2626" : "#6366f1";
    const btnColor = isDanger ? "#dc2626" : "#6366f1";

    return (
      <div style={styles.overlay} onClick={handleCancel}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={{ ...styles.modalHeader, borderBottomColor: borderColor }}>
            <h3 style={styles.headerTitle}>
              {isDanger ? "⚠️ " : ""}{title}
            </h3>
            <button onClick={handleCancel} style={styles.closeBtn}>✕</button>
          </div>
          <div style={styles.modalBody}>
            <p style={styles.message}>{message}</p>
            <div style={styles.actions}>
              <button
                style={{ ...styles.btn, backgroundColor: "#e2e8f0", color: "#475569" }}
                onClick={() => {
                  playClick();
                  handleCancel();
                }}
              >
                {cancelText}
              </button>
              <button
                style={{ ...styles.btn, backgroundColor: btnColor, color: "#fff" }}
                onClick={() => {
                  playClick();
                  handleConfirm();
                }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmDialogComponent };
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
    padding: "1rem",
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    borderRadius: "6px",
    overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
  },
  modalHeader: {
    backgroundColor: "#1e293b",
    padding: "0.75rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "3px solid #6366f1",
  },
  headerTitle: {
    margin: 0,
    color: "#f8fafc",
    fontSize: "1rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "1.2rem",
    cursor: "pointer",
  },
  modalBody: {
    backgroundColor: "#fefdfb",
    padding: "1.25rem",
  },
  message: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#334155",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    lineHeight: "1.5",
    marginBottom: "1.25rem",
  },
  actions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
  },
  btn: {
    padding: "0.45rem 1rem",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    transition: "all 0.15s ease",
  },
};