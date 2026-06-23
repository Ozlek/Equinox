import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function TopicCatalogue({ onSelectTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('Elementary');

  useEffect(() => {
    // Axios targets your base URL and handles slash resolution safely
    api.get('/topics/')
      .then((res) => {
        setTopics(res.data); // Axios automatically unwraps JSON into response.data
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error retrieving topic catalogue structural framework:", err);
        setError("Unable to load the topic structural framework matrix. Please try again.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={styles.message}>Loading Topic Catalogue Matrix...</div>;
  if (error) return <div style={{ ...styles.message, color: '#f56565' }}>⚠️ {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.mainTitle}>📚 Topic Catalogue</h1>
        <p style={styles.subtitle}>Select a structural framework area to configure your study session.</p>
      </div>

      <div style={styles.grid}>
        {topics.map((topic) => (
          <div key={topic.id} style={styles.topicCard}>
            <div style={styles.cardContent}>
                <div style={styles.cardHeaderRow}>
                <h3 style={styles.cardTitle}>{topic.name}</h3>
                <span style={styles.gradeBadge}>
                  Grades {topic.grade_level_min}-{topic.grade_level_max}
                </span>
              </div>
               
              <p style={styles.cardDescription}>{topic.description}</p>
              
                <div style={styles.gradeSelector}>
                  <label style={styles.gradeLabel}>Grade Level:</label>
                  <select 
                    style={styles.gradeSelect}
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                  >
                    <option value="Elementary">Elementary (Grades 1-6)</option>
                    <option value="Junior High">Junior High (Grades 7-10)</option>
                  </select>
                </div>
               
              <button 
                style={styles.actionBtn} 
                onClick={() => onSelectTopic(topic.id, selectedGrade)}
              >
                Review Topic ➔
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#f7fafc' },
  header: { marginBottom: '2.5rem' },
  mainTitle: { margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: 'bold' },
  subtitle: { margin: 0, color: '#a0aec0', fontSize: '1.1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
  topicCard: { backgroundColor: '#1a202c', border: '1px solid #2d3748', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, border-color 0.2s ease' },
  cardContent: { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', flexGrow: 1 },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '1rem' },
  cardTitle: { margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', lineHeight: '1.3' },
  gradeBadge: { backgroundColor: '#4a5568', color: '#e2e8f0', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' },
  cardDescription: { margin: '0 0 1.5rem 0', color: '#a0aec0', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1 },
  actionBtn: { width: '100%', padding: '0.75rem', backgroundColor: '#63b3ed', color: '#1a202c', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', transition: 'background-color 0.15s ease', marginTop: '1rem' },
  gradeSelector: { marginBottom: '1rem' },
  gradeLabel: { display: 'block', color: '#a0aec0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' },
  gradeSelect: { width: '100%', padding: '0.6rem', backgroundColor: '#111827', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', cursor: 'pointer', boxSizing: 'border-box' },
  message: { textAlign: 'center', color: '#a0aec0', padding: '5rem', fontSize: '1.1rem' }
};
