import React, { useState } from 'react';
import api from '../api/axios';

const GRADE_MAP = {
  elementary: [1, 2, 3, 4, 5, 6],
  highschool: [7, 8, 9, 10],
};

const CATEGORY_LABELS = {
  elementary: 'Elementary',
  highschool: 'High School',
};

export default function Questionnaire({ onComplete }) {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [seniorClicked, setSeniorClicked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const goToPage = (nextPage) => {
    setTransitioning(true);
    setTimeout(() => {
      setPage(nextPage);
      setTransitioning(false);
    }, 250);
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setSelectedGrade(null);
    setAcknowledged(false);
    setSeniorClicked(false);
    goToPage(2);
  };

  const handleBack = () => {
    setSelectedGrade(null);
    setAcknowledged(false);
    setSeniorClicked(false);
    goToPage(1);
  };

  const handleSubmit = async () => {
    if (!selectedGrade || !acknowledged) return;
    
    setSubmitting(true);

    try {
      await api.post('/accounts/onboarding/', { grade_level: selectedGrade });
      onComplete();
    } catch (error) {
      console.error("Onboarding submission failed:", error);
      setSubmitting(false);
    }
  };

  const innerContent = {
    opacity: transitioning ? 0 : 1,
    transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.notebookCover}>
        <div style={styles.spiralBinding}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={styles.spiralHole}><div style={styles.spiralRing} /></div>
          ))}
        </div>
        <div style={styles.coverContent}>
          <div style={styles.marbleAccent} />
          <div style={styles.titleLabel}>
            <div style={styles.titleLabelInner}>
              <h1 style={styles.coverTitle}>Equinox</h1>
              <p style={styles.coverSubtitle}>Welcome to the Journey</p>
            </div>
          </div>
          <div style={styles.ruledPage}>
            <div style={styles.redMargin} />
            <div style={styles.pageInner}>
              <div style={innerContent}>
                {/* Page 1: Category Selection */}
                {page === 1 && (
                  <>
                    <h2 style={styles.title}>What's your current Grade Level?</h2>
                    <p style={styles.subtitle}>This helps Equinox personalize your experience.</p>

                    <div style={styles.categoryGrid}>
                      <button style={styles.categoryBtn} onClick={() => handleCategorySelect('elementary')}>
                        Elementary
                      </button>
                      <button style={styles.categoryBtn} onClick={() => handleCategorySelect('highschool')}>
                        High School
                      </button>
                      <button
                        style={{
                          ...styles.categoryBtn,
                          ...(seniorClicked ? styles.categoryBtnSeniorActive : {}),
                        }}
                        onClick={() => setSeniorClicked(prev => !prev)}
                      >
                        Senior High School
                      </button>
                    </div>

                    <div style={{
                      ...styles.seniorNote,
                      maxHeight: seniorClicked ? '60px' : '0px',
                      opacity: seniorClicked ? 1 : 0,
                      marginTop: seniorClicked ? '0.5rem' : '0',
                    }}>
                      Senior High School levels aren't supported yet.
                    </div>
                  </>
                )}

                {/* Page 2: Grade Selection */}
                {page === 2 && (
                  <>
                    <div style={styles.backRow}>
                      <button style={styles.backBtn} onClick={handleBack}>← Back</button>
                    </div>

                    <h2 style={styles.title}>What's your current Grade Level?</h2>
                    <p style={styles.subtitle}>{CATEGORY_LABELS[category]}</p>

                    <div style={styles.gradeGrid}>
                      {GRADE_MAP[category].map(grade => (
                        <button
                          key={grade}
                          onClick={() => { setSelectedGrade(grade); setAcknowledged(false); }}
                          style={{
                            ...styles.gradeBtn,
                            ...(selectedGrade === grade ? styles.gradeBtnSelected : {})
                          }}
                        >
                          Grade {grade}
                        </button>
                      ))}
                    </div>

                    <div style={{
                      ...styles.notice,
                      maxHeight: selectedGrade ? '200px' : '0px',
                      opacity: selectedGrade ? 1 : 0,
                      marginTop: selectedGrade ? '0.5rem' : '0',
                      overflow: 'hidden',
                    }}>
                      <p style={styles.noticeText}>
                        Your grade level helps Equinox personalize your experience, but you're free to explore any topic across all levels. Nothing is locked!
                      </p>
                      <label style={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={acknowledged}
                          onChange={e => setAcknowledged(e.target.checked)}
                          style={{ marginRight: '0.5rem' }}
                        />
                        I understand
                      </label>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!selectedGrade || !acknowledged || submitting}
                      style={{
                        ...styles.submitBtn,
                        opacity: selectedGrade && acknowledged && !submitting ? 1 : 0.35,
                        cursor: selectedGrade && acknowledged && !submitting ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {submitting ? 'Saving...' : 'Continue to Equinox →'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '1rem',
  },

  notebookCover: {
    position: 'relative',
    display: 'flex',
    backgroundColor: '#1e293b',
    borderRadius: '6px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
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
  titleLabelInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  coverTitle: {
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#60a5fa',
    fontStyle: 'italic',
    margin: 0,
    letterSpacing: '0.02em',
  },
  coverSubtitle: {
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '0.8rem',
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
    padding: '1.25rem 1.25rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  title: {
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '1.3rem',
    fontWeight: '700',
    marginBottom: '0.2rem',
    color: '#1e293b',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
    textAlign: 'center',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
  },

  categoryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  categoryBtn: {
    padding: '0.7rem',
    borderRadius: '6px',
    border: '2px solid #e2e8f0',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    color: '#475569',
    transition: 'all 0.15s',
    width: '100%',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
  },
  categoryBtnSeniorActive: {
    border: '2px solid #f87171',
    color: '#f87171',
  },

  seniorNote: {
    color: '#f87171',
    fontSize: '0.8rem',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease',
    textAlign: 'center',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
  },

  backRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '0.5rem',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '0.85rem',
    padding: '0',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
  },

  gradeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
  },

  gradeBtn: {
    padding: '0.6rem 0.4rem',
    borderRadius: '6px',
    border: '2px solid #e2e8f0',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    color: '#475569',
    transition: 'all 0.15s',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
  },
  gradeBtnSelected: {
    backgroundColor: '#3b82f6',
    border: '2px solid #3b82f6',
    color: '#fff',
  },

  notice: {
    backgroundColor: '#f0f4ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '0.65rem 0.85rem',
    textAlign: 'left',
    transition: 'max-height 0.35s ease, opacity 0.35s ease, margin-top 0.35s ease',
  },
  noticeText: {
    color: '#475569',
    fontSize: '0.78rem',
    marginBottom: '0.4rem',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
  },
  checkLabel: {
    color: '#1e293b',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
  },

  submitBtn: {
    width: '100%',
    padding: '0.7rem',
    border: 'none',
    borderRadius: '3px',
    backgroundColor: '#86efac',
    color: '#1e293b',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontStyle: 'italic',
    transform: 'rotate(0.3deg)',
    boxShadow: '2px 3px 8px rgba(0,0,0,0.1)',
    transition: 'opacity 0.3s ease',
    marginTop: '0.25rem',
  },
};