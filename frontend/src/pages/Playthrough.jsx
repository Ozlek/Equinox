import React, { useState, useEffect } from 'react';
import MathKeypad from './MathKeypad';
import { getCookie } from '../utils';

const getTierColor = (tier) => {
  const colors = {
    'Novice': '#58ec84',
    'Intermediate': '#63b3ed',
    'Advanced': '#b03cf8',
    'Expert': '#f56565',
  };
  return colors[tier] || '#a0aec0';
};

export default function PlaythroughChallenge({ topicId }) {
  const [gameState, setGameState] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showAdminAnswer, setShowAdminAnswer] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);

  const fetchNextQuestion = () => {
    fetch(`http://127.0.0.1:8000/playthrough/${topicId}/`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setGameState(data);
        setFeedback(null);
        setSelectedAnswer('');
        setShowKeypad(false);
        setShowAdminAnswer(false);
        setShowStreakPopup(false);
      });
  };

  useEffect(() => { fetchNextQuestion(); }, [topicId]);

  const handleInsertSymbol = (symbol) => setSelectedAnswer(prev => prev + symbol);

  const handleQuitChallenge = () => {
    if (window.confirm("Are you sure? Progress will be lost.")) {
      fetch('http://127.0.0.1:8000/playthrough/quit/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCookie('csrftoken') }
      }).then(res => { if (res.ok) window.location.href = '/dashboard'; });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`http://127.0.0.1:8000/playthrough/${topicId}/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
      body: JSON.stringify({ answer: selectedAnswer }),
    })
      .then((res) => res.json())
      .then((data) => {
        setFeedback(data);
        if (data.is_correct && data.current_streak > 4) setShowStreakPopup(true);
      });
  };

  if (!gameState) return <div style={styles.message}>Loading Engine...</div>;

  const displayScore = feedback ? feedback.gamified_score : gameState.gamified_score;
  const displayStreak = feedback ? feedback.current_streak : gameState.current_streak;
  const tierColor = getTierColor(gameState.current_tier);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={styles.header}>
          <div>
            <div style={styles.label}>Total Score</div>
            <h3 style={styles.scoreText}>{displayScore.toLocaleString()}</h3>
          </div>
          <div style={styles.rightHeader}>
            <div style={{ ...styles.tierBadge, borderColor: tierColor, color: tierColor }}>
              {gameState.current_tier}
            </div>
            <div style={styles.label}>Question: {gameState.question_number} / {gameState.total_questions}</div>
          </div>
        </div>

        {displayStreak > 0 && (
          <div style={styles.streakBadge}>🔥 {displayStreak} Streak</div>
        )}

        <div style={styles.questionSection}>
          <h4 style={styles.questionText}>{gameState.question_text}</h4>
          <button onClick={handleQuitChallenge} style={styles.quitBtn}>✕ Quit</button>
        </div>

        {!feedback ? (
          <form onSubmit={handleSubmit}>
            {gameState.choices ? (
              <div style={styles.choicesGrid}>
                {Object.entries(gameState.choices).map(([key, value]) => (
                  <label key={key} style={styles.choiceOption}>
                    <input type="radio" name="mathAns" value={key} onChange={(e) => setSelectedAnswer(e.target.value)} required />
                    <span style={{ marginLeft: '10px' }}>{key}. {value}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div style={styles.inputWrapper}>
                <input style={styles.input} type="text" value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)} placeholder="Type answer..." required />
                <button type="button" style={styles.mathPadBtn} onClick={() => setShowKeypad(!showKeypad)}>🧮 Pad</button>
              </div>
            )}
            {showKeypad && <MathKeypad onSymbolSelect={handleInsertSymbol} />}
            <button type="submit" style={styles.primaryBtn}>Submit Answer</button>
          </form>
        ) : (
          <div style={{ ...styles.feedbackBox, backgroundColor: feedback.is_correct ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)' }}>
            <h3 style={{ color: feedback.is_correct ? '#68d391' : '#fc8181' }}>{feedback.is_correct ? '🎉 Correct!' : '❌ Not quite.'}</h3>
            <button style={styles.primaryBtn} onClick={fetchNextQuestion}>Next Question ➔</button>
          </div>
        )}

        {gameState.is_admin && (
          <div style={styles.adminSection}>
             <span style={styles.adminLabel}>ADMIN ONLY</span>
             <button style={styles.adminBtn} onClick={() => setShowAdminAnswer(!showAdminAnswer)}>
               {showAdminAnswer ? '🙈 Hide Answer' : '👁️ Show Answer'}
             </button>
             {showAdminAnswer && <p style={styles.adminText}>Answer: {gameState.admin_correct_answer}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '1rem' },
  card: { backgroundColor: '#1a202c', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '500px', color: '#f7fafc', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #2d3748', paddingBottom: '1rem' },
  label: { fontSize: '0.7rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' },
  scoreText: { margin: '0', color: '#63b3ed', fontSize: '1.5rem' },
  tierBadge: { fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', marginBottom: '4px', border: '1px solid', fontWeight: 'bold' },
  streakBadge: { backgroundColor: '#ecc94b', color: '#744210', padding: '0.4rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' },
  questionSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  questionText: { margin: 0 },
  quitBtn: { backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' },
  choicesGrid: { display: 'grid', gap: '8px', marginBottom: '1rem' },
  choiceOption: { backgroundColor: '#2d3748', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', display: 'block' },
  inputWrapper: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #4a5568', backgroundColor: '#2d3748', color: 'white' },
  mathPadBtn: { backgroundColor: '#4a5568', color: 'white', border: 'none', padding: '0 1rem', borderRadius: '8px', cursor: 'pointer' },
  primaryBtn: { width: '100%', padding: '0.8rem', marginTop: '1rem', backgroundColor: '#63b3ed', border: 'none', borderRadius: '8px', color: '#1a202c', fontWeight: 'bold', cursor: 'pointer' },
  feedbackBox: { padding: '1.5rem', borderRadius: '8px', textAlign: 'center', marginTop: '1rem' },
  adminSection: { marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed #4a5568', textAlign: 'center' },
  adminLabel: { display: 'block', fontSize: '0.65rem', color: '#ecc94b', marginBottom: '0.5rem', letterSpacing: '0.1em' },
  adminBtn: { background: 'none', border: '1px solid #ecc94b', color: '#ecc94b', borderRadius: '4px', padding: '0.3rem 0.8rem', cursor: 'pointer' },
  adminText: { marginTop: '0.5rem', color: '#ecc94b', fontSize: '0.8rem' },
  message: { textAlign: 'center', color: '#a0aec0', padding: '2rem' }
};