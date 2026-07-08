import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Profile({ onNavigate }) {
  const [userInfo, setUserInfo] = useState(null);
  const [gradeLevel, setGradeLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/accounts/check-auth/'),
      api.get('/accounts/grade/')
    ])
      .then(([authRes, gradeRes]) => {
        if (authRes.data.authenticated) {
          setUserInfo({
            username: authRes.data.username,
            email: authRes.data.email || null,
            date_joined: authRes.data.date_joined || null,
            user_type: authRes.data.user_type || 'student',
            is_staff: authRes.data.is_staff || false,
            is_superuser: authRes.data.is_superuser || false,
          });
          setGradeLevel(gradeRes.data.grade_level || null);
        } else {
          setError('You are not authenticated. Please log in again.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load profile information from the Equinox server.');
        setLoading(false);
      });
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUserTypeLabel = () => {
    if (!userInfo) return '';
    if (userInfo.is_superuser) return 'Administrator';
    if (userInfo.is_staff) return 'Instructor';
    if (userInfo.user_type === 'instructor') return 'Instructor';
    return 'Student';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner-border text-info mb-3" role="status" style={{ width: '2rem', height: '2rem' }}></div>
        <div style={styles.loadingText}>Loading profile...</div>
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
              <span style={{ fontSize: '1.5rem' }}>👤</span>
              <h2 style={styles.title}>User Profile</h2>
            </div>
            <button
              style={styles.closeBtn}
              title="Return to Dashboard"
              onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/')}
            >
              ✕
            </button>
          </div>
          <p style={styles.reportSubtitle}>Account Information & Details</p>
        </div>

        {/* ── Ruled Content Area ── */}
        <div style={styles.ruledContent}>
          <div style={styles.redMargin} />
          <div style={styles.contentInner}>

            {/* ── Profile Avatar & Basic Info ── */}
            <section style={styles.section}>
              <div style={styles.avatarSection}>
                <div style={styles.avatar}>
                  {userInfo?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div style={styles.avatarInfo}>
                  <h3 style={styles.displayName}>{userInfo?.username || '—'}</h3>
                  <span style={styles.roleBadge}>{getUserTypeLabel()}</span>
                </div>
              </div>
            </section>

            <div style={styles.divider} />

            {/* ── Account Details ── */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="bi bi-info-circle" style={styles.sectionIcon}></i>
                Account Details
              </h3>
              <div style={styles.infoGrid}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Username</span>
                  <span style={styles.infoValue}>{userInfo?.username || '—'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Email</span>
                  <span style={styles.infoValue}>
                    {userInfo?.email || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Account Type</span>
                  <span style={styles.infoValue}>{getUserTypeLabel()}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Grade Level</span>
                  <span style={styles.infoValue}>
                    {gradeLevel ? `Grade ${gradeLevel}` : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not set</span>}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Member Since</span>
                  <span style={styles.infoValue}>{formatDate(userInfo?.date_joined)}</span>
                </div>
              </div>
            </section>

            <div style={styles.divider} />

            {/* ── Quick Actions ── */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="bi bi-lightning-fill" style={styles.sectionIcon}></i>
                Quick Actions
              </h3>
              <div style={styles.actionList}>
                <div style={styles.actionRow}>
                  <div>
                    <div style={styles.actionRowTitle}>Settings</div>
                    <div style={styles.actionRowDesc}>Manage your preferences and account configuration.</div>
                  </div>
                  <button
                    style={styles.actionBtn}
                    onClick={() => onNavigate('settings')}
                  >
                    Go to Settings
                  </button>
                </div>
                <div style={styles.actionRow}>
                  <div>
                    <div style={styles.actionRowTitle}>Dashboard</div>
                    <div style={styles.actionRowDesc}>Return to your main dashboard overview.</div>
                  </div>
                  <button
                    style={styles.actionBtn}
                    onClick={() => onNavigate('dashboard')}
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={styles.reportFooter}>
          <span>Equinox Profile • Generated {new Date().toLocaleDateString()}</span>
          <span>Page 1 of 1</span>
        </div>

      </div>
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
  reportSubtitle: {
    margin: '0.5rem 0 0 28px',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontStyle: 'italic',
  },

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

  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0.5rem 0',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
    flexShrink: 0,
  },
  avatarInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  displayName: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  roleBadge: {
    display: 'inline-block',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    alignSelf: 'flex-start',
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
};