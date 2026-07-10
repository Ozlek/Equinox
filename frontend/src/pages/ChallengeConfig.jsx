import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { playBegin, playClick, playCheck } from '../utils/sounds';

export default function ChallengeConfigModal({ isOpen, onClose, onLaunch, topicTitle = "Selected Topic" }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate');
  const [availableModifiers, setAvailableModifiers] = useState([]);
  const [equippedModifierSlug, setEquippedModifierSlug] = useState('');
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const [activeModifiers, setActiveModifiers] = useState({
    timed: false,
    disable_adjuster: false,
    one_life: false,
    easy_going: false
  });

  const difficulties = [
    { id: 'Novice', label: 'Novice', color: '#16a34a', desc: 'Focuses on core concepts with extensive hints.' },
    { id: 'Intermediate', label: 'Intermediate', color: '#2563eb', desc: 'Standard assessment with balanced question types.' },
    { id: 'Advanced', label: 'Advanced', color: '#d97706', desc: 'Complex problem-solving with minimal guidance.' },
    { id: 'Expert', label: 'Expert', color: '#dc2626', desc: 'High-stress scenarios prioritizing speed and mastery.' }
  ];

  useEffect(() => {
    if (isOpen) {
      setIsLoadingInventory(true);

      api.get('/playthrough/inventory/')
        .then(res => {
          setAvailableModifiers(res.data.available_modifiers || []);
          setIsLoadingInventory(false);
        })
        .catch(err => {
          console.error("Error fetching inventory:", err);
          setIsLoadingInventory(false);
        });
    }
  }, [isOpen]);

const toggleModifier = (key) => {
    playCheck();
    setActiveModifiers(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'easy_going' && next.easy_going) {
        next.timed = false;
        next.one_life = false;
      }
      if ((key === 'timed' || key === 'one_life') && next[key]) {
        next.easy_going = false;
      }
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.reportPaper}>
        
        {/* ── Header with punched holes ── */}
        <div style={styles.reportHeader}>
          <div style={styles.punchedHoles}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={styles.hole} />
            ))}
          </div>
          <div style={styles.headerContent}>
            <div>
              <h2 style={styles.title}>Challenge Setup</h2>
              <p style={styles.subtitle}>Target: <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{topicTitle}</span></p>
            </div>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Ruled Content Area ── */}
        <div style={styles.ruledContent}>
          <div style={styles.redMargin} />
          <div style={styles.contentInner}>

            {/* SECTION 1: DIFFICULTY */}
            <section style={styles.section}>
              <label style={styles.sectionLabel}>1. SELECT BASELINE DIFFICULTY</label>
