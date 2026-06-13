import React, { useState, useEffect } from 'react';
import MathKeypad from './MathKeypad';
import { getCookie } from '../utils';

export default function PlaythroughChallenge({ topicId }) {
  const [gameState, setGameState] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  
  const [showKeypad, setShowKeypad] = useState(false); 

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
      });
  };

  useEffect(() => {
    fetchNextQuestion();
  }, [topicId]);

  const handleInsertSymbol = (symbol) => {
    setSelectedAnswer(prev => prev + symbol);
  };

  const handleQuitChallenge = () => {
    if (window.confirm("Are you sure you want to give up? Your progress for this challenge will be lost.")) {
      const csrfToken = getCookie('csrftoken');
      
      fetch('http://127.0.0.1:8000/playthrough/quit/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken,
        }
      })
      .then(res => {
        if (res.ok) {
          window.location.href = '/dashboard'; 
        }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const csrfToken = getCookie('csrftoken');

    fetch(`http://127.0.0.1:8000/playthrough/${topicId}/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ answer: selectedAnswer }),
    })
      .then((res) => res.json())
      .then((data) => {
        setFeedback(data);
      });
  };

  if (!gameState) return <div>Loading Equinox Challenge Engine...</div>;

  if (gameState.session_complete) {
    return (
      <div className="card p-5 text-center shadow-lg">
        <h2 className="text-success">Challenge Complete! 🌟</h2>
        <p className="fs-4">Your Final Score: {gameState.final_score} / {gameState.total_questions}</p>
        <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="card p-4 shadow-sm"> 
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="fw-bold text-secondary">Question {gameState.question_number} of {gameState.total_questions}</span>
        
        <div>
          <span className="badge bg-primary me-2">Difficulty: {gameState.current_tier}</span>
          <button 
            onClick={handleQuitChallenge} 
            className="btn btn-sm btn-outline-danger"
            title="Give up and return to Dashboard"
          >
            ✕ Quit
          </button>
        </div>
      </div>

      <h3 className="mb-4">{gameState.question_text}</h3>

      {!feedback ? (
        <form onSubmit={handleSubmit}>
          {gameState.choices ? (
            Object.entries(gameState.choices).map(([key, value]) => (
              <div key={key} className="form-check mb-2">
                <input className="form-check-input" type="radio" name="mathAns" value={key} id={key} onChange={(e) => setSelectedAnswer(e.target.value)} required />
                <label className="form-check-label" htmlFor={key}>{value}</label>
              </div>
            ))
          ) : (
            <div className="form-group mb-3">
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-control" 
                  value={selectedAnswer} 
                  onChange={(e) => setSelectedAnswer(e.target.value)} 
                  placeholder="Type numerical answer..." 
                  required 
                />
                <button 
                  className={`btn ${showKeypad ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  type="button"
                  onClick={() => setShowKeypad(!showKeypad)}
                >
                  {showKeypad ? 'Hide MathPad' : '🧮 MathPad'}
                </button>
              </div>
              
              {showKeypad && <MathKeypad onSymbolSelect={handleInsertSymbol} />}
            </div>
          )}
          <button type="submit" className="btn btn-success mt-3">Submit Answer</button>
        </form>
      ) : (
        <div className="mt-3">
          {feedback.is_correct ? (
            <div className="alert alert-success">🎉 Correct! Outstanding work!</div>
          ) : (
            <div className="alert alert-danger">✕ Incorrect. The correct answer was: {feedback.correct_answer}</div>
          )}
          <button className="btn btn-primary mt-2" onClick={fetchNextQuestion}>Next Question ➔</button>
        </div>
      )}
      
    </div>
  );
}