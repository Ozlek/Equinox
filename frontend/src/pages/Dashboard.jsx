import React, { useState, useEffect } from 'react';
import AchievementsCard from './Achievements';

export default function DashboardWorkspace({ onNavigate, onStartQuiz }) {
  const [activeSessionTopicId, setActiveSessionTopicId] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  
  // MATCHED: Object track to catch active session metadata parameters from Django cache
  const [activeSessionMetadata, setActiveSessionMetadata] = useState({
    difficulty: 'Intermediate',
    modifiers: [],
    equipped_item: ''
  });

  useEffect(() => {
    fetch('http://127.0.0.1:8000/playthrough/check_active/', {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.has_active_session) {
          setActiveSessionTopicId(data.topic_id);
          // Safely seed ongoing structural configurations back down if provided by the endpoint
          setActiveSessionMetadata({
            difficulty: data.difficulty || 'Intermediate',
            modifiers: data.modifiers || [],
            equipped_item: data.equipped_item || ''
          });
        }
      });
  }, []);

  return (
    <div className="graphing-paper" style={styles.container}>
      <div style={styles.welcomeSection}>
        <h1 style={styles.mainTitle}>Welcome to Equinox</h1>
        <p style={styles.subtitle}>Ready to improve your math skills today?</p>
      </div>

      {activeSessionTopicId && (
        <div style={styles.interceptorBanner}>
          <div style={styles.bannerTextContainer}>
            <h5 style={styles.bannerTitle}>⚠️ Session in Progress</h5>
            <span style={styles.bannerDescription}>
              You have an ongoing challenge. Resuming now prevents you from losing your progress!
            </span>
          </div>
          <button 
            style={styles.resumeBtn} 
            onClick={() => onStartQuiz(
              activeSessionTopicId, 
              activeSessionMetadata.difficulty, 
              activeSessionMetadata.modifiers, 
              activeSessionMetadata.equipped_item
            )}
          >
            Resume Challenge ➔
          </button>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div style={styles.actionGrid}>
        
        {/* Card 1: Catalogue */}
        <div style={styles.actionCard}>
          <div style={styles.cardContent}>
            <h3 style={styles.cardTitle}>Topic Catalogue</h3>
            <p style={styles.cardDescription}>Review available K-12 math structural areas.</p>
            <button style={{ ...styles.cardBtn, backgroundColor: '#63b3ed', color: '#1a202c' }} onClick={() => onNavigate('catalogue')}>
              Open Catalogue
            </button>
          </div>
        </div>

        {/* Card 2: Progress */}
        <div style={styles.actionCard}>
          <div style={styles.cardContent}>
            <h3 style={styles.cardTitle}>Progress History</h3>
            <p style={styles.cardDescription}>View your quiz performance matrices and historical logs.</p>
            <button style={{ ...styles.cardBtn, backgroundColor: '#68d391', color: '#1a202c' }} onClick={() => onNavigate('progress')}>
              Open History
            </button>
          </div>
        </div>

        {/* Card 3: Quick Start */}
        <div style={{ ...styles.actionCard, borderColor: '#f56565' }}>
          <div style={styles.cardContent}>
            <h3 style={{ ...styles.cardTitle, color: '#f56565' }}>Quick Start Quiz</h3>
            <p style={styles.cardDescription}>Begin an immediate adaptive instructional challenge playthrough.</p>
            <button 
              style={{ 
                ...styles.cardBtn, 
                backgroundColor: activeSessionTopicId ? '#4a5568' : '#f56565', 
                color: activeSessionTopicId ? '#a0aec0' : '#1a202c',
                cursor: activeSessionTopicId ? 'not-allowed' : 'pointer'
              }} 
              onClick={() => onNavigate('catalogue')}
              disabled={activeSessionTopicId !== null}
            >
              Launch Challenge
            </button>
          </div>
        </div>

      </div>

      {/* Gamification Toggle Controls */}
      <div style={styles.toggleSection}>
        {!showAchievements ? (
          <button style={styles.achievementsToggleBtn} onClick={() => setShowAchievements(true)}>
            🏆 View Milestones & Achievements
          </button>
        ) : (
          <div style={styles.achievementsContainer}>
            <div style={styles.toggleHeader}>
              <button style={styles.hideAchievementsBtn} onClick={() => setShowAchievements(false)}>
                🙈 Hide Achievements Archive
              </button>
            </div>
            <AchievementsCard />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#2d3748', position: 'relative', zIndex: 1 },
  welcomeSection: { marginBottom: '2rem' },
  mainTitle: { margin: '0 0 0.5rem 0', fontSize: '2.2rem', fontWeight: 'bold', color: '#1a202c' },
  subtitle: { margin: 0, color: '#4a5568', fontSize: '1.1rem' },

  interceptorBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(217, 119, 6, 0.12)', border: '2px solid #d97706', borderRadius: '12px', padding: '1.25rem', marginBottom: '2.5rem', gap: '1.5rem', flexWrap: 'wrap' },
  bannerTextContainer: { display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 300px' },
  bannerTitle: { margin: 0, color: '#92400e', fontSize: '1.1rem', fontWeight: 'bold' },
  bannerDescription: { color: '#451a03', fontSize: '0.95rem', lineHeight: '1.4' },
  resumeBtn: { backgroundColor: '#d97706', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform 0.1s ease' },

  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '3rem' },
  actionCard: { backgroundColor: '#ffffff', border: '2px solid #d4af37', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' },
  cardContent: { display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', flexGrow: 1 },
  cardTitle: { margin: '0 0 0.75rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#1a202c' },
  cardDescription: { margin: '0 0 1.5rem 0', color: '#4a5568', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1 },
  cardBtn: { width: '100%', padding: '0.75rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },

  toggleSection: { marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  achievementsToggleBtn: { backgroundColor: '#ffffff', color: '#1a202c', border: '2px solid #d4af37', padding: '1rem 2rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  achievementsContainer: { width: '100%' },
  toggleHeader: { display: 'flex', justifyContent: 'center', marginBottom: '1rem' },
  hideAchievementsBtn: { background: '#f9f7f4', border: '2px solid #d4af37', color: '#2d3748', padding: '0.5rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500' }
};