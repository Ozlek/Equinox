import React, { useState } from 'react';
import api from '../api/axios';

export default function PasswordResetConfirm({ uid, token, onNavigate }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (newPassword !== confirmPassword) {
      setErrors(["Passwords do not match. Please retype them carefully."]);
      return;
    }

    setIsSubmitting(true);

    try {
      // Endpoint provided by dj-rest-auth (mounted at /accounts/password/reset/)
      await api.post('/accounts/password/reset/confirm/', {
        uid: uid,
        token: token,
        new_password1: newPassword,
        new_password2: confirmPassword
      });

      setIsSuccess(true);
    } catch (err) {
      console.error("Password Update Error:", err);
      
      let extractedErrors = [];
      if (err.response && err.response.data) {
        const serverErrors = err.response.data;
        
        // Handle common token expiration or validation messages
        if (serverErrors.detail) {
          extractedErrors.push(serverErrors.detail);
        } else if (typeof serverErrors === 'object') {
          extractedErrors.push(...Object.values(serverErrors).flat());
        }
      } else {
        extractedErrors.push("Failed to transmit change request. Link may be expired.");
      }

      setErrors(extractedErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={styles.container}>
        <div style={styles.authCard}>
          <div style={styles.headerSection}>
            <h2 style={styles.mainTitle}>🎉 Password Updated</h2>
            <p style={styles.subtitle}>Your Equinox credentials are now secure</p>
          </div>

          <div style={styles.successBlock}>
            <p style={styles.successText}>
              Your old single-use token has been revoked, and your new account access configurations are active.
            </p>
          </div>

          <button 
            type="button" 
            style={{ ...styles.submitBtn, backgroundColor: '#63b3ed', color: '#1a202c' }}
            onClick={() => onNavigate('login')}
          >
            Log In with New Password
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.authCard}>
        
        <div style={styles.headerSection}>
          <h2 style={styles.mainTitle}>Reset Credentials</h2>
          <p style={styles.subtitle}>Establish a new entry password for your profile</p>
        </div>

        {errors.length > 0 && (
          <div style={styles.errorBanner}>
            <div style={styles.bannerTextContainer}>
              <h5 style={styles.bannerTitle}>⚠️ Modification Blocked</h5>
              <div style={styles.bannerDescription}>
                {errors.map((msg, idx) => (
                  <div key={`err-${idx}`} style={styles.errorItem}>{msg}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleConfirmSubmit} style={styles.formElement}>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.passwordWrapper}>
              <input 
                type={showPassword ? "text" : "password"} 
                style={styles.inputField} 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
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

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              style={styles.inputField} 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
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
            {isSubmitting ? "Overwriting Database..." : "Save Selection ➔"}
          </button>
        </form>

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
  passwordWrapper: { position: 'relative', display: 'flex', alignItems: 'center', width: '100%' },
  toggleBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0, display: 'flex', alignItems: 'center' },
  inputField: { width: '100%', padding: '0.75rem 1rem', backgroundColor: '#111827', border: '1px solid #2d3748', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '0.85rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', marginTop: '0.5rem', transition: 'all 0.1s ease' },
  errorBanner: { display: 'flex', backgroundColor: 'rgba(245, 101, 101, 0.12)', border: '1px solid #f56565', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' },
  bannerTextContainer: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' },
  bannerTitle: { margin: 0, color: '#f56565', fontSize: '1rem', fontWeight: 'bold' },
  bannerDescription: { color: '#e2e8f0', fontSize: '0.875rem', lineHeight: '1.4' },
  errorItem: { marginTop: '2px' },
  successBlock: { display: 'flex', backgroundColor: 'rgba(72, 187, 120, 0.08)', border: '1px solid #48bb78', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' },
  successText: { margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5' }
};