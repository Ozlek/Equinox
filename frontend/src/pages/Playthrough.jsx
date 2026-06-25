import React, { useState, useEffect, useRef } from 'react';
import MathKeypad from './MathKeypad';
import api from '../api/axios';

const getTierColor = (tier) => {
  const colors = { 'Novice': '#58ec84', 'Intermediate': '#63b3ed', 'Advanced': '#f6ad55', 'Expert': '#f56565' };
  return colors[tier] || '#a0aec0';
};

const getTimerLimit = (tier) => {
  const limits = { 'Novice': 120, 'Intermediate': 110, 'Advanced': 100, 'Expert': 90 };
  return limits[tier] || 120;
};

// Achievement Popup Modal
const AchievementPopup = ({ achievements, onClose }) => {
  if (!achievements || achievements.length === 0) return null;
  
  return (
    <div style={styles.popupOverlay} onClick={onClose}>
      <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.popupHeader}>
          <h2 style={styles.popupTitle}>🏆 Achievement Unlocked!</h2>
          <button style={styles.popupCloseBtn} onClick={onClose}>✕</button>
        </div>
        {achievements.map((achievement, index) => (
          <div key={index} style={styles.achievementItem}>
            <div style={styles.achievementIcon}>{achievement.icon || '🏆'}</div>
            <div style={styles.achievementInfo}>
              <div style={styles.achievementTitle}>{achievement.title}</div>
              <div style={styles.achievementDesc}>{achievement.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Analysis Popup Modal
const AnalysisPopup = ({ analysis, onClose }) => {
  if (!analysis) return null;
  
  const getPriorityColor = (priority) => {
    const colors = { 'high': '#f56565', 'medium': '#f6ad55', 'low': '#63b3ed' };
    return colors[priority] || '#a0aec0';
  };

  const getRecommendationIcon = (type) => {
    const icons = { 'improvement': '📚', 'advancement': '🚀', 'skill_focus': '🎯', 'maintenance': '💪' };
    return icons[type] || '💡';
  };

  return (
    <div style={styles.popupOverlay} onClick={onClose}>
      <div style={styles.popupContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.popupHeader}>
          <h2 style={styles.popupTitle}>🧠 Adaptive Learning Analysis</h2>
          <button style={styles.popupCloseBtn} onClick={onClose}>✕</button>
        </div>
        
        {analysis.analysis && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#63b3ed', marginBottom: '1rem' }}>📊 Performance Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#2d3748', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#63b3ed' }}>{analysis.analysis.overall_accuracy}%</div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Overall Accuracy</div>
              </div>
              <div style={{ backgroundColor: '#2d3748', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#68d391' }}>{analysis.analysis.strengths.length || 0}</div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Strengths</div>
              </div>
              <div style={{ backgroundColor: '#2d3748', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f6ad55' }}>{analysis.analysis.weaknesses.length || 0}</div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Areas to Improve</div>
              </div>
            </div>
          </div>
        )}

        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <div>
            <h3 style={{ color: '#63b3ed', marginBottom: '1rem' }}>💡 Personalized Recommendations</h3>
            {analysis.recommendations.map((rec, index) => (
              <div key={index} style={{ backgroundColor: '#2d3748', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', borderLeft: `4px solid ${getPriorityColor(rec.priority)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{getRecommendationIcon(rec.type)}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: getPriorityColor(rec.priority), padding: '0.2rem 0.6rem', borderRadius: '6px', border: `1px solid ${getPriorityColor(rec.priority)}` }}>
                    {rec.priority.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f7fafc', marginBottom: '0.5rem' }}>
                  {rec.type === 'improvement' && '📚 Focus on Improvement'}
                  {rec.type === 'advancement' && '🚀 Ready to Advance'}
                  {rec.type === 'skill_focus' && '🎯 Skill Building'}
                  {rec.type === 'maintenance' && '💪 Maintain Progress'}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#63b3ed', marginBottom: '0.5rem' }}>
                  Topic: <strong>{rec.topic}</strong> | Difficulty: <strong>{rec.difficulty}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '0.5rem', lineHeight: '1.5' }}>
                  {rec.reason}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#68d391', fontStyle: 'italic' }}>
                  <em>{rec.expected_benefit}</em>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function PlaythroughChallenge({ topicId, initialDifficulty, activeMods = [], equippedModifier = '', onNavigate }) {
  const [gameState, setGameState] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showAdminAnswer, setShowAdminAnswer] = useState(false);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [showAchievementsPopup, setShowAchievementsPopup] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [newAchievements, setNewAchievements] = useState([]);
  
  const [timeLeft, setTimeLeft] = useState(null);
  const isTimed = activeMods.includes('timed');
  const isSubmitting = useRef(false);
  const timerRef = useRef(null);

  const getRequestParams = (isFirstLoad = false) => {
    const modQuery = activeMods.length > 0 ? `&mods=${activeMods.join(',')}` : '';
    const itemQuery = equippedModifier ? `&equipped_modifier=${equippedModifier}` : '';
    const diffQuery = (isFirstLoad && initialDifficulty) ? `&difficulty=${initialDifficulty}` : '';
    const queryString = `${diffQuery}${modQuery}${itemQuery}`;

    return queryString ? `?${queryString}`.replace('?&', '?') : '';
  };

  const fetchNextQuestion = async (isFirstLoad = false) => {
    try {
      const response = await api.get(`/playthrough/sessions/${topicId}/${getRequestParams(isFirstLoad)}`);
      const data = response.data;

      if (data.session_complete || data.status === 'completed' || data.is_finished) {
        // Check for achievements and analysis in the completion response
        if (data.new_achievements && data.new_achievements.length > 0) {
          console.log('Session complete - showing achievements:', data.new_achievements);
          setNewAchievements(data.new_achievements);
          setShowAchievementsPopup(true);
        }
        
        if (data.adaptive_analysis && data.adaptive_analysis.recommendations) {
          console.log('Session complete - showing analysis');
          setAnalysisData(data.adaptive_analysis);
          setTimeout(() => setShowAnalysisPopup(true), 1500);
        }
        
        // Don't set is_completed here - let the button click handle it after popups
        // Just store the final score and mark that we're waiting for popups
        setGameState({ 
          is_completed: false, // Keep showing the quiz UI so popups can display
          final_score: data.final_gamified_score || 0,
          waiting_for_popups: true // Flag to indicate we need to show completion after popups
        });
      } else {
        setGameState(data);
        if (isTimed) setTimeLeft(getTimerLimit(data.current_tier));
      }
      setFeedback(null);
      setSelectedAnswer('');
      setShowKeypad(false);
      setShowAdminAnswer(false);
      setShowStreakPopup(false);
    } catch (error) {
      console.error("Failed to submit answer:", error);
      
      if (error.response && error.response.data) {
        const serverData = error.response.data;
        
        if (serverData !== null && typeof serverData === 'object') {
          const parsedErrors = Object.keys(serverData)
            .map(key => `${key}: ${Array.isArray(serverData[key]) ? serverData[key].join(', ') : serverData[key]}`)
            .join(' | ');
          setSubmissionError(parsedErrors);
        } else {
          setSubmissionError(String(serverData));
        }
      } else {
        setSubmissionError(`Network error status ${error.response?.status || 'unknown'}`);
      }
    }
  };

  useEffect(() => { fetchNextQuestion(true); }, [topicId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || feedback || gameState?.is_completed) return;
    timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, feedback, gameState]);

  useEffect(() => {
    if (timeLeft === 0 && !feedback && !isSubmitting.current) {
       isSubmitting.current = true;
       submitAnswer(null, true);
    }
  }, [timeLeft]);

  const handleInsertSymbol = (symbol) => setSelectedAnswer(prev => prev + symbol);

  const handleQuitChallenge = async () => {
    if (window.confirm("Are you sure? Progress will be lost if you quit now.")) {
      try {
        await api.post('/playthrough/quit/');
        window.location.href = '/';
      } catch (error) {
        console.error("Failed to quit challenge:", error);
      }
    }
  };

  const submitAnswer = async (overrideAnswer = null, isTimeout = false) => {
    const finalAnswer = isTimeout ? 'TIMEOUT_NO_ANSWER' : (overrideAnswer || selectedAnswer);
    setSubmissionError(null);

    try {
      const response = await api.post(`/playthrough/sessions/${topicId}/`, {
        answer: finalAnswer, 
        timeout: isTimeout,
        active_mods: activeMods,
        equipped_modifier: equippedModifier
      });
      
      const data = response.data;
      console.log('Submit answer response:', data); // Debug log
      setFeedback(data);
      
      // Check for new achievements
      if (data.new_achievements && data.new_achievements.length > 0) {
        console.log('Showing achievements popup:', data.new_achievements); // Debug log
        setNewAchievements(data.new_achievements);
        setShowAchievementsPopup(true);
      } else {
        console.log('No new achievements in response'); // Debug log
      }
      
      // Check for adaptive analysis
      if (data.adaptive_analysis && data.adaptive_analysis.recommendations) {
        console.log('Showing analysis popup'); // Debug log
        setAnalysisData(data.adaptive_analysis);
        // Auto-show analysis after a short delay if quiz is complete
        if (data.session_complete || data.is_finished) {
          setTimeout(() => setShowAnalysisPopup(true), 500);
        }
      } else {
        console.log('No adaptive analysis in response'); // Debug log
      }
      
      if (data.is_correct && data.current_streak > 4) setShowStreakPopup(true);
      
      // Don't fetch next question if session is complete - session is already ended on backend
      if (data.session_complete || data.is_finished) {
        console.log('Session complete - not fetching next question');
        // Mark game as completed to prevent creating a new session
        setGameState({ 
          is_completed: true, 
          final_score: data.final_gamified_score || data.gamified_score || 0 
        });
        return;
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);

      setSubmissionError(
      error.response?.data?.detail || 
      `Network error status ${error.response?.status}: Check token validation.`
    );
  }
  };

  const handleSubmit = (e) => { e.preventDefault(); if (!selectedAnswer || !selectedAnswer.trim()) return; submitAnswer(); };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (gameState?.is_completed) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ color: '#0dcaf0', textAlign: 'center' }}>🎉 Challenge Completed!</h2>
          <p style={{ textAlign: 'center', color: '#a0aec0' }}>Your performance data has been safely recorded.</p>
          <div style={{ padding: '1.5rem', backgroundColor: '#111827', borderRadius: '12px', textAlign: 'center', margin: '1rem 0' }}>
            <span style={styles.label}>Final Score</span>
            <h1 style={{ color: '#68d391', margin: '0.5rem 0' }}>{gameState.final_score.toLocaleString()} PTS</h1>
          </div>
          <button style={styles.primaryBtn} onClick={() => onNavigate ? onNavigate('dashboard') : window.location.href = '/'}>Return to Dashboard</button>
        </div>
        
        {/* Achievement Popup - included in completion screen */}
        {showAchievementsPopup && (
          <AchievementPopup 
            achievements={newAchievements} 
            onClose={() => setShowAchievementsPopup(false)} 
          />
        )}
        
        {/* Analysis Popup - included in completion screen */}
        {showAnalysisPopup && (
          <AnalysisPopup 
            analysis={analysisData} 
            onClose={() => setShowAnalysisPopup(false)} 
          />
        )}
      </div>
    );
  }

  if (!gameState) return <div style={styles.message}>Loading Engine...</div>;

  const displayScore = feedback ? feedback.gamified_score : (gameState.gamified_score || 0);
  const displayStreak = feedback ? feedback.current_streak : (gameState.current_streak || 0);
  const tierColor = getTierColor(gameState.current_tier);

  const isGameOver = feedback && (
  feedback.session_complete || 
  feedback.is_finished || 
  feedback.status === 'completed' ||
  (activeMods.includes('one_life') && !feedback.is_correct)
  );

  const isShieldAbsorbed = feedback && !feedback.is_correct && feedback.current_streak > 0 && gameState.active_modifier_type === 'STREAK_SHIELD';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        <div style={styles.header}>
          <div>
            <div style={styles.label}>Total Score</div>
            <h3 style={styles.scoreText}>{displayScore.toLocaleString()}</h3>
          </div>
          <div style={styles.rightHeader}>
            <button onClick={handleQuitChallenge} style={styles.quitBtn}>✕ Quit</button>
            <div style={styles.label2}>Question: {gameState.question_number} / {gameState.total_questions}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {displayStreak > 0 && <div style={styles.streakBadge}>🔥 {displayStreak} Streak</div>}
            {isTimed && timeLeft !== null && (
                <div style={{...styles.timerBadge, color: timeLeft <= 10 ? '#fc8181' : '#f7fafc'}}>
                    ⏱️ {formatTime(timeLeft)}
                </div>
            )}
            {activeMods.includes('one_life') && <div style={styles.oneLifeBadge}>❤️‍🔥 One Life</div>}
            
            {activeMods.includes('dda_adjuster') && (
              <div style={{ ...styles.itemBadge, borderColor: '#9f7aea', color: '#9f7aea' }}>
                ⚖️ DDA Locked
              </div>
            )}

            {gameState.active_modifier_type && (
              <div style={{ 
                ...styles.itemBadge, 
                borderColor: gameState.active_modifier_type === 'SCORE_BOOST' ? '#ecc94b' : '#38b2ac',
                color: gameState.active_modifier_type === 'SCORE_BOOST' ? '#ecc94b' : '#38b2ac'
              }}>
                ⚙️ Equipped: {gameState.active_modifier_type.replace('_', ' ')}
              </div>
            )}
        </div>

        <div style={styles.questionSection}>
          <h4 style={styles.questionText}>{gameState.question_text}</h4>
          <div style={{ ...styles.tierBadge, borderColor: tierColor, color: tierColor }}>
            {gameState.current_tier}
          </div>
        </div>

        {submissionError && (
          <div style={{ color: '#f56565', backgroundColor: 'rgba(245,101,101,0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center', border: '1px solid #f56565' }}>
            ⚠️ {submissionError}
          </div>
        )}

        {!feedback ? (
          <form onSubmit={handleSubmit}>
            {gameState.choices ? (
              <div style={styles.choicesGrid}>
                {Object.entries(gameState.choices).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <div 
                      key={key} 
                      style={{ 
                        ...styles.choiceOption, 
                        borderColor: selectedAnswer === key ? '#63b3ed' : 'transparent',
                        backgroundColor: selectedAnswer === key ? '#2b6cb0' : '#2d3748'
                      }}
                      onClick={() => setSelectedAnswer(key)}
                    >
                      <strong style={{ marginRight: '12px', color: '#90cdf4' }}>{key}.</strong> {value}
                    </div>
                  );
                })}
                <button type="button" style={styles.primaryBtn} disabled={!selectedAnswer} onClick={() => submitAnswer()}>
                  Submit Answer
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={styles.inputWrapper}>
                  <input 
                    type="text" 
                    value={selectedAnswer} 
                    onChange={(e) => setSelectedAnswer(e.target.value)} 
                    placeholder="Type answer..."
                    style={styles.input}
                  />
                  <button type="button" onClick={() => setShowKeypad(!showKeypad)} style={styles.mathPadBtn}>
                    {showKeypad ? '✕ Hide' : '🧮 MathPad'}
                  </button>
                </div>
                
                {showKeypad && (
                  <div style={styles.reviewSection}>
                    <MathKeypad onSymbolSelect={handleInsertSymbol} />
                  </div>
                )}
                
                <button type="submit" style={styles.primaryBtn} disabled={!selectedAnswer.trim()}>
                  Submit Answer
                </button>
              </div>
            )}
          </form>
        ) : (
          <div style={{ 
            ...styles.feedbackBox, 
            backgroundColor: feedback.is_correct ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)' 
          }}>
            <h3 style={{ color: feedback.is_correct ? '#68d391' : '#fc8181', marginBottom: '0.5rem', marginTop: 0 }}>
              {feedback.timeout ? '⏰ Time is up!' : (feedback.is_correct ? '🎉 Correct!' : '❌ Not quite.')}
            </h3>

            {isShieldAbsorbed && (
              <p style={{ color: '#38b2ac', fontSize: '0.9rem', fontWeight: 'bold', margin: '8px 0' }}>
                🛡️ Streak Shield Absorbed! Combo metric sustained without dropping.
              </p>
            )}

            {!feedback.is_correct && (
              <p style={{ color: '#a0aec0', fontSize: '0.9rem', margin: '8px 0' }}>
                Correct Answer was: <strong style={{ color: '#e2e8f0' }}>{feedback.correct_answer}</strong>
              </p>
            )}
            
            <button 
              style={styles.primaryBtn} 
              onClick={() => {
                if (isGameOver) {
                  // Popups are already shown by submitAnswer(), just transition to completion screen
                  setGameState({ 
                    is_completed: true, 
                    final_score: feedback.final_gamified_score || feedback.gamified_score || 0 
                  });
                } else {
                  fetchNextQuestion();
                }
              }}
            >
              {isGameOver ? 'View Results ➔' : 'Next Question ➔'}
            </button>
          </div>
        )}

        {gameState.is_admin && (
          <div style={styles.adminSection}>
            <span style={styles.adminLabel}>ADMIN ONLY</span>
            <button type="button" onClick={() => setShowAdminAnswer(!showAdminAnswer)} style={styles.adminBtn}>
              {showAdminAnswer ? '🙈 Hide Answer' : '👁️ Show Answer'}
            </button>
            {showAdminAnswer && <div style={styles.adminText}>Target Answer: {gameState.admin_correct_answer}</div>}
          </div>
        )}

      </div>

      {/* Achievement Popup */}
      {showAchievementsPopup && (
        <AchievementPopup 
          achievements={newAchievements} 
          onClose={() => setShowAchievementsPopup(false)} 
        />
      )}
      
      {/* Analysis Popup */}
      {showAnalysisPopup && (
        <AnalysisPopup 
          analysis={analysisData} 
          onClose={() => setShowAnalysisPopup(false)} 
        />
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '0.5rem', width: '100%', boxSizing: 'border-box' },
  card: { backgroundColor: '#1a202c', borderRadius: '16px', padding: '1.25rem', width: '100%', maxWidth: '500px', color: '#f7fafc', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #2d3748', paddingBottom: '1rem' },
  rightHeader: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  label: { fontSize: '0.7rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' },
  label2: { fontSize: '0.7rem', color: '#718096', letterSpacing: '0.05em' },
  scoreText: { margin: '0', color: '#63b3ed', fontSize: '1.4rem' },
  tierBadge: { fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', border: '1px solid', fontWeight: 'bold', textTransform: 'uppercase', height: 'fit-content', whiteSpace: 'nowrap' },
  streakBadge: { backgroundColor: '#ecc94b', color: '#744210', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' },
  timerBadge: { backgroundColor: '#2d3748', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #4a5568' },
  oneLifeBadge: { backgroundColor: '#f56565', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem' },
  itemBadge: { padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: '#111827' },
  questionSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '12px' },
  questionText: { margin: 0, lineHeight: '1.4', fontSize: '1.1rem' },
  quitBtn: { backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' },
  choicesGrid: { display: 'grid', gap: '10px', marginBottom: '1rem' },
  choiceOption: { border: '1px solid #4a5568', padding: '0.85rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.95rem', transition: 'all 0.15s ease' },
  inputWrapper: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #4a5568', backgroundColor: '#2d3748', color: 'white', fontSize: '16px' },
  mathPadBtn: { backgroundColor: '#4a5568', color: 'white', border: 'none', padding: '0 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  primaryBtn: { width: '100%', padding: '0.85rem', marginTop: '0.5rem', backgroundColor: '#63b3ed', border: 'none', borderRadius: '8px', color: '#1a202c', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', minHeight: '44px', transition: 'background 0.2s' },
  feedbackBox: { padding: '1.25rem', borderRadius: '8px', textAlign: 'center', marginTop: '1rem' },
  adminSection: { marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #4a5568', textAlign: 'center' },
  adminLabel: { display: 'block', fontSize: '0.65rem', color: '#ecc94b', marginBottom: '0.5rem', letterSpacing: '0.1em' },
  adminBtn: { background: 'none', border: '1px solid #ecc94b', color: '#ecc94b', borderRadius: '4px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontSize: '0.75rem' },
  adminText: { marginTop: '0.5rem', color: '#ecc94b', fontSize: '0.8rem' },
  message: { textAlign: 'center', color: '#a0aec0', padding: '2rem' },
  reviewSection: { backgroundColor: '#111827', padding: '1rem', borderRadius: '12px', border: '1px solid #2d3748' },
  popupOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  popupContent: { backgroundColor: '#1a202c', borderRadius: '16px', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
  popupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #2d3748', paddingBottom: '1rem' },
  popupTitle: { margin: 0, fontSize: '1.5rem', color: '#f7fafc' },
  popupCloseBtn: { backgroundColor: 'rgba(245, 101, 101, 0.1)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.2)', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' },
  achievementItem: { backgroundColor: '#2d3748', padding: '1rem', borderRadius: '12px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' },
  achievementIcon: { fontSize: '2.5rem' },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#f7fafc', marginBottom: '0.25rem' },
  achievementDesc: { fontSize: '0.85rem', color: '#a0aec0' }
};