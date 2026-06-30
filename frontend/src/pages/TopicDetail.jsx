import React, { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard';
import ChallengeConfigModal from './ChallengeConfig';
import api from '../api/axios';

const LESSONS = {
    Arithmetic: {
      1: [
        {
          id: 1,
          title: "Counting Numbers",
          completed: true,
          locked: false,
          lesson: {
            objectives: [
              "Count numbers from 1 to 20",
              "Count objects correctly",
              "Recognize increasing number order"
            ],
            example: "🍎🍎🍎🍎 = 4",
            tip: "Point to each object while counting."
          }
        },
        {
          id:2,

          title:"Number Recognition",

          completed:true,

          locked:false,

          lesson:{
              objectives:[

                  "Recognize numbers from 0 to 20",

                  "Identify missing numbers",

                  "Read numbers correctly"

              ],
              example:"15",
              tip:"Practice reading numbers aloud."
          }
        },
        {
          id: 3,
          title: "Addition within 10",
          completed: false,
          locked: false,
          lesson: {
            objectives: [
              "Add two numbers within 10",
              "Represent addition using objects",
              "Solve simple addition problems"
            ],
            example: "3 + 2 = 5",
            tip: "Start counting from the bigger number."
          }
        },
        {
          id: 4,
          title: "Addition within 20",
          completed: false,
          locked: false,
          lesson: {
            objectives: [
              "Add numbers within 20",
              "Use counting strategies",
              "Solve simple equations"
            ],
            example: "13 + 5 = 18",
            tip: "Break the second number into smaller parts."
          }
        },
        {
          id: 5,
          title: "Subtraction within 10",
          completed: false,
          locked: false,
          lesson: {
            objectives: [
              "Subtract numbers within 10",
              "Understand taking away",
              "Solve subtraction problems"
            ],
            example: "9 − 4 = 5",
            tip: "Count backwards carefully."
          }
        },
        {
          id: 6,
          title: "Word Problems",
          completed: false,
          locked: true,
          lesson: {
            objectives: [
              "Read mathematical situations",
              "Identify important numbers",
              "Choose the correct operation"
            ],
            example: "Anna has 5 apples and buys 3 more.",
            tip: "Underline important numbers before solving."
          }
        }
      ]
    }
  };

export default function TopicDetail({ topicId, selectedGrade, onBack, onStartChallenge }) {
  const [topic, setTopic] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [failedEmbeds, setFailedEmbeds] = useState({});
  const [selectedLesson, setSelectedLesson] = useState(null);

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

                  {/* Learning Workspace */}
                  <div style={styles.workspace}>

                    {/* LEFT PANEL */}
                    <div style={styles.lessonSidebar}>

                      <h3 style={styles.sectionTitle}>
                        📚 Learning Journey
                      </h3>

                      <div style={styles.progressBox}>
                        <span>📖 Learning Progress</span>
                        <div style={styles.progressBar}>
                          <div style={styles.progressFill} />
                        </div>
                        <small>2 of 6 Lessons Mastered</small>
                      </div>

                      {(LESSONS[topic.name]?.[selectedGrade] || []).map((lesson) => {

                        const isSelected =
                          selectedLesson?.id === lesson.id;

                        return (

                          <button
                            key={lesson.id}
                            disabled={lesson.locked}
                            onClick={() => setSelectedLesson(lesson)}
                            style={{
                              ...styles.lessonButton,

                              backgroundColor: isSelected ? "#dbeafe" : "#fffefb",
                              border: isSelected
                                ? "2px solid #3b82f6"
                                : "1px solid #d6d3d1",
                              fontWeight: isSelected ? "700" : "500",

                              opacity:
                                lesson.locked
                                  ? 0.55
                                  : 1,

                              cursor:
                                lesson.locked
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >

                            <span>

                              {lesson.locked
                                ? "🔒"
                                : lesson.completed
                                  ? "✅"
                                  : isSelected
                                    ? "⭐"
                                    : "📖"}

                            </span>

                            <span>{lesson.title}</span>

                          </button>

                        );

                      })}

                    </div>

                    {/* RIGHT PANEL */}

                    <div style={styles.lessonPreview}>

                      {selectedLesson && (

                      <div style={styles.lessonCard}>

                      <h2 style={styles.lessonTitle}>
                          {selectedLesson.title}
                      </h2>
                      <div
                      style={{
                      display:"inline-flex",
                      alignItems:"center",
                      gap:"8px",
                      marginBottom:"1rem"
                      }}
                      >

                      <span
                      style={{
                      background:"#dcfce7",
                      padding:"4px 10px",
                      borderRadius:"999px",
                      fontSize:".75rem",
                      fontWeight:"700",
                      color:"#166534"
                      }}
                      >

                      ⭐ Beginner Lesson

                      </span>

                      <span
                      style={{
                      fontSize:".75rem",
                      color:"#64748b"
                      }}
                      >

                      Estimated Time: ⏱ 3–5 minutes

                      </span>
                      </div>

                      <p style={styles.lessonIntro}>
                          Master this lesson before entering a Playthrough.
                      </p>

                      {selectedLesson.lesson && (

                      <>

                      <h4 style={{ color:"#1e293b", marginBottom:"0.5rem", fontWeight:"700", fontSize:"1rem" }}>
                      🎯 Learning Objectives
                      </h4>

                      <ul style={styles.objectiveList}>
                      {selectedLesson.lesson.objectives.map(objective => (

                      <li
                          key={objective}
                          style={{
                              color:"#334155",
                              marginBottom:"8px"
                          }}
                        >
                          {objective}
                      </li>

                      ))}
                      </ul>

                      <h4 style={{ color:"#1e293b", marginBottom:"0.5rem" }}>
                      📝 Example Problem
                      </h4>

                      <div style={styles.exampleBox}>
                      {selectedLesson.lesson.example}
                      </div>

                      <h4 style={{ color:"#1e293b", marginBottom:"0.5rem" }}>
                      💡 Remember
                      </h4>

                      <div style={styles.tipBox}>
                      {selectedLesson.lesson.tip}
                      </div>

                      </>

                      )}

                      <h4
                      style={{
                      marginTop:"1.5rem",
                      marginBottom:"0.75rem",
                      color:"#1e293b"
                      }}
                      >
                      📚 Learning Resources
                      </h4>

                      <div style={styles.resourceCards}>

                      {resources.map(resource=>(

                      <a
                      key={resource.id}
                      href={resource.embed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.resourceCardMini}
                      >

                      <strong style={{color:"#1e293b"}}>{resource.title}</strong>

                      <small
                      style={{
                      marginTop:"4px",
                      color:"#64748b"
                      }}
                      >
                      📘 Open Resource →
                      </small>

                      <span
                      style={{
                          color:"#64748b",
                          fontSize:".75rem",
                          marginTop:"4px"
                      }}
                      >
                      {resource.type}
                      </span>

                      </a>

                      ))}

                      </div>

                      </div>

                      )}

                    </div>

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
    fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#60a5fa',
    margin: 0,
    letterSpacing: '0.02em',
  },
  coverSubtitle: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.85rem',
    color: '#94a3b8',
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
    color: '#1e293b',
  },

  descriptionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
  },

  description: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
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

  workspace: {
    display: 'flex',
    gap: '1.5rem',
  },

  lessonSidebar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  sectionTitle: {
    fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },

  progressBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    padding: '0.75rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.95rem',
    color: '#475569',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#cbd5e1',
    borderRadius: '999px',
    overflow: 'hidden',
  },

  progressFill: {
    width: '33%',
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: '999px',
  },

  lessonButton: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    textAlign: 'left',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease',
    color: '#1e293b',
  },

  lessonPreview: {
    flex: 1.5,
  },

  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },

  lessonTitle: {
    fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 0,
    marginBottom: '0.5rem',
  },

  lessonIntro: {
    color: '#64748b',
    fontSize: '0.95rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    marginBottom: '1rem',
  },

  objectiveList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  exampleBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '1rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.1rem',
    color: '#1e293b',
    marginBottom: '1rem',
  },

  tipBox: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.95rem',
    color: '#92400e',
    marginBottom: '1rem',
  },

  resourceCards: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  resourceCardMini: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.6rem 0.75rem',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    color: '#1e293b',
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
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
    fontWeight: 'bold',
    backgroundColor: '#86efac',
    color: '#1e293b',
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
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
    fontWeight: 'bold',
    backgroundColor: '#fde68a',
    color: '#92400e',
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
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
    fontWeight: '500',
    backgroundColor: '#e2e8f0',
    color: '#475569',
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