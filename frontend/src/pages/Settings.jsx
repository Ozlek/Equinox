import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useConfirmDialog } from '../components/ConfirmDialog';

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

  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

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

    api.delete('/accounts/delete-account/')
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

  const handleResetAchievements = async () => {
    const ok = await confirm('This will reset all your achievements. Are you sure?', {
      title: "Reset Achievements",
      confirmText: "Reset",
      danger: true,
    });
    if (!ok) return;
    
    api.post('/accounts/reset-achievements/')
      .then(res => {
        alert(`Achievements reset! ${res.data.message}`);
        localStorage.removeItem('achievements_cache');
        sessionStorage.clear();
        window.location.href = window.location.href;
      })
      .catch(err => {
        console.error('Failed to reset achievements:', err);
        alert('Failed to reset achievements. Please try again.');
      });
  };

  const handleResetPassword = () => {
    if (onNavigate) {
      onNavigate('forgot-password');
    } else {
      window.location.href = '/forgot-password';
    }
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
      <div style={styles.loadingContainer}>
        <div className="spinner-border text-info mb-3" role="status" style={{ width: '2rem', height: '2rem' }}></div>
        <div style={styles.loadingText}>Loading account settings...</div>
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
      <style>{`@keyframes diagonalSlide { 0% { background-position: 0 0, 0 0, 0 0; } 100% { background-position: -400px 400px, 0 0, 0 0; } }`}</style>
      <ConfirmDialogComponent />
      <div style={styles.reportPaper}>

        {/* ── Header with punched holes ── */}
        <div style={styles.reportHeader}>
          <div style={styles.punchedHoles}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={styles.hole} />
            ))}
          </div>
          <div style={styles.headerContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚙️</span>
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
        </div>

        {/* ── Ruled Content Area ── */}
        <div style={styles.ruledContent}>
          <div style={styles.redMargin} />
          <div style={styles.contentInner}>

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
                  <span style={styles.infoValue}>{userInfo?.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}</span>
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
                    onClick={handleResetPassword}
                  >
                    Reset Password
                  </button>
                </div>
                <div style={styles.actionRow}>
                  <div>
                    <div style={styles.actionRowTitle}>Reset Achievements</div>
                    <div style={styles.actionRowDesc}>Clear all achievement progress (for testing purposes).</div>
                  </div>
                  <button
                    style={{ ...styles.actionBtn, borderColor: '#f59e0b', color: '#d97706' }}
                    onClick={handleResetAchievements}
                  >
                    Reset Achievements
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
                    <div style={styles.actionRowDesc}>Work in Progress: Play audio feedback during quiz interactions.</div>
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
                    <div style={styles.actionRowDesc}>Work in Progress: Receive in-app alerts for achievements and milestones.</div>
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
                    <div style={styles.actionRowDesc}>Equinox plans to have a dark mode and light mode feature soon.</div>
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
              <h3 style={{ ...styles.sectionTitle, color: '#dc2626' }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ ...styles.sectionIcon, color: '#dc2626' }}></i>
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
        </div>

        {/* ── Footer ── */}
        <div style={styles.reportFooter}>
          <span>Equinox Settings • Generated {new Date().toLocaleDateString()}</span>
          <span>Page 1 of 1</span>
        </div>

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
              This will permanently delete your Equinox account, including all quiz history, achievements, scores, and preferences. <strong style={{ color: '#dc2626' }}>This cannot be undone.</strong>
            </p>

            <p style={styles.modalPrompt}>
              Type <strong style={{ color: '#dc2626', letterSpacing: '0.05em' }}>DELETE</strong> to confirm:
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
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: '#f5f3f0',
    backgroundImage: [
      `url('data:image/svg+xml;utf8,<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><text x="50" y="70" font-size="48" font-weight="bold" fill="rgba(239,68,68,0.25)" text-anchor="middle">+</text><text x="200" y="120" font-size="48" font-weight="bold" fill="rgba(251,191,36,0.25)" text-anchor="middle">−</text><text x="350" y="170" font-size="48" font-weight="bold" fill="rgba(79,70,229,0.25)" text-anchor="middle">×</text><text x="100" y="220" font-size="48" font-weight="bold" fill="rgba(34,197,94,0.3)" text-anchor="middle">÷</text><text x="300" y="280" font-size="48" font-weight="bold" fill="rgba(239,68,68,0.25)" text-anchor="middle">+</text><text x="150" y="330" font-size="48" font-weight="bold" fill="rgba(251,191,36,0.25)" text-anchor="middle">−</text></svg>')`,
      'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
      'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
    ].join(', '),
    backgroundRepeat: 'repeat',
    animation: 'diagonalSlide 12s linear infinite',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '1.5rem 1rem',
    boxSizing: 'border-box',
    position: 'relative',
  },

  // Loading state
  loadingContainer: {
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: '#f5f3f0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
  },
  loadingText: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
    color: '#64748b',
  },

  // Error box
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    padding: '1.25rem',
    borderRadius: '8px',
    textAlign: 'center',
    margin: '2rem auto',
    maxWidth: '500px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
  },

  // ── Report Paper ──
  reportPaper: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '760px',
    backgroundColor: '#fefdfb',
    borderRadius: '4px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #d6d3d1',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    color: '#1e293b',
    overflow: 'hidden',
  },

  // ── Header ──
  reportHeader: {
    position: 'relative',
    backgroundColor: '#1e293b',
    padding: '1.5rem 2rem 1rem',
    borderBottom: '3px solid #3b82f6',
  },
  punchedHoles: {
    position: 'absolute',
    left: '20px',
    top: '0',
    bottom: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: '12px 0',
    zIndex: 2,
  },
  hole: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#fefdfb',
    border: '2px solid #475569',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: '28px',
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  closeBtn: {
    backgroundColor: 'rgba(245, 101, 101, 0.15)',
    color: '#fc8181',
    border: '1px solid rgba(245, 101, 101, 0.3)',
    width: '34px',
    height: '34px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
    flexShrink: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Ruled Content ──
  ruledContent: {
    display: 'flex',
    flexDirection: 'row',
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(203,213,225,0.3) 31px, rgba(203,213,225,0.3) 32px)',
    position: 'relative',
  },
  redMargin: {
    width: '3px',
    backgroundColor: '#ef4444',
    opacity: 0.5,
    flexShrink: 0,
    marginLeft: '2rem',
    alignSelf: 'stretch',
  },
  contentInner: {
    flex: 1,
    padding: '1.5rem 2rem',
  },

  // ── Content Styles ──
  section: {
    marginBottom: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  sectionIcon: {
    fontSize: '1rem',
    color: '#3b82f6',
  },
  divider: {
    borderTop: '1px solid #e2e8f0',
    margin: '1.75rem 0',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.9rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: '0.95rem',
    fontWeight: '500',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  infoValue: {
    color: '#1e293b',
    fontSize: '1rem',
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  actionRowTitle: {
    color: '#1e293b',
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '2px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  actionRowDesc: {
    color: '#64748b',
    fontSize: '0.88rem',
    lineHeight: '1.4',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  actionBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    padding: '0.45rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  comingSoonBadge: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
    border: '1px solid #e2e8f0',
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  dateBadge: {
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  savedBadge: {
    color: '#16a34a',
    fontSize: '0.85rem',
    fontWeight: '600',
    animation: 'fadeIn 0.2s ease',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  alwaysOnBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
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
    backgroundColor: '#3b82f6',
  },
  toggleOff: {
    backgroundColor: '#cbd5e1',
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
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '8px',
    padding: '1.25rem',
    gap: '1.5rem',
    flexWrap: 'wrap',
  },
  dangerTitle: {
    color: '#dc2626',
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '4px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  dangerDesc: {
    color: '#64748b',
    fontSize: '0.88rem',
    lineHeight: '1.5',
    maxWidth: '480px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '0.55rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.15s ease',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Footer ──
  reportFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 2rem',
    borderTop: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    backgroundColor: '#f8fafc',
  },

  // ── Modal ──
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
    backgroundColor: '#fefdfb',
    border: '1px solid #d6d3d1',
    borderRadius: '8px',
    padding: '2rem',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    color: '#1e293b',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#dc2626',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalCloseBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '4px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalBody: {
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    marginBottom: '1.25rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalPrompt: {
    color: '#1e293b',
    fontSize: '0.95rem',
    marginBottom: '0.6rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#1e293b',
    padding: '0.65rem 0.9rem',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    letterSpacing: '0.05em',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalError: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    padding: '0.55rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modalDeleteBtn: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    padding: '0.55rem 1.25rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '700',
    transition: 'all 0.15s ease',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
};