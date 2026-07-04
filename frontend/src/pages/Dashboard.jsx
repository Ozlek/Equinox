import React, { useState, useEffect } from 'react';
import AchievementsCard from './Achievements';
import api from '../api/axios';

export default function DashboardWorkspace({ onNavigate, onStartQuiz }) {
  const [activeSessionTopicId, setActiveSessionTopicId] = useState(null);
  const [showAchievements, setShowAchievements] = useState(false);
  
  const [activeSessionMetadata, setActiveSessionMetadata] = useState({
    difficulty: 'Intermediate',
    modifiers: [],
    equipped_item: ''
  });

  useEffect(() => {
      api.get('/playthrough/check-session/')
      .then(res => {
        const data = res.data;
        if (data.has_active_session) {
          setActiveSessionTopicId(data.topic_id);
          setActiveSessionMetadata({
            difficulty: data.difficulty || 'Intermediate',
            modifiers: data.modifiers || [],
            equipped_item: data.equipped_item || ''
          });
        }
      })
      .catch(err => {
        console.error("Error identifying active adaptive playthrough sessions:", err);
      });
  }, []);

  return (
    <div className="graphing-paper" style={styles.container}>
      {/* Welcome Section - Notebook Paper Style */}
      <div style={styles.welcomePaper}>
        <div style={styles.notebookHeader}>
          <div style={styles.punchedHoles}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={styles.hole} />
            ))}
          </div>
          <div style={styles.headerContent}>
            <h2 style={styles.mainTitle}>Welcome to Equinox</h2>
            <p style={styles.subtitle}>Ready to improve your math skills today?</p>
          </div>
        </div>
        <div style={styles.ruledContent}>
          <div style={styles.redMargin} />
          <div style={{ flex: 1, padding: '0.75rem 1.25rem' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", lineHeight: '1.6' }}>
              Track your progress, explore topics, and challenge yourself with adaptive quizzes designed to grow with you.
            </p>
          </div>
        </div>
      </div>

      {activeSessionTopicId && (
        <div style={styles.interceptorPaper}>
          <div style={styles.notebookHeaderSmall}>
            <div style={styles.punchedHolesSmall}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={styles.holeSmall} />
              ))}
            </div>
            <div style={styles.headerContentSmall}>
              <h5 style={styles.bannerTitle}>⚠️ Session in Progress</h5>
              <span style={styles.bannerDescription}>
                You have an ongoing challenge. Resuming now prevents you from losing your progress!
              </span>
            </div>
          </div>
          <div style={styles.ruledContentSmall}>
            <div style={styles.redMarginSmall} />
            <div style={{ flex: 1, padding: '0.75rem 1rem', textAlign: 'right' }}>
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
          </div>
        </div>
      )}

      {/* Quick Action Navigation Grid - Notebook Card Style */}
      <div style={styles.actionGrid}>
        
        {/* Card 1: Catalogue */}
        <div style={styles.actionCard}>
          <div style={styles.notebookHeaderCard}>
            <div style={styles.punchedHolesCard}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={styles.holeCard} />
              ))}
            </div>
            <div style={styles.headerContentCard}>
              <h3 style={styles.cardTitle}>Topic Catalogue</h3>
            </div>
          </div>
          <div style={styles.ruledContentCard}>
            <div style={styles.redMarginCard} />
            <div style={styles.cardBody}>
              <p style={styles.cardDescription}>Review available Grades 1-10 math structural areas.</p>
              <button style={{ ...styles.cardBtn, backgroundColor: '#63b3ed', color: '#1a202c' }} onClick={() => onNavigate('catalogue')}>
                Open Catalogue
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Progress */}
        <div style={styles.actionCard}>
          <div style={styles.notebookHeaderCard}>
            <div style={styles.punchedHolesCard}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={styles.holeCard} />
              ))}
            </div>
            <div style={styles.headerContentCard}>
              <h3 style={styles.cardTitle}>Progress History</h3>
            </div>
          </div>
          <div style={styles.ruledContentCard}>
            <div style={styles.redMarginCard} />
            <div style={styles.cardBody}>
              <p style={styles.cardDescription}>View your quiz performance matrices and historical logs.</p>
              <button style={{ ...styles.cardBtn, backgroundColor: '#68d391', color: '#1a202c' }} onClick={() => onNavigate('progress')}>
                Open History
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Quick Start */}
        <div style={styles.actionCard}>
          <div style={{ ...styles.notebookHeaderCard, borderBottom: '3px solid #f56565' }}>
            <div style={styles.punchedHolesCard}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={styles.holeCard} />
              ))}
            </div>
            <div style={styles.headerContentCard}>
              <h3 style={{ ...styles.cardTitle, color: '#f56565' }}>Quick Start Quiz</h3>
            </div>
          </div>
          <div style={styles.ruledContentCard}>
            <div style={styles.redMarginCard} />
            <div style={styles.cardBody}>
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

      </div>

      {/* Achievements Section - always visible */}
      <div style={styles.achievementsSection}>
        <AchievementsCard />
      </div>

    </div>
  );
}

