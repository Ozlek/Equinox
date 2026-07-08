import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function TopicCatalogue({ onSelectTopic, userGrade }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrades, setSelectedGrades] = useState({});
  const [modifiedTopics, setModifiedTopics] = useState({});

  useEffect(() => {
    api.get('/topics/')
      .then((res) => {
        setTopics(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error retrieving topic catalogue:", err);
        setError("Unable to load the topic catalogue. Please try again.");
        setLoading(false);
      });
  }, []);

  // Initialize default grade for each topic (use min grade)
  useEffect(() => {
  if (topics.length > 0) {
    const defaults = {};

    topics.forEach(topic => {
      if (
        userGrade &&
        userGrade >= topic.grade_level_min &&
        userGrade <= topic.grade_level_max
      ) {
        defaults[topic.id] = userGrade;
      } else {
        defaults[topic.id] = topic.grade_level_min || 1;
      }
    });

    setSelectedGrades(defaults);
  }
}, [topics, userGrade]);

  const handleGradeChange = (topicId, grade) => {
    const parsed = parseInt(grade, 10);

    setSelectedGrades(prev => ({
      ...prev,
      [topicId]: parsed
    }));

    setModifiedTopics(prev => ({
        ...prev,
        [topicId]: true
      }));
  };

  if (loading) return (
    <div style={styles.graphingPaper}>
      <div style={styles.message}>Loading Topic Catalogue Matrix...</div>
    </div>
  );

  if (error) return (
    <div style={styles.graphingPaper}>
      <div style={{ ...styles.message, color: '#dc2626' }}>⚠️ {error}</div>
    </div>
  );

  const stickyNoteColors = [
    { bg: '#93c5fd', text: '#1e293b', rotate: '-0.8deg' },   // blue
    { bg: '#86efac', text: '#1e293b', rotate: '0.5deg' },    // green
    { bg: '#fde68a', text: '#92400e', rotate: '-0.3deg' },   // yellow
    { bg: '#f9a8d4', text: '#831843', rotate: '0.7deg' },    // pink
    { bg: '#c4b5fd', text: '#312e81', rotate: '-0.5deg' },   // purple
  ];

  // Split topics into recommended and explore based on userGrade
  const recommendedTopics = [];
  const exploreTopics = [];
  
  topics.forEach((topic, index) => {
    const topicInfo = { ...topic, colorIndex: index % stickyNoteColors.length };
    if (userGrade && topic.grade_level_min <= userGrade && userGrade <= topic.grade_level_max) {
      recommendedTopics.push(topicInfo);
    } else {
      exploreTopics.push(topicInfo);
    }
  });

  const renderTopicCard = (topic, index) => {
    const color = stickyNoteColors[topic.colorIndex];
    const currentGrade = selectedGrades[topic.id] || topic.grade_level_min || 1;
    
    // Generate grade options from min to max
    const gradeOptions = [];
    for (let g = topic.grade_level_min; g <= topic.grade_level_max; g++) {
      gradeOptions.push(g);
    }

    // Determine if this grade is different from user's grade
    const gradeDiff = currentGrade - userGrade;
    const showMismatchWarning = modifiedTopics[topic.id] && userGrade && gradeDiff !== 0;

    return (
      <div 
        key={topic.id} 
        style={{
          ...styles.stickyNote,
          backgroundColor: color.bg,
          color: color.text,
          transform: `rotate(${color.rotate})`,
        }}
      >
        <div style={styles.stickyNotePin}>📌</div>
        <div style={styles.stickyNoteContent}>
          <div style={styles.stickyNoteHeader}>
            <h3 style={{ ...styles.stickyNoteTitle, color: color.text }}>{topic.name}</h3>
            <span style={{ ...styles.stickyNoteBadge, backgroundColor: color.text, color: color.bg }}>
              Recommended for Grades {topic.grade_level_min}-{topic.grade_level_max}
            </span>
          </div>
          
          <p style={{ ...styles.stickyNoteDesc, color: color.text }}>{topic.description}</p>
          
          {/* Grade mismatch warning */}
          {showMismatchWarning && (
            <div style={{
              ...styles.gradeWarning,
              backgroundColor: gradeDiff > 0 ? '#fef3c7' : '#dbeafe',
              color: gradeDiff > 0 ? '#92400e' : '#1e40af',
              borderColor: gradeDiff > 0 ? '#f59e0b' : '#3b82f6',
            }}>
            {gradeDiff > 0 ? '⚠️ More challenging concepts' : 'ℹ️ May cover familiar material'}
            </div>
          )}
          
          <div style={styles.gradeSelector}>
            <label style={{ ...styles.gradeLabel, color: color.text }}>Select Grade Level</label>
            <select 
              style={{
                ...styles.gradeSelect,
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderColor: color.text,
                color: color.text,
              }}
              value={currentGrade}
              onChange={(e) => handleGradeChange(topic.id, e.target.value)}
            >
              {gradeOptions.map(grade => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          <button 
            style={{
              ...styles.stickyNoteActionBtn,
              backgroundColor: color.text,
              color: color.bg,
            }}
            onClick={() => onSelectTopic(topic.id, currentGrade)}
          >
            Review Topic ➔
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes diagonalSlide {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -400px 400px, 0 0, 0 0; }
        }
      `}</style>
      <div style={styles.graphingPaper}>
        <div style={styles.content}>
          {/* Title */}
          <div style={styles.headerArea}>
            <h1 style={styles.mainTitle}>📚 Topic Catalogue</h1>
            <p style={styles.adventureMessage}>Choose your learning adventure!</p>
            {userGrade && (
              <p style={styles.subtitle}>
                Showing topics for Grade {userGrade} • 
                <span style={{ color: '#059669', fontWeight: '600' }}> {recommendedTopics.length} recommended</span> • 
                <span style={{ color: '#64748b' }}> {exploreTopics.length} to explore</span>
              </p>
            )}
          </div>

          {/* Recommended Topics Section */}
          {recommendedTopics.length > 0 && (
            <>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>⭐</span>
                <h2 style={styles.sectionTitle}>Recommended for Grade {userGrade}</h2>
              </div>
              <div style={styles.grid}>
                {recommendedTopics.map(topic => renderTopicCard(topic, topic.colorIndex))}
              </div>
            </>
          )}

          {/* Explore Other Topics Section */}
          {exploreTopics.length > 0 && (
            <>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>🔍</span>
                <h2 style={{ ...styles.sectionTitle, color: '#64748b' }}>Explore Other Topics</h2>
              </div>
              <div style={styles.grid}>
                {exploreTopics.map(topic => renderTopicCard(topic, topic.colorIndex))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  graphingPaper: {
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: '#f5f3f0',
    backgroundImage: [
      "url('data:image/svg+xml;utf8,<svg width=\"400\" height=\"400\" xmlns=\"http://www.w3.org/2000/svg\"><text x=\"50\" y=\"70\" font-size=\"48\" font-weight=\"bold\" fill=\"rgba(239,68,68,0.25)\" text-anchor=\"middle\">+</text><text x=\"200\" y=\"120\" font-size=\"48\" font-weight=\"bold\" fill=\"rgba(251,191,36,0.25)\" text-anchor=\"middle\">−</text><text x=\"350\" y=\"170\" font-size=\"48\" font-weight=\"bold\" fill=\"rgba(79,70,229,0.25)\" text-anchor=\"middle\">×</text><text x=\"100\" y=\"220\" font-size=\"48\" font-weight=\"bold\" fill=\"rgba(34,197,94,0.3)\" text-anchor=\"middle\">÷</text><text x=\"300\" y=\"280\" font-size=\"48\" font-weight=\"bold\" fill=\"rgba(239,68,68,0.25)\" text-anchor=\"middle\">+</text><text x=\"150\" y=\"330\" font-size=\"48\" font-weight=\"bold\" fill=\"rgba(251,191,36,0.25)\" text-anchor=\"middle\">−</text></svg>')",
      'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
      'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
    ].join(', '),
    backgroundRepeat: 'repeat',
    animation: 'diagonalSlide 12s linear infinite',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '1.5rem 1rem',
    boxSizing: 'border-box',
    position: 'relative',
    minHeight: 'calc(100vh - 60px)',
  },

  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '1100px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },

  headerArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0',
  },
  mainTitle: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  adventureMessage: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.1rem',
    color: '#059669',
    margin: '0.25rem 0 0.5rem',
    fontWeight: '500',
  },
  subtitle: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.95rem',
    color: '#64748b',
    margin: 0,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '28px',
  },

  stickyNote: {
    borderRadius: '3px',
    padding: '1.5rem 1.25rem',
    boxShadow: '4px 5px 14px rgba(0,0,0,0.15), -1px -1px 0 rgba(255,255,255,0.4) inset',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    position: 'relative',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  stickyNotePin: {
    position: 'absolute',
    top: '-4px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '1rem',
    lineHeight: 1,
    zIndex: 2,
  },

  stickyNoteContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
    flexGrow: 1,
  },

  stickyNoteHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '0.75rem',
  },

  stickyNoteTitle: {
    margin: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.4rem',
    fontWeight: 'bold',
    opacity: 0.9,
    lineHeight: '1.3',
  },

  stickyNoteBadge: {
    padding: '0.2rem 0.5rem',
    borderRadius: '2px',
    fontSize: '0.65rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: '600',
    whiteSpace: 'nowrap',
    letterSpacing: '0.03em',
    opacity: 0.8,
    alignSelf: 'flex-start',
  },

  stickyNoteDesc: {
    margin: '0 0 1rem 0',
    fontSize: '0.9rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    lineHeight: '1.5',
    opacity: 0.8,
    flexGrow: 1,
  },

  gradeSelector: {
    marginBottom: '0.75rem',
  },

  gradeLabel: {
    display: 'block',
    fontSize: '0.7rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: '700',
    marginBottom: '4px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    opacity: 0.7,
  },

  gradeSelect: {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: 'rgba(255,255,255,0.5)',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#1e293b',
  },

  stickyNoteActionBtn: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.95rem',
    fontWeight: 'bold',
    letterSpacing: '0.02em',
    opacity: 0.9,
    transition: 'opacity 0.15s ease',
  },

  message: {
    textAlign: 'center',
    color: '#475569',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1rem',
    padding: '5rem',
  },

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
    marginTop: '0.5rem',
  },
  sectionIcon: {
    fontSize: '1.5rem',
  },
  sectionTitle: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '2rem 0',
    gap: '1rem',
  },
  dividerText: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.95rem',
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  gradeWarning: {
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '0.8rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: '600',
    marginBottom: '0.75rem',
    textAlign: 'center',
  },
};