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

export default function ProgressHistory({ onNavigate }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Tracks network or parsing errors safely

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
  message: { textAlign: 'center', color: '#a0aec0', padding: '3rem' }
};