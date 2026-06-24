import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function TopicCatalogue({ onSelectTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState('Elementary');

  useEffect(() => {
    api.get('/topics/')
      .then((res) => {
        setTopics(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error retrieving topic catalogue structural framework:", err);
        setError("Unable to load the topic structural framework matrix. Please try again.");
        setLoading(false);
      });
  }, []);

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
    { bg: '#fdba74', text: '#7c2d12', rotate: '0.4deg' },    // orange
  ];

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
            <p style={styles.subtitle}>Select a structural framework area to configure your study session.</p>
          </div>

          {/* Sticky Note Topic Grid */}
          <div style={styles.grid}>
            {topics.map((topic, index) => {
              const color = stickyNoteColors[index % stickyNoteColors.length];
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
                        {topic.grade_level}
                      </span>
                    </div>
                    
                    <p style={{ ...styles.stickyNoteDesc, color: color.text }}>{topic.description}</p>
                    
                    <div style={styles.gradeSelector}>
                      <label style={{ ...styles.gradeLabel, color: color.text }}>Grade Level</label>
                      <select 
                        style={{
                          ...styles.gradeSelect,
                          backgroundColor: 'rgba(255,255,255,0.5)',
                          borderColor: color.text,
                          color: color.text,
                        }}
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                      >
                        <option value="Elementary">Elementary (Grades 1-6)</option>
                        <option value="Junior High">Junior High (Grades 7-10)</option>
                      </select>
                    </div>

                    <button 
                      style={{
                        ...styles.stickyNoteActionBtn,
                        backgroundColor: color.text,
                        color: color.bg,
                      }}
                      onClick={() => onSelectTopic(topic.id, selectedGrade)}
                    >
                      Review Topic ➔
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.9rem',
    color: '#64748b',
    fontStyle: 'italic',
    margin: 0,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '28px',
  },

  // ── Sticky Note Topic Card ──
  stickyNote: {
    borderRadius: '2px',
    padding: '1.25rem',
    boxShadow: '3px 4px 12px rgba(0,0,0,0.15), -1px -1px 0 rgba(255,255,255,0.4) inset',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    position: 'relative',
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '0.75rem',
  },

  stickyNoteTitle: {
    margin: 0,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '1.1rem',
    fontWeight: 'bold',
    opacity: 0.85,
    lineHeight: '1.3',
  },

  stickyNoteBadge: {
    padding: '0.2rem 0.5rem',
    borderRadius: '2px',
    fontSize: '0.6rem',
    fontFamily: "'Courier New', monospace",
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    opacity: 0.8,
  },

  stickyNoteDesc: {
    margin: '0 0 1rem 0',
    fontSize: '0.85rem',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    lineHeight: '1.5',
    opacity: 0.75,
    fontStyle: 'italic',
    flexGrow: 1,
  },

  gradeSelector: {
    marginBottom: '0.75rem',
  },

  gradeLabel: {
    display: 'block',
    fontSize: '0.6rem',
    fontFamily: "'Courier New', monospace",
    fontWeight: '700',
    marginBottom: '4px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity: 0.7,
  },

  gradeSelect: {
    width: '100%',
    padding: '0.5rem',
    backgroundColor: 'rgba(255,255,255,0.5)',
    border: '1px solid',
    borderRadius: '2px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.85rem',
    cursor: 'pointer',
    boxSizing: 'border-box',
    fontStyle: 'italic',
    outline: 'none',
  },

  stickyNoteActionBtn: {
    width: '100%',
    padding: '0.55rem 0.8rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.85rem',
    fontWeight: 'bold',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    opacity: 0.9,
    transition: 'opacity 0.15s ease',
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