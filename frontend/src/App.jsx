import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TopicCatalogue from './pages/TopicCatalogue';
import TopicDetail from './pages/TopicDetail';
import ProgressHistory from './pages/ProgressHistory';
import DashboardWorkspace from './pages/Dashboard';
import PlaythroughChallenge from './pages/Playthrough';
import { getCookie } from './utils';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Establish validation sync on system boot execution
  useEffect(() => {
    fetch('http://127.0.0.1:8000/accounts/check-auth/', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setUser(data.username);
          setCurrentView('dashboard');
        } else {
          setCurrentView('home');
        }
        setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
  }, []);

  const handleLogout = () => {
    const csrfToken = getCookie('csrftoken');
    fetch('http://127.0.0.1:8000/accounts/logout/', {
      method: 'POST',
      headers: { 'X-CSRFToken': csrfToken },
      credentials: 'include'
    }).then(() => {
      setUser(null);
      setCurrentView('home');
    });
  };

  if (checkingAuth) return <div className="text-center mt-5">Synchronizing Equinox Core Engine...</div>;

  return (
    <div>
      {/* Global Context Dual-State Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <button className="navbar-brand btn btn-link text-decoration-none fw-bold text-white fs-4" onClick={() => setCurrentView(user ? 'dashboard' : 'home')}>
            Equinox
          </button>
            <span className="navbar-text text-warning mx-2"> Hello, {user}!</span>
          <div className="navbar-nav ms-auto gap-2 align-items-center">
            {user ? (
              <>
                <button className="nav-link btn btn-link" onClick={() => setCurrentView('dashboard')}>Dashboard</button>
                <button className="nav-link btn btn-link" onClick={() => setCurrentView('catalogue')}>Topics</button>
                <button className="nav-link btn btn-link" onClick={() => setCurrentView('progress')}>Progress Log</button>
                <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button className="nav-link btn btn-link" onClick={() => setCurrentView('home')}>Home</button>
                <button className="btn btn-outline-light btn-sm px-3" onClick={() => setCurrentView('login')}>Login</button>
                <button className="btn btn-primary btn-sm px-3" onClick={() => setCurrentView('register')}>Register</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container Core View Switcher Engine */}
      <div className="container mt-5">
        {!user && currentView === 'home' && <Home onNavigate={setCurrentView} />}
        {!user && currentView === 'login' && <Login onNavigate={setCurrentView} onLoginSuccess={(name) => { setUser(name); setCurrentView('dashboard'); }} />}
        {!user && currentView === 'register' && <Register onNavigate={setCurrentView} onRegisterSuccess={(name) => { setUser(name); setCurrentView('dashboard'); }} />}

        {user && (
          <>
            {currentView === 'dashboard' && <DashboardWorkspace onNavigate={setCurrentView} onStartQuiz={(id) => { setSelectedTopicId(id); setCurrentView('playthrough'); }} />}
            {currentView === 'catalogue' && <TopicCatalogue onSelectTopic={(id) => { setSelectedTopicId(id); setCurrentView('detail'); }} />}
            {currentView === 'detail' && <TopicDetail topicId={selectedTopicId} onBack={() => setCurrentView('catalogue')} onStartChallenge={(id) => { setSelectedTopicId(id); setCurrentView('playthrough'); }} />}
            {currentView === 'progress' && <ProgressHistory />}
            {currentView === 'playthrough' && <PlaythroughChallenge topicId={selectedTopicId} />}
          </>
        )}
      </div>
    </div>
  );
}