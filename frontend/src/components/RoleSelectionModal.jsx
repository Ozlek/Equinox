import React from 'react';

export default function RoleSelectionModal({ onSelect, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.title}>Join Equinox</h2>
          <p style={styles.subtitle}>How would you like to register?</p>
        </div>
        <div style={styles.modalBody}>
          <button
            style={styles.roleCard}
            onClick={() => onSelect('student')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e3340'; e.currentTarget.style.backgroundColor = '#23272f'; }}
          >
            <div style={styles.roleIcon}>👨‍🎓</div>
            <div style={styles.roleInfo}>
              <strong style={styles.roleTitle}>Student</strong>
              <p style={styles.roleDesc}>Practice math, earn stars, and track your progress.</p>
            </div>
          </button>

          <button
            style={styles.roleCard}
            onClick={() => onSelect('instructor')}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.backgroundColor = '#1e293b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2e3340'; e.currentTarget.style.backgroundColor = '#23272f'; }}
          >
            <div style={styles.roleIcon}>👨‍🏫</div>
            <div style={styles.roleInfo}>
              <strong style={styles.roleTitle}>Instructor / Contributor</strong>
              <p style={styles.roleDesc}>Create and manage questions, lessons, and learning content.</p>
            </div>
          </button>

          <button style={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#1a1d23',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    border: '1px solid #2e3340',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.5rem 1.5rem 0.5rem',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: '0 0 0.3rem',
    color: '#f1f5f9',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  subtitle: {
    color: '#64748b',
    fontSize: '0.95rem',
    margin: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalBody: {
    padding: '1rem 1.5rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  roleCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '2px solid #2e3340',
    backgroundColor: '#23272f',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    width: '100%',
    textAlign: 'left',
  },
  roleIcon: {
    fontSize: '2rem',
    flexShrink: 0,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    display: 'block',
    fontSize: '0.95rem',
    color: '#f1f5f9',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    marginBottom: '2px',
  },
  roleDesc: {
    margin: 0,
    fontSize: '0.78rem',
    color: '#94a3b8',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  cancelBtn: {
    padding: '0.6rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    width: '100%',
    textAlign: 'center',
  },
};