import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
// ─── NEW PASSWORD RECOVERY IMPORTS ───
import ForgotPassword from './pages/ForgotPassword';
import PasswordResetConfirm from './pages/PasswordResetConfirm';

import TopicCatalogue from './pages/TopicCatalogue';
import TopicDetail from './pages/TopicDetail';
import ProgressHistory from './pages/ProgressHistory';
import DashboardWorkspace from './pages/Dashboard';
import PlaythroughChallenge from './pages/Playthrough';
import Questionnaire from './pages/Questionnaire';
import Settings from './pages/Settings';
import Help from './pages/Help';
import AdminPage from './pages/AdminPage';
import InstructorPage from './pages/InstructorPage';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import api from './api/axios';
import { getCookie } from './utils';

const styles = {
  sidebarInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '1rem 0',
    alignItems: 'stretch',
  },
  tabMarker: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '12px 16px',
    boxSizing: 'border-box',
    borderRadius: '0 24px 24px 0',
    border: '2px solid transparent',
    borderLeft: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    backgroundColor: '#1f2937',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontSize: '1.1rem',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    padding: 0,
    color: '#f8fafc',
    fontSize: '1.2rem',
  },
  tabLabel: {
    fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif",
    fontSize: '1.1rem',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s ease',
    letterSpacing: '0.05em',
    fontWeight: 'bold',
  },
  sidebarSeparator: {
    width: '80%',
    height: '1px',
    backgroundColor: '#374151',
    margin: '8px auto',
    opacity: 0.5,
  },
};

