import React, { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard';
import ChallengeConfigModal from './ChallengeConfig';
import api from '../api/axios';

export default function TopicDetail({ topicId, selectedGrade, onBack, onStartChallenge }) {
  const [topic, setTopic] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [failedEmbeds, setFailedEmbeds] = useState({});

  useEffect(() => {
    // Axios resolves relative routing paths using your centralized base domain rules
    api.get(`/topics/${topicId}/`)
      .then((res) => {
        setTopic(res.data); // Content payload unpacked automatically
      })
      .catch((err) => {
        console.error(`Error compiling learning module metadata for ID ${topicId}:`, err);
        setError("Unable to recover properties for this educational framework node.");
      });
  }, [topicId]);

  // Fetch learning resources when grade changes
  useEffect(() => {
    if (topicId && selectedGrade) {
      setLoadingResources(true);
      setFailedEmbeds({});
      api.get(`/playthrough/topics/${topicId}/resources/?grade_level=${selectedGrade}`)
        .then((res) => {
          setResources(res.data.resources);
          setLoadingResources(false);
        })
        .catch((err) => {
          console.error("Error loading learning resources:", err);
          setResources([]);
          setLoadingResources(false);
        });
    }
  }, [topicId, selectedGrade]);

  const handleIframeError = (resourceId) => {
    setFailedEmbeds(prev => ({ ...prev, [resourceId]: true }));
  };

  if (error) return <div style={{ ...styles.message, color: '#f56565' }}>⚠️ {error}</div>;

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

        <div style={styles.headerRow}>
          <p style={styles.description}>{topic.description}</p>
          <span style={styles.gradeBadge}>{selectedGrade}</span>
        </div>
        
        <div style={styles.reviewSection}>
          <h3 style={styles.sectionTitle}>📋 Review Section</h3>
          <p style={styles.reviewPlaceholder}>
            Learning materials and instructional walkthrough structural points for this topic will appear here soon.
          </p>
        </div>

        {/* Learning Resources Section */}
        <div style={styles.resourcesSection}>
          <h3 style={styles.resourcesTitle}>📚 Learning Resources ({selectedGrade})</h3>
          
          {loadingResources ? (
            <div style={styles.loadingText}>Loading learning resources...</div>
          ) : resources.length > 0 ? (
            <div style={styles.resourcesList}>
              {resources.map((resource) => (
                <div key={resource.id} style={styles.resourceCard}>
                  <div style={styles.resourceHeader}>
                    <h4 style={styles.resourceTitle}>{resource.title}</h4>
                    <span style={styles.resourceTypeBadge}>{resource.type}</span>
                  </div>
                  {resource.description && (
                    <p style={styles.resourceDescription}>{resource.description}</p>
                  )}
                  <div style={styles.iframeContainer}>
                    {resource.type === 'KHAN_ACADEMY' ? (
                      <div style={styles.externalLink}>
                        <p style={styles.externalLinkText}>
                          📚 This resource is hosted on Khan Academy
                        </p>
                        <a 
                          href={resource.embed_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={styles.externalLinkButton}
                        >
                          Open Khan Academy Lesson →
                        </a>
                      </div>
                    ) : failedEmbeds[resource.id] ? (
                      <div style={styles.fallbackLink}>
                        <p style={styles.fallbackText}>This embed cannot be displayed directly.</p>
                        <a 
                          href={resource.embed_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={styles.fallbackButton}
                        >
                          Open Resource in New Tab →
                        </a>
                      </div>
                    ) : (
                      <iframe
                        src={resource.embed_url}
                        width="100%"
                        height="500"
                        frameBorder="0"
                        allowFullScreen
                        title={resource.title}
                        style={styles.iframe}
                        onError={() => handleIframeError(resource.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.noResources}>
              <p>No learning resources available for this grade level yet.</p>
            </div>
          )}
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
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  description: { fontSize: '1.1rem', color: '#e2e8f0', lineHeight: '1.6', margin: '0 0 1rem 0', flex: 1 },
  gradeBadge: { backgroundColor: '#4a5568', color: '#e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap' },
  reviewSection: { backgroundColor: 'rgba(45, 55, 72, 0.3)', border: '1px solid #2d3748', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' },
  resourcesSection: { marginTop: '2rem', marginBottom: '2rem' },
  resourcesTitle: { margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' },
  loadingText: { textAlign: 'center', color: '#a0aec0', padding: '2rem' },
  resourcesList: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  resourceCard: { backgroundColor: '#111827', border: '1px solid #2d3748', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  resourceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' },
  resourceTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', flex: 1 },
  resourceTypeBadge: { backgroundColor: '#4a5568', color: '#e2e8f0', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' },
  resourceDescription: { color: '#a0aec0', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' },
  iframeContainer: { marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2d3748' },
  iframe: { display: 'block' },
  externalLink: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', backgroundColor: '#1a202c', border: '2px solid #4a5568', borderRadius: '8px', textAlign: 'center' },
  externalLinkText: { color: '#a0aec0', fontSize: '1rem', marginBottom: '1rem' },
  externalLinkButton: { padding: '0.75rem 1.5rem', backgroundColor: '#63b3ed', color: '#1a202c', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', textDecoration: 'none', display: 'inline-block' },
  fallbackLink: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', backgroundColor: '#111827', border: '2px dashed #4a5568', borderRadius: '8px', textAlign: 'center' },
  fallbackText: { color: '#a0aec0', fontSize: '1rem', marginBottom: '1rem' },
  fallbackButton: { padding: '0.75rem 1.5rem', backgroundColor: '#63b3ed', color: '#1a202c', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', textDecoration: 'none', display: 'inline-block' },
  noResources: { textAlign: 'center', padding: '2rem', color: '#a0aec0', backgroundColor: 'rgba(45, 55, 72, 0.3)', borderRadius: '12px', border: '1px solid #2d3748' },
  sectionTitle: { margin: '0 0 0.75rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' },
  reviewPlaceholder: { margin: 0, color: '#a0aec0', fontSize: '0.95rem', lineHeight: '1.5' },
  actionsPanel: { display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' },
  startBtn: { flex: '2 1 240px', padding: '0.85rem 1.5rem', backgroundColor: '#68d391', color: '#1a202c', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
  leaderboardBtn: { flex: '1 1 180px', padding: '0.85rem 1.5rem', backgroundColor: '#ecc94b', color: '#744210', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },
  backBtn: { flex: '1 1 160px', padding: '0.85rem 1.5rem', backgroundColor: '#4a5568', color: '#e2e8f0', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' },
  message: { textAlign: 'center', color: '#a0aec0', padding: '5rem', fontSize: '1.1rem' }
};