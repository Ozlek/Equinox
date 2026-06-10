import React, { useState } from 'react';
import { getCookie } from '../utils'; // Adjust based on your utils path setup

export default function Login({ onNavigate, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState(null);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const csrfToken = getCookie('csrftoken');

    fetch('http://127.0.0.1:8000/accounts/login/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          onLoginSuccess(data.username);
        } else {
          setErrors(data.errors || { non_field_errors: ["Invalid credentials credentials profile match."] });
        }
      })
      .catch(() => setErrors({ network: ["Could not establish server authentication response link."] }));
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-5">
        <div className="card shadow border-0 p-4">
          <h2 className="fw-bold mb-4 text-center">Sign In</h2>
          {errors && <div className="alert alert-danger">{JSON.stringify(errors)}</div>}
          <form onSubmit={handleLoginSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="mb-4">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2">Authenticate</button>
          </form>
          <p className="mt-4 text-center text-muted small">
            New to Equinox? <button className="btn btn-link p-0 small" onClick={() => onNavigate('register')}>Register Here</button>
          </p>
        </div>
      </div>
    </div>
  );
}