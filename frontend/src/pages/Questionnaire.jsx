import React, { useState } from 'react';
import { getCookie } from '../utils';

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

  const handleSubmit = () => {
    if (!selectedGrade || !acknowledged) return;
    setSubmitting(true);
    const csrfToken = getCookie('csrftoken');

    fetch('http://127.0.0.1:8000/accounts/onboarding/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ grade_level: selectedGrade }),
    })
      .then(res => res.json())
      .then(() => onComplete());
  };

  return (
    <div style={styles.overlay}>
      <div style={{
        ...styles.modal,
        opacity: transitioning ? 0 : 1,
        transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
      }}>

        {/* Page 1: Category Selection */}
        {page === 1 && (
          <>
            <h2 style={styles.title}>Welcome to Equinox</h2>
            <p style={styles.subtitle}>Before you begin, one quick question:</p>
            <h5 style={styles.question}>What's your current Grade Level?</h5>

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

            {/* Senior High dropdown message */}
            <div style={{
              ...styles.seniorNote,
              maxHeight: seniorClicked ? '60px' : '0px',
              opacity: seniorClicked ? 1 : 0,
              marginTop: seniorClicked ? '0.75rem' : '0',
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

            {/* Acknowledgement notice */}
            <div style={{
              ...styles.notice,
              maxHeight: selectedGrade ? '200px' : '0px',
              opacity: selectedGrade ? 1 : 0,
              marginTop: selectedGrade ? '0.75rem' : '0',
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
                ...styles.gradeBtn,
                width: '100%',
                marginTop: '1rem',
                padding: '0.75rem',
                fontSize: '0.95rem',
                opacity: selectedGrade && acknowledged && !submitting ? 1 : 0.35,
                cursor: selectedGrade && acknowledged && !submitting ? 'pointer' : 'not-allowed',
                transition: 'opacity 0.3s ease',
              }}
            >
              {submitting ? 'Saving...' : 'Continue to Equinox →'}
            </button>
          </>
        )}
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
  modal: {
    backgroundColor: '#1a1d23',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    border: '1px solid #2e3340',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '700',
    marginBottom: '0.3rem',
    color: '#f1f5f9',
  },
  subtitle: {
    color: '#64748b',
    marginBottom: '1rem',
    fontSize: '0.95rem',
  },
  question: {
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: '1.2rem',
    fontSize: '1rem',
  },
  categoryGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  categoryBtn: {
    padding: '0.8rem',
    borderRadius: '8px',
    border: '2px solid #2e3340',
    backgroundColor: '#23272f',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    color: '#94a3b8',
    transition: 'all 0.15s',
    width: '100%',
  },
  categoryBtnSeniorActive: {
    border: '2px solid #f87171',
    color: '#f87171',
  },
  seniorNote: {
    color: '#f87171',
    fontSize: '0.85rem',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease',
  },
  backRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '1rem',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0',
  },
  gradeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  gradeBtn: {
    padding: '0.6rem 0.4rem',
    borderRadius: '8px',
    border: '2px solid #2e3340',
    backgroundColor: '#23272f',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.85rem',
    color: '#94a3b8',
    transition: 'all 0.15s',
  },
  gradeBtnSelected: {
    backgroundColor: '#3b82f6',
    border: '2px solid #3b82f6',
    color: '#fff',
  },
  notice: {
    backgroundColor: '#1e2330',
    border: '1px solid #2e3340',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    transition: 'max-height 0.35s ease, opacity 0.35s ease, margin-top 0.35s ease',
  },
  noticeText: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  checkLabel: {
    color: '#cbd5e1',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
};