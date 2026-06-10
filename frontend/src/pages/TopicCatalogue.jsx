import React, { useState, useEffect } from 'react';

export default function TopicCatalogue({ onSelectTopic }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/topics/', { method: 'GET' })
      .then((res) => res.json())
      .then((data) => {
        setTopics(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-5">Loading Topic Catalogue Matrix...</div>;

  return (
    <div>
      <h1 className="mb-4 fw-bold">Topic Catalogue</h1>
      <div className="row">
        {topics.map((topic) => (
          <div key={topic.id} className="col-md-6 col-lg-4 mb-4">
            <div className="card shadow-sm h-100 border-0 shadow-hover">
              <div className="card-body d-flex flex-column">
                <h4 className="card-title fw-bold">{topic.name}</h4>
                <h6 className="badge bg-secondary align-self-start mb-3">{topic.grade_level}</h6>
                <p className="card-text text-muted small flex-grow-1">{topic.description}</p>
                <button className="btn btn-primary mt-3 w-100" onClick={() => onSelectTopic(topic.id)}>
                  Review Topic Setup
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}