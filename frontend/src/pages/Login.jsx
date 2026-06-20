import React, { useState } from 'react';
import api from '../api/axios'; 

export default function Login({ onNavigate, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrors(null);

    try {
      const response = await api.post('/accounts/login/', { username, password });
      
      const { access, refresh, needs_onboarding, username: returnedName } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      onLoginSuccess(returnedName || username, needs_onboarding || false);
      
    } catch (err) {
      console.error("Axios Auth Error Object:", err);

      if (err.response) {
        const serverErrors = err.response.data;
        if (serverErrors.detail) {
          setErrors({ non_field_errors: [serverErrors.detail] });
        } else {
          setErrors(serverErrors);
        }
      } else {
        setErrors({ network: ["Could not establish server authentication response link."] });
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.authCard}>
        
        <div style={styles.headerSection}>
          <h2 style={styles.mainTitle}>Log In</h2>
          <p style={styles.subtitle}>Access your Equinox dashboard</p>
        </div>

        {errors && (
          <div style={styles.errorBanner}>
            <div style={styles.bannerTextContainer}>
              <h5 style={styles.bannerTitle}>⚠️ Authentication Blocked</h5>
              <span style={styles.bannerDescription}>
                {Object.keys(errors).map((key) => 
                  errors[key].map((msg, idx) => <div key={`${key}-${idx}`}>{msg}</div>)
                )}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={styles.formElement}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input 
              type="text" 
              style={styles.inputField} 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              style={styles.inputField} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" style={{ ...styles.submitBtn, backgroundColor: '#63b3ed', color: '#1a202c' }}>
            Authenticate Profile ➔
          </button>
        </form>

        <p style={styles.footerText}>
          Brand new to Equinox?{' '}
          <button style={styles.switchBtn} onClick={() => onNavigate('register')}>
            Register Here
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
  switchBtn: { background: 'none', border: 'none', color: '#63b3ed', padding: 0, cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }
};