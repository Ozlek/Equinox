import React, { useState, useEffect } from 'react';

export default function AchievementsCard() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/progress/achievements/', { 
      method: 'GET',
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setAchievements(data.achievements || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load achievements:", err);
        setError("Could not sync milestones with the Equinox server.");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="card p-4 shadow-sm text-center">Loading Achievements</div>;
  
  if (error) return <div className="alert alert-warning text-center my-3">{error}</div>;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
        <h5 className="fw-bold mb-0">Achievements</h5>
      </div>
      <div className="card-body">
        {achievements.length === 0 ? (
          <p className="text-muted small">No achievements registered in the engine yet.</p>
        ) : (
          <div className="row g-3">
            {achievements.map((badge) => (
              <div key={badge.id} className="col-12 col-md-6 col-xl-4">
                <div 
                  className={`p-3 border rounded d-flex align-items-center ${badge.unlocked ? 'bg-light border-primary' : 'bg-white text-muted'}`} 
                  style={{ opacity: badge.unlocked ? 1 : 0.6 }}
                >
                  <div className="fs-1 me-3">{badge.icon}</div>
                  <div>
                    <h6 className="mb-1 fw-bold">{badge.title}</h6>
                    <p className="mb-0 small" style={{ fontSize: '0.8rem' }}>
                      {badge.unlocked ? "Completed! 🌟" : badge.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}