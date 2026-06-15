import React, { useState } from 'react';

export default function ChallengeConfigModal({ isOpen, onClose, onLaunch, topicTitle = "Selected Topic" }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('novice');

  const difficulties = [
    { id: 'novice', label: 'Novice', color: '#68d391', desc: 'Focuses on core concepts with extensive hints.' },
    { id: 'intermediate', label: 'Intermediate', color: '#63b3ed', desc: 'Standard assessment with balanced question types.' },
    { id: 'advanced', label: 'Advanced', color: '#f6ad55', desc: 'Complex problem-solving with minimal guidance.' },
    { id: 'expert', label: 'Expert', color: '#f56565', desc: 'High-stress scenarios prioritizing speed and mastery.' }
  ];

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard} className="animate-fade-in-up">
        
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Initialize Sequence</h2>
            <p style={styles.subtitle}>Target: <span style={{ color: '#0dcaf0', fontWeight: 'bold' }}>{topicTitle}</span></p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Difficulty Selection Grid */}
        <div style={styles.section}>
          <label style={styles.sectionLabel}>1. SELECT BASELINE DIFFICULTY</label>
          <div style={styles.difficultyGrid}>
            {difficulties.map((diff) => {
              const isActive = selectedDifficulty === diff.id;
              return (
                <div 
                  key={diff.id}
                  style={{
                    ...styles.difficultyCard,
                    borderColor: isActive ? diff.color : '#2d3748',
                    backgroundColor: isActive ? `${diff.color}15` : '#111827',
                  }}
                  onClick={() => setSelectedDifficulty(diff.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ ...styles.diffTitle, color: isActive ? diff.color : '#e2e8f0' }}>{diff.label}</h4>
                    {isActive && <i className="bi bi-check-circle-fill" style={{ color: diff.color }}></i>}
                  </div>
                  <p style={styles.diffDesc}>{diff.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modifiers Section (Placeholders) */}
        <div style={styles.section}>
          <label style={styles.sectionLabel}>2. SESSION MODIFIERS (OPTIONAL)</label>
          <div style={styles.modifierContainer}>
            
            <div style={styles.modifierToggle}>
              <div style={styles.modText}>
                <span style={styles.modTitle}>⏱️ Time Attack</span>
                <span style={styles.modDesc}>Enforce strict time limits per question</span>
              </div>
              <input type="checkbox" style={styles.checkbox} disabled />
            </div>

            <div style={styles.modifierToggle}>
              <div style={styles.modText}>
                <span style={styles.modTitle}>🛡️ Safe Mode</span>
                <span style={styles.modDesc}>Disable penalty for incorrect answers</span>
              </div>
              <input type="checkbox" style={styles.checkbox} disabled />
            </div>

          </div>
          <p style={{ fontSize: '0.8rem', color: '#718096', marginTop: '8px', fontStyle: 'italic' }}>
            * Modifiers are locked pending administrator module activation.
          </p>
        </div>

        {/* Footer Actions */}
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Abort</button>
          <button 
            style={styles.launchBtn} 
            onClick={() => onLaunch(selectedDifficulty)}
          >
            Launch Challenge ➔
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  // Full-screen takeover with blur to focus attention
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem 1rem', overflowY: 'auto' },
  
  // Main Modal Window
  modalCard: { backgroundColor: '#1a202c', border: '1px solid #2d3748', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)', marginTop: 'auto', marginBottom: 'auto', boxSizing: 'border-box'},
  
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { margin: '0 0 0.25rem 0', color: '#f7fafc', fontSize: '1.5rem', fontWeight: 'bold' },
  subtitle: { margin: 0, color: '#a0aec0', fontSize: '0.95rem' },
  closeBtn: { background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '1.25rem', padding: '4px', transition: 'color 0.2s ease' },

  section: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sectionLabel: { color: '#a0aec0', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.05em' },
  
  // Responsive Grid for Difficulties
  difficultyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' },
  difficultyCard: { padding: '1rem', borderRadius: '12px', border: '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s ease' },
  diffTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 'bold' },
  diffDesc: { margin: 0, color: '#a0aec0', fontSize: '0.85rem', lineHeight: '1.4' },

  // Modifiers Styling
  modifierContainer: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #2d3748' },
  modifierToggle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }, // Opacity lowered to indicate placeholder/disabled
  modText: { display: 'flex', flexDirection: 'column' },
  modTitle: { color: '#e2e8f0', fontWeight: 'bold', fontSize: '0.95rem' },
  modDesc: { color: '#718096', fontSize: '0.85rem' },
  checkbox: { width: '18px', height: '18px', cursor: 'not-allowed' },

  // Action Buttons
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1rem' },
  cancelBtn: { backgroundColor: 'transparent', color: '#a0aec0', border: '1px solid #4a5568', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  launchBtn: { backgroundColor: '#0dcaf0', color: '#111827', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(13, 202, 240, 0.2)' }
};