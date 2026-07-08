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
      const { access, refresh, needs_onboarding, username: returnedName, is_staff, is_superuser } = response.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      onLoginSuccess(returnedName || username, needs_onboarding || false, is_staff || false, is_superuser || false);
      
    } catch (err) {
      console.error("Axios Auth Error Object:", err);

      let extractedErrors = [];

      if (err.response) {
        const statusCode = err.response.status;
        const serverErrors = err.response.data;

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

      // Filter out any undefined or null values from the array
      extractedErrors = extractedErrors.filter(msg => msg != null && msg !== undefined);

      if (extractedErrors.length === 0) {
        extractedErrors = ["The username or password you entered is incorrect."];
      }

      setErrors(extractedErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes diagonalSlide {
          0% { background-position: 0 0, 0 0, 0 0; }
          100% { background-position: -400px 400px, 0 0, 0 0; }
        }
      `}</style>
      <div style={styles.graphingPaper}>
        <div style={styles.pageWrapper}>
          {/* Notebook Cover Card */}
          <div style={styles.notebookCover}>
            {/* Spiral binding — left side */}
            <div style={styles.spiralBinding}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={styles.spiralHole}>
                  <div style={styles.spiralRing} />
                </div>
              ))}
            </div>

            <div style={styles.coverContent}>
              {/* Marble texture */}
              <div style={styles.marbleAccent} />

              {/* Title label — simple Equinox branding */}
              <div style={styles.titleLabel}>
                <div style={styles.titleLabelInner}>
                  <h1 style={styles.coverTitle}>Equinox</h1>
                  <p style={styles.coverSubtitle}>Log In</p>
                </div>
              </div>

              {/* Ruled notebook page area */}
              <div style={styles.ruledPage}>
                <div style={styles.redMargin} />
                <div style={styles.pageInner}>
                  {errors.length > 0 && (
                    <div style={styles.errorBanner}>
                      {errors.map((msg, idx) => (
                        <div key={idx} style={styles.errorItem}>{msg}</div>
                      ))}
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
                          {showPassword ? "👁" : "🙈"}
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
                        ...styles.stickyNoteBtn,
                        opacity: isSubmitting ? 0.7 : 1,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span style={styles.stickyNotePin}>📌</span>
                      <span>{isSubmitting ? "Verifying Credentials..." : "Log In"}</span>
                    </button>
                  </form>

                  <p style={styles.footerText}>
                    New to Equinox?{' '}
                    <button style={styles.switchBtn} onClick={() => onNavigate('register')}>
                      Register Here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
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

  pageWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: '520px',
    position: 'relative',
    zIndex: 1,
  },

  // ── Composition Notebook Cover ──
  notebookCover: {
    position: 'relative',
    display: 'flex',
    backgroundColor: '#1e293b',
    borderRadius: '6px',
    width: '100%',
    boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
    border: '2px solid #334155',
    overflow: 'hidden',
  },

  spiralBinding: {
    position: 'absolute',
    left: '16px',
    top: '30px',
    bottom: '30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  spiralHole: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#0f172a',
    border: '2px solid #475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  spiralRing: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#64748b',
  },

  coverContent: {
    position: 'relative',
    flex: 1,
    padding: '1.75rem 1.5rem 1.75rem 2.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },

  marbleAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: [
      'radial-gradient(ellipse at 20% 30%, rgba(99, 179, 237, 0.05) 0%, transparent 50%)',
      'radial-gradient(ellipse at 80% 20%, rgba(192, 132, 252, 0.04) 0%, transparent 40%)',
      'radial-gradient(ellipse at 50% 80%, rgba(13, 202, 240, 0.03) 0%, transparent 50%)',
    ].join(', '),
    pointerEvents: 'none',
  },

  // ── Title Label ──
  titleLabel: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    backgroundColor: '#334155',
    border: '1px solid #475569',
    borderRadius: '3px',
    padding: '0.75rem 1rem',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.25)',
  },
  titleLabelInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  coverTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#60a5fa',
    fontStyle: 'italic',
    margin: 0,
    letterSpacing: '0.02em',
  },
  coverSubtitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontStyle: 'italic',
    margin: 0,
  },

  // ── Ruled Notebook Page ──
  ruledPage: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    backgroundColor: '#f8f7f4',
    borderRadius: '3px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
  },

  redMargin: {
    width: '3px',
    backgroundColor: '#ef4444',
    opacity: 0.4,
    flexShrink: 0,
  },

  pageInner: {
    flex: 1,
    padding: '1.25rem 1.25rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  // ── Form ──
  formElement: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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

  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  toggleBtn: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recoveryRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '-4px',
  },
  inlineLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    padding: 0,
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontStyle: 'italic',
    textDecoration: 'underline',
    textDecorationColor: '#94a3b8',
  },

  inputField: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    backgroundColor: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '3px',
    color: '#1e293b',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
  },

  // ── Sticky Note Submit Button ──
  stickyNoteBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.9rem',
    fontWeight: 'bold',
    backgroundColor: '#93c5fd',
    color: '#1e293b',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    transform: 'rotate(-0.5deg)',
    boxShadow: '2px 3px 8px rgba(0,0,0,0.12), -1px -1px 0 rgba(255,255,255,0.4) inset',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '0.25rem',
  },

  stickyNotePin: {
    fontSize: '0.85rem',
    lineHeight: 1,
  },

  // ── Error Banner ──
  errorBanner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid #fca5a5',
    borderRadius: '3px',
    padding: '0.6rem 0.8rem',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: '0.75rem',
    color: '#dc2626',
    lineHeight: '1.4',
  },
  errorItem: {
    marginTop: '2px',
  },

  // ── Footer ──
  footerText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.8rem',
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
    fontSize: '0.8rem',
  },
};