const styles = {
  container: {
    padding: '1.5rem 1rem',
    maxWidth: '100%',
    margin: '0 auto',
    color: '#2d3748',
    position: 'relative',
    zIndex: 1,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Welcome Paper (full notebook page style) ──
  welcomePaper: {
    backgroundColor: '#fefdfb',
    border: '1px solid #d6d3d1',
    borderRadius: '4px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '2rem',
    overflow: 'hidden',
  },
  notebookHeader: {
    position: 'relative',
    backgroundColor: '#1e293b',
    padding: '1rem 1.5rem 0.75rem',
    borderBottom: '3px solid #3b82f6',
  },
  punchedHoles: {
    position: 'absolute',
    left: '16px',
    top: '0',
    bottom: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: '8px 0',
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
    marginLeft: '24px',
  },
  mainTitle: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  subtitle: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '1rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  ruledContent: {
    display: 'flex',
    flexDirection: 'row',
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(203,213,225,0.3) 31px, rgba(203,213,225,0.3) 32px)',
    position: 'relative',
  },
  redMargin: {
    width: '3px',
    backgroundColor: '#ef4444',
    opacity: 0.5,
    flexShrink: 0,
    marginLeft: '1.5rem',
    alignSelf: 'stretch',
  },

  // ── Session Interceptor (small notebook style) ──
  interceptorPaper: {
    backgroundColor: '#fefdfb',
    border: '1px solid #d97706',
    borderRadius: '4px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    marginBottom: '2.5rem',
    overflow: 'hidden',
  },
  notebookHeaderSmall: {
    position: 'relative',
    backgroundColor: '#1e293b',
    padding: '0.75rem 1.25rem 0.5rem',
    borderBottom: '3px solid #d97706',
  },
  punchedHolesSmall: {
    position: 'absolute',
    left: '12px',
    top: '0',
    bottom: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: '4px 0',
    zIndex: 2,
  },
  holeSmall: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#fefdfb',
    border: '2px solid #475569',
  },
  headerContentSmall: {
    marginLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bannerTitle: {
    margin: 0,
    color: '#fde68a',
    fontSize: '1rem',
    fontWeight: 'bold',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  bannerDescription: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  ruledContentSmall: {
    display: 'flex',
    flexDirection: 'row',
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(203,213,225,0.3) 31px, rgba(203,213,225,0.3) 32px)',
    position: 'relative',
  },
  redMarginSmall: {
    width: '3px',
    backgroundColor: '#ef4444',
    opacity: 0.5,
    flexShrink: 0,
    marginLeft: '1.25rem',
    alignSelf: 'stretch',
  },
  resumeBtn: {
    backgroundColor: '#d97706',
    color: '#fff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.9rem',
  },

  // ── Card Grid ──
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
    marginBottom: '2rem',
  },
  actionCard: {
    backgroundColor: '#fefdfb',
    border: '1px solid #d6d3d1',
    borderRadius: '4px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // ── Card Notebook Header ──
  notebookHeaderCard: {
    position: 'relative',
    backgroundColor: '#1e293b',
    padding: '0.5rem 1rem 0.4rem',
    borderBottom: '3px solid #3b82f6',
    flexShrink: 0,
  },
  punchedHolesCard: {
    position: 'absolute',
    left: '10px',
    top: '0',
    bottom: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: '3px 0',
    zIndex: 2,
  },
  holeCard: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#fefdfb',
    border: '2px solid #475569',
  },
  headerContentCard: {
    marginLeft: '18px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Card Ruled Body ──
  ruledContentCard: {
    display: 'flex',
    flexDirection: 'row',
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(203,213,225,0.3) 31px, rgba(203,213,225,0.3) 32px)',
    backgroundColor: '#fefdfb',
    position: 'relative',
    flex: 1,
  },
  redMarginCard: {
    width: '3px',
    backgroundColor: '#ef4444',
    opacity: 0.5,
    flexShrink: 0,
    marginLeft: '1.25rem',
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    padding: '0.6rem 0.85rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardDescription: {
    margin: '0 0 0.75rem 0',
    color: '#64748b',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    flexGrow: 0,
  },
  cardBtn: {
    width: '100%',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Achievements Section ──
  achievementsSection: {
    marginTop: '1rem',
  },
};
