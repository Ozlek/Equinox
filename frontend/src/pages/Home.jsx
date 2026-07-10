import React from 'react';

export default function Home({ onNavigate }) {
  return (
    <>
      <style>{`
        @keyframes diagonalSlide {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -400px 400px, 0 0, 0 0; }
        }
      `}</style>
      <div style={styles.graphingPaper}>
        {/* Radial vignette overlay */}
        <div style={styles.vignette} />

        <div style={styles.content}>
          {/* Title area */}
          <div style={styles.titleSection}>
            <div style={styles.titleGlow} />
            <h1 style={styles.mainTitle}>EQUINOX</h1>
            <div style={styles.titleUnderline}>
              <span style={styles.underlineDot} />
              <span style={styles.underlineLine} />
              <span style={styles.underlineDot} />
            </div>
            <p style={styles.subtitle}>
              A Gamified Math Learning Web App with Dynamic Difficulty Adjustment.
            </p>
          </div>

          {/* Sticky note buttons */}
          <div style={styles.actionsSection}>
            <button 
              style={styles.stickyNoteBtn}
              onClick={() => onNavigate('login')}
            >
              <span style={styles.stickyNotePin}>📌</span>
              <span style={styles.stickyNoteLabel}>Log In to Study</span>
            </button>

            <button 
              style={styles.stickyNoteBtnGreen}
              onClick={() => onNavigate('register')}
            >
              <span style={styles.stickyNotePin}>📌</span>
              <span style={styles.stickyNoteLabel}>Create Profile</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  graphingPaper: {
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
    alignItems: 'center',
    padding: '1rem',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  },

  vignette: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: [
      'radial-gradient(ellipse at 50% 40%, rgba(30, 41, 59, 0.03) 0%, transparent 60%)',
      'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.08) 0%, transparent 50%)',
    ].join(', '),
    pointerEvents: 'none',
  },

  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2.5rem',
    maxWidth: '560px',
    width: '100%',
  },

  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem',
    position: 'relative',
  },

  titleGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '320px',
    height: '160px',
    background: 'radial-gradient(ellipse, rgba(96, 165, 250, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },

  mainTitle: {
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '4rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    letterSpacing: '-0.02em',
    textShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'relative',
    lineHeight: 1.1,
  },

  titleUnderline: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '70%',
  },
  underlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#60a5fa',
    flexShrink: 0,
  },
  underlineLine: {
    flex: 1,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)',
  },

  subtitle: {
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '1rem',
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: '380px',
    margin: 0,
    lineHeight: 1.6,
  },

  actionsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    width: '100%',
    maxWidth: '340px',
    alignItems: 'center',
  },

  stickyNoteBtn: {
    width: '100%',
    padding: '0.9rem 1.5rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '0.95rem',
    fontWeight: 'bold',
    backgroundColor: '#93c5fd',
    color: '#1e293b',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    transform: 'rotate(-0.8deg)',
    boxShadow: '3px 4px 10px rgba(0,0,0,0.15), -1px -1px 0 rgba(255,255,255,0.4) inset',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    position: 'relative',
  },

  stickyNoteBtnGreen: {
    width: '100%',
    padding: '0.9rem 1.5rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '0.95rem',
    fontWeight: 'bold',
    backgroundColor: '#86efac',
    color: '#1e293b',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    transform: 'rotate(0.6deg)',
    boxShadow: '3px 4px 10px rgba(0,0,0,0.15), -1px -1px 0 rgba(255,255,255,0.4) inset',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    position: 'relative',
  },

  stickyNotePin: {
    fontSize: '1rem',
    lineHeight: 1,
  },

  stickyNoteLabel: {
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
  },
};