const appLayoutStyles = {
  appContainer: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#1a202c', color: '#f7fafc' },
  topbar: { height: '60px', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', zIndex: 1030, display: 'flex', alignItems: 'center', flexShrink: 0 },
  mainGrid: { display: 'flex', flex: 1, height: 'calc(100vh - 60px)', overflow: 'hidden', position: 'relative' },
  sidebar: { backgroundColor: '#111827', borderRight: '1px solid #1f2937', transition: 'transform 0.2s ease-in-out', zIndex: 1020, left: 0, padding: '0', width: '280px' },
  sidebarTooltip: { position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '12px', backgroundColor: '#1f2937', color: '#f7fafc', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', border: '1px solid #374151', pointerEvents: 'none', zIndex: 1050 },
  topbarTooltip: { position: 'absolute', top: '100%', right: '0', marginTop: '8px', backgroundColor: '#1f2937', color: '#f7fafc', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', border: '1px solid #374151', pointerEvents: 'none', zIndex: 1050 },
  mobileBackdrop: { position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', zIndex: 1010 },
  contentContainer: { flex: 1, overflowY: 'auto', height: '100%', backgroundColor: '#1a202c', marginLeft: '280px' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [userGrade, setUserGrade] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [sessionDifficulty, setSessionDifficulty] = useState('Intermediate');
  const [isStaff, setIsStaff] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [userStars, setUserStars] = useState(0);
  
  // ─── NEW PASSWORD RESET ARGUMENT STATES ───
  const [resetParams, setResetParams] = useState({ uid: null, token: null });
  
  // Configuration data states for Equinox Playthrough
  const [sessionMods, setSessionMods] = useState([]);
  const [sessionItem, setSessionItem] = useState('');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
      setIsMobile(window.innerWidth < 768);
  }, []);

  const [hoveredLink, setHoveredLink] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // ─── NEW EFFECT: INTERCEPT EMAIL DEEP-LINKS ON APP START ───
  useEffect(() => {
    const path = window.location.pathname; // e.g., /reset-password/Mg/abc-123/
    const match = path.match(/\/reset-password\/([^/]+)\/([^/]+)/);

    if (match) {
      const [_, uid, token] = match;
      setResetParams({ uid, token });
      setCurrentView('reset-password-confirm');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    api.get('/accounts/check-auth/')
      .then(res => {
        if (res.data.authenticated) {
          setUser(res.data.username);
          setNeedsOnboarding(res.data.needs_onboarding);
          setIsStaff(res.data.is_staff || false);
          setIsSuperuser(res.data.is_superuser || false);
          setCurrentView('dashboard');
          
          // Fetch user's grade level and stars balance
          return Promise.all([
            api.get('/accounts/grade/'),
            api.get('/playthrough/stars/')
          ]);
        } else {
          setCurrentView('home');
        }
      })
      .then(res => {
        if (res && res[0] && res[0].data && res[0].data.grade_level) {
          setUserGrade(res[0].data.grade_level);
        }
        if (res && res[1] && res[1].data && res[1].data.balance !== undefined) {
          setUserStars(res[1].data.balance);
        }
      })
      .catch(() => {
        setCurrentView('home');
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
      
      if (!mobileCheck && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileSidebarOpen]);

  const handleLogout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    api.post('/accounts/logout/', { refresh: refreshToken })
      .then(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        setUser(null);
        setNeedsOnboarding(false);
        setCurrentView('home');
        setMobileSidebarOpen(false);
      })

      .finally(() => {
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('access_token');

          setUser(null);

          navigateTo("home");
      });
  };

  const navigateTo = (view) => {
    // MODIFIED: Clear out unique deep link paths from url string bar when bouncing back safely
    if (view === 'login' || view === 'home') {
      window.history.pushState({}, document.title, "/");
    }
    setCurrentView(view);
    setMobileSidebarOpen(false); 
  };

  if (checkingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white">
        <div className="text-center">
          <div className="spinner-border text-info mb-3" role="status"></div>
          <div className="fw-bold tracking-wide">Synchronizing Equinox Core Engine...</div>
        </div>
      </div>
    );
  }

  // Sidebar structure:
  // Main: Dashboard, Catalogue, Progress, Shop
  // Separator
  // Role: Instructor, Admin
  // Separator
  // Help, Settings (at bottom)
  const sidebarNavItems = [
    { view: 'dashboard', icon: 'grid-1x2-fill', label: 'Dashboard', },
    { view: 'catalogue', icon: 'book-half', label: 'Topic Catalogue' },
    { view: 'progress', icon: 'graph-up-arrow', label: 'Progress History' },
    { view: 'shop', icon: 'shop', label: 'Shop' },
    { isSeparator: true },
    ...(isStaff || isSuperuser ? [{ view: 'instructor', icon: 'easel-fill', label: 'Instructor Portal' }] : []),
    ...(isSuperuser ? [{ view: 'admin', icon: 'shield-fill-check', label: 'Admin Panel' }] : []),
    { isSeparator: true },
    { view: 'help', icon: 'question-circle-fill', label: 'Help' },
    { view: 'settings', icon: 'gear-fill', label: 'Settings' },
  ];

  const SidebarSeparator = () => (
    <div style={styles.sidebarSeparator} />
  );

  const SidebarLink = ({ view, icon, label, index, isSeparator }) => {
    if (isSeparator) {
      return <SidebarSeparator />;
    }
    
    const isActive = currentView === view;
    const isThisHovered = hoveredLink === view;
    const tabColors = ['#93c5fd', '#86efac', '#fde68a', '#f9a8d4', '#c4b5fd'];
    const tabColor = tabColors[index % tabColors.length];

    return (
      <div style={{ position: 'relative', width: '100%' }} onMouseEnter={() => setHoveredLink(view)} onMouseLeave={() => setHoveredLink(null)}>
        <div style={{
          ...styles.tabMarker,
          justifyContent: sidebarExpanded
          ? 'flex-start'
          : 'center',
          gap: sidebarExpanded
          ? '8px'
          : '0px',
          backgroundColor: isActive ? tabColor : 'transparent',
          border: isActive ? `2px solid ${tabColor}` : '2px solid transparent',
          boxShadow: isActive ? `2px 2px 8px rgba(0,0,0,0.3)` : 'none',
          cursor: 'pointer',
        }} onClick={() => navigateTo(view)}>
          <button 
            style={{
              ...styles.tabBtn,
              color: isActive ? '#1e293b' : '#f8fafc',
            }}
          >
            <i className={`bi bi-${icon}`} style={{ fontSize: '1.2rem' }}></i>
          </button>
          
          {/* Tab label - visible on hover / always when active */}
            <span
              style={{
                  ...styles.tabLabel,
                  color: isActive ? '#1e293b' : '#f8fafc',
                  opacity: sidebarExpanded ? 1 : 0,
                  width: sidebarExpanded ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'opacity .2s ease',
              }}
            >
              {label}
            </span>
        </div>

        {!isMobile && !sidebarExpanded && isThisHovered && (
          <div style={appLayoutStyles.sidebarTooltip}>
            {label}
          </div>
        )}
      </div>
    );
  };

  const TopbarAction = ({ id, icon, label, onClick, colorClass = "" }) => {
    const isThisHovered = hoveredLink === id;

    return (
      <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setHoveredLink(id)} onMouseLeave={() => setHoveredLink(null)}>
        <button 
          className="btn d-flex justify-content-center align-items-center rounded-3 p-0"
          style={{
            width: '40px',
            height: '40px',
            border: 'none',
            backgroundColor: 'transparent',
            transition: 'all 0.15s ease',
            cursor: 'pointer'
          }}
          onClick={onClick}
        >
          <i className={`bi bi-${icon} ${colorClass}`} style={{ fontSize: '1.3rem' }}></i>
        </button>

        {!isMobile && !sidebarExpanded && isThisHovered && (
          <div style={appLayoutStyles.topbarTooltip}>
            {label}
          </div>
        )}
      </div>
    );
  };

  const dynamicSidebarStyle = {
    ...appLayoutStyles.sidebar,
    position: isMobile ? 'fixed' : 'absolute',
    transform: (isMobile && !mobileSidebarOpen) ? 'translateX(-100%)' : 'translateX(0)',
    width: sidebarExpanded ? '280px' : '64px',
    transition: 'width 0.25s ease',
    overflow: 'hidden',
    top: isMobile ? '60px' : '0',
    height: isMobile ? 'calc(100vh - 60px)' : '100%',
    padding: '0',
    left: '0',
    zIndex: 1020,
  };

  return (
    <div style={appLayoutStyles.appContainer}>
      {user && needsOnboarding && (
        <Questionnaire
            onComplete={async () => {
                setNeedsOnboarding(false);

                try {
                    const res = await api.get('/accounts/grade/');
                    setUserGrade(res.data.grade_level);
                } catch (err) {
                    console.error("Failed to refresh grade:", err);
                }
            }}
        />
      )}

      {/* 1. TOPBAR SYSTEM */}
      <nav className="navbar navbar-dark bg-dark px-3" style={appLayoutStyles.topbar}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: '8px' }}>
            {user && (
              <button 
                className="btn btn-dark d-md-none border-0 px-2 py-1"
                style={{ backgroundColor: 'transparent' }}
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              >
                <i className={`bi bi-${mobileSidebarOpen ? 'x-lg' : 'list'} fs-4 text-secondary`}></i>
              </button>
            )}
            <button 
              className="btn btn-link text-decoration-none fw-extrabold text-white fs-4 p-0 m-0 tracking-tight" 
              onClick={() => navigateTo(user ? 'dashboard' : 'home')}
            >
              🌌 Equinox
            </button>
            
            {/* Grade Level Selector - only show for logged-in users */}
            {user && userGrade && (
              <select
                value={userGrade}
                onChange={(e) => {
                  const newGrade = parseInt(e.target.value, 10);
                  const previousGrade = userGrade;
                  setUserGrade(newGrade);
                  // Update grade on backend
                  api.post('/accounts/grade/update/', {
                      grade_level: newGrade
                  })
                  .catch(() => {
                      setUserGrade(previousGrade);
                  });
                }}
                style={{
                  backgroundColor: '#1f2937',
                  color: '#f7fafc',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: '0.05em',
                  outline: 'none',
                }}
              >
                {[1,2,3,4,5,6,7,8,9,10].map(g => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <>
                <TopbarAction id="profile-status" icon="person-circle" label={`Signed in as: ${user}`} colorClass="text-warning" onClick={() => navigateTo('profile')} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#1f2937', borderRadius: '6px', border: '1px solid #374151' }}>
                  <span style={{ color: '#fbbf24', fontSize: '1.1rem' }}>⭐</span>
                  <span style={{ color: '#f7fafc', fontSize: '0.9rem', fontWeight: 'bold', fontFamily: "'Patrick Hand', 'Segoe UI', system-ui, sans-serif" }}>{userStars.toLocaleString()}</span>
                </div>
                <TopbarAction id="logout-trigger" icon="box-arrow-right" label="Logout" colorClass="text-danger" onClick={handleLogout} />
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                <button className="btn btn-link nav-link text-white-50 py-1 px-2" onClick={() => navigateTo('home')}>Home</button>
                <button className="btn btn-outline-light btn-sm px-3 rounded-2" onClick={() => navigateTo('login')}>Login</button>
                <button className="btn btn-info btn-sm px-3 text-dark fw-bold rounded-2" onClick={() => navigateTo('register')}>Register</button>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* 2. BODY CONTAINER SYSTEM */}
      <div style={appLayoutStyles.mainGrid}>
        {user && (
          <>
            <div
                style={dynamicSidebarStyle}
                onMouseEnter={() => !isMobile && setSidebarExpanded(true)}
                onMouseLeave={() => !isMobile && setSidebarExpanded(false)}>
              <div style={styles.sidebarInner}>
                {sidebarNavItems.map((item, index) => {
                  if (item.isSeparator) {
                    return <SidebarSeparator key={`sep-${index}`} />;
                  }
                  return <SidebarLink key={item.view} view={item.view} icon={item.icon} label={item.label} index={index} />;
                })}
              </div>
            </div>

            {isMobile && mobileSidebarOpen && (
              <div style={appLayoutStyles.mobileBackdrop} onClick={() => setMobileSidebarOpen(false)} />
            )}
          </>
        )}

        {/* WORKSPACE CONTENT PANEL */}
        <div style={{
          ...appLayoutStyles.contentContainer,

              marginLeft:
                  isMobile
                      ? '0'
                      : sidebarExpanded
                          ? '280px'
                          : '64px',

              transition: 'margin-left .25s ease',
        }}>
          <div className="container-fluid py-4 px-md-4 px-2" style={{ maxWidth: '100%', margin: '0 auto', paddingLeft: '1rem', paddingRight: '1rem' }}>
            
            {/* UNAUTHENTICATED ROUTER CORE SWITCHES */}
            {!user && currentView === 'home' && <Home onNavigate={navigateTo} />}
            {!user && currentView === 'login' && <Login onNavigate={navigateTo} onLoginSuccess={(name, needsOnboard, isStaff, isSuperuser) => { setUser(name); setNeedsOnboarding(needsOnboard); setIsStaff(isStaff); setIsSuperuser(isSuperuser); setCurrentView('dashboard'); }} />}
            {!user && currentView === 'register' && <Register onNavigate={navigateTo} onRegisterSuccess={(name, data) => { setUser(name); setNeedsOnboarding(true); setIsStaff(data?.is_staff || false); setIsSuperuser(data?.is_superuser || false); setCurrentView('dashboard'); }} />}
            
            {/* ─── ADDED RECOVERY COMPONENTS HERE ─── */}
            {!user && currentView === 'forgot-password' && <ForgotPassword onNavigate={navigateTo} />}
            {!user && currentView === 'reset-password-confirm' && <PasswordResetConfirm uid={resetParams.uid} token={resetParams.token} onNavigate={navigateTo} />}

            {user && (
              <>
                {currentView === 'dashboard' && (
                  <DashboardWorkspace 
                    onNavigate={navigateTo} 
                    onStartQuiz={(id, difficulty, mods, item) => { 
                      setSelectedTopicId(id); 
                      setSessionDifficulty(difficulty || 'Intermediate'); 
                      setSessionMods(mods || []);
                      setSessionItem(item || '');
                      setCurrentView('playthrough'); 
                    }} 
                  />
                )}
                
                {currentView === 'catalogue' && <TopicCatalogue onSelectTopic={(id, grade) => { setSelectedTopicId(id); setSelectedGrade(grade || 'Elementary'); setCurrentView('detail'); }} userGrade={userGrade} />}
                
                {currentView === 'detail' && (
                  <TopicDetail 
                    topicId={selectedTopicId}
                    selectedGrade={selectedGrade}
                    onBack={() => navigateTo('catalogue')} 
                    onStartChallenge={(id, difficulty, mods, item) => { 
                      setSelectedTopicId(id); 
                      setSessionDifficulty(difficulty || 'Intermediate'); 
                      setSessionMods(mods || []);
                      setSessionItem(item || '');
                      setCurrentView('playthrough'); 
                    }} 
                  />
                )}
                
                {currentView === 'progress' && <ProgressHistory onNavigate={navigateTo} />}

                {currentView === 'profile' && <Profile onNavigate={navigateTo} />}

                {currentView === 'settings' && <Settings onNavigate={navigateTo} />}

                {currentView === 'help' && <Help onNavigate={navigateTo} />}

                {currentView === 'shop' && <Shop onNavigate={navigateTo} isSuperuser={isSuperuser} />}

                {currentView === 'instructor' && (isStaff || isSuperuser) && <InstructorPage />}

                {currentView === 'admin' && isSuperuser && <AdminPage />}
                
                {currentView === 'playthrough' && (
                  <PlaythroughChallenge 
                    topicId={selectedTopicId} 
                    initialDifficulty={sessionDifficulty} 
                    activeMods={sessionMods}
                    equippedModifier={sessionItem}
                    onNavigate={navigateTo}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}