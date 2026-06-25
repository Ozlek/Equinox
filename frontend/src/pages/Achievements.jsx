import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // Integrated your environment-aware Axios client

export default function AchievementsCard() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Axios automatically uses your hostname-switching logic and applies active JWTs
    api.get('/progress/achievements/')
      .then(res => {
        // Response payloads are automatically unwrapped into res.data
        // Backend returns a flat array of achievements
        const data = Array.isArray(res.data) ? res.data : (res.data.achievements || []);
        setAchievements(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load achievements milestone dataset:", err);
        setError("Could not sync milestones with the Equinox server.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={styles.message}>Loading Achievements...</div>;
  
  if (error) return <div style={styles.errorBox}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={styles.header}>
          <h2 style={styles.title}>🏆 Achievements</h2>
          <button 
            style={styles.closeBtn} 
            title="Return to Dashboard" 
            onClick={() => window.location.href = '/dashboard'}
          >
            ✕
          </button>
        </div>

        {achievements.length === 0 ? (
          <div style={styles.emptyState}>
            No achievements registered in the engine yet.
          </div>
        ) : (
          <div style={styles.grid}>
            {achievements.map((badge) => {
              const cardStyle = badge.unlocked 
                ? { ...styles.badgeCard, ...styles.unlockedCard }
                : { ...styles.badgeCard, ...styles.lockedCard };

              return (
                <div key={badge.id} style={cardStyle}>
                  <div style={styles.iconWrapper}>{badge.icon}</div>
                  <div style={styles.textContainer}>
                    <h4 style={badge.unlocked ? styles.unlockedTitle : styles.lockedTitle}>
                      {badge.title}
                    </h4>
                    <p style={styles.description}>
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '1rem', display: 'flex', justifyContent: 'center' },
  card: { backgroundColor: '#1a202c', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '1000px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#f7fafc' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #2d3748', paddingBottom: '1rem' },
  title: { margin: 0, fontSize: '1.5rem', color: '#f7fafc' },
  closeBtn: { backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.2)', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' },
  emptyState: { backgroundColor: 'rgba(99, 179, 237, 0.1)', color: '#63b3ed', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', border: '1px dashed #4a5568' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  badgeCard: { display: 'flex', alignItems: 'center', padding: '1rem', borderRadius: '12px', border: '1px solid', transition: 'all 0.2s ease' },
  unlockedCard: { backgroundColor: '#2d3748', borderColor: '#63b3ed', opacity: 1, boxShadow: '0 4px 12px rgba(99, 179, 237, 0.15)' },
  lockedCard: { backgroundColor: 'rgba(45, 55, 72, 0.25)', borderColor: '#2d3748', opacity: 0.4 },
  iconWrapper: { fontSize: '2.5rem', marginRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  textContainer: { display: 'flex', flexDirection: 'column', gap: '2px' },
  unlockedTitle: { margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#fff' },
  lockedTitle: { margin: 0, fontSize: '1rem', fontWeight: 'bold', color: '#718096' },
  description: { margin: 0, fontSize: '0.8rem', color: '#a0aec0', lineHeight: '1.4' },
  message: { textAlign: 'center', color: '#a0aec0', padding: '3rem' },
  errorBox: { backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.2)', padding: '1.2rem', borderRadius: '8px', textAlign: 'center', margin: '2rem auto', maxWidth: '500px' }
};