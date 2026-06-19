import React, { useState, useEffect } from 'react';
import AchievementsCard from './Achievements';



export default function DashboardWorkspace({ onNavigate, onStartQuiz }) {
  const [activeSessionTopicId, setActiveSessionTopicId] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/playthrough/check_active/', {
      method: 'GET',
      credentials: 'include' // Critical: Sends the Django session cookie!
    })
      .then(res => res.json())
      .then(data => {
        if (data.has_active_session) {
          setActiveSessionTopicId(data.topic_id);
        }
      });
  }, []);

  return (
    <div>
      <div className="mb-4">
        <h1 className="fw-bold">Welcome to Equinox</h1>
        <p className="lead text-muted">Ready to improve your mathematical expertise?</p>
      </div>

      {/* NEW: Interceptor Banner - Only appears if they refreshed mid-quiz */}
      {activeSessionTopicId && (
        <div className="alert alert-warning shadow-sm border-warning d-flex justify-content-between align-items-center mb-4 p-3">
          <div>
            <h5 className="mb-1 text-dark fw-bold">⚠️ Session in Progress</h5>
            <span className="text-dark">You have an ongoing challenge. Resuming now prevents you from losing your progress!</span>
          </div>
          {/* Jump them right back to the exact question they were on */}
          <button 
            className="btn btn-warning fw-bold px-4 py-2" 
            onClick={() => onStartQuiz(activeSessionTopicId)}
          >
            Resume Challenge ➔
          </button>
        </div>
      )}

      {/* Quick Action Navigation Grid*/}
      <div className="row mt-4 g-4">
        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-0 bg-light">
            <div className="card-body d-flex flex-column">
              <h5>Topic Catalogue</h5>
              <p className="small text-muted flex-grow-1">Review available K-12 math structural areas.</p>
              <button className="btn btn-primary w-100 mt-2" onClick={() => onNavigate('catalogue')}>Open Catalogue</button>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-0 bg-light">
            <div className="card-body d-flex flex-column">
              <h5>Progress History</h5>
              <p className="small text-muted flex-grow-1">View your quiz performance matrices and logs.</p>
              <button className="btn btn-success w-100 mt-2" onClick={() => onNavigate('progress')}>Open History</button>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100 border-primary bg-light">
            <div className="card-body d-flex flex-column">
              <h5 className="text-primary fw-bold">Quick Start Quiz</h5>
              <p className="small text-muted flex-grow-1">Begin an immediate assessment playthrough challenge.</p>
              {/* Note: I'm assuming you have a default topic or a quick-start handler here! */}
              <button 
                className="btn btn-danger w-100 mt-2" 
                onClick={() => onNavigate('catalogue')}
                disabled={activeSessionTopicId !== null} // Lock this if they need to resume!
              >
                Launch Challenge
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gamification & Mastery Section */}
      <div className="mt-5">
        <AchievementsCard />
      </div>
    </div>
  );
}