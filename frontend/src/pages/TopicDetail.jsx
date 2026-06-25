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
    // Guard against invalid topicId
    if (!topicId) {
      setError("No topic selected.");
      return;
    }

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

  if (error) return (
    <div style={styles.graphingPaper}>
      <div style={{ ...styles.message, color: '#dc2626' }}>⚠️ {error}</div>
    </div>
  );

  if (!topic) return (
    <div style={styles.graphingPaper}>
      <div style={styles.message}>Compiling Learning Module Properties...</div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes diagonalSlide {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -400px 400px, 0 0, 0 0; }
        }
      `}</style>
      <div style={styles.graphingPaper}>
        <div style={styles.pageWrapper}>
          {/* Notebook Cover Card */}
          <div style={styles.notebookCover}>
            {/* Spiral binding */}
            <div style={styles.spiralBinding}>
              {[...Array(10)].map((_, i) => (
                <div key={i} style={styles.spiralHole}>
                  <div style={styles.spiralRing} />
                </div>
              ))}
            </div>

            <div style={styles.coverContent}>
              {/* Marble texture */}
              <div style={styles.marbleAccent} />

              {/* Title label with back button */}
              <div style={styles.titleLabel}>
                <div style={styles.titleRow}>
                  <button style={styles.backIconBtn} onClick={onBack}>←</button>
                  <div style={styles.titleLabelInner}>
                    <h1 style={styles.coverTitle}>{topic.name}</h1>
                    <p style={styles.coverSubtitle}>Grades {topic.grade_level_min}-{topic.grade_level_max}</p>
                  </div>
                </div>
              </div>

              {/* Ruled notebook page */}
              <div style={styles.ruledPage}>
                <div style={styles.redMargin} />
                <div style={styles.pageInner}>
                  {/* Description */}
                  <div style={styles.descriptionRow}>
                    <p style={styles.description}>{topic.description}</p>
                    <span style={styles.gradeBadge}>Grade {selectedGrade}</span>
                  </div>

                  {/* Learning Resources Section */}
                  <div style={styles.resourcesSection}>
                    <h3 style={styles.sectionTitle}>📚 Learning Resources (Grade {selectedGrade})</h3>
                    
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
                  
                  {/* Action buttons */}
                  <div style={styles.actionsPanel}>
                    <div style={styles.stickyNoteWrapper}>
                      <button style={styles.stickyNoteStartBtn} onClick={() => setIsConfigModalOpen(true)}>
                        <span style={styles.stickyNotePin}>📌</span>
                        <span style={styles.stickyNoteLabel}>Start Challenge</span>
                      </button>
                    </div>

                    <div style={styles.stickyNoteWrapper}>
                      <button style={styles.stickyNoteLeaderBtn} onClick={() => setShowLeaderboard(true)}>
                        <span style={styles.stickyNotePin}>📌</span>
                        <span style={styles.stickyNoteLabel}>View Leaderboard</span>
                      </button>
                    </div>

                    <div style={styles.stickyNoteWrapper}>
                      <button style={styles.stickyNoteBackBtn} onClick={onBack}>
                        <span style={styles.stickyNotePin}>📌</span>
                        <span style={styles.stickyNoteLabel}>Back to Catalogue</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showLeaderboard && (
          <Leaderboard
            topicId={topic.id}
            topicName={topic.name}
            onClose={() => setShowLeaderboard(false)}
          />
        )}

        <ChallengeConfigModal 
          isOpen={isConfigModalOpen}
          topicTitle={topic.name}
          onClose={() => setIsConfigModalOpen(false)}
          onLaunch={(selectedDifficulty, activeMods, equippedModifier) => {
            setIsConfigModalOpen(false);
            onStartChallenge(topic.id, selectedDifficulty, activeMods, equippedModifier);
          }}
        />
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
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: '1.5rem 1rem',
    boxSizing: 'border-box',
    position: 'relative',
    minHeight: 'calc(100vh - 60px)',
  },

  pageWrapper: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '900px',
    position: 'relative',
    zIndex: 1,
  },

  notebookCover: {
    position: 'relative',
    display: 'flex',
    backgroundColor: '#1e293b',
    borderRadius: '6px',
    width: '100%',
    boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
    border: '2px solid #334155',
    overflow: 'hidden',
  },

  spiralBinding: {
    position: 'absolute',
    left: '16px',
    top: '30px',
    bottom: '30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  spiralHole: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#0f172a',
    border: '2px solid #475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  spiralRing: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#64748b',
  },

  coverContent: {
    position: 'relative',
    flex: 1,
    padding: '1.75rem 1.5rem 1.75rem 2.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },

  marbleAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: [
      'radial-gradient(ellipse at 20% 30%, rgba(99, 179, 237, 0.05) 0%, transparent 50%)',
      'radial-gradient(ellipse at 80% 20%, rgba(192, 132, 252, 0.04) 0%, transparent 40%)',
      'radial-gradient(ellipse at 50% 80%, rgba(13, 202, 240, 0.03) 0%, transparent 50%)',
    ].join(', '),
    pointerEvents: 'none',
  },

  titleLabel: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    backgroundColor: '#334155',
    border: '1px solid #475569',
    borderRadius: '3px',
    padding: '0.65rem 1rem',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  backIconBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '0 4px',
    fontFamily: "'Georgia', serif",
    lineHeight: 1,
  },
  titleLabelInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    flex: 1,
  },
  coverTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#60a5fa',
    fontStyle: 'italic',
    margin: 0,
    letterSpacing: '0.02em',
  },
  coverSubtitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontStyle: 'italic',
    margin: 0,
  },

  ruledPage: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    backgroundColor: '#f8f7f4',
    borderRadius: '3px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
  },

  redMargin: {
    width: '3px',
    backgroundColor: '#ef4444',
    opacity: 0.4,
    flexShrink: 0,
  },

  pageInner: {
    flex: 1,
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  descriptionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
  },

  description: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.95rem',
    color: '#475569',
    lineHeight: '1.6',
    margin: 0,
    flex: 1,
  },

  gradeBadge: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '0.3rem 0.6rem',
    borderRadius: '3px',
    fontSize: '0.65rem',
    fontFamily: "'Courier New', monospace",
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },

  resourcesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },
  loadingText: {
    textAlign: 'center',
    color: '#64748b',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontStyle: 'italic',
    padding: '2rem',
  },
  resourcesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  resourceCard: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    padding: '1.25rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  resourceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  resourceTitle: {
    margin: 0,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  resourceTypeBadge: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '0.2rem 0.5rem',
    borderRadius: '3px',
    fontSize: '0.6rem',
    fontFamily: "'Courier New', monospace",
    fontWeight: 'bold',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  resourceDescription: {
    color: '#64748b',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.85rem',
    lineHeight: '1.5',
    marginBottom: '0.75rem',
  },
  iframeContainer: {
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  iframe: {
    display: 'block',
  },
  externalLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '4px',
    textAlign: 'center',
  },
  externalLinkText: {
    color: '#64748b',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  externalLinkButton: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#93c5fd',
    color: '#1e293b',
    border: 'none',
    borderRadius: '2px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontStyle: 'italic',
  },
  fallbackLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    backgroundColor: '#fff',
    border: '2px dashed #cbd5e1',
    borderRadius: '4px',
    textAlign: 'center',
  },
  fallbackText: {
    color: '#64748b',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.85rem',
    marginBottom: '1rem',
  },
  fallbackButton: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#e2e8f0',
    color: '#1e293b',
    border: 'none',
    borderRadius: '2px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  noResources: {
    textAlign: 'center',
    padding: '1.5rem',
    color: '#64748b',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontStyle: 'italic',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
  },

  actionsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
  },

  stickyNoteWrapper: {
    display: 'flex',
    justifyContent: 'center',
  },

  stickyNoteStartBtn: {
    width: '100%',
    padding: '0.7rem 1rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.9rem',
    fontWeight: 'bold',
    backgroundColor: '#86efac',
    color: '#1e293b',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    transform: 'rotate(-0.4deg)',
    boxShadow: '2px 3px 8px rgba(0,0,0,0.12), -1px -1px 0 rgba(255,255,255,0.4) inset',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },

  stickyNoteLeaderBtn: {
    width: '100%',
    padding: '0.7rem 1rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.9rem',
    fontWeight: 'bold',
    backgroundColor: '#fde68a',
    color: '#92400e',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    transform: 'rotate(0.3deg)',
    boxShadow: '2px 3px 8px rgba(0,0,0,0.12), -1px -1px 0 rgba(255,255,255,0.4) inset',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },

  stickyNoteBackBtn: {
    width: '100%',
    padding: '0.7rem 1rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.85rem',
    fontWeight: '500',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    transform: 'rotate(-0.2deg)',
    boxShadow: '2px 3px 8px rgba(0,0,0,0.1), -1px -1px 0 rgba(255,255,255,0.3) inset',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },

  stickyNotePin: {
    fontSize: '0.85rem',
    lineHeight: 1,
  },

  stickyNoteLabel: {
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
  },

  message: {
    textAlign: 'center',
    color: '#475569',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '1rem',
    fontStyle: 'italic',
    padding: '5rem',
  },
};