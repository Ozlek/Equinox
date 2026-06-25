import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const MOD_LABELS = {
  'timed': '⏱️ Timed',
  'disable_adjuster': '🔒 Locked DDA',
  'one_life': '❤️‍🔥 One Life',
  'easy_going': '🍃 Easy'
};

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
  const [error, setError] = useState(null); // Tracks network or parsing errors safely
  const [adaptiveAnalysis, setAdaptiveAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    // Shared Axios instance inherently preserves credentials and toggles host environments
    api.get('/progress/')
      .then((res) => {
        setRecords(res.data || []); // Payloads automatically unwrapped to response.data
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

  if (loading) return <div style={styles.message}>Analyzing Student Mastery Profile Records...</div>;

  if (error) return <div style={{ ...styles.message, color: '#f56565' }}>⚠️ {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>📈 Progress History</h2>
          <button 
            style={styles.closeBtn} 
            title="Return to Dashboard" 
            onClick={() => onNavigate ? onNavigate('dashboard') : window.location.href = '/'}
          >
            ✕
          </button>
        </div>

        {!showAnalysis ? (
          <div style={styles.actionArea}>
            <button style={styles.analyzeBtn} onClick={loadAdaptiveAnalysis}>
              🧠 Get Adaptive Learning Analysis
            </button>
          </div>
        ) : null}

        {records.length === 0 ? (
          <div style={styles.emptyState}>
            No completions recorded yet! Jump into a challenge playthrough to log metrics.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Topic</th>
                  <th style={styles.th}>Grade</th>
                  <th style={styles.th}>Accuracy</th>
                  <th style={styles.th}>Total Points</th>
                  <th style={styles.th}>Highest Tier</th>
                  <th style={styles.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const tierColor = getTierColor(r.difficulty_achieved);
                  const accuracyPercentage = r.total_questions > 0 ? (r.score / r.total_questions) * 100 : 0;
                  const accuracyColor = accuracyPercentage >= 75 ? '#68d391' : accuracyPercentage >= 50 ? '#ecc94b' : '#fc8181';
                  const localDate = new Date(r.completed_at).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={r.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 'bold', color: '#f7fafc' }}>
                        {r.topic_name}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.gradeBadge}>{r.grade_level}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: accuracyColor, fontWeight: 'bold' }}>
                          {r.score} / {r.total_questions}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#63b3ed', fontWeight: 'bold' }}>
                        {r.gamified_score?.toLocaleString() || 0}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.tierBadge, borderColor: tierColor, color: tierColor }}>
                          {r.difficulty_achieved}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#a0aec0', fontSize: '0.85rem' }}>
                        {localDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showAnalysis && adaptiveAnalysis && (
          <div style={styles.analysisSection}>
            <h3 style={styles.analysisTitle}>🧠 Adaptive Learning Analysis</h3>
            
            {adaptiveAnalysis.analysis && (
              <div style={styles.analysisCard}>
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
                          <span style={{ ...styles.domainTier, color: getTierColor(data.current_tier) }}>
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
              <div style={styles.recommendationsCard}>
                <h4 style={styles.analysisSubtitle}>💡 Personalized Recommendations</h4>
                {adaptiveAnalysis.recommendations.map((rec, index) => (
                  <div key={index} style={styles.recommendationItem}>
                    <div style={styles.recommendationHeader}>
                      <span style={styles.recommendationIcon}>
                        {getRecommendationIcon(rec.type)}
                      </span>
                      <span style={{ ...styles.recommendationPriority, color: getPriorityColor(rec.priority) }}>
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
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '1rem', display: 'flex', justifyContent: 'center' },
  card: { backgroundColor: '#1a202c', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '1000px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#f7fafc' },
  header: { marginBottom: '1.5rem', borderBottom: '1px solid #2d3748', paddingBottom: '1rem' },
  title: { margin: 0, fontSize: '1.5rem', color: '#f7fafc' },
  closeBtn: { backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.2)', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' },
  emptyState: { backgroundColor: 'rgba(99, 179, 237, 0.1)', color: '#63b3ed', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', border: '1px dashed #4a5568' },
  tableWrapper: { overflowX: 'auto', borderRadius: '8px', border: '1px solid #2d3748' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { backgroundColor: '#2d3748', color: '#a0aec0', padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #1a202c' },
  tr: { borderBottom: '1px solid #2d3748', transition: 'background-color 0.2s ease' },
  td: { padding: '1rem', verticalAlign: 'middle' },
  gradeBadge: { backgroundColor: '#4a5568', color: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' },
  tierBadge: { fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid', fontWeight: 'bold', textTransform: 'uppercase' },
  message: { textAlign: 'center', color: '#a0aec0', padding: '3rem' },
  actionArea: { textAlign: 'center', marginBottom: '2rem' },
  analyzeBtn: { backgroundColor: '#63b3ed', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 179, 237, 0.3)', transition: 'all 0.2s ease' },
  analysisSection: { marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #2d3748' },
  analysisTitle: { fontSize: '1.5rem', color: '#f7fafc', marginBottom: '1.5rem', textAlign: 'center' },
  analysisCard: { backgroundColor: '#2d3748', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  analysisSubtitle: { fontSize: '1.1rem', color: '#f7fafc', marginBottom: '1rem', marginTop: 0 },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  metricCard: { backgroundColor: '#1a202c', padding: '1rem', borderRadius: '8px', textAlign: 'center' },
  metricValue: { fontSize: '2rem', fontWeight: 'bold', color: '#63b3ed', marginBottom: '0.5rem' },
  metricLabel: { fontSize: '0.85rem', color: '#a0aec0' },
  domainBreakdown: { marginTop: '1.5rem' },
  domainTitle: { fontSize: '1rem', color: '#f7fafc', marginBottom: '1rem' },
  domainItem: { backgroundColor: '#1a202c', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem' },
  domainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  domainName: { fontWeight: 'bold', color: '#f7fafc' },
  domainTier: { fontSize: '0.85rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid' },
  domainMetrics: { display: 'flex', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' },
  domainStat: { fontSize: '0.85rem', color: '#a0aec0' },
  progressBar: { height: '8px', backgroundColor: '#4a5568', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#63b3ed', transition: 'width 0.3s ease' },
  recommendationsCard: { backgroundColor: '#2d3748', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  recommendationItem: { backgroundColor: '#1a202c', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', borderLeft: '4px solid #63b3ed' },
  recommendationHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  recommendationIcon: { fontSize: '1.5rem' },
  recommendationPriority: { fontSize: '0.75rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid' },
  recommendationContent: { marginTop: '0.5rem' },
  recommendationTitle: { fontSize: '1rem', fontWeight: 'bold', color: '#f7fafc', marginBottom: '0.5rem' },
  recommendationTopic: { fontSize: '0.9rem', color: '#63b3ed', marginBottom: '0.5rem' },
  recommendationReason: { fontSize: '0.85rem', color: '#a0aec0', marginBottom: '0.5rem', lineHeight: '1.5' },
  recommendationBenefit: { fontSize: '0.85rem', color: '#68d391', fontStyle: 'italic' },
  hideAnalysisBtn: { backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.2)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'block', margin: '1.5rem auto 0', transition: 'all 0.2s ease' }
};