<div style={styles.difficultyGrid}>
                {difficulties.map((diff) => {
                  const isActive = selectedDifficulty === diff.id;
                  return (
                    <div 
                      key={diff.id}
                      style={{
                        ...styles.difficultyCard,
                        borderColor: isActive ? diff.color : '#e2e8f0',
                        backgroundColor: isActive ? `${diff.color}10` : '#fefdfb',
                      }}
                      onClick={() => {
                        playClick();
                        setSelectedDifficulty(diff.id);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <h4 style={{ ...styles.diffTitle, color: isActive ? diff.color : '#1e293b' }}>{diff.label}</h4>
                        {isActive && <i className="bi bi-check-circle-fill" style={{ color: diff.color }}></i>}
                      </div>
                      <p style={styles.diffDesc}>{diff.desc}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION 2: INVENTORY */}
            <section style={styles.section}>
              <label style={styles.sectionLabel}>2. TOOLS INVENTORY (WORK IN PROGRESS)</label>
              <div style={styles.inventoryContainer}>
                {isLoadingInventory ? (
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>Scanning inventory cache...</p>
                ) : availableModifiers.length === 0 ? (
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>⚠️ No tools in inventory. Work in progress.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <select 
                      value={equippedModifierSlug} 
                      onChange={(e) => setEquippedModifierSlug(e.target.value)}
                      style={styles.dropdown}
                    >
                      <option value="">-- No Consumable Item Equipped --</option>
                      {availableModifiers.map((mod) => (
                        <option key={mod.slug} value={mod.slug}>
                          {mod.name} (Owned: {mod.quantity}x) - {mod.description || mod.type}
                        </option>
                      ))}
                    </select>
                    {equippedModifierSlug && (
                      <p style={styles.itemConfirmation}>
                        ✨ Target item locked. Will be consumed upon completing this playthrough.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 3: MODIFIERS */}
            <section style={styles.section}>
              <label style={styles.sectionLabel}>3. CHALLENGE MODIFIERS (OPTIONAL)</label>
              <div style={styles.modifierContainer}>
                <ModifierToggle 
                  icon="⏱️" title="Timed Questions" desc="Enforce strict time limits per question (+0.25x)" 
                  checked={activeModifiers.timed} onChange={() => toggleModifier('timed')} 
                />
                <ModifierToggle 
                  icon="🔒" title="Disable Adjuster" desc="Lock DDA to selected difficulty throughout (Up to +0.25x)" 
                  checked={activeModifiers.disable_adjuster} onChange={() => toggleModifier('disable_adjuster')} 
                />
                <ModifierToggle 
                  icon="❤️‍🔥" title="One Life" desc="A single incorrect answer ends the session (+0.50x)" 
                  checked={activeModifiers.one_life} onChange={() => toggleModifier('one_life')} 
                />
                <ModifierToggle 
                  icon="🍃" title="Easy-Going Mode" desc="No timers, no streak break penalties (-0.25x)" 
                  checked={activeModifiers.easy_going} onChange={() => toggleModifier('easy_going')} 
                />
              </div>
            </section>

          </div>
        </div>

{/* ── Footer ── */}
        <div style={styles.reportFooter}>
          <span>Equinox Challenge Configuration</span>
          <button style={styles.cancelBtn} onClick={() => {
            playClick();
            onClose();
          }}>Cancel</button>
          <button 
            style={styles.launchBtn} 
            onClick={() => {
              playBegin();
              const activeModsList = Object.keys(activeModifiers).filter(k => activeModifiers[k]);
              onLaunch(selectedDifficulty, activeModsList, equippedModifierSlug);
            }}
          >
            Launch Challenge ➔
          </button>
        </div>

      </div>
    </div>
  );
}

const ModifierToggle = ({ icon, title, desc, checked, onChange }) => (
  <div style={{ ...styles.modifierToggle, opacity: 1, cursor: 'pointer' }} onClick={onChange}>
    <div style={styles.modText}>
      <span style={styles.modTitle}>{icon} {title}</span>
      <span style={styles.modDesc}>{desc}</span>
    </div>
    <div style={{
      ...styles.checkbox,
      backgroundColor: checked ? '#3b82f6' : '#fefdfb',
      borderColor: checked ? '#3b82f6' : '#cbd5e1',
    }}>
      {checked && <span style={styles.checkmark}>✓</span>}
    </div>
  </div>
);

const styles = {
  overlay: { 
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)', 
    zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', 
    padding: '2rem 1rem', overflowY: 'auto' 
  },

  // ── Report Paper ──
  reportPaper: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '600px',
    backgroundColor: '#fefdfb',
    borderRadius: '4px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    border: '1px solid #d6d3d1',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    color: '#1e293b',
    overflow: 'hidden',
    marginTop: 'auto',
    marginBottom: 'auto',
  },

  // ── Header ──
  reportHeader: {
    position: 'relative',
    backgroundColor: '#1e293b',
    padding: '1.25rem 1.5rem 1rem',
    borderBottom: '3px solid #3b82f6',
  },
  punchedHoles: {
    position: 'absolute',
    left: '16px',
    top: '0',
    bottom: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: '10px 0',
    zIndex: 2,
  },
  hole: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#fefdfb',
    border: '2px solid #475569',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginLeft: '24px',
  },
  title: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  subtitle: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '1.1rem',
    padding: '4px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Ruled Content ──
  ruledContent: {
    display: 'flex',
    flexDirection: 'row',
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(203,213,225,0.3) 31px, rgba(203,213,225,0.3) 32px)',
    position: 'relative',
  },
  redMargin: {
    width: '3px',
    backgroundColor: '#ef4444',
    opacity: 0.5,
    flexShrink: 0,
    marginLeft: '1.5rem',
    alignSelf: 'stretch',
  },
  contentInner: {
    flex: 1,
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },

  // ── Section Styles ──
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    letterSpacing: '0.05em',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  difficultyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '10px',
  },
  difficultyCard: {
    padding: '0.9rem 1rem',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  diffTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 'bold',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  diffDesc: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  inventoryContainer: {
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  dropdown: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '6px',
    backgroundColor: '#fefdfb',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  itemConfirmation: {
    margin: '4px 0 0 0',
    color: '#2563eb',
    fontSize: '0.8rem',
    fontStyle: 'italic',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modifierContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    backgroundColor: '#f8fafc',
    padding: '1rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  modifierToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
  },
  modText: {
    display: 'flex',
    flexDirection: 'column',
  },
  modTitle: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: '0.95rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  modDesc: {
    color: '#64748b',
    fontSize: '0.85rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  checkbox: {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    border: '2px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  checkmark: {
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },

  // ── Footer ──
  reportFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    padding: '0.75rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    padding: '0.6rem 1.25rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.9rem',
  },
  launchBtn: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    padding: '0.6rem 1.5rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '0.9rem',
  },
};