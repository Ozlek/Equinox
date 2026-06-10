import React, { useState, useEffect } from 'react';

export default function TopicDetail({ topicId, onBack, onStartChallenge }) {
  const [topic, setTopic] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/topics/${topicId}/`, { method: 'GET' })
      .then((res) => res.json())
      .then((data) => setTopic(data));
  }, [topicId]);

  if (!topic) return <div className="text-center py-5">Compiling Learning Module Properties...</div>;

  return (
    <div className="card border-0 shadow-sm p-4">
      <div className="card-body">
        <h1 className="fw-bold mb-1">{topic.name}</h1>
        <h5 className="text-primary mb-4 fw-semibold">{topic.grade_level}</h5>
        <p className="fs-5 text-muted mb-4">{topic.description}</p>
        
        <hr />
        
        <h4 className="fw-bold mt-4">📋 Review Section</h4>
        <p className="text-muted">Learning materials and instructional walkthroughs for this topic will appear here soon.</p>
        
        <div className="d-flex gap-2 mt-5">
          <button className="btn btn-success px-4" onClick={() => onStartChallenge(topic.id)}>
            Start Challenge Playthrough
          </button>
          <button className="btn btn-secondary px-4" onClick={onBack}>
            Back to Catalogue
          </button>
        </div>
      </div>
    </div>
  );
}