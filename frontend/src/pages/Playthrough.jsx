import React, { useState, useEffect } from 'react';
import { getCookie } from '../utils';

export default function PlaythroughChallenge({ topicId }) {
  const [gameState, setGameState] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Fetch view payload (GET)
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
      });
  };

  useEffect(() => {
    fetchNextQuestion();
  }, [topicId]);

  // Submit answer payload (POST)
  const handleSubmit = (e) => {
    e.preventDefault();
    const csrfToken = getCookie('csrftoken'); // Pull the cookie token value

    fetch(`http://127.0.0.1:8000/playthrough/${topicId}/`, {
      method: 'POST',
      credentials: 'include', // Sends your session authorization cookie
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken, // <-- CRITICAL: Pass validation token here!
      },
      body: JSON.stringify({ answer: selectedAnswer }),
    })
      .then((res) => res.json())
      .then((data) => {
        setFeedback(data); // Contains backend evaluation (is_correct)
      });
  };

  if (!gameState) return <div>Loading Equinox Challenge Engine...</div>;

  // Handle Session Completion Render Block
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
      <div className="d-flex justify-content-between mb-3">
        <span>Question {gameState.question_number} of {gameState.total_questions}</span>
        <span className="badge bg-primary">Tier: {gameState.current_tier}</span>
      </div>

      <h3 className="mb-4">{gameState.question_text}</h3>

      {!feedback ? (
        <form onSubmit={handleSubmit}>
          {gameState.choices ? (
            // Render multiple choice template options dynamically
            Object.entries(gameState.choices).map(([key, value]) => (
              <div key={key} className="form-check mb-2">
                <input className="form-check-input" type="radio" name="mathAns" value={key} id={key} onChange={(e) => setSelectedAnswer(e.target.value)} required />
                <label className="form-check-label" htmlFor={key}>{value}</label>
              </div>
            ))
          ) : (
            // Textbox input template fallback automatically
            <input type="text" className="form-control mb-3" value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)} placeholder="Type numerical answer..." required />
          )}
          <button type="submit" className="btn btn-success mt-3">Submit Answer</button>
        </form>
      ) : (
        // Real-Time Feedback Display Layout
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