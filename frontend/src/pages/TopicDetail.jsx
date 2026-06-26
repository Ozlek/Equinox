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
      ],
      2: [
      {
      id:1,
      title:"Place Value",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Identify ones, tens and hundreds",
      "Read and write whole numbers",
      "Compare numbers"
      ],
      example:"245 = 2 hundreds, 4 tens, 5 ones",
      tip:"Start from the rightmost digit."
      }
      },
      {
      id:2,
      title:"Addition without Regrouping",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Add 2-digit numbers",
      "Align digits correctly",
      "Check answers"
      ],
      example:"24 + 15 = 39",
      tip:"Add ones before tens."
      }
      },
      {
      id:3,
      title:"Addition with Regrouping",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Carry numbers correctly",
      "Add larger values",
      "Understand regrouping"
      ],
      example:"38 + 27 = 65",
      tip:"If ones exceed 9, carry to the tens."
      }
      },
      {
      id:4,
      title:"Subtraction with Regrouping",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Subtract 2-digit numbers",
      "Borrow correctly",
      "Check subtraction"
      ],
      example:"52 − 18 = 34",
      tip:"Borrow from the next place value when needed."
      }
      },
      {
      id:5,
      title:"Money",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Identify Philippine coins",
      "Count money",
      "Solve simple money problems"
      ],
      example:"₱20 + ₱10 = ₱30",
      tip:"Group similar denominations."
      }
      },
      {
      id:6,
      title:"Word Problems",
      completed:false,
      locked:true,
      lesson:{
      objectives:[
      "Read carefully",
      "Choose the operation",
      "Solve daily-life problems"
      ],
      example:"Ben bought 12 mangoes then 8 more.",
      tip:"Underline important numbers."
      }
      }
      ],
      3: [
      {
      id:1,
      title:"Multiplication Basics",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Understand multiplication as repeated addition",
      "Multiply one-digit numbers",
      "Recognize multiplication sentences"
      ],
      example:"4 × 3 = 12",
      tip:"Think of multiplication as adding equal groups."
      }
      },
      {
      id:2,
      title:"Multiplication Tables",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Recall multiplication facts",
      "Practice tables from 2 to 10",
      "Build multiplication fluency"
      ],
      example:"7 × 6 = 42",
      tip:"Practice one multiplication table at a time."
      }
      },
      {
      id:3,
      title:"Division Basics",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Understand division as sharing equally",
      "Solve basic division problems",
      "Relate multiplication and division"
      ],
      example:"12 ÷ 3 = 4",
      tip:"Ask yourself how many equal groups can be made."
      }
      },
      {
      id:4,
      title:"Simple Fractions",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Recognize fractions",
      "Identify numerator and denominator",
      "Compare simple fractions"
      ],
      example:"1/2 of 8 = 4",
      tip:"A fraction represents equal parts of a whole."
      }
      },
      {
      id:5,
      title:"Measurement",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Measure length",
      "Measure mass",
      "Measure time"
      ],
      example:"1 meter = 100 centimeters",
      tip:"Always check the unit."
      }
      },
      {
      id:6,
      title:"Word Problems",
      completed:false,
      locked:true,
      lesson:{
      objectives:[
      "Analyze situations",
      "Choose the correct operation",
      "Solve step-by-step"
      ],
      example:"A box has 24 pencils shared by 6 students.",
      tip:"Underline important information."
      }
      }
      ],
      4: [
      {
      id:1,
      title:"Multi-digit Multiplication",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Multiply 2-digit numbers",
      "Use vertical multiplication",
      "Check answers"
      ],
      example:"24 × 13 = 312",
      tip:"Multiply each place value carefully."
      }
      },
      {
      id:2,
      title:"Long Division",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Divide large numbers",
      "Interpret remainders",
      "Use long division"
      ],
      example:"84 ÷ 6 = 14",
      tip:"Divide, multiply, subtract, bring down."
      }
      },
      {
      id:3,
      title:"Factors and Multiples",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Identify factors",
      "Find multiples",
      "Recognize common factors"
      ],
      example:"Factors of 12: 1,2,3,4,6,12",
      tip:"Factors divide evenly."
      }
      },
      {
      id:4,
      title:"Fractions and Decimals",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Compare fractions",
      "Convert simple decimals",
      "Understand place value"
      ],
      example:"0.5 = 1/2",
      tip:"Decimals are another way to write fractions."
      }
      },
      {
      id:5,
      title:"Geometry Basics",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Identify polygons",
      "Measure angles",
      "Recognize symmetry"
      ],
      example:"A square has four equal sides.",
      tip:"Look for equal sides and angles."
      }
      },
      {
      id:6,
      title:"Word Problems",
      completed:false,
      locked:true,
      lesson:{
      objectives:[
      "Solve multi-step problems",
      "Identify operations",
      "Interpret answers"
      ],
      example:"Maria bought 3 boxes with 24 candies each.",
      tip:"Break large problems into smaller parts."
      }
      }
      ],
      5: [
      {
      id:1,
      title:"Decimals",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Read decimals",
      "Compare decimals",
      "Add decimals"
      ],
      example:"3.25 + 1.50 = 4.75",
      tip:"Align decimal points."
      }
      },
      {
      id:2,
      title:"Percentages",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Understand percentages",
      "Convert fractions",
      "Solve simple percentage problems"
      ],
      example:"50% of 20 = 10",
      tip:"Percent means out of 100."
      }
      },
      {
      id:3,
      title:"Fraction Operations",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Add fractions",
      "Subtract fractions",
      "Simplify answers"
      ],
      example:"1/4 + 2/4 = 3/4",
      tip:"Add numerators when denominators are equal."
      }
      },
      {
      id:4,
      title:"Area and Perimeter",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Find perimeter",
      "Find area",
      "Use formulas"
      ],
      example:"Rectangle Area = length × width",
      tip:"Perimeter is around, area is inside."
      }
      },
      {
      id:5,
      title:"Volume",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Measure volume",
      "Apply formulas",
      "Interpret units"
      ],
      example:"2 × 3 × 4 = 24 cubic units",
      tip:"Volume uses cubic units."
      }
      },
      {
      id:6,
      title:"Word Problems",
      completed:false,
      locked:true,
      lesson:{
      objectives:[
      "Apply multiple concepts",
      "Interpret data",
      "Solve systematically"
      ],
      example:"Find the total cost of several items.",
      tip:"Read the question twice."
      }
      }
      ],
      6: [
      {
      id:1,
      title:"Ratios",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Understand ratios",
      "Write ratios",
      "Compare ratios"
      ],
      example:"2:3",
      tip:"Ratios compare quantities."
      }
      },
      {
      id:2,
      title:"Integers",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Recognize positive and negative numbers",
      "Compare integers",
      "Order integers"
      ],
      example:"-3 < 2",
      tip:"Numbers farther right are greater."
      }
      },
      {
      id:3,
      title:"Algebraic Expressions",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Recognize variables",
      "Evaluate expressions",
      "Simplify expressions"
      ],
      example:"x + 5",
      tip:"Variables represent unknown numbers."
      }
      },
      {
      id:4,
      title:"Statistics",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Read graphs",
      "Interpret data",
      "Find averages"
      ],
      example:"Mean = Sum ÷ Number of values",
      tip:"Always organize the data first."
      }
      },
      {
      id:5,
      title:"Probability",
      completed:false,
      locked:false,
      lesson:{
      objectives:[
      "Understand chance",
      "Find simple probability",
      "Interpret outcomes"
      ],
      example:"Rolling a 3 on a die = 1/6",
      tip:"Probability ranges from 0 to 1."
      }
      },
      {
      id:6,
      title:"Problem Solving",
      completed:false,
      locked:true,
      lesson:{
      objectives:[
      "Combine multiple skills",
      "Analyze situations",
      "Solve logically"
      ],
      example:"Solve a real-life multi-step problem.",
      tip:"Plan your solution before calculating."
      }
      }
      ],
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
      if (!topic) return;

      const lessons =
          LESSONS[topic.name]?.[selectedGrade];

      if (lessons?.length) {
          setSelectedLesson(lessons[0]);
      }
  }, [topic, selectedGrade]);

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
                    <p style={styles.workspaceSubtitle}>
                    📖 Grade {selectedGrade} Learning Journey
                    </p>
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
                        <span style={{color:"#1e293b",fontWeight:"700"}}>📖 Learning Progress</span>
                        <div style={styles.progressBar}>
                          <div style={styles.progressFill} />
                        </div>
                        <small style={{color:"#64748b"}}>2 of 6 Lessons Mastered</small>
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

                      📖 Grade {selectedGrade}

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
                          Master this lesson before starting your challenge.
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
    backgroundColor: '#5b8c5a',
    borderRadius: '6px',
    width: '100%',
    boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
    border: '2px solid #48734a',
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

  workspace: {
    display: "flex",
    gap: "2rem",
    alignItems: "stretch",
    marginTop: "1rem",
  },

  workspaceSubtitle: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    fontStyle: "italic",
    fontSize: ".85rem",
  },

  lessonSidebar: {
    width: "34%",
    borderRight: "2px dashed #d6d3d1",
    paddingRight: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },

  lessonCard: {
    background: "#fffefb",
    border: "1px solid #d6d3d1",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 4px 10px rgba(0,0,0,.06)",
    color: "#1e293b",
  },

  lessonPreview: {
    flex: 1,
    paddingLeft: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },

  lessonButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",

    width: "100%",

    padding: "0.85rem 1rem",

    border: "1px solid #d6d3d1",

    borderRadius: "8px",

    background: "#fffefb",

    color: "#1e293b",

    fontFamily: "'Georgia', serif",

    fontSize: "0.95rem",

    textAlign: "left",

    cursor: "pointer",

    transition: "all .15s ease",

    boxShadow: "0 2px 6px rgba(0,0,0,.05)",
  },

  lessonTitle: {
    margin: 0,
    color: "#1e293b",
    fontSize: "2rem",
    fontWeight: "700",
  },

  lessonIntro: {
    color: "#64748b",
    fontStyle: "italic",
    fontSize: "1rem",
    marginBottom: "1rem",
  },

  objectiveList: {
    paddingLeft: "1.25rem",
    lineHeight: 1.8,
    color: "#334155",
  },

  exampleBox: {
    background: "#eff6ff",
    color: "#1e293b",
    border: "1px solid #bfdbfe",
    padding: "1rem",
    borderRadius: "8px",
    fontWeight: "600",
  },

  tipBox: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fbbf24",
    padding: "1rem",
    borderRadius: "8px",
  },

  resourceCards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: "1rem",
  },

  resourceCardMini:{

  background:"#f8fafc",

  border:"1px solid #d6d3d1",

  borderRadius:"8px",

  padding:"1rem",

  display:"flex",

  flexDirection:"column",

  gap:"4px",

  textDecoration:"none",

  color:"#1e293b",

  transition:".15s",

  },

  progressBox: {
    background:"#fffefb",

    border:"1px solid #d6d3d1",

    borderRadius:"10px",

    padding:"1rem",

    boxShadow:"0 2px 8px rgba(0,0,0,.04)",
  },  

  progressBar: {
    height: "8px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
    margin: "8px 0",
  },

  progressFill: {
    width: "35%",
    height: "100%",
    background: "#22c55e",
  },

  noLessonSelected: {
    padding: "3rem",
    textAlign: "center",
    color: "#64748b",
  }
};