import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ChallengeConfigModal({ isOpen, onClose, onLaunch, topicTitle = "Selected Topic" }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate'); // Match backend default capitalization
  const [availableModifiers, setAvailableModifiers] = useState([]); // Loaded from backend DB
  const [equippedModifierSlug, setEquippedModifierSlug] = useState(''); // Tracking selected consumable
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const [activeModifiers, setActiveModifiers] = useState({
    timed: false,
    disable_adjuster: false,
    one_life: false,
    easy_going: false
  });

  const difficulties = [
    { id: 'Novice', label: 'Novice', color: '#68d391', desc: 'Focuses on core concepts with extensive hints.' },
    { id: 'Intermediate', label: 'Intermediate', color: '#63b3ed', desc: 'Standard assessment with balanced question types.' },
    { id: 'Advanced', label: 'Advanced', color: '#f6ad55', desc: 'Complex problem-solving with minimal guidance.' },
    { id: 'Expert', label: 'Expert', color: '#f56565', desc: 'High-stress scenarios prioritizing speed and mastery.' }
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
      <div style={styles.modalCard} className="animate-fade-in-up">
        
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Initialize Sequence</h2>
            <p style={styles.subtitle}>Target: <span style={{ color: '#0dcaf0', fontWeight: 'bold' }}>{topicTitle}</span></p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>

        {/* SECTION 1: DIFFICULTY SELECTION */}
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

        <div style={styles.section}>
          <label style={styles.sectionLabel}>2. TOOLS INVENTORY (WORK IN PROGRESS)</label>
          <div style={styles.inventoryContainer}>
            {isLoadingInventory ? (
              <p style={{ color: '#a0aec0', margin: 0, fontSize: '0.9rem' }}>Scanning inventory cache...</p>
            ) : availableModifiers.length === 0 ? (
              <p style={{ color: '#718096', margin: 0, fontSize: '0.9rem' }}>⚠️ No tools in inventory. Work in progress.</p>
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
        </div>

        {/* SECTION 3: RULES/VARIANTS */}
        <div style={styles.section}>
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
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Abort</button>
          <button 
            style={styles.launchBtn} 
            onClick={() => {
              const activeModsList = Object.keys(activeModifiers).filter(k => activeModifiers[k]);
              // Pass the chosen difficulty, gameplay conditions array, and the item slug to parent launch handler
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
    <input type="checkbox" style={{ cursor: 'pointer' }} checked={checked} readOnly />
  </div>
);

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '2rem 1rem', overflowY: 'auto' },
  modalCard: { backgroundColor: '#1a202c', border: '1px solid #2d3748', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', marginTop: 'auto', marginBottom: 'auto', boxSizing: 'border-box'},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { margin: '0 0 0.25rem 0', color: '#f7fafc', fontSize: '1.5rem', fontWeight: 'bold' },
  subtitle: { margin: 0, color: '#a0aec0', fontSize: '0.95rem' },
  closeBtn: { background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '1.25rem', padding: '4px' },
  section: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  sectionLabel: { color: '#a0aec0', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.05em' },
  difficultyGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' },
  difficultyCard: { padding: '1rem', borderRadius: '12px', border: '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s ease' },
  diffTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 'bold' },
  diffDesc: { margin: 0, color: '#a0aec0', fontSize: '0.85rem', lineHeight: '1.4' },
  inventoryContainer: { backgroundColor: '#111827', padding: '1rem', borderRadius: '12px', border: '1px solid #2d3748' },
  dropdown: { width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#1a202c', color: '#e2e8f0', border: '1px solid #4a5568', fontSize: '0.95rem', cursor: 'pointer' },
  itemConfirmation: { margin: '4px 0 0 0', color: '#0dcaf0', fontSize: '0.8rem', fontStyle: 'italic' },
  modifierContainer: { display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#111827', padding: '1.25rem', borderRadius: '12px', border: '1px solid #2d3748' },
  modifierToggle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modText: { display: 'flex', flexDirection: 'column' },
  modTitle: { color: '#e2e8f0', fontWeight: 'bold', fontSize: '0.95rem' },
  modDesc: { color: '#718096', fontSize: '0.85rem' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '0.5rem' },
  cancelBtn: { backgroundColor: 'transparent', color: '#a0aec0', border: '1px solid #4a5568', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  launchBtn: { backgroundColor: '#0dcaf0', color: '#111827', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }
};