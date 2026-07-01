import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

const stickerThemes = {
  'first_steps': {
    icon: '🌱',
    bgColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  'algebra_master_1': {
    icon: '📐',
    bgColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  'flawless_victory': {
    icon: '👑',
    bgColor: '#fef9c3',
    borderColor: '#eab308',
  },
};

const defaultTheme = {
  icon: '🏆',
  bgColor: '#f1f5f9',
  borderColor: '#94a3b8',
};

export default function AchievementsCard() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get('/progress/achievements/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.achievements || []);
        setAchievements(data);
        setLoading(false);
        setTimeout(() => setIsVisible(true), 200);
      })
      .catch(err => {
        console.error("Failed to load achievements:", err);
        setError("Could not sync milestones with the Equinox server.");
        setLoading(false);
      });
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      setScrollPos(scrollRef.current.scrollLeft);
    }
  };

  const ruledBg = {
    backgroundImage: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 27px,
        rgba(148, 163, 184, 0.15) 27px,
        rgba(148, 163, 184, 0.15) 28px
      )
    `,
    backgroundPosition: '0 20px',
  };

  const maxScroll = scrollRef.current
    ? scrollRef.current.scrollWidth - scrollRef.current.clientWidth
    : 1;
  const scrollPercent = maxScroll > 0 ? (scrollPos / maxScroll) * 100 : 0;

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.spiralNotebook}>
          <div style={styles.spiralBar}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={styles.spiralHoleSmall}>
                <div style={styles.spiralRingSmall} />
              </div>
            ))}
          </div>
          <div style={{ ...styles.notebookPage, ...ruledBg }}>
            <div style={styles.redMargin} />
            <div style={styles.notebookInner}>
              <span style={styles.loadingText}>📖 Loading achievements...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.spiralNotebook}>
          <div style={styles.spiralBar}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={styles.spiralHoleSmall}>
                <div style={styles.spiralRingSmall} />
              </div>
            ))}
          </div>
          <div style={{ ...styles.notebookPage, ...ruledBg }}>
            <div style={styles.redMargin} />
            <div style={styles.notebookInner}>
              <span style={styles.errorText}>⚠️ {error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div style={styles.page}>
      <div style={styles.spiralNotebook}>
        {/* Spiral binding */}
        <div style={styles.spiralBar}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={styles.spiralHoleSmall}>
              <div style={styles.spiralRingSmall} />
            </div>
          ))}
        </div>

        {/* Notebook page */}
        <div style={{
          ...styles.notebookPage,
          ...ruledBg,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <div style={styles.redMargin} />
          <div style={styles.notebookInner}>
            {/* Page header — hand-written */}
            <div style={styles.pageHeader}>
              <div style={styles.pageTitleRow}>
                <span style={styles.handwrittenPageTitle}>Achievement Stickers</span>
                <span style={styles.handwrittenPageSub}>Equinox Milestones</span>
              </div>
              <div style={styles.pageStats}>
                <span style={styles.handwrittenStats}>
                  {unlockedCount} / {achievements.length} collected
                </span>
                <div style={styles.miniProgress}>
                  <div style={{
                    ...styles.miniProgressFill,
                    width: `${(unlockedCount / Math.max(achievements.length, 1)) * 100}%`,
                  }} />
                </div>
              </div>
            </div>

            {/* Scroll hint */}
            <div style={{
              ...styles.scrollHint,
              opacity: scrollPos < 5 ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}>
              <span style={styles.scrollHintText}>← scroll →</span>
            </div>

            {/* Horizontal scrollable sticker strip */}
            <div
              ref={scrollRef}
              style={styles.stickerStrip}
              onScroll={handleScroll}
            >
              {achievements.map((badge, index) => {
                const theme = stickerThemes[badge.id] || defaultTheme;
                const delay = 0.1 * index;

                return (
                  <div
                    key={badge.id}
                    style={{
                      ...styles.stickerCard,
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
                      transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
                    }}
                  >
                    {/* Taped top edge (like a polaroid taped to the page) */}
                    <div style={styles.tapeTab}>
                      <div style={styles.tapePiece} />
                    </div>

                    {/* Hand-drawn circle with icon */}
                    <div style={{
                      ...styles.handDrawnCircle,
                      borderColor: badge.unlocked ? theme.borderColor : '#cbd5e1',
                      backgroundColor: badge.unlocked ? theme.bgColor : '#f8fafc',
                    }}>
                      <span style={styles.circleIcon}>
                        {badge.unlocked ? theme.icon : '🔒'}
                      </span>
                      {badge.unlocked && (
                        <div style={styles.circleCheck}>
                          <span style={styles.checkText}>✓</span>
                        </div>
                      )}
                    </div>

                    {/* Hand-written text */}
                    <div style={styles.stickerTextArea}>
                      <h4 style={{
                        ...styles.handwrittenName,
                        color: badge.unlocked ? '#1e293b' : '#94a3b8',
                        textDecoration: badge.unlocked ? 'none' : 'line-through wavy #cbd5e1',
                      }}>
                        {badge.title}
                      </h4>

                      <p style={styles.handwrittenDetail}>
                        {badge.unlocked
                          ? (badge.unlocked_at
                              ? new Date(badge.unlocked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Completed! ✨')
                          : badge.description
                        }
                      </p>

                      {/* Stamped status */}
                      <div style={styles.stampedStatus}>
                        {badge.unlocked ? (
                          <span style={styles.collectedStamp}>✔ Collected</span>
                        ) : (
                          <span style={styles.lockedStamp}>✗ Locked</span>
                        )}
                      </div>

                      {/* Squiggle underline */}
                      <svg width="100%" height="5" viewBox="0 0 150 5" preserveAspectRatio="none" style={styles.squiggle}>
                        <path
                          d="M0,2.5 Q18.75,0 37.5,2.5 T75,2.5 T112.5,2.5 T150,2.5"
                          fill="none"
                          stroke={badge.unlocked ? theme.borderColor : '#cbd5e1'}
                          strokeWidth="0.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll progress dots */}
            <div style={styles.scrollDots}>
              {achievements.map((_, i) => (
                <div key={i} style={{
                  ...styles.dot,
                  backgroundColor: (i / achievements.length) * 100 <= scrollPercent + 10 ? '#64748b' : '#cbd5e1',
                }} />
              ))}
            </div>

            {/* Footer */}
            <div style={styles.pageFooter}>
              <span style={styles.handwrittenFooter}>— Achievement Archive —</span>
            </div>
          </div>
        </div>
      </div>

      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap" rel="stylesheet" />
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    padding: '0.75rem 0.5rem',
    position: 'relative',
  },

  // ── Spiral Notebook ──
  spiralNotebook: {
    display: 'flex',
    width: '100%',
    maxWidth: '780px',
    backgroundColor: '#f8f7f4',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },

  // ── Spiral Binding Bar ──
  spiralBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '16px 6px',
    backgroundColor: '#e2e8f0',
    borderRight: '1px solid #cbd5e1',
    flexShrink: 0,
  },
  spiralHoleSmall: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#cbd5e1',
    border: '1px solid #94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiralRingSmall: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#64748b',
  },

  // ── Notebook Page ──
  notebookPage: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },

  redMargin: {
    position: 'absolute',
    left: '28px',
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: '#ef4444',
    opacity: 0.25,
    zIndex: 1,
  },

  notebookInner: {
    position: 'relative',
    zIndex: 2,
    padding: '1.25rem 1.25rem 1rem 2.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  // ── Page Header ──
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    marginBottom: '0.25rem',
    flexWrap: 'wrap',
  },
  pageTitleRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  handwrittenPageTitle: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.2,
  },
  handwrittenPageSub: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.85rem',
    color: '#64748b',
  },
  pageStats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  handwrittenStats: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.85rem',
    color: '#475569',
  },
  miniProgress: {
    width: '80px',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: '3px',
    transition: 'width 0.8s ease',
  },

  // ── Scroll Hint ──
  scrollHint: {
    textAlign: 'center',
  },
  scrollHintText: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.8rem',
    color: '#94a3b8',
  },

  // ── Horizontal Sticker Strip ──
  stickerStrip: {
    display: 'flex',
    gap: '20px',
    overflowX: 'auto',
    overflowY: 'hidden',
    padding: '0.75rem 0.25rem 1rem',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch',
    // Hide scrollbar but keep functionality
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
  },

  // ── Individual Sticker Card ──
  stickerCard: {
    flex: '0 0 200px',
    scrollSnapAlign: 'start',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    padding: '1rem 0.75rem 0.75rem',
    position: 'relative',
  },

  // ── Tape tab ──
  tapeTab: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '-1.25rem',
    marginBottom: '0.5rem',
  },
  tapePiece: {
    width: '40px',
    height: '16px',
    backgroundColor: 'rgba(203, 213, 225, 0.5)',
    borderRadius: '1px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },

  // ── Hand-drawn Circle ──
  handDrawnCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: '2.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 0.75rem',
    position: 'relative',
    flexShrink: 0,
  },
  circleIcon: {
    fontSize: '2rem',
    lineHeight: 1,
  },
  circleCheck: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: 'bold',
  },

  // ── Sticker Text Area ──
  stickerTextArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    textAlign: 'center',
  },
  handwrittenName: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: 0,
    lineHeight: 1.3,
  },
  handwrittenDetail: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.8rem',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.4,
  },

  // ── Stamped Status ──
  stampedStatus: {
    marginTop: '4px',
    display: 'flex',
    justifyContent: 'center',
  },
  collectedStamp: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    padding: '1px 8px',
    borderRadius: '2px',
  },
  lockedStamp: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#94a3b8',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    padding: '1px 8px',
    borderRadius: '2px',
  },

  // ── Squiggle Underline ──
  squiggle: {
    marginTop: '6px',
  },

  // ── Scroll Progress Dots ──
  scrollDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
    padding: '0.25rem 0',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease',
  },

  // ── Page Footer ──
  pageFooter: {
    textAlign: 'center',
    paddingTop: '0.25rem',
  },
  handwrittenFooter: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.8rem',
    color: '#94a3b8',
  },

  // ── Loading & Error ──
  loadingText: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
    color: '#64748b',
    textAlign: 'center',
    display: 'block',
    padding: '1rem',
  },
  errorText: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.95rem',
    color: '#dc2626',
    textAlign: 'center',
    display: 'block',
    padding: '1rem',
  },
};