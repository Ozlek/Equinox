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

const ITEMS_PER_PAGE = 10;

export default function ProgressHistory({ onNavigate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adaptiveAnalysis, setAdaptiveAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div className="spinner-border text-success mb-3" role="status" style={{ width: '2rem', height: '2rem' }}></div>
      <div style={styles.loadingText}>Analyzing Student Mastery Profile Records...</div>
    </div>
  );

  if (error) return (
    <div style={styles.container}>
      <div style={styles.errorBox}>⚠️ {error}</div>
    </div>
  );

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
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <h2 style={styles.title}>Progress Report</h2>
            </div>
            <button 
              style={styles.closeBtn} 
              title="Return to Dashboard" 
              onClick={() => onNavigate ? onNavigate('dashboard') : window.location.href = '/'}
            >
              ✕
            </button>
          </div>
          <p style={styles.reportSubtitle}>Student Achievement & Mastery Record</p>
        </div>

        {/* ── Analysis Section (shown on top when active) ── */}
        {showAnalysis && adaptiveAnalysis && (
          <div style={styles.analysisSection}>
            <div style={styles.analysisPaper}>
              <h3 style={styles.analysisTitle}>🧠 Adaptive Learning Analysis</h3>
              
              {adaptiveAnalysis.analysis && (
                <div style={styles.reportCard}>
                  <h4 style={styles.analysisSubtitle}>📊 Performance Overview</h4>
                  <div style={styles.metricsGrid}>
                    <div style={styles.metricCard}>
                      <div style={styles.metricValue}>{adaptiveAnalysis.analysis.overall_accuracy}%</div>
                      <div style={styles.metricLabel}>Overall Accuracy</div>
                    </div>
                    <div style={styles.metricCard}>
                      <div style={styles.metricValue}>{adaptiveAnalysis.analysis.strengths.length || 0}</div>
                      <div style={styles.metricLabel}>Strengths</div>
                    </div>
                    <div style={styles.metricCard}>
                      <div style={styles.metricValue}>{adaptiveAnalysis.analysis.weaknesses.length || 0}</div>
                      <div style={styles.metricLabel}>Areas to Improve</div>
                    </div>
                  </div>

                  {adaptiveAnalysis.analysis.domains && Object.keys(adaptiveAnalysis.analysis.domains).length > 0 && (
                    <div style={styles.domainBreakdown}>
                      <h5 style={styles.domainTitle}>Domain Performance</h5>
                      {Object.entries(adaptiveAnalysis.analysis.domains).map(([domain, data]) => (
                        <div key={domain} style={styles.domainItem}>
                          <div style={styles.domainHeader}>
                            <span style={styles.domainName}>{domain}</span>
                            <span style={{ ...styles.domainTier, color: getTierColor(data.current_tier), borderColor: getTierColor(data.current_tier) }}>
                              {data.current_tier}
                            </span>
                          </div>
                          <div style={styles.domainMetrics}>
                            <span style={styles.domainStat}>
                              Accuracy: <strong>{data.accuracy}%</strong>
                            </span>
                            <span style={styles.domainStat}>
                              Word Problems: <strong>{data.word_problem_accuracy}%</strong>
                            </span>
                            <span style={styles.domainStat}>
                              Direct Problems: <strong>{data.direct_problem_accuracy}%</strong>
                            </span>
                          </div>
                          <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${data.accuracy}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {adaptiveAnalysis.recommendations && adaptiveAnalysis.recommendations.length > 0 && (
                <div style={styles.reportCard}>
                  <h4 style={styles.analysisSubtitle}>💡 Personalized Recommendations</h4>
                  {adaptiveAnalysis.recommendations.map((rec, index) => (
                    <div key={index} style={styles.recommendationItem}>
                      <div style={styles.recommendationHeader}>
                        <span style={styles.recommendationIcon}>
                          {getRecommendationIcon(rec.type)}
                        </span>
                        <span style={{ ...styles.recommendationPriority, color: getPriorityColor(rec.priority), borderColor: getPriorityColor(rec.priority) }}>
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>
                      <div style={styles.recommendationContent}>
                        <div style={styles.recommendationTitle}>
                          {rec.type === 'improvement' && '📚 Focus on Improvement'}
                          {rec.type === 'advancement' && '🚀 Ready to Advance'}
                          {rec.type === 'skill_focus' && '🎯 Skill Building'}
                          {rec.type === 'maintenance' && '💪 Maintain Progress'}
                        </div>
                        <div style={styles.recommendationTopic}>
                          Topic: <strong>{rec.topic}</strong> | Difficulty: <strong>{rec.difficulty}</strong>
                        </div>
                        <div style={styles.recommendationReason}>{rec.reason}</div>
                        <div style={styles.recommendationBenefit}>
                          <em>{rec.expected_benefit}</em>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                style={styles.hideAnalysisBtn} 
                onClick={() => setShowAnalysis(false)}
              >
                Hide Analysis
              </button>
            </div>
          </div>
        )}

        {/* ── Analysis Button (when not showing analysis) ── */}
        {!showAnalysis ? (
          <div style={styles.actionArea}>
            <button style={styles.analyzeBtn} onClick={loadAdaptiveAnalysis}>
              🧠 Generate Learning Analysis Report
            </button>
          </div>
        ) : null}

        {/* ── Records Table ── */}
        {records.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '2rem' }}>📝</span>
            <p>No completions recorded yet! Jump into a challenge playthrough to log metrics.</p>
          </div>
        ) : (
          <div style={styles.ruledTableWrapper}>
            <div style={styles.redMargin} />
            <div style={styles.tableContent}>
              <div style={styles.pagination}>
                <button style={{...styles.paginationBtn, opacity: currentPage <= 1 ? 0.4 : 1}} disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>◀ Previous</button>
                <span style={styles.paginationText}>Page {currentPage} of {Math.max(1, Math.ceil(records.length / ITEMS_PER_PAGE))}</span>
                <button style={{...styles.paginationBtn, opacity: currentPage >= Math.ceil(records.length / ITEMS_PER_PAGE) ? 0.4 : 1}} disabled={currentPage >= Math.ceil(records.length / ITEMS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)}>Next ▶</button>
              </div>
              <h3 style={styles.tableHeading}>Session History</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Topic</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>Accuracy</th>
                    <th style={styles.th}>Score</th>
                    <th style={styles.th}>Tier</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((r) => {
                    const tierColor = getTierColor(r.difficulty_achieved);
                    const accuracyPercentage = r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0;
                    const accuracyColor = accuracyPercentage >= 75 ? '#16a34a' : accuracyPercentage >= 50 ? '#ca8a04' : '#dc2626';
                    const localDate = new Date(r.completed_at).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={r.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 'bold', color: '#1e293b' }}>
                          {r.topic_name}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.gradeBadge}>Grade {r.grade_level}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ color: accuracyColor, fontWeight: 'bold' }}>
                            {r.score} / {r.total_questions}
                          </span>
                        </td>
                        <td style={{ ...styles.td, color: '#2563eb', fontWeight: 'bold' }}>
                          {r.gamified_score?.toLocaleString() || 0}
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.tierBadge, borderColor: tierColor, color: tierColor }}>
                            {r.difficulty_achieved}
                          </span>
                        </td>
                        <td style={{ ...styles.td, color: '#64748b', fontSize: '0.85rem' }}>
                          {localDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={styles.reportFooter}>
          <span>Equinox Learning Report • Generated {new Date().toLocaleDateString()}</span>
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
    maxWidth: '960px',
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
  reportSubtitle: {
    margin: '0.5rem 0 0 28px',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontStyle: 'italic',
  },

  // ── Action Area ──
  actionArea: {
    textAlign: 'center',
    padding: '1.5rem',
    borderBottom: '2px dashed #d6d3d1',
  },
  analyzeBtn: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '0.9rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
    transition: 'all 0.15s ease',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Empty State ──
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '3rem 2rem',
    color: '#64748b',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
  },

  // ── Ruled Table ──
  ruledTableWrapper: {
    display: 'flex',
    flexDirection: 'row',
    padding: '1.5rem 0',
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(203,213,225,0.4) 31px, rgba(203,213,225,0.4) 32px)',
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
  tableContent: {
    flex: 1,
    padding: '0 1.5rem 0 1rem',
  },
  tableHeading: {
    margin: '0 0 1rem 0',
    fontSize: '1.2rem',
    color: '#1e293b',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '0.75rem 0.75rem',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '2px solid #cbd5e1',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: '600',
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '0.75rem',
    verticalAlign: 'middle',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.9rem',
  },
  gradeBadge: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '0.2rem 0.6rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  tierBadge: {
    fontSize: '0.75rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '4px',
    border: '1px solid',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Analysis Section ──
  analysisSection: {
    padding: '0',
  },
  analysisPaper: {
    padding: '1.5rem 2rem',
    borderBottom: '2px dashed #d6d3d1',
  },
  analysisTitle: {
    fontSize: '1.5rem',
    color: '#1e293b',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: 'bold',
  },
  analysisSubtitle: {
    fontSize: '1.1rem',
    color: '#1e293b',
    marginBottom: '1rem',
    marginTop: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: 'bold',
  },
  reportCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  metricCard: {
    backgroundColor: '#fefdfb',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: '0.3rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  metricLabel: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  domainBreakdown: {
    marginTop: '1.5rem',
  },
  domainTitle: {
    fontSize: '1rem',
    color: '#1e293b',
    marginBottom: '1rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: 'bold',
  },
  domainItem: {
    backgroundColor: '#fefdfb',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
  },
  domainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  domainName: {
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.9rem',
  },
  domainTier: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  domainMetrics: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
  },
  domainStat: {
    fontSize: '0.85rem',
    color: '#64748b',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },

  // ── Recommendations ──
  recommendationsCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  recommendationItem: {
    backgroundColor: '#fefdfb',
    border: '1px solid #e2e8f0',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '0.75rem',
    borderLeft: '4px solid #3b82f6',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  recommendationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  recommendationIcon: {
    fontSize: '1.5rem',
  },
  recommendationPriority: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  recommendationContent: {
    marginTop: '0.5rem',
  },
  recommendationTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '0.5rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  recommendationTopic: {
    fontSize: '0.85rem',
    color: '#2563eb',
    marginBottom: '0.5rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  recommendationReason: {
    fontSize: '0.85rem',
    color: '#64748b',
    marginBottom: '0.5rem',
    lineHeight: '1.5',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  recommendationBenefit: {
    fontSize: '0.85rem',
    color: '#16a34a',
    fontStyle: 'italic',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  hideAnalysisBtn: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    padding: '0.7rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    display: 'block',
    margin: '1.5rem auto 0',
    transition: 'all 0.15s ease',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Pagination ──
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    padding: "0.75rem 0",
    flexWrap: "wrap",
  },
  paginationBtn: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    cursor: "pointer",
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    transition: "all 0.15s ease",
  },
  paginationText: {
    color: "#475569",
    fontSize: "0.8rem",
    fontWeight: "600",
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
};