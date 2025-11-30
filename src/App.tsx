import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { Dumbbell, LineChart, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';

import './App.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/onboarding' || location.pathname === '/login';

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      {/* Desktop Sidebar - Hidden on mobile via CSS */}
      <div className="desktop-sidebar">
        {/* Logo */}
        <Link to="/" style={{
          padding: '1rem 1rem',
          marginBottom: '2rem',
          textDecoration: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img src="/favicon.svg" alt="Prodegi" style={{
            width: '3.5rem',
            height: 'auto'
          }} />
        </Link>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <Link
            to="/"
            className={clsx('nav-item', location.pathname === '/' && 'active')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
              textDecoration: 'none',
              color: location.pathname === '/' ? '#C8956B' : '#6a6a6a',
              transition: 'all 0.2s',
              borderRadius: '8px',
              background: location.pathname === '/' ? 'rgba(200, 149, 107, 0.1)' : 'transparent'
            }}
          >
            <Dumbbell size={22} />
            <span style={{ fontSize: '0.95rem', fontWeight: location.pathname === '/' ? 500 : 400 }}>Workout</span>
          </Link>
          <Link
            to="/progress"
            className={clsx('nav-item', location.pathname === '/progress' && 'active')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
              textDecoration: 'none',
              color: location.pathname === '/progress' ? '#C8956B' : '#6a6a6a',
              transition: 'all 0.2s',
              borderRadius: '8px',
              background: location.pathname === '/progress' ? 'rgba(200, 149, 107, 0.1)' : 'transparent'
            }}
          >
            <LineChart size={22} />
            <span style={{ fontSize: '0.95rem', fontWeight: location.pathname === '/progress' ? 500 : 400 }}>Progress</span>
          </Link>
          <Link
            to="/settings"
            className={clsx('nav-item', location.pathname === '/settings' && 'active')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
              textDecoration: 'none',
              color: location.pathname === '/settings' ? '#C8956B' : '#6a6a6a',
              transition: 'all 0.2s',
              borderRadius: '8px',
              background: location.pathname === '/settings' ? 'rgba(200, 149, 107, 0.1)' : 'transparent'
            }}
          >
            <SettingsIcon size={22} />
            <span style={{ fontSize: '0.95rem', fontWeight: location.pathname === '/settings' ? 500 : 400 }}>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content" id="main-content">
        <div style={{ flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: 'auto',
          paddingTop: '1rem',
          paddingBottom: '0.5rem',
          borderTop: '1px solid #1a1a1a',
          fontSize: '0.85rem',
          color: '#6a6a6a'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            © 2025 Prodegi. All rights reserved.
          </p>
          <p style={{ margin: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <a href="mailto:contact@prodegitracker.com" style={{ color: '#C8956B', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#d4a576'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#C8956B'}>
              contact@prodegitracker.com
            </a>
            <span style={{ color: '#6a6a6a' }}>|</span>
            <a href="https://www.instagram.com/prodegitracker" target="_blank" rel="noopener noreferrer" style={{ color: '#C8956B', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#d4a576'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#C8956B'}>
              Instagram
            </a>
          </p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation - Shown only on mobile via CSS */}
      <nav className="mobile-nav">
        <Link
          to="/"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            color: location.pathname === '/' ? '#C8956B' : '#6a6a6a',
            transition: 'all 0.2s',
            fontSize: '0.7rem',
            flex: 1
          }}
        >
          <Dumbbell size={20} />
          <span>Workout</span>
        </Link>
        <Link
          to="/progress"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            color: location.pathname === '/progress' ? '#C8956B' : '#6a6a6a',
            transition: 'all 0.2s',
            fontSize: '0.7rem',
            flex: 1
          }}
        >
          <LineChart size={20} />
          <span>Progress</span>
        </Link>
        <Link
          to="/settings"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            color: location.pathname === '/settings' ? '#C8956B' : '#6a6a6a',
            transition: 'all 0.2s',
            fontSize: '0.7rem',
            flex: 1
          }}
        >
          <SettingsIcon size={20} />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireRoutine?: boolean }> = ({ children, requireRoutine = false }) => {
  const { user, loading } = useAuth();
  const { state, isLoaded } = useStore();

  if (loading || !isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#0a0a0a'
      }}>
        <img 
          src="/favicon.svg" 
          alt="Prodegi" 
          style={{
            width: '120px',
            height: 'auto',
            marginBottom: '2rem',
            animation: 'pulse 2s ease-in-out infinite'
          }}
        />
        <div style={{
          color: '#CC8E51',
          fontSize: '1.2rem',
          fontWeight: '500',
          animation: 'fadeInOut 1.5s ease-in-out infinite'
        }}>
          Loading...
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRoutine && state.routine.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const LoadingScreen: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#0a0a0a'
  }}>
    <img
      src="/favicon.svg"
      alt="Prodegi"
      style={{
        width: '120px',
        height: 'auto',
        marginBottom: '2rem',
        animation: 'pulse 2s ease-in-out infinite'
      }}
    />
    <div style={{
      color: '#CC8E51',
      fontSize: '1.2rem',
      fontWeight: '500',
      animation: 'fadeInOut 1.5s ease-in-out infinite'
    }}>
      Loading...
    </div>
    <style>{`
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
      @keyframes fadeInOut {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
    `}</style>
  </div>
);

const OnboardingRoute: React.FC = () => {
  const { user } = useAuth();
  const { state, isLoaded } = useStore();
  const location = useLocation();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow editing if coming from settings with edit=true query param
  const searchParams = new URLSearchParams(location.search);
  const isEditing = searchParams.get('edit') === 'true';

  // If user already has a routine and not in edit mode, redirect to home
  if (state.routine.length > 0 && !isEditing) {
    return <Navigate to="/" replace />;
  }

  return <Onboarding />;
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <Login />
          } />
          <Route path="/onboarding" element={
            <OnboardingRoute />
          } />
          <Route path="/" element={
            <ProtectedRoute requireRoutine={true}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute>
              <Progress />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
};

export default App;
