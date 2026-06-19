import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TopicCatalogue from './pages/TopicCatalogue';
import TopicDetail from './pages/TopicDetail';
import ProgressHistory from './pages/ProgressHistory';
import DashboardWorkspace from './pages/Dashboard';
import PlaythroughChallenge from './pages/Playthrough';
import Questionnaire from './pages/Questionnaire';
import { getCookie } from './utils';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [sessionDifficulty, setSessionDifficulty] = useState('Intermediate');
  
  // ─── NEW CONFIGURATION DATA STATES FOR EQUINOX PLAYTHROUGH ───
  const [sessionMods, setSessionMods] = useState([]);
  const [sessionItem, setSessionItem] = useState('');

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [hoveredLink, setHoveredLink] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/accounts/check-auth/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.username);
          setNeedsOnboarding(data.needs_onboarding);
          setCurrentView('dashboard');
        } else {
          setCurrentView('home');
        }
        setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
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
    const csrfToken = getCookie('csrftoken');
    fetch('http://127.0.0.1:8000/accounts/logout/', {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      credentials: 'include'
    }).then(() => {
      setUser(null);
      setNeedsOnboarding(false);
      setCurrentView('home');
      setMobileSidebarOpen(false);
    });
  };

  const navigateTo = (view) => {
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

  const SidebarLink = ({ view, icon, label }) => {
    const isActive = currentView === view;
    const isThisHovered = hoveredLink === view;

    return (
      <div style={{ position: 'relative', width: '100%' }} onMouseEnter={() => setHoveredLink(view)} onMouseLeave={() => setHoveredLink(null)}>
        <button 
          className="btn w-100 d-flex justify-content-center align-items-center rounded-3 p-0"
          style={{
            height: '48px',
            border: 'none',
            backgroundColor: isActive ? '#0dcaf0' : 'transparent', 
            color: isActive ? '#111827' : '#a0aec0',
            transition: 'all 0.15s ease',
            cursor: 'pointer'
          }}
          onClick={() => navigateTo(view)}
        >
          <i className={`bi bi-${icon}`} style={{ fontSize: '1.4rem' }}></i>
        </button>

        {!isMobile && isThisHovered && (
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

        {!isMobile && isThisHovered && (
          <div style={appLayoutStyles.topbarTooltip}>
            {label}
          </div>
        )}
      </div>
    );
  };

  const dynamicSidebarStyle = {
    ...appLayoutStyles.sidebar,
    position: isMobile ? 'fixed' : 'relative',
    transform: (isMobile && !mobileSidebarOpen) ? 'translateX(-100%)' : 'translateX(0)',
    width: isMobile ? '240px' : '72px', 
    top: isMobile ? '60px' : '0',
    height: isMobile ? 'calc(100vh - 60px)' : '100%',
  };

  return (
    <div style={appLayoutStyles.appContainer}>
      {user && needsOnboarding && (
        <Questionnaire onComplete={() => setNeedsOnboarding(false)} />
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <>
                <TopbarAction id="profile-status" icon="person-circle" label={`Signed in as: ${user}`} colorClass="text-warning" onClick={() => navigateTo('dashboard')} />
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
            <div style={dynamicSidebarStyle}>
              <div className="d-flex flex-column align-items-center gap-3 p-2 pt-4">
                <SidebarLink view="dashboard" icon="grid-1x2-fill" label="Dashboard" />
                <SidebarLink view="catalogue" icon="book-half" label="Topic Catalogue" />
                <SidebarLink view="progress" icon="graph-up-arrow" label="Progress History" />
              </div>
            </div>

            {isMobile && mobileSidebarOpen && (
              <div style={appLayoutStyles.mobileBackdrop} onClick={() => setMobileSidebarOpen(false)} />
            )}
          </>
        )}

        {/* WORKSPACE CONTENT PANEL */}
        <div style={appLayoutStyles.contentContainer}>
          <div className="container-fluid py-4 px-md-4 px-2" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {!user && currentView === 'home' && <Home onNavigate={navigateTo} />}
            {!user && currentView === 'login' && <Login onNavigate={navigateTo} onLoginSuccess={(name, needsOnboard) => { setUser(name); setNeedsOnboarding(needsOnboard); setCurrentView('dashboard'); }} />}
            {!user && currentView === 'register' && <Register onNavigate={navigateTo} onRegisterSuccess={(name) => { setUser(name); setNeedsOnboarding(true); setCurrentView('dashboard'); }} />}

            {user && (
              <>
                {/* MODIFIED: Receives structural configs directly from Modal elements inside Dashboard */}
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
                
                {currentView === 'catalogue' && <TopicCatalogue onSelectTopic={(id) => { setSelectedTopicId(id); setCurrentView('detail'); }} />}
                
                {/* MODIFIED: Receives structural configs directly from Modal elements inside TopicDetail */}
                {currentView === 'detail' && (
                  <TopicDetail 
                    topicId={selectedTopicId} 
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
                
                {currentView === 'progress' && <ProgressHistory />}
                
                {/* MODIFIED: Maps internal system configurations into Playthrough Engine */}
                {currentView === 'playthrough' && (
                  <PlaythroughChallenge 
                    topicId={selectedTopicId} 
                    initialDifficulty={sessionDifficulty} 
                    activeMods={sessionMods}
                    equippedModifier={sessionItem}
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

const appLayoutStyles = {
  appContainer: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#1a202c', color: '#f7fafc' },
  topbar: { height: '60px', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', zIndex: 1030, display: 'flex', alignItems: 'center', flexShrink: 0 },
  mainGrid: { display: 'flex', flex: 1, height: 'calc(100vh - 60px)', overflow: 'hidden', position: 'relative' },
  sidebar: { backgroundColor: '#111827', borderRight: '1px solid #1f2937', transition: 'transform 0.2s ease-in-out, width 0.2s ease-in-out', zIndex: 1020, left: 0 },
  sidebarTooltip: { position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '12px', backgroundColor: '#1f2937', color: '#f7fafc', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', border: '1px solid #374151', pointerEvents: 'none', zIndex: 1050 },
  topbarTooltip: { position: 'absolute', top: '100%', right: '0', marginTop: '8px', backgroundColor: '#1f2937', color: '#f7fafc', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', border: '1px solid #374151', pointerEvents: 'none', zIndex: 1050 },
  mobileBackdrop: { position: 'fixed', top: '60px', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(3px)', zIndex: 1010 },
  contentContainer: { flex: 1, overflowY: 'auto', height: '100%', backgroundColor: '#1a202c' }
};