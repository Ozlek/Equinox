import React, { useState, useEffect } from 'react';

export default function ProgressHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/progress/', {
      method: 'GET',
      credentials: 'include', // Verification cookie authorization passage
    })
      .then((res) => res.json())
      .then((data) => {
        setRecords(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-5">Analyzing Student Mastery Profile Records...</div>;

  return (
    <div className="card border-0 shadow-sm p-4">
      <h1 className="fw-bold mb-4">📈 Progress Analytics Log</h1>
      {records.length === 0 ? (
        <div className="alert alert-info">No completions recorded yet! Jump into challenge evaluation mode to log metrics.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead className="table-dark">
              <tr>
                <th>Subject Topic Domain</th>
                <th>Performance Score</th>
                <th>Peak Assessment Tier achieved</th>
                <th>Completion Date Stamp</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="fw-bold">{r.topic_name}</td>
                  <td>
                    <span className={`badge ${r.score >= (r.total_questions / 2) ? 'bg-success' : 'bg-warning'}`}>
                      {r.score} / {r.total_questions}
                    </span>
                  </td>
                  <td><span className="badge bg-primary">{r.difficulty_achieved}</span></td>
                  <td className="text-muted small">{r.completed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}