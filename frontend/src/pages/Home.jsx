import React from 'react';

export default function Home({ onNavigate }) {
  return (
    <div className="container text-center py-5">
      <div className="row justify-content-center py-5">
        <div className="col-lg-8">
          <h1 className="display-3 fw-bold mb-3 text-dark">Equinox</h1>
          <p className="fs-4 text-muted mb-5">
            An adaptive learning ecosystem providing personalized mathematics engineering 
            tailored for grades 1 through 12.
          </p>
          <div className="d-grid gap-3 d-sm-flex justify-content-sm-center">
            <button className="btn btn-primary btn-lg px-5 shadow-sm" onClick={() => onNavigate('login')}>
              Sign In to Study
            </button>
            <button className="btn btn-outline-secondary btn-lg px-5" onClick={() => onNavigate('register')}>
              Create Student Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}