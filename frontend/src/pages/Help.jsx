import React, { useState } from 'react';

// ── Accordion Item Component ──────────────────────────────────────────────────
function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div style={{ ...accordionStyles.item, ...(isOpen ? accordionStyles.itemOpen : {}) }}>
      <button style={accordionStyles.trigger} onClick={onToggle} aria-expanded={isOpen}>
        <span style={accordionStyles.question}>{question}</span>
        <span style={{ ...accordionStyles.chevron, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <i className="bi bi-chevron-down" style={{ fontSize: '0.9rem', color: '#3b82f6' }}></i>
        </span>
      </button>
      <div
        style={{
          ...accordionStyles.body,
          maxHeight: isOpen ? '600px' : '0',
          opacity: isOpen ? 1 : 0,
          paddingTop: isOpen ? '0.75rem' : '0',
          paddingBottom: isOpen ? '1.25rem' : '0',
        }}
      >
        <div style={accordionStyles.answer}>{answer}</div>
      </div>
    </div>
  );
}

// ── Glossary Term Component ───────────────────────────────────────────────────
function GlossaryTerm({ term, definition }) {
  return (
    <div style={glossaryStyles.row}>
      <div style={glossaryStyles.term}>{term}</div>
      <div style={glossaryStyles.definition}>{definition}</div>
    </div>
  );
}

// ── Step Component ────────────────────────────────────────────────────────────
function Step({ number, title, description }) {
  return (
    <div style={stepStyles.row}>
      <div style={stepStyles.number}>{number}</div>
      <div style={stepStyles.content}>
        <div style={stepStyles.title}>{title}</div>
        <div style={stepStyles.description}>{description}</div>
      </div>
    </div>
  );
}

