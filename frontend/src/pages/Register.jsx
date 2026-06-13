import React, { useState } from 'react';
import { getCookie } from '../utils';

export default function Register({ onNavigate, onRegisterSuccess }) {
  const [formData, setFormData] = useState({ username: '', email: '', password1: '', password2: '' });
  const [fieldErrors, setFieldErrors] = useState(null);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const csrfToken = getCookie('csrftoken');

    fetch('http://127.0.0.1:8000/accounts/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setTimeout(() => onRegisterSuccess(data.username), 100);
        } else {
          setFieldErrors(data.errors);
        }
      });
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow border-0 p-4">
          <h2 className="fw-bold mb-3 text-center">Create Account</h2>
          
          {fieldErrors && (
            <div className="alert alert-danger">
              {/* Renders readability-friendly clean error text rather than raw JSON strings */}
              {fieldErrors.password1 || fieldErrors.password2 || JSON.stringify(fieldErrors)}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit}>
            <div className="mb-2">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" onChange={e => setFormData({...formData, username: e.target.value})} required />
            </div>
            
            <div className="mb-2">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            
            <div className="mb-2">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" onChange={e => setFormData({...formData, password1: e.target.value})} required />
            </div>

            <div className="mb-2">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" onChange={e => setFormData({...formData, password2: e.target.value})} required />
            </div>

            <button type="submit" className="btn btn-success w-100 mt-4 py-2">Register Student Profile</button>
          </form>
        </div>
      </div>
    </div>
  );
}