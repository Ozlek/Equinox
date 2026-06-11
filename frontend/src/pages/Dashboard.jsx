import React from 'react';
import AchievementsCard from './Achievements';

export default function DashboardWorkspace({ onNavigate, onStartQuiz }) {
  return (
    <div>
      <div className="mb-4">
        <h1 className="fw-bold">Welcome to Equinox</h1>
        <p className="lead text-muted">Ready to improve your mathematical expertise today?</p>
      </div>

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
              <button className="btn btn-danger w-100 mt-2" onClick={() => onStartQuiz(1)}>Launch Challenge</button>
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