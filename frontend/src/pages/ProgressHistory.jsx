import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const getTierColor = (tier) => {
  const colors = {
    'Novice': '#58ec84',
    'Intermediate': '#63b3ed',
    'Advanced': '#f6ad55',
    'Expert': '#f56565',    
  };
  return colors[tier] || '#a0aec0';
};

const getPriorityColor = (priority) => {
  const colors = {
    'high': '#f56565',
    'medium': '#f6ad55',
    'low': '#63b3ed'
  };
  return colors[priority] || '#a0aec0';
};

const getRecommendationIcon = (type) => {
  const icons = {
    'improvement': '📚',
    'advancement': '🚀',
    'skill_focus': '🎯',
    'maintenance': '💪'
  };
  return icons[type] || '💡';
};

export default function ProgressHistory({ onNavigate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adaptiveAnalysis, setAdaptiveAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    api.get('/progress/')
      .then((res) => {
        setRecords(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load historical progress logs:", err);
        setError("Could not retrieve your mastery records from the Equinox server.");
        setLoading(false);
      });
  }, []);

  const loadAdaptiveAnalysis = () => {
    api.get('/progress/adaptive-analysis/')
      .then((res) => {
        setAdaptiveAnalysis(res.data);
        setShowAnalysis(true);
      })
      .catch((err) => {
        console.error("Failed to load adaptive analysis:", err);
      });
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

  if (loading) {
    return (
      <div style={styles.graphingPaper}>
        <div style={styles.notebookWrap}>
          <div style={styles.spiralBar}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={styles.spiralHole}>
                <div style={styles.spiralRing} />
              </div>
            ))}
          </div>
          <div style={{ ...styles.notebookPage, ...ruledBg }}>
            <div style={styles.redMargin} />
            <div style={styles.pageInner}>
              <span style={styles.handwrittenMuted}>📖 Reviewing your records...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.graphingPaper}>
        <div style={styles.notebookWrap}>
          <div style={styles.spiralBar}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={styles.spiralHole}>
                <div style={styles.spiralRing} />
              </div>
            ))}
          </div>
          <div style={{ ...styles.notebookPage, ...ruledBg }}>
            <div style={styles.redMargin} />
            <div style={styles.pageInner}>
              <span style={{ ...styles.handwrittenMuted, color: '#dc2626' }}>⚠️ {error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes diagonalSlide {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -400px 400px, 0 0, 0 0; }
        }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap" rel="stylesheet" />
      <div style={styles.graphingPaper}>
        <div style={styles.notebookWrap}>
          {/* Spiral binding */}
          <div style={styles.spiralBar}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={styles.spiralHole}>
                <div style={styles.spiralRing} />
              </div>
            ))}
          </div>

          {/* Notebook page */}
          <div style={{ ...styles.notebookPage, ...ruledBg }}>
            <div style={styles.redMargin} />
            <div style={styles.pageInner}>
              {/* Page Title */}
              <div style={styles.pageTitleRow}>
                <div style={styles.titleLeft}>
                  <span style={styles.handwrittenTitle}>Progress History</span>
                  <span style={styles.handwrittenSub}>Your quiz records</span>
                </div>
                <button 
                  style={styles.closeBtn} 
                  onClick={() => onNavigate ? onNavigate('dashboard') : window.location.href = '/'}
                >
                  ✕
                </button>
              </div>

              {/* Adaptive Analysis Button */}
              {!showAnalysis && (
                <div style={styles.analysisPrompt}>
                  <button style={styles.stickyNoteBtn} onClick={loadAdaptiveAnalysis}>
                    <span style={styles.stickyNotePin}>📌</span>
                    <span style={styles.stickyNoteLabel}>Get Adaptive Learning Analysis</span>
                  </button>
                </div>
              )}

              {/* Records list */}
              {records.length === 0 ? (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>📭</span>
                  <p style={styles.emptyText}>No completions recorded yet!</p>
                  <p style={styles.emptyHint}>Jump into a challenge playthrough to log metrics.</p>
                </div>
              ) : (
                <div style={styles.recordsList}>
                  {records.map((r) => {
                    const tierColor = getTierColor(r.difficulty_achieved);
                    const accuracyPercentage = r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0;
                    const accuracyColor = accuracyPercentage >= 75 ? '#22c55e' : accuracyPercentage >= 50 ? '#eab308' : '#ef4444';
                    const localDate = new Date(r.completed_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div key={r.id} style={styles.recordCard}>
                        <div style={styles.recordHeader}>
                          <span style={styles.handwrittenTopic}>{r.topic_name}</span>
                          <span style={styles.gradeTag}>{r.grade_level}</span>
                        </div>

                        <div style={styles.recordBody}>
                          <div style={styles.recordStat}>
                            <span style={styles.statLabel}>Score</span>
                            <span style={{ ...styles.statValue, color: accuracyColor }}>
                              {r.score} / {r.total_questions}
                            </span>
                          </div>
                          <div style={styles.recordStat}>
                            <span style={styles.statLabel}>Points</span>
                            <span style={styles.statValue}>{r.gamified_score?.toLocaleString() || 0}</span>
                          </div>
                          <div style={styles.recordStat}>
                            <span style={styles.statLabel}>Tier</span>
                            <span style={{ ...styles.statValue, color: tierColor }}>{r.difficulty_achieved}</span>
                          </div>
                          <div style={styles.recordStat}>
                            <span style={styles.statLabel}>Date</span>
                            <span style={styles.statDate}>{localDate}</span>
                          </div>
                        </div>

                        {/* Hand-drawn progress mini-bar */}
                        <div style={styles.miniBar}>
                          <div style={{ ...styles.miniBarFill, width: `${accuracyPercentage}%`, backgroundColor: accuracyColor }} />
                        </div>

                        {/* Squiggle underline */}
                        <svg width="100%" height="4" viewBox="0 0 200 4" preserveAspectRatio="none" style={styles.squiggle}>
                          <path d="M0,2 Q25,0 50,2 T100,2 T150,2 T200,2" fill="none" stroke="#cbd5e1" strokeWidth="0.7" strokeLinecap="round" />
                        </svg>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Adaptive Analysis Section */}
              {showAnalysis && adaptiveAnalysis && (
                <div style={styles.analysisSection}>
                  <div style={styles.analysisDivider}>~~*~~</div>
                  <span style={styles.handwrittenSectionTitle}>Adaptive Learning Analysis</span>
                  
                  {adaptiveAnalysis.analysis && (
                    <div style={styles.analysisCard}>
                      <div style={styles.metricsGrid}>
                        <div style={styles.metricItem}>
                          <span style={styles.metricValue}>{adaptiveAnalysis.analysis.overall_accuracy}%</span>
                          <span style={styles.metricLabel}>Accuracy</span>
                        </div>
                        <div style={styles.metricItem}>
                          <span style={styles.metricValue}>{adaptiveAnalysis.analysis.strengths.length || 0}</span>
                          <span style={styles.metricLabel}>Strengths</span>
                        </div>
                        <div style={styles.metricItem}>
                          <span style={styles.metricValue}>{adaptiveAnalysis.analysis.weaknesses.length || 0}</span>
                          <span style={styles.metricLabel}>To Improve</span>
                        </div>
                      </div>

                      {adaptiveAnalysis.analysis.domains && Object.keys(adaptiveAnalysis.analysis.domains).length > 0 && (
                        <div style={styles.domainsSection}>
                          <span style={styles.handwrittenSectionSub}>Domain Performance</span>
                          {Object.entries(adaptiveAnalysis.analysis.domains).map(([domain, data]) => (
                            <div key={domain} style={styles.domainRow}>
                              <div style={styles.domainHeader}>
                                <span style={styles.handwrittenDomain}>{domain}</span>
                                <span style={{ color: getTierColor(data.current_tier), ...styles.domainTier }}>{data.current_tier}</span>
                              </div>
                              <div style={styles.domainBar}>
                                <div style={{ ...styles.domainBarFill, width: `${data.accuracy}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {adaptiveAnalysis.recommendations && adaptiveAnalysis.recommendations.length > 0 && (
                    <div style={styles.recsSection}>
                      <span style={styles.handwrittenSectionSub}>Recommendations</span>
                      {adaptiveAnalysis.recommendations.map((rec, index) => (
                        <div key={index} style={styles.recCard}>
                          <div style={styles.recHeader}>
                            <span style={styles.recIcon}>{getRecommendationIcon(rec.type)}</span>
                            <span style={{ ...styles.recPriority, color: getPriorityColor(rec.priority) }}>{rec.priority.toUpperCase()}</span>
                          </div>
                          <span style={styles.recTopic}>{rec.topic} — {rec.difficulty}</span>
                          <p style={styles.recReason}>{rec.reason}</p>
                          <p style={styles.recBenefit}>{rec.expected_benefit}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={styles.hideBtnWrap}>
                    <button style={styles.hideBtn} onClick={() => setShowAnalysis(false)}>
                      ✕ Hide Analysis
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={styles.footer}>
                <span style={styles.handwrittenFooter}>— End of Records —</span>
              </div>
            </div>
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
    alignItems: 'flex-start',
    padding: '1.5rem 1rem',
    boxSizing: 'border-box',
    position: 'relative',
  },

  notebookWrap: {
    display: 'flex',
    width: '100%',
    maxWidth: '780px',
    backgroundColor: '#f8f7f4',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },

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
  spiralHole: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#cbd5e1',
    border: '1px solid #94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiralRing: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#64748b',
  },

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

  pageInner: {
    position: 'relative',
    zIndex: 2,
    padding: '1.25rem 1.25rem 1rem 2.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  // ── Page Title ──
  pageTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  handwrittenTitle: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.2,
  },
  handwrittenSub: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.85rem',
    color: '#64748b',
  },
  closeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    width: '32px',
    height: '32px',
    borderRadius: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    flexShrink: 0,
    fontFamily: "'Georgia', serif",
  },

  // ── Analysis Prompt ──
  analysisPrompt: {
    display: 'flex',
    justifyContent: 'center',
  },
  stickyNoteBtn: {
    padding: '0.65rem 1.2rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.95rem',
    fontWeight: 600,
    backgroundColor: '#93c5fd',
    color: '#1e293b',
    fontStyle: 'italic',
    transform: 'rotate(-0.3deg)',
    boxShadow: '2px 3px 8px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  stickyNotePin: { fontSize: '0.8rem', lineHeight: 1 },
  stickyNoteLabel: {},

  // ── Empty State ──
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2rem',
    border: '2px dashed #cbd5e1',
    borderRadius: '4px',
  },
  emptyIcon: { fontSize: '2rem', lineHeight: 1 },
  emptyText: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '1rem',
    color: '#475569',
    margin: 0,
  },
  emptyHint: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.85rem',
    color: '#94a3b8',
    margin: 0,
    fontStyle: 'italic',
  },

  // ── Records List ──
  recordsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  recordCard: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '0.9rem 1rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },

  recordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  handwrittenTopic: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  gradeTag: {
    fontFamily: "'Courier New', monospace",
    fontSize: '0.6rem',
    fontWeight: 'bold',
    color: '#475569',
    backgroundColor: '#e2e8f0',
    padding: '0.15rem 0.45rem',
    borderRadius: '2px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },

  recordBody: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '0.5rem',
  },
  recordStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  statLabel: {
    fontFamily: "'Courier New', monospace",
    fontSize: '0.55rem',
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  statDate: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.85rem',
    color: '#64748b',
  },

  miniBar: {
    height: '5px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '4px',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },

  squiggle: {
    marginTop: '6px',
  },

  // ── Analysis Section ──
  analysisSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
  },
  analysisDivider: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.9rem',
    letterSpacing: '0.3em',
    fontFamily: "'Georgia', serif",
  },
  handwrittenSectionTitle: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1e293b',
    textAlign: 'center',
  },
  handwrittenSectionSub: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#475569',
    display: 'block',
    marginBottom: '0.5rem',
  },

  analysisCard: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '1rem',
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '1rem',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '4px',
  },
  metricValue: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  metricLabel: {
    fontFamily: "'Courier New', monospace",
    fontSize: '0.55rem',
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },

  domainsSection: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '0.75rem',
  },
  domainRow: {
    marginBottom: '0.75rem',
  },
  domainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  handwrittenDomain: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  domainTier: {
    fontFamily: "'Courier New', monospace",
    fontSize: '0.65rem',
    fontWeight: 'bold',
    padding: '0.15rem 0.4rem',
    borderRadius: '2px',
    border: '1px solid',
  },
  domainBar: {
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  domainBarFill: {
    height: '100%',
    backgroundColor: '#63b3ed',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },

  recsSection: {},
  recCard: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '0.85rem',
    marginBottom: '0.75rem',
    borderLeft: '3px solid #93c5fd',
  },
  recHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  recIcon: { fontSize: '1.2rem', lineHeight: 1 },
  recPriority: {
    fontFamily: "'Courier New', monospace",
    fontSize: '0.6rem',
    fontWeight: 'bold',
    padding: '0.15rem 0.4rem',
    borderRadius: '2px',
    border: '1px solid',
  },
  recTopic: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#475569',
    display: 'block',
    marginBottom: '4px',
  },
  recReason: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.8rem',
    color: '#64748b',
    margin: '0 0 4px 0',
    lineHeight: 1.4,
  },
  recBenefit: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.8rem',
    color: '#22c55e',
    fontStyle: 'italic',
    margin: 0,
  },

  hideBtnWrap: {
    display: 'flex',
    justifyContent: 'center',
  },
  hideBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '0.45rem 1rem',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.85rem',
    fontWeight: 600,
  },

  // ── Footer ──
  footer: {
    textAlign: 'center',
    paddingTop: '0.25rem',
  },
  handwrittenFooter: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '0.8rem',
    color: '#94a3b8',
  },

  // ── Muted text ──
  handwrittenMuted: {
    fontFamily: "'Caveat', 'Comic Sans MS', cursive",
    fontSize: '1rem',
    color: '#64748b',
    textAlign: 'center',
    display: 'block',
    padding: '1rem',
  },
};