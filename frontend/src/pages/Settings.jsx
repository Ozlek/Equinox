import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Settings({ onNavigate }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Preference toggle states
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('pref_sound');
    return stored === null ? true : stored === 'true';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem('pref_notifications');
    return stored === null ? true : stored === 'true';
  });

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Inline feedback states
  const [savedSound, setSavedSound] = useState(false);
  const [savedNotifications, setSavedNotifications] = useState(false);

  useEffect(() => {
    api.get('/accounts/check-auth/')
      .then(res => {
        if (res.data.authenticated) {
          setUserInfo({
            username: res.data.username,
            email: res.data.email || null,
            date_joined: res.data.date_joined || null,
          });
        } else {
          setError('You are not authenticated. Please log in again.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load account information from the Equinox server.');
        setLoading(false);
      });
  }, []);

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('pref_sound', String(next));
    setSavedSound(true);
    setTimeout(() => setSavedSound(false), 1800);
  };

  const handleNotificationsToggle = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem('pref_notifications', String(next));
    setSavedNotifications(true);
    setTimeout(() => setSavedNotifications(false), 1800);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleteLoading(true);
    setDeleteError(null);

    api.delete('/accounts/delete/')
      .then(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('pref_sound');
        localStorage.removeItem('pref_notifications');
        window.location.href = '/';
      })
      .catch(err => {
        console.error('Account deletion failed:', err);
        setDeleteError('Failed to delete account. Please try again or contact support.');
        setDeleteLoading(false);
      });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={styles.message}>
        <div className="spinner-border text-info mb-3" role="status" style={{ width: '2rem', height: '2rem' }}></div>
        <div>Loading account settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* ── Header ── */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>⚙️</span>
            <h2 style={styles.title}>Settings</h2>
          </div>
          <button
            style={styles.closeBtn}
            title="Return to Dashboard"
            onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/')}
          >
            ✕
          </button>
        </div>

        {/* ── Profile Information ── */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <i className="bi bi-person-circle" style={styles.sectionIcon}></i>
            Profile Information
          </h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Username</span>
              <span style={styles.infoValue}>{userInfo?.username || '—'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Email</span>
              <span style={styles.infoValue}>{userInfo?.email || <span style={{ color: '#718096', fontStyle: 'italic' }}>Not provided</span>}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Member Since</span>
              <span style={styles.infoValue}>{formatDate(userInfo?.date_joined)}</span>
            </div>
          </div>
        </section>

        <div style={styles.divider} />

        {/* ── Account Settings ── */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <i className="bi bi-shield-lock" style={styles.sectionIcon}></i>
            Account Settings
          </h3>
          <div style={styles.actionList}>
            <div style={styles.actionRow}>
              <div>
                <div style={styles.actionRowTitle}>Change Password</div>
                <div style={styles.actionRowDesc}>Reset your password via a secure email link.</div>
              </div>
              <button
                style={styles.actionBtn}
                onClick={() => onNavigate ? onNavigate('forgot-password') : (window.location.href = '/')}
              >
                Reset Password
              </button>
            </div>
            <div style={styles.actionRow}>
              <div>
                <div style={styles.actionRowTitle}>Email Preferences</div>
                <div style={styles.actionRowDesc}>Manage how Equinox communicates with you via email.</div>
              </div>
              <span style={styles.comingSoonBadge}>Coming Soon</span>
            </div>
            <div style={styles.actionRow}>
              <div>
                <div style={styles.actionRowTitle}>Account Created</div>
                <div style={styles.actionRowDesc}>Your Equinox account was created on this date.</div>
              </div>
              <span style={styles.dateBadge}>{formatDate(userInfo?.date_joined)}</span>
            </div>
          </div>
        </section>

        <div style={styles.divider} />

        {/* ── Preferences ── */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <i className="bi bi-sliders" style={styles.sectionIcon}></i>
            Preferences
          </h3>
          <div style={styles.actionList}>

            {/* Sound Effects */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.actionRowTitle}>Sound Effects</div>
                <div style={styles.actionRowDesc}>Play audio feedback during quiz interactions.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {savedSound && <span style={styles.savedBadge}>Saved ✓</span>}
                <button
                  style={{ ...styles.toggle, ...(soundEnabled ? styles.toggleOn : styles.toggleOff) }}
                  onClick={handleSoundToggle}
                  aria-label="Toggle sound effects"
                >
                  <span style={{ ...styles.toggleKnob, transform: soundEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.actionRowTitle}>Notifications</div>
                <div style={styles.actionRowDesc}>Receive in-app alerts for achievements and milestones.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {savedNotifications && <span style={styles.savedBadge}>Saved ✓</span>}
                <button
                  style={{ ...styles.toggle, ...(notificationsEnabled ? styles.toggleOn : styles.toggleOff) }}
                  onClick={handleNotificationsToggle}
                  aria-label="Toggle notifications"
                >
                  <span style={{ ...styles.toggleKnob, transform: notificationsEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                </button>
              </div>
            </div>

            {/* Dark Mode — always on */}
            <div style={styles.toggleRow}>
              <div>
                <div style={styles.actionRowTitle}>Dark Mode</div>
                <div style={styles.actionRowDesc}>Equinox runs exclusively in dark mode for optimal readability.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={styles.alwaysOnBadge}>Always On</span>
                <button
                  style={{ ...styles.toggle, ...styles.toggleOn, opacity: 0.6, cursor: 'not-allowed' }}
                  disabled
                  aria-label="Dark mode always enabled"
                >
                  <span style={{ ...styles.toggleKnob, transform: 'translateX(22px)' }} />
                </button>
              </div>
            </div>

          </div>
        </section>

        <div style={styles.divider} />

        {/* ── Danger Zone ── */}
        <section style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, color: '#fc8181' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ ...styles.sectionIcon, color: '#fc8181' }}></i>
            Danger Zone
          </h3>
          <div style={styles.dangerCard}>
            <div>
              <div style={styles.dangerTitle}>Delete Account</div>
              <div style={styles.dangerDesc}>
                Permanently remove your account and all associated data — quiz history, achievements, and scores. This action cannot be undone.
              </div>
            </div>
            <button
              style={styles.deleteBtn}
              onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(null); }}
            >
              Delete Account
            </button>
          </div>
        </section>

      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div style={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>⚠️ Confirm Account Deletion</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>

            <p style={styles.modalBody}>
              This will permanently delete your Equinox account, including all quiz history, achievements, scores, and preferences. <strong style={{ color: '#fc8181' }}>This cannot be undone.</strong>
            </p>

            <p style={styles.modalPrompt}>
              Type <strong style={{ color: '#fc8181', letterSpacing: '0.05em' }}>DELETE</strong> to confirm:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              style={styles.modalInput}
              autoFocus
            />

            {deleteError && (
              <div style={styles.modalError}>⚠️ {deleteError}</div>
            )}

            <div style={styles.modalActions}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.modalDeleteBtn,
                  opacity: deleteConfirmText !== 'DELETE' || deleteLoading ? 0.45 : 1,
                  cursor: deleteConfirmText !== 'DELETE' || deleteLoading ? 'not-allowed' : 'pointer',
                }}
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '1rem',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1a202c',
    border: '1px solid #2d3748',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '760px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    color: '#f7fafc',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '1px solid #2d3748',
    paddingBottom: '1.25rem',
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#f7fafc',
  },
  closeBtn: {
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
    color: '#fc8181',
    border: '1px solid rgba(245, 101, 101, 0.2)',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  section: {
    marginBottom: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#63b3ed',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    fontSize: '1rem',
    color: '#63b3ed',
  },
  divider: {
    borderTop: '1px solid #2d3748',
    margin: '1.75rem 0',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    backgroundColor: '#111827',
    borderRadius: '12px',
    border: '1px solid #2d3748',
    overflow: 'hidden',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.9rem 1.25rem',
    borderBottom: '1px solid #1f2937',
  },
  infoLabel: {
    color: '#a0aec0',
    fontSize: '0.9rem',
    fontWeight: '500',
  },
  infoValue: {
    color: '#f7fafc',
    fontSize: '0.95rem',
    fontWeight: '600',
    textAlign: 'right',
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    backgroundColor: '#111827',
    borderRadius: '12px',
    border: '1px solid #2d3748',
    overflow: 'hidden',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #1f2937',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #1f2937',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  actionRowTitle: {
    color: '#e2e8f0',
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '2px',
  },
  actionRowDesc: {
    color: '#718096',
    fontSize: '0.82rem',
    lineHeight: '1.4',
  },
  actionBtn: {
    backgroundColor: 'rgba(99, 179, 237, 0.12)',
    color: '#63b3ed',
    border: '1px solid rgba(99, 179, 237, 0.3)',
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(74, 85, 104, 0.4)',
    color: '#718096',
    border: '1px solid #4a5568',
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  dateBadge: {
    color: '#a0aec0',
    fontSize: '0.85rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  savedBadge: {
    color: '#68d391',
    fontSize: '0.78rem',
    fontWeight: '600',
    animation: 'fadeIn 0.2s ease',
  },
  alwaysOnBadge: {
    backgroundColor: 'rgba(13, 202, 240, 0.1)',
    color: '#0dcaf0',
    border: '1px solid rgba(13, 202, 240, 0.25)',
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  toggle: {
    position: 'relative',
    width: '46px',
    height: '26px',
    borderRadius: '13px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
    padding: 0,
  },
  toggleOn: {
    backgroundColor: '#0dcaf0',
  },
  toggleOff: {
    backgroundColor: '#4a5568',
  },
  toggleKnob: {
    position: 'absolute',
    top: '3px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'transform 0.2s ease',
    display: 'block',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  dangerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 101, 101, 0.06)',
    border: '1px solid rgba(245, 101, 101, 0.25)',
    borderRadius: '12px',
    padding: '1.25rem',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  dangerTitle: {
    color: '#fc8181',
    fontSize: '0.95rem',
    fontWeight: '700',
    marginBottom: '4px',
  },
  dangerDesc: {
    color: '#a0aec0',
    fontSize: '0.82rem',
    lineHeight: '1.5',
    maxWidth: '480px',
  },
  deleteBtn: {
    backgroundColor: 'rgba(245, 101, 101, 0.15)',
    color: '#fc8181',
    border: '1px solid rgba(245, 101, 101, 0.4)',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#1a202c',
    border: '1px solid #2d3748',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    color: '#f7fafc',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.15rem',
    fontWeight: 'bold',
    color: '#fc8181',
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#a0aec0',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '4px',
  },
  modalBody: {
    color: '#a0aec0',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    marginBottom: '1.25rem',
  },
  modalPrompt: {
    color: '#e2e8f0',
    fontSize: '0.9rem',
    marginBottom: '0.6rem',
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#111827',
    border: '1px solid #4a5568',
    borderRadius: '8px',
    color: '#f7fafc',
    padding: '0.65rem 0.9rem',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    letterSpacing: '0.05em',
  },
  modalError: {
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
    color: '#fc8181',
    border: '1px solid rgba(245, 101, 101, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    backgroundColor: '#2d3748',
    color: '#a0aec0',
    border: '1px solid #4a5568',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  modalDeleteBtn: {
    backgroundColor: 'rgba(245, 101, 101, 0.2)',
    color: '#fc8181',
    border: '1px solid rgba(245, 101, 101, 0.5)',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '700',
    transition: 'all 0.15s ease',
  },
  message: {
    textAlign: 'center',
    color: '#a0aec0',
    padding: '4rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  errorBox: {
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
    color: '#fc8181',
    border: '1px solid rgba(245, 101, 101, 0.2)',
    padding: '1.25rem',
    borderRadius: '12px',
    textAlign: 'center',
    margin: '2rem auto',
    maxWidth: '500px',
  },
};
