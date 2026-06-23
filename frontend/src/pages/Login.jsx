import React, { useState } from 'react';
import api from '../api/axios'; 

export default function Login({ onNavigate, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]); 

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      const response = await api.post('/accounts/login/', { username, password });
      const { access, refresh, needs_onboarding, username: returnedName } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      onLoginSuccess(returnedName || username, needs_onboarding || false);
      
    } catch (err) {
      console.error("Axios Auth Error Object:", err);

      let extractedErrors = [];

      if (err.response) {
        const statusCode = err.response.status;
        const serverErrors = err.response.data;

        // Overrides explicit 401 Unauthorized or 400 Bad Request validations with user-friendly text
        if (statusCode === 401 || statusCode === 400) {
          extractedErrors.push("The username or password you entered is incorrect. Please check your spelling and try again.");
        } 
        else if (serverErrors.detail) {
          extractedErrors.push(serverErrors.detail);
        } 
        else if (serverErrors.non_field_errors) {
          if (Array.isArray(serverErrors.non_field_errors)) {
            extractedErrors.push(...serverErrors.non_field_errors);
          } else {
            extractedErrors.push(serverErrors.non_field_errors);
          }
        } 
        else if (typeof serverErrors === 'object') {
          extractedErrors.push(...Object.values(serverErrors).flat());
        }
      } else {
        extractedErrors.push("Could not establish server authentication response link.");
      }

      // Safety fallback guarantee
      if (extractedErrors.length === 0 || extractedErrors.includes("undefined")) {
        extractedErrors = ["The username or password you entered is incorrect."];
      }

      setErrors(extractedErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.authCard}>
        
        <div style={styles.headerSection}>
          <h2 style={styles.mainTitle}>Log In</h2>
          <p style={styles.subtitle}>Access your Equinox dashboard</p>
        </div>

        {/* Dynamic Error Banner Block */}
        {errors.length > 0 && (
          <div style={styles.errorBanner}>
            <div style={styles.bannerTextContainer}>
              <h5 style={styles.bannerTitle}>⚠️ Authentication Blocked</h5>
              <div style={styles.bannerDescription}>
                {errors.map((msg, idx) => (
                  <div key={`err-${idx}`} style={styles.errorItem}>{msg}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} style={styles.formElement}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input 
              type="text" 
              autoComplete="username"
              style={styles.inputField} 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              disabled={isSubmitting}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                autoComplete="current-password"
                style={styles.inputField} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={isSubmitting}
              />
              <button
                type="button"
                style={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          <div style={styles.recoveryRow}>
            <button 
              type="button" 
              style={styles.inlineLinkBtn} 
              onClick={() => onNavigate('forgot-password')}
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              ...styles.submitBtn, 
              backgroundColor: isSubmitting ? '#4a5568' : '#63b3ed', 
              color: isSubmitting ? '#1a202c': '#1a202c',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? "Verifying Credentials..." : "Authenticate Profile ➔"}
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
  
  passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  toggleBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  
  recoveryRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' },
  inlineLinkBtn: { background: 'none', border: 'none', color: '#a0aec0', padding: 0, cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'none' },
  
  inputField: { width: '100%', padding: '0.75rem 1rem', backgroundColor: '#111827', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '0.85rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.25rem', transition: 'transform 0.1s ease' },
  
  errorBanner: { display: 'flex', backgroundColor: 'rgba(245, 101, 101, 0.12)', border: '1px solid #f56565', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' },
  bannerTextContainer: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' },
  bannerTitle: { margin: 0, color: '#f56565', fontSize: '1rem', fontWeight: 'bold' },
  bannerDescription: { color: '#e2e8f0', fontSize: '0.875rem', lineHeight: '1.4' },
  errorItem: { marginTop: '2px' },
  
  footerText: { marginTop: '2rem', textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem', margin: '2rem 0 0 0' },
  switchBtn: { background: 'none', border: 'none', color: '#63b3ed', padding: 0, cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }
};