// ── Main Help Component ───────────────────────────────────────────────────────
export default function Help({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(prev => (prev === index ? null : index));
  };

  const faqs = [
    {
      question: 'What is Equinox?',
      answer: (
        <span>
          Equinox is an adaptive math learning platform designed for Grades 1–10 students. It uses a Dynamic Difficulty Adjustment (DDA) engine to tailor quiz difficulty in real time based on your performance, ensuring you're always challenged at the right level — never too easy, never overwhelming. Equinox also features a gamified scoring system, achievements, leaderboards, and progress tracking to keep learning engaging.
        </span>
      ),
    },
    {
      question: 'How does the adaptive difficulty system work?',
      answer: (
        <span>
          Equinox's DDA engine monitors your accuracy and response patterns throughout each playthrough. When you answer questions correctly and consistently, the system promotes you to a harder difficulty tier (Novice → Intermediate → Advanced → Expert). If you struggle, it scales back to give you a better foundation. This happens automatically during a playthrough — you don't need to configure anything. The goal is to keep you in an optimal learning zone at all times.
        </span>
      ),
    },
    {
      question: 'What are modifiers and how do I use them?',
      answer: (
        <span>
          Modifiers are optional challenge rules you can apply before starting a playthrough to increase difficulty and boost your potential score multiplier. Available modifiers include:
          <br /><br />
          <strong style={{ color: '#1e293b' }}>⏱️ Timed</strong> — Each question has a countdown timer. Running out of time counts as an incorrect answer.
          <br />
          <strong style={{ color: '#1e293b' }}>🔒 Locked DDA</strong> — Disables the adaptive difficulty engine, locking you into your chosen starting difficulty.
          <br />
          <strong style={{ color: '#1e293b' }}>❤️‍🔥 One Life</strong> — A single wrong answer ends the playthrough immediately.
          <br />
          <strong style={{ color: '#1e293b' }}>🍃 Easy Going</strong> — Removes time pressure and reduces penalty weight for a more relaxed experience.
          <br /><br />
          Select modifiers on the Challenge Configuration screen before launching a playthrough.
        </span>
      ),
    },
    {
      question: 'How is my score calculated?',
      answer: (
        <span>
          Your gamified score is calculated from several factors: base points per correct answer, a difficulty multiplier (higher tiers award more points), an active streak bonus (consecutive correct answers multiply your score), and any modifier bonuses you've applied. The formula rewards both accuracy and the courage to tackle harder challenges. You can review your score breakdown in the Progress History page after each session.
        </span>
      ),
    },
    {
      question: 'What are achievements and how do I unlock them?',
      answer: (
        <span>
          Achievements are milestone badges awarded for reaching specific goals — such as completing your first playthrough, maintaining a long streak, reaching the Expert difficulty tier, or scoring above a certain threshold. They appear on your Dashboard under the Achievements section. Locked achievements show their unlock condition so you know what to aim for. Achievements are permanent and tied to your account.
        </span>
      ),
    },
    {
      question: 'How does the leaderboard work?',
      answer: (
        <span>
          Each math topic has its own leaderboard that ranks all users by their highest gamified score for that topic. You can view the leaderboard from the Topic Detail page. Your current rank is highlighted so you can see exactly where you stand. Scores update after each completed session, so keep practicing to climb the rankings.
        </span>
      ),
    },
    {
      question: 'Can I reset my progress?',
      answer: (
        <span>
          Individual session progress cannot be selectively deleted — your history is a permanent record of your learning journey. However, if you wish to start completely fresh, you can delete your account from the Settings page (Danger Zone section) and create a new one. Note that account deletion is irreversible and removes all data including achievements, scores, and history.
        </span>
      ),
    },
  ];

  const steps = [
    {
      number: 1,
      title: 'Create your account',
      description: 'Register with a username and password. After signing up, you\'ll be guided through a short onboarding questionnaire to help Equinox understand your current level.',
    },
    {
      number: 2,
      title: 'Complete the onboarding questionnaire',
      description: 'Answer a few questions about your grade level and math comfort zone. This seeds the DDA engine with a starting difficulty profile tailored to you.',
    },
    {
      number: 3,
      title: 'Browse the Topic Catalogue',
      description: 'Navigate to the Topic Catalogue from the sidebar or Dashboard. Topics are organized by Grades 1-10 math areas. Select a topic to view its details, difficulty tiers, and leaderboard.',
    },
    {
      number: 4,
      title: 'Configure and launch a challenge',
      description: 'On the Topic Detail page, choose your starting difficulty tier and optionally apply modifiers for extra challenge. Hit "Start Challenge" to enter the quiz.',
    },
    {
      number: 5,
      title: 'Complete the quiz',
      description: 'Answer questions using the on-screen keypad or keyboard. The DDA engine adjusts difficulty in real time. Your streak, score, and current tier are displayed throughout.',
    },
    {
      number: 6,
      title: 'Review your results',
      description: 'After finishing, your session results are saved to Progress History. Check your gamified score, accuracy, and any achievements you unlocked. Return to the catalogue to tackle another topic.',
    },
  ];

  const glossaryTerms = [
    {
      term: 'DDA',
      definition: 'Dynamic Difficulty Adjustment — the core engine that automatically scales question difficulty up or down based on your real-time performance within a session.',
    },
    {
      term: 'Streak',
      definition: 'A consecutive sequence of correct answers without interruption. Maintaining a streak applies a score multiplier that grows with each correct answer, significantly boosting your gamified score.',
    },
    {
      term: 'Gamified Score',
      definition: 'Your total points for a session, calculated from base accuracy, difficulty tier multipliers, streak bonuses, and modifier bonuses. This is the score used for leaderboard rankings.',
    },
    {
      term: 'Modifier',
      definition: 'An optional rule applied before a quiz that changes the challenge conditions — such as adding a timer, removing adaptive difficulty, or enabling one-life mode. Modifiers increase score potential in exchange for higher risk.',
    },
    {
      term: 'Achievement',
      definition: 'A permanent milestone badge awarded when you reach a specific goal, such as completing your first quiz, reaching Expert tier, or maintaining a long streak. Achievements are visible on your Dashboard.',
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.reportPaper}>

        {/* ── Header with punched holes ── */}
        <div style={styles.reportHeader}>
          <div style={styles.punchedHoles}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={styles.hole} />
            ))}
          </div>
          <div style={styles.headerContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>❓</span>
              <h2 style={styles.title}>Help & Documentation</h2>
            </div>
            <button
              style={styles.closeBtn}
              title="Return to Dashboard"
              onClick={() => onNavigate ? onNavigate('dashboard') : (window.location.href = '/')}
            >
              ✕
            </button>
          </div>
          <p style={styles.reportSubtitle}>Equinox Platform Guide & Reference</p>
        </div>

        {/* ── Ruled Content Area ── */}
        <div style={styles.ruledContent}>
          <div style={styles.redMargin} />
          <div style={styles.contentInner}>

            {/* ── FAQ Section ── */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="bi bi-chat-square-text" style={styles.sectionIcon}></i>
                Frequently Asked Questions
              </h3>
              <div style={styles.accordionContainer}>
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFaq === index}
                    onToggle={() => toggleFaq(index)}
                  />
                ))}
              </div>
            </section>

            <div style={styles.divider} />

            {/* ── Getting Started ── */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="bi bi-rocket-takeoff" style={styles.sectionIcon}></i>
                Getting Started
              </h3>
              <p style={styles.sectionIntro}>
                New to Equinox? Follow these steps to go from sign-up to your first completed challenge.
              </p>
              <div style={styles.stepsContainer}>
                {steps.map((step) => (
                  <Step
                    key={step.number}
                    number={step.number}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </div>
            </section>

            <div style={styles.divider} />

            {/* ── Glossary ── */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="bi bi-book" style={styles.sectionIcon}></i>
                Glossary
              </h3>
              <p style={styles.sectionIntro}>
                Key terms used throughout the Equinox platform.
              </p>
              <div style={styles.glossaryContainer}>
                {glossaryTerms.map((item, index) => (
                  <GlossaryTerm
                    key={index}
                    term={item.term}
                    definition={item.definition}
                  />
                ))}
              </div>
            </section>

            <div style={styles.divider} />

            {/* ── Contact & Support ── */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>
                <i className="bi bi-envelope" style={styles.sectionIcon}></i>
                Contact & Support
              </h3>
              <div style={styles.supportGrid}>
                <a
                  href="mailto:support@equinox.app"
                  style={styles.supportCard}
                >
                  <div style={styles.supportIcon}>
                    <i className="bi bi-envelope-fill" style={{ fontSize: '1.5rem', color: '#3b82f6' }}></i>
                  </div>
                  <div>
                    <div style={styles.supportCardTitle}>Email Support</div>
                    <div style={styles.supportCardDesc}>support@equinox.app</div>
                  </div>
                </a>
                <a
                  href="https://github.com/Ozlek/Equinox"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.supportCard}
                >
                  <div style={styles.supportIcon}>
                    <i className="bi bi-github" style={{ fontSize: '1.5rem', color: '#3b82f6' }}></i>
                  </div>
                  <div>
                    <div style={styles.supportCardTitle}>GitHub Repository</div>
                    <div style={styles.supportCardDesc}>Source code & issue tracker</div>
                  </div>
                </a>
                <a
                  href="https://github.com/equinox-platform/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.supportCard}
                >
                  <div style={styles.supportIcon}>
                    <i className="bi bi-file-earmark-text-fill" style={{ fontSize: '1.5rem', color: '#3b82f6' }}></i>
                  </div>
                  <div>
                    <div style={styles.supportCardTitle}>Documentation</div>
                    <div style={styles.supportCardDesc}>Full platform reference docs</div>
                  </div>
                </a>
              </div>
            </section>

          </div>
        </div>

        {/* ── Footer ── */}
        <div style={styles.reportFooter}>
          <span>Equinox Help Guide • Generated {new Date().toLocaleDateString()}</span>
          <span>Page 1 of 1</span>
        </div>

      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  container: {
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
    alignItems: 'flex-start',
    padding: '1.5rem 1rem',
    boxSizing: 'border-box',
    position: 'relative',
  },

  // ── Report Paper ──
  reportPaper: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '800px',
    backgroundColor: '#fefdfb',
    borderRadius: '4px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #d6d3d1',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    color: '#1e293b',
    overflow: 'hidden',
  },

  // ── Header ──
  reportHeader: {
    position: 'relative',
    backgroundColor: '#1e293b',
    padding: '1.5rem 2rem 1rem',
    borderBottom: '3px solid #3b82f6',
  },
  punchedHoles: {
    position: 'absolute',
    left: '20px',
    top: '0',
    bottom: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    padding: '12px 0',
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
    alignItems: 'center',
    marginLeft: '28px',
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#f8fafc',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  closeBtn: {
    backgroundColor: 'rgba(245, 101, 101, 0.15)',
    color: '#fc8181',
    border: '1px solid rgba(245, 101, 101, 0.3)',
    width: '34px',
    height: '34px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
    flexShrink: 0,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  reportSubtitle: {
    margin: '0.5rem 0 0 28px',
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontStyle: 'italic',
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
    marginLeft: '2rem',
    alignSelf: 'stretch',
  },
  contentInner: {
    flex: 1,
    padding: '1.5rem 2rem',
  },

  // ── Content Styles ──
  section: {
    marginBottom: '0.5rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  sectionIcon: {
    fontSize: '1rem',
    color: '#3b82f6',
  },
  sectionIntro: {
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    marginBottom: '1.25rem',
    marginTop: '-0.5rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  divider: {
    borderTop: '1px solid #e2e8f0',
    margin: '1.75rem 0',
  },
  accordionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  glossaryContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  supportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  supportCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.1rem 1.25rem',
    textDecoration: 'none',
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
    cursor: 'pointer',
  },
  supportIcon: {
    width: '44px',
    height: '44px',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  supportCardTitle: {
    color: '#1e293b',
    fontSize: '0.95rem',
    fontWeight: '700',
    marginBottom: '2px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  supportCardDesc: {
    color: '#64748b',
    fontSize: '0.85rem',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },

  // ── Footer ──
  reportFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 2rem',
    borderTop: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    backgroundColor: '#f8fafc',
  },
};

const accordionStyles = {
  item: {
    backgroundColor: '#fefdfb',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s ease',
  },
  itemOpen: {
    backgroundColor: '#f8fafc',
  },
  trigger: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    gap: '12px',
  },
  question: {
    color: '#1e293b',
    fontSize: '1rem',
    fontWeight: '600',
    lineHeight: '1.4',
    flex: 1,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'transform 0.25s ease',
  },
  body: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.25s ease, padding 0.25s ease',
    paddingLeft: '1.25rem',
    paddingRight: '1.25rem',
  },
  answer: {
    color: '#64748b',
    fontSize: '0.93rem',
    lineHeight: '1.7',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
};

const stepStyles = {
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '1.1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
  },
  number: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    color: '#3b82f6',
    fontSize: '0.85rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#1e293b',
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '4px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  description: {
    color: '#64748b',
    fontSize: '0.9rem',
    lineHeight: '1.55',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
};

const glossaryStyles = {
  row: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
  term: {
    color: '#3b82f6',
    fontSize: '0.95rem',
    fontWeight: '800',
    minWidth: '120px',
    flexShrink: 0,
    letterSpacing: '0.03em',
    paddingTop: '1px',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
  definition: {
    color: '#64748b',
    fontSize: '0.92rem',
    lineHeight: '1.6',
    flex: 1,
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
  },
};