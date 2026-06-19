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
    <div style={styles.container}>
      <div style={styles.authCard}>
        
        <div style={styles.headerSection}>
          <h2 style={styles.mainTitle}>Create Account</h2>
          <p style={styles.subtitle}>Setup your personalized student profile</p>
        </div>

        {fieldErrors && (
          <div style={styles.errorBanner}>
            <div style={styles.bannerTextContainer}>
              <h5 style={styles.bannerTitle}>⚠️ Registration Incomplete</h5>
              <span style={styles.bannerDescription}>
                {Object.keys(fieldErrors).map((key) => 
                  fieldErrors[key].map((msg, idx) => <div key={`${key}-${idx}`}>{msg}</div>)
                )}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} style={styles.formElement}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input 
              type="text" 
              style={styles.inputField} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              required 
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              style={styles.inputField} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              style={styles.inputField} 
              onChange={e => setFormData({...formData, password1: e.target.value})} 
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input 
              type="password" 
              style={styles.inputField} 
              onChange={e => setFormData({...formData, password2: e.target.value})} 
              required 
            />
          </div>

          <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#68d391', color: '#1a202c' }}>
            Register Student Profile ➔
          </button>
        </form>

        <p style={styles.footerText}>
          Already have a profile?{' '}
          <button style={styles.switchBtn} onClick={() => onNavigate('login')}>
            Log In Here
          </button>
        </p>

      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: 'calc(100vh - 140px)', padding: '1rem', color: '#f7fafc' },
  authCard: { backgroundColor: '#1a202c', border: '1px solid #2d3748', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '460px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' },
  headerSection: { marginBottom: '2rem', textAlign: 'center' },
  mainTitle: { margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 'bold', color: '#fff' },
  subtitle: { margin: 0, color: '#a0aec0', fontSize: '0.95rem' },
  
  formElement: { display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' },
  label: { color: '#a0aec0', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' },
  
  inputField: { width: '100%', padding: '0.75rem 1rem', backgroundColor: '#111827', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease' },
  submitBtn: { width: '100%', padding: '0.85rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem', transition: 'transform 0.1s ease' },
  
  errorBanner: { display: 'flex', backgroundColor: 'rgba(245, 101, 101, 0.12)', border: '1px solid #f56565', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' },
  bannerTextContainer: { display: 'flex', flexDirection: 'column', gap: '4px' },
  bannerTitle: { margin: 0, color: '#f56565', fontSize: '1rem', fontWeight: 'bold' },
  bannerDescription: { color: '#e2e8f0', fontSize: '0.875rem', lineHeight: '1.4' },
  
  footerText: { marginTop: '2rem', textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem', margin: '2rem 0 0 0' },
  switchBtn: { background: 'none', border: 'none', color: '#68d391', padding: 0, cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }
};