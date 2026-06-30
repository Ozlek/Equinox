import React, { useState, useEffect, useRef } from 'react';
import MathKeypad from './MathKeypad';
import api from '../api/axios';

const getTierColor = (tier) => {
  const colors = { 'Novice': '#16a34a', 'Intermediate': '#2563eb', 'Advanced': '#d97706', 'Expert': '#dc2626' };
  return colors[tier] || '#64748b';
};

const getTimerLimit = (tier) => {
  const limits = { 'Novice': 120, 'Intermediate': 110, 'Advanced': 100, 'Expert': 90 };
  return limits[tier] || 120;
};

// Achievement Popup Modal
const AchievementPopup = ({ achievements, onClose }) => {
  if (!achievements || achievements.length === 0) return null;
  
  return (
    <div style={popupStyles.overlay} onClick={onClose}>
      <div style={popupStyles.paper} onClick={(e) => e.stopPropagation()}>
        <div style={popupStyles.reportHeader}>
          <div style={popupStyles.punchedHoles}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={popupStyles.hole} />
            ))}
          </div>
          <div style={popupStyles.headerContent}>
            <h2 style={popupStyles.title}>🏆 Achievement Unlocked!</h2>
            <button style={popupStyles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={popupStyles.ruledContent}>
          <div style={popupStyles.redMargin} />
          <div style={popupStyles.contentInner}>
            {achievements.map((achievement, index) => (
              <div key={index} style={popupStyles.achievementItem}>
                <div style={popupStyles.achievementIcon}>{achievement.icon || '🏆'}</div>
                <div style={popupStyles.achievementInfo}>
                  <div style={popupStyles.achievementTitle}>{achievement.title}</div>
                  <div style={popupStyles.achievementDesc}>{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Analysis Popup Modal
const AnalysisPopup = ({ analysis, onClose }) => {
  if (!analysis) return null;
  
  const getPriorityColor = (priority) => {
    const colors = { 'high': '#dc2626', 'medium': '#d97706', 'low': '#2563eb' };
    return colors[priority] || '#64748b';
  };

  const getRecommendationIcon = (type) => {
    const icons = { 'improvement': '📚', 'advancement': '🚀', 'skill_focus': '🎯', 'maintenance': '💪' };
    return icons[type] || '💡';
  };

  return (
    <div style={popupStyles.overlay} onClick={onClose}>
      <div style={popupStyles.paper} onClick={(e) => e.stopPropagation()}>
        <div style={popupStyles.reportHeader}>
          <div style={popupStyles.punchedHoles}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={popupStyles.hole} />
            ))}
          </div>
          <div style={popupStyles.headerContent}>
            <h2 style={popupStyles.title}>🧠 Adaptive Learning Analysis</h2>
            <button style={popupStyles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={popupStyles.ruledContent}>
          <div style={popupStyles.redMargin} />
          <div style={popupStyles.contentInner}>
            {analysis.analysis && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#2563eb', marginBottom: '1rem', fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif" }}>📊 Performance Overview</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>{analysis.analysis.overall_accuracy}%</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>Overall Accuracy</div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>{analysis.analysis.strengths.length || 0}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>Strengths</div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>{analysis.analysis.weaknesses.length || 0}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>Areas to Improve</div>
                  </div>
                </div>
              </div>
            )}

            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <h3 style={{ color: '#2563eb', marginBottom: '1rem', fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif" }}>💡 Personalized Recommendations</h3>
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', borderLeft: `4px solid ${getPriorityColor(rec.priority)}`, border: `1px solid #e2e8f0`, borderLeft: `4px solid ${getPriorityColor(rec.priority)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{getRecommendationIcon(rec.type)}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: getPriorityColor(rec.priority), padding: '0.2rem 0.6rem', borderRadius: '6px', border: `1px solid ${getPriorityColor(rec.priority)}`, fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem', fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif" }}>
                      {rec.type === 'improvement' && '📚 Focus on Improvement'}
                      {rec.type === 'advancement' && '🚀 Ready to Advance'}
                      {rec.type === 'skill_focus' && '🎯 Skill Building'}
                      {rec.type === 'maintenance' && '💪 Maintain Progress'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#2563eb', marginBottom: '0.5rem', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>
                      Topic: <strong>{rec.topic}</strong> | Difficulty: <strong>{rec.difficulty}</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', lineHeight: '1.5', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>
                      {rec.reason}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#16a34a', fontStyle: 'italic', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>
                      <em>{rec.expected_benefit}</em>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
        
        setGameState({ 
          is_completed: false,
          final_score: data.final_gamified_score || 0,
          waiting_for_popups: true
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
      console.log('Submit answer response:', data);
      setFeedback(data);
      
      if (data.new_achievements && data.new_achievements.length > 0) {
        console.log('Showing achievements popup:', data.new_achievements);
        setNewAchievements(data.new_achievements);
        setShowAchievementsPopup(true);
      } else {
        console.log('No new achievements in response');
      }
      
      if (data.adaptive_analysis && data.adaptive_analysis.recommendations) {
        console.log('Showing analysis popup');
        setAnalysisData(data.adaptive_analysis);
        if (data.session_complete || data.is_finished) {
          setTimeout(() => setShowAnalysisPopup(true), 500);
        }
      } else {
        console.log('No adaptive analysis in response');
      }
      
      if (data.is_correct && data.current_streak > 4) setShowStreakPopup(true);
      
      if (data.session_complete || data.is_finished) {
        console.log('Session complete - not fetching next question');
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
        <div style={styles.reportPaper}>
          <div style={styles.reportHeader}>
            <div style={styles.punchedHoles}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={styles.hole} />
              ))}
            </div>
            <div style={styles.headerContent}>
              <h2 style={styles.title}>🎉 Challenge Completed!</h2>
              <button style={styles.quitBtnHeader} onClick={() => onNavigate ? onNavigate('dashboard') : window.location.href = '/'}>✕</button>
            </div>
          </div>
          <div style={styles.ruledContent}>
            <div style={styles.redMargin} />
            <div style={styles.contentInner}>
              <p style={{ textAlign: 'center', color: '#64748b', margin: '0 0 1rem 0', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", fontSize: '1rem' }}>
                Your performance data has been safely recorded.
              </p>
              <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center', margin: '1rem 0', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>Final Score</span>
                <h1 style={{ color: '#16a34a', margin: '0.5rem 0', fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif", fontSize: '2.5rem' }}>{gameState.final_score.toLocaleString()} PTS</h1>
              </div>
              <button style={styles.primaryBtn} onClick={() => onNavigate ? onNavigate('dashboard') : window.location.href = '/'}>Return to Dashboard</button>
            </div>
          </div>
        </div>
        
        {showAchievementsPopup && (
          <AchievementPopup 
            achievements={newAchievements} 
            onClose={() => setShowAchievementsPopup(false)} 
          />
        )}
        
        {showAnalysisPopup && (
          <AnalysisPopup 
            analysis={analysisData} 
            onClose={() => setShowAnalysisPopup(false)} 
          />
        )}
      </div>
    );
  }

  if (!gameState) return (
    <div style={styles.container}>
      <div style={{ ...styles.reportPaper, textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", fontSize: '1rem', color: '#64748b' }}>Loading Engine...</div>
      </div>
    </div>
  );

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
      <div style={styles.reportPaper}>

        {/* ── Header with punched holes ── */}
        <div style={styles.reportHeader}>
          <div style={styles.punchedHoles}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={styles.hole} />
            ))}
          </div>
          <div style={styles.headerContent}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>Total Score</div>
              <h3 style={{ margin: '0', color: '#2563eb', fontSize: '1.5rem', fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif" }}>{displayScore.toLocaleString()}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <button onClick={handleQuitChallenge} style={styles.quitBtnHeader}>✕ Quit</button>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>Question: {gameState.question_number} / {gameState.total_questions}</div>
            </div>
          </div>
        </div>

        {/* ── Ruled Content Area ── */}
        <div style={styles.ruledContent}>
          <div style={styles.redMargin} />
          <div style={styles.contentInner}>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {displayStreak > 0 && <div style={streakStyles.badge}>🔥 {displayStreak} Streak</div>}
              {isTimed && timeLeft !== null && (
                <div style={{...streakStyles.timer, color: timeLeft <= 10 ? '#dc2626' : '#1e293b'}}>
                  ⏱️ {formatTime(timeLeft)}
                </div>
              )}
              {activeMods.includes('one_life') && <div style={streakStyles.oneLife}>❤️‍🔥 One Life</div>}
              {gameState.active_modifier_type && (
                <div style={{ ...streakStyles.itemBadge, borderColor: '#2563eb', color: '#2563eb' }}>
                  ⚙️ {gameState.active_modifier_type.replace('_', ' ')}
                </div>
              )}
            </div>

            {/* Question */}
            <div style={styles.questionSection}>
              <h4 style={styles.questionText}>{gameState.question_text}</h4>
              <div style={{ ...styles.tierBadge, borderColor: tierColor, color: tierColor }}>
                {gameState.current_tier}
              </div>
            </div>

            {/* Error */}
            {submissionError && (
              <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center', border: '1px solid #fca5a5', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>
                ⚠️ {submissionError}
              </div>
            )}

            {/* Answer Input */}
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
                            borderColor: selectedAnswer === key ? '#2563eb' : '#e2e8f0',
                            backgroundColor: selectedAnswer === key ? 'rgba(37,99,235,0.08)' : '#fefdfb',
                          }}
                          onClick={() => setSelectedAnswer(key)}
                        >
                          <strong style={{ marginRight: '12px', color: '#2563eb' }}>{key}.</strong> 
                          <span style={{ color: '#1e293b', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>{value}</span>
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
                backgroundColor: feedback.is_correct ? '#f0fdf4' : '#fef2f2',
                border: feedback.is_correct ? '1px solid #86efac' : '1px solid #fca5a5',
              }}>
                <h3 style={{ color: feedback.is_correct ? '#16a34a' : '#dc2626', marginBottom: '0.5rem', marginTop: 0, fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif", fontSize: '1.3rem' }}>
                  {feedback.timeout ? '⏰ Time is up!' : (feedback.is_correct ? '🎉 Correct!' : '❌ Not quite.')}
                </h3>

                {isShieldAbsorbed && (
                  <p style={{ color: '#2563eb', fontSize: '0.9rem', fontWeight: 'bold', margin: '8px 0', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>
                    🛡️ Streak Shield Absorbed! Combo metric sustained without dropping.
                  </p>
                )}

                {!feedback.is_correct && (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '8px 0', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>
                    Correct Answer was: <strong style={{ color: '#1e293b' }}>{feedback.correct_answer}</strong>
                  </p>
                )}
                
                <button 
                  style={styles.primaryBtn} 
                  onClick={() => {
                    if (isGameOver) {
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

            {/* Admin */}
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
        </div>

      </div>

      {/* Popups */}
      {showAchievementsPopup && (
        <AchievementPopup 
          achievements={newAchievements} 
          onClose={() => setShowAchievementsPopup(false)} 
        />
      )}
      
      {showAnalysisPopup && (
        <AnalysisPopup 
          analysis={analysisData} 
          onClose={() => setShowAnalysisPopup(false)} 
        />
      )}
    </div>
  );
}

const popupStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' },
  paper: { position: 'relative', zIndex: 1, width: '100%', maxWidth: '600px', backgroundColor: '#fefdfb', borderRadius: '4px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid #d6d3d1', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif", color: '#1e293b', overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' },
  reportHeader: { position: 'relative', backgroundColor: '#1e293b', padding: '1rem 1.5rem 0.75rem', borderBottom: '3px solid #3b82f6', flexShrink: 0 },
  punchedHoles: { position: 'absolute', left: '16px', top: '0', bottom: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '8px 0', zIndex: 2 },
  hole: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fefdfb', border: '2px solid #475569' },
  headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: '24px' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc', fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif" },
  closeBtn: { backgroundColor: 'rgba(245, 101, 101, 0.15)', color: '#fc8181', border: '1px solid rgba(245, 101, 101, 0.3)', width: '34px', height: '34px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold', flexShrink: 0, fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  ruledContent: { display: 'flex', flexDirection: 'row', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(203,213,225,0.3) 31px, rgba(203,213,225,0.3) 32px)', overflowY: 'auto', flex: 1 },
  redMargin: { width: '3px', backgroundColor: '#ef4444', opacity: 0.5, flexShrink: 0, marginLeft: '1.5rem', alignSelf: 'stretch' },
  contentInner: { flex: 1, padding: '1.25rem 1.5rem' },
  achievementItem: { backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e2e8f0' },
  achievementIcon: { fontSize: '2.5rem' },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.25rem', fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif" },
  achievementDesc: { fontSize: '0.85rem', color: '#64748b', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }
};

const streakStyles = {
  badge: { backgroundColor: '#fef3c7', color: '#92400e', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  timer: { backgroundColor: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid #e2e8f0', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  oneLife: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.3rem 0.6rem', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
  itemBadge: { padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: '#f8fafc', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" },
};

const styles = {
  container: {
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
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '1.5rem 1rem',
    boxSizing: 'border-box',
    position: 'relative',
  },

  // ── Report Paper ──
  reportPaper: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '500px',
    backgroundColor: '#fefdfb',
    borderRadius: '4px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #d6d3d1',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    color: '#1e293b',
    overflow: 'hidden',
  },

  // ── Header ──
  reportHeader: {
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginLeft: '24px',
  },
  title: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: "'Caveat', 'Segoe UI', system-ui, sans-serif",
  },
  quitBtnHeader: {
    backgroundColor: 'rgba(245, 101, 101, 0.15)',
    color: '#fc8181',
    border: '1px solid rgba(245, 101, 101, 0.3)',
    padding: '0.3rem 0.6rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Ruled Content ──
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
  contentInner: {
    flex: 1,
    padding: '1.25rem 1.5rem',
  },

  // ── Quiz Elements ──
  questionSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
    gap: '12px',
  },
  questionText: {
    margin: 0,
    lineHeight: '1.4',
    fontSize: '1.1rem',
    color: '#1e293b',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  tierBadge: {
    fontSize: '0.65rem',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    height: 'fit-content',
    whiteSpace: 'nowrap',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  choicesGrid: {
    display: 'grid',
    gap: '10px',
    marginBottom: '1rem',
  },
  choiceOption: {
    border: '2px solid #e2e8f0',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.95rem',
    transition: 'all 0.15s ease',
  },
  inputWrapper: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '0.8rem',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    fontSize: '16px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  mathPadBtn: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    padding: '0 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  primaryBtn: {
    width: '100%',
    padding: '0.8rem',
    marginTop: '0.5rem',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    minHeight: '44px',
    transition: 'background 0.2s',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  feedbackBox: {
    padding: '1.25rem',
    borderRadius: '8px',
    textAlign: 'center',
    marginTop: '1rem',
  },
  adminSection: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px dashed #e2e8f0',
    textAlign: 'center',
  },
  adminLabel: {
    display: 'block',
    fontSize: '0.65rem',
    color: '#d97706',
    marginBottom: '0.5rem',
    letterSpacing: '0.1em',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  adminBtn: {
    background: 'none',
    border: '1px solid #d97706',
    color: '#d97706',
    borderRadius: '4px',
    padding: '0.3rem 0.8rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  adminText: {
    marginTop: '0.5rem',
    color: '#d97706',
    fontSize: '0.8rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  reviewSection: {
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
};