import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function InstructorRegister({ onNavigate, onRegisterSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password1: '',
    password2: '',
    grade_level_min: 1,
    grade_level_max: 10,
    assigned_topics: [],
    instructional_scope: '',
  });
  const [topics, setTopics] = useState([]);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [loadingTopics, setLoadingTopics] = useState(true);

  useEffect(() => {
    // Fetch available topics for the checkbox list (public endpoint)
    api.get('/topics/all/')
      .then(res => setTopics(res.data))
      .catch(err => console.error("Failed to load topics", err))
      .finally(() => setLoadingTopics(false));
  }, []);

  const toggleTopic = (topicId) => {
    setFormData(prev => ({
      ...prev,
      assigned_topics: prev.assigned_topics.includes(topicId)
        ? prev.assigned_topics.filter(id => id !== topicId)
        : [...prev.assigned_topics, topicId],
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors(null);

    try {
      const response = await api.post('/accounts/register/instructor/', formData);
      
      if (response.data.authenticated || response.status === 201) {
        try {
          const tokenResponse = await api.post('/api/token/', {
            username: formData.username,
            password: formData.password1 
          });

          localStorage.setItem('access_token', tokenResponse.data.access);
          localStorage.setItem('refresh_token', tokenResponse.data.refresh);

          setTimeout(() => onRegisterSuccess(formData.username, response.data), 100);
        } catch (tokenErr) {
          console.error("Auto-login after registration failed", tokenErr);
          onNavigate('login'); 
        }
      } else {
        setFieldErrors(response.data.errors);
      }
    } catch (err) {
      console.error("Instructor Registration Error:", err);
      if (err.response && err.response.data) {
        setFieldErrors(err.response.data.errors || err.response.data);
      } else {
        setFieldErrors({ network: ["Could not establish server connection."] });
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    backgroundColor: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '3px',
    color: '#1e293b',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
  };

  const labelStyle = {
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    color: '#475569',
    fontSize: '0.6rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    width: '100%',
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
          <div style={styles.notebookCover}>
            <div style={styles.spiralBinding}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={styles.spiralHole}>
                  <div style={styles.spiralRing} />
                </div>
              ))}
            </div>

            <div style={styles.coverContent}>
              <div style={styles.marbleAccent} />

              <div style={styles.titleLabel}>
                <div style={styles.titleLabelInner}>
                  <h1 style={styles.coverTitle}>Equinox</h1>
                  <p style={styles.coverSubtitle}>Instructor / Contributor Registration</p>
                </div>
              </div>

              <div style={styles.ruledPage}>
                <div style={styles.redMargin} />
                <div style={styles.pageInner}>
                  {fieldErrors && (
                    <div style={styles.errorBanner}>
                      {Object.keys(fieldErrors).map((key) => 
                        fieldErrors[key].map((msg, idx) => <div key={`${key}-${idx}`}>{msg}</div>)
                      )}
                    </div>
                  )}

                  <form onSubmit={handleRegisterSubmit} style={styles.formElement}>
                    <div style={styles.formGroup}>
                      <label style={labelStyle}>Username</label>
                      <input 
                        type="text" 
                        style={inputStyle} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        required 
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={labelStyle}>Email Address</label>
                      <input 
                        type="email" 
                        style={inputStyle} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={labelStyle}>Password</label>
                      <input 
                        type="password" 
                        style={inputStyle} 
                        onChange={e => setFormData({...formData, password1: e.target.value})} 
                        required 
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={labelStyle}>Confirm Password</label>
                      <input 
                        type="password" 
                        style={inputStyle} 
                        onChange={e => setFormData({...formData, password2: e.target.value})} 
                        required 
                      />
                    </div>

                    {/* Grade Level Range */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <div style={styles.formGroup}>
                        <label style={labelStyle}>Min Grade Level</label>
                        <select
                          style={{ ...inputStyle, cursor: 'pointer' }}
                          value={formData.grade_level_min}
                          onChange={e => setFormData({...formData, grade_level_min: parseInt(e.target.value)})}
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(g => (
                            <option key={g} value={g}>Grade {g}</option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={labelStyle}>Max Grade Level</label>
                        <select
                          style={{ ...inputStyle, cursor: 'pointer' }}
                          value={formData.grade_level_max}
                          onChange={e => setFormData({...formData, grade_level_max: parseInt(e.target.value)})}
                        >
                          {[1,2,3,4,5,6,7,8,9,10].map(g => (
                            <option key={g} value={g}>Grade {g}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Instructional Scope */}
                    <div style={styles.formGroup}>
                      <label style={labelStyle}>Instructional Scope</label>
                      <input 
                        type="text" 
                        style={inputStyle}
                        placeholder="E.g. Elementary Mathematics Specialist"
                        value={formData.instructional_scope}
                        onChange={e => setFormData({...formData, instructional_scope: e.target.value})} 
                      />
                      <span style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '2px' }}>
                        Briefly describe your teaching scope or specialization.
                      </span>
                    </div>

                    {/* Assigned Topics */}
                    <div style={styles.formGroup}>
                      <label style={labelStyle}>Assigned Topics (select the ones you'll manage)</label>
                      {loadingTopics ? (
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Loading topics...</p>
                      ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '4px',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          padding: '6px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '3px',
                          backgroundColor: '#faf9f7',
                        }}>
                          {topics.map(topic => (
                            <label key={topic.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontSize: '0.72rem',
                              color: '#334155',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              backgroundColor: formData.assigned_topics.includes(topic.id) ? '#e0e7ff' : 'transparent',
                            }}>
                              <input
                                type="checkbox"
                                checked={formData.assigned_topics.includes(topic.id)}
                                onChange={() => toggleTopic(topic.id)}
                              />
                              {topic.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{
                      padding: '0.5rem',
                      backgroundColor: 'rgba(139, 92, 246, 0.06)',
                      border: '1px solid #c4b5fd',
                      borderRadius: '3px',
                      fontSize: '0.7rem',
                      color: '#6d28d9',
                      lineHeight: '1.4',
                    }}>
                      <strong>Access Notice:</strong> Your account will be restricted to the grade levels and topics selected above. You'll only be able to create and manage questions within your assigned scope.
                    </div>

                    <button type="submit" style={styles.stickyNoteBtn}>
                      <span style={styles.stickyNotePin}>📌</span>
                      <span>Register as Instructor</span>
                    </button>
                  </form>

                  <p style={styles.footerText}>
                    Already have an account?{' '}
                    <button style={styles.switchBtn} onClick={() => onNavigate('login')}>
                      Log In Here
                    </button>
                  </p>
                  <p style={styles.footerText}>
                    Want to register as a student?{' '}
                    <button style={styles.switchBtn} onClick={() => onNavigate('register')}>
                      Student Registration
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
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#a78bfa',
    fontStyle: 'italic',
    margin: 0,
    letterSpacing: '0.02em',
  },
  coverSubtitle: {
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontStyle: 'italic',
    margin: 0,
  },

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

  formElement: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
    width: '100%',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    width: '100%',
  },

  stickyNoteBtn: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '0.9rem',
    fontWeight: 'bold',
    backgroundColor: '#c4b5fd',
    color: '#1e293b',
    fontStyle: 'italic',
    letterSpacing: '0.02em',
    transform: 'rotate(0.5deg)',
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

  errorBanner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid #fca5a5',
    borderRadius: '3px',
    padding: '0.6rem 0.8rem',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '0.75rem',
    color: '#dc2626',
    lineHeight: '1.4',
  },

  footerText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.8rem',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontStyle: 'italic',
    margin: 0,
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#22c55e',
    padding: 0,
    cursor: 'pointer',
    fontWeight: 'bold',
    textDecoration: 'underline',
    fontFamily: "'Patrick Hand', 'Times New Roman', serif",
    fontSize: '0.8rem',
  },
};