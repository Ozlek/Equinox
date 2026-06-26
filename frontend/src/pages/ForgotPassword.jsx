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
      await api.post('/accounts/password/reset/', { email });
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

  if (isEmailSent) {
    return (
      <div style={styles.graphingPaper}>
        <div style={styles.card}>
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
            style={styles.submitBtn}
            onClick={() => onNavigate('login')}
          >
            Return to Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes diagonalSlide {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -400px 400px, 0 0, 0 0; }
        }
      `}</style>
      <div style={styles.graphingPaper}>
        <div style={styles.card}>
          
          <div style={styles.headerSection}>
            <h2 style={styles.mainTitle}>Recover Account</h2>
            <p style={styles.subtitle}>We'll send you an authentication bypass link</p>
          </div>

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
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? "Generating Token..." : "Send Password Recovery Link ➔"}
            </button>
          </form>

          <p style={styles.footerText}>
            Remembered your profile?{' '}
            <button style={styles.switchBtn} onClick={() => onNavigate('login')}>
              Back to Log In
            </button>
          </p>

        </div>
      </div>
    </>
  );
}

const styles = {
  graphingPaper: {
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: '#f5f3f0',
    backgroundImage: [
      `url('data:image/svg+xml;utf8,<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><text x="50" y="70" font-size="48" font-weight="bold" fill="rgba(239,68,68,0.25)" text-anchor="middle">+</text><text x="200" y="120" font-size="48" font-weight="bold" fill="rgba(251,191,36,0.25)" text-anchor="middle">−</text><text x="350" y="170" font-size="48" font-weight="bold" fill="rgba(79,70,229,0.25)" text-anchor="middle">×</text><text x="100" y="220" font-size="48" font-weight="bold" fill="rgba(34,197,94,0.3)" text-anchor="middle">÷</text><text x="300" y="280" font-size="48" font-weight="bold" fill="rgba(239,68,68,0.25)" text-anchor="middle">+</text><text x="150" y="330" font-size="48" font-weight="bold" fill="rgba(251,191,36,0.25)" text-anchor="middle">−</text></svg>')`,
      'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
      'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(120,100,80,0.28) 39px, rgba(120,100,80,0.28) 42px)',
    ].join(', '),
    backgroundRepeat: 'repeat',
    animation: 'diagonalSlide 12s linear infinite',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    boxSizing: 'border-box',
    position: 'relative',
  },

  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    position: 'relative',
    zIndex: 1,
  },

  headerSection: {
    textAlign: 'center',
  },
  mainTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0 0 0.25rem 0',
  },
  subtitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.85rem',
    color: '#64748b',
    fontStyle: 'italic',
    margin: 0,
  },

  formElement: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
  },
  label: {
    fontFamily: "'Courier New', monospace",
    color: '#475569',
    fontSize: '0.65rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  inputField: {
    width: '100%',
    padding: '0.7rem 0.9rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '3px',
    color: '#1e293b',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
  },

  submitBtn: {
    width: '100%',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '2px',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontStyle: 'italic',
    backgroundColor: '#93c5fd',
    color: '#1e293b',
    transform: 'rotate(-0.3deg)',
    boxShadow: '2px 3px 8px rgba(0,0,0,0.12)',
    marginTop: '0.25rem',
    cursor: 'pointer',
  },

  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid #fca5a5',
    borderRadius: '3px',
    padding: '0.85rem',
  },
  bannerTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  },
  bannerTitle: {
    margin: 0,
    color: '#dc2626',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    fontFamily: "'Courier New', monospace",
  },
  bannerDescription: {
    color: '#1e293b',
    fontSize: '0.8rem',
    lineHeight: '1.4',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  errorItem: {
    marginTop: '2px',
  },

  successBlock: {
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    border: '1px solid #86efac',
    borderRadius: '3px',
    padding: '1rem',
  },
  successText: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.9rem',
    color: '#1e293b',
    margin: '0 0 0.5rem 0',
    lineHeight: '1.5',
  },
  successSubtext: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.8rem',
    color: '#64748b',
    fontStyle: 'italic',
    margin: 0,
  },

  footerText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.85rem',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontStyle: 'italic',
    margin: 0,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    padding: 0,
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'underline',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.85rem',
  },
};