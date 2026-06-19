import React, { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard';
import ChallengeConfigModal from './ChallengeConfig';

export default function TopicDetail({ topicId, onBack, onStartChallenge }) {
  const [topic, setTopic] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/topics/${topicId}/`, { method: 'GET' })
      .then((res) => res.json())
      .then((data) => setTopic(data));
  }, [topicId]);

  if (!topic) return <div style={styles.message}>Compiling Learning Module Properties...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={styles.header}>
          <div>
            <span style={styles.gradeMeta}>
              {topic.grade_level.toLowerCase().includes('grade') ? topic.grade_level : `${topic.grade_level}`}
            </span>
            <h1 style={styles.mainTitle}>{topic.name}</h1>
          </div>
          <button 
            style={styles.closeBtn} 
            title="Back to Catalogue" 
            onClick={onBack}
          >
            ✕
          </button>
        </div>

        <p style={styles.description}>{topic.description}</p>
        
        <div style={styles.reviewSection}>
          <h3 style={styles.sectionTitle}>📋 Review Section</h3>
          <p style={styles.reviewPlaceholder}>
            Learning materials and instructional walkthrough structural points for this topic will appear here soon.
          </p>
        </div>
        
        <div style={styles.actionsPanel}>
          <button style={styles.startBtn} onClick={() => setIsConfigModalOpen(true)}>
            Start Challenge Playthrough ➔
          </button>
          
          <button style={styles.leaderboardBtn} onClick={() => setShowLeaderboard(true)}>
            🏆 View Leaderboard
          </button>
          
          <button style={styles.backBtn} onClick={onBack}>
            Back to Catalogue
          </button>
        </div>
      </div>

      {/* Leaderboard Popup Display Module */}
      {showLeaderboard && (
        <Leaderboard
          topicId={topic.id}
          topicName={topic.name}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* MATCHED: Intercepts multi-variable layout parameters from the configuration panel */}
      <ChallengeConfigModal 
        isOpen={isConfigModalOpen}
        topicTitle={topic.name}
        onClose={() => setIsConfigModalOpen(false)}
        onLaunch={(selectedDifficulty, activeMods, equippedModifier) => {
          setIsConfigModalOpen(false);
          // Pass all configuration tracks up to the App.jsx parent core
          onStartChallenge(topic.id, selectedDifficulty, activeMods, equippedModifier);
        }}
      />
    </div>
  );
}

const styles = {
  container: { padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', overflowY: 'auto', boxSizing: 'border-box' },
  card: { backgroundColor: '#1a202c', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '850px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#f7fafc', position: 'relative', border: '1px solid #2d3748', marginTop: 'auto', marginBottom: 'auto', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #2d3748', paddingBottom: '1.25rem', marginBottom: '1.5rem', gap: '16px' },
  gradeMeta: { color: '#63b3ed', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  mainTitle: { margin: '4px 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#fff' },
  closeBtn: { backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.2)', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' },
  description: { fontSize: '1.1rem', color: '#e2e8f0', lineHeight: '1.6', margin: '0 0 2rem 0' },
  reviewSection: { backgroundColor: 'rgba(45, 55, 72, 0.3)', border: '1px solid #2d3748', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem' },
  sectionTitle: { margin: '0 0 0.75rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' },
  reviewPlaceholder: { margin: 0, color: '#a0aec0', fontSize: '0.95rem', lineHeight: '1.5' },
  actionsPanel: { display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' },
  startBtn: { flex: '2 1 240px', padding: '0.85rem 1.5rem', backgroundColor: '#68d391', color: '#1a202c', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  leaderboardBtn: { flex: '1 1 180px', padding: '0.85rem 1.5rem', backgroundColor: '#ecc94b', color: '#744210', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },
  backBtn: { flex: '1 1 160px', padding: '0.85rem 1.5rem', backgroundColor: '#4a5568', color: '#e2e8f0', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },
  message: { textAlign: 'center', color: '#a0aec0', padding: '5rem', fontSize: '1.1rem' }
};