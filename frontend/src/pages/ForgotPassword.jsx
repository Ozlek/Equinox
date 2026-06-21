import React, { useState } from 'react';
import api from '../api/axios';

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setIsSubmitting(true);

    try {
      // Endpoint provided by dj-rest-auth via your include statement
      await api.post('/accounts/password/reset/', { email });
      
      // If successful, trigger the success screen UI state
      setIsEmailSent(true);
    } catch (err) {
      console.error("Password Reset Request Error:", err);
      
      let extractedErrors = [];
      if (err.response && err.response.data) {
        const serverErrors = err.response.data;
        
        if (serverErrors.detail) {
          extractedErrors.push(serverErrors.detail);
        } else if (typeof serverErrors === 'object') {
          extractedErrors.push(...Object.values(serverErrors).flat());
        }
      } else {
        extractedErrors.push("Could not contact the recovery server. Check your network.");
      }

      setErrors(extractedErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUCCESS STATE UI ---
  if (isEmailSent) {
    return (
      <div style={styles.container}>
        <div style={styles.authCard}>
          <div style={styles.headerSection}>
            <h2 style={styles.mainTitle}>📩 Email Dispatched</h2>
            <p style={styles.subtitle}>Check your student or academic inbox</p>
          </div>

          <div style={styles.successBlock}>
            <p style={styles.successText}>
              If an account is associated with <strong>{email}</strong>, a temporary link to reset your credentials has been generated and sent.
            </p>
            <p style={styles.successSubtext}>
              Please check your spam or junk folder if the notification doesn't appear within a few minutes.
            </p>
          </div>

          <button 
            type="button" 
            style={{ ...styles.submitBtn, backgroundColor: '#63b3ed', color: '#1a202c' }}
            onClick={() => onNavigate('login')}
          >
            Return to Log In
          </button>
        </div>
      </div>
    );
  }

  // --- DEFAULT FORM UI ---
  return (
    <div style={styles.container}>
      <div style={styles.authCard}>
        
        <div style={styles.headerSection}>
          <h2 style={styles.mainTitle}>Recover Account</h2>
          <p style={styles.subtitle}>We'll send you an authentication bypass link</p>
        </div>

        {/* Flat Error Banner */}
        {errors.length > 0 && (
          <div style={styles.errorBanner}>
            <div style={styles.bannerTextContainer}>
              <h5 style={styles.bannerTitle}>⚠️ Recovery Request Failed</h5>
              <div style={styles.bannerDescription}>
                {errors.map((msg, idx) => (
                  <div key={`err-${idx}`} style={styles.errorItem}>{msg}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleResetSubmit} style={styles.formElement}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Registered Email Address</label>
            <input 
              type="email" 
              autoComplete="email"
              style={styles.inputField} 
              placeholder="e.g., student@example.com"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              disabled={isSubmitting}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              ...styles.submitBtn, 
              backgroundColor: isSubmitting ? '#4a5568' : '#63b3ed', 
              color: isSubmitting ? '#a0aec0' : '#1a202c',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? "Generating Token..." : "Send Recovery Link ➔"}
          </button>
        </form>

        <p style={styles.footerText}>
          Remembered your security profile?{' '}
          <button style={styles.switchBtn} onClick={() => onNavigate('login')}>
            Back to Sign In
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
  subtitle: { margin: 0, color: '#a0aec0', fontSize: '0.95rem', lineHeight: '1.4' },
  
  formElement: { display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' },
  label: { color: '#a0aec0', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' },
  inputField: { width: '100%', padding: '0.75rem 1rem', backgroundColor: '#111827', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  
  submitBtn: { width: '100%', padding: '0.85rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.5rem', transition: 'all 0.1s ease', cursor: 'pointer' },
  
  errorBanner: { display: 'flex', backgroundColor: 'rgba(245, 101, 101, 0.12)', border: '1px solid #f56565', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' },
  bannerTextContainer: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' },
  bannerTitle: { margin: 0, color: '#f56565', fontSize: '1rem', fontWeight: 'bold' },
  bannerDescription: { color: '#e2e8f0', fontSize: '0.875rem', lineHeight: '1.4' },
  errorItem: { marginTop: '2px' },

  successBlock: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(72, 187, 120, 0.08)', border: '1px solid #48bb78', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' },
  successText: { margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5' },
  successSubtext: { margin: 0, color: '#a0aec0', fontSize: '0.85rem', lineHeight: '1.4', italic: 'true' },
  
  footerText: { marginTop: '2rem', textAlign: 'center', color: '#a0aec0', fontSize: '0.9rem', margin: '2rem 0 0 0' },
  switchBtn: { background: 'none', border: 'none', color: '#63b3ed', padding: 0, cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }
};