import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Friends from './pages/Friends';
import UsernamePrompt from './components/UsernamePrompt';
import { Dumbbell, LineChart, Settings as SettingsIcon, Users } from 'lucide-react';
import clsx from 'clsx';
import { useSEO } from './hooks/useSEO';
import './utils/testPublicProfile'; // Debug utility for testing profile sync

import './App.css';

// reCAPTCHA site key (configure in environment variables)
const RECAPTCHA_SITE_KEY = '6LesKB0sAAAAAJLdCi4ZO6CcBg9rzPxccGD9zu0M';

// Context for tracking workout state
interface WorkoutContextType {
  isWorkoutActive: boolean;
  setWorkoutActive: (active: boolean) => void;
  handleCancelWorkout?: () => void;
  setHandleCancelWorkout?: (handler: (() => void) | undefined) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error('useWorkout must be used within WorkoutProvider');
  return context;
};

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/onboarding' || location.pathname === '/login' || location.pathname === '/set-username';
  const { isWorkoutActive, handleCancelWorkout } = useWorkout();
  const { t } = useLanguage();
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // Update SEO tags on route change
  useSEO();

  // Handle back button - intercept page unload
  useEffect(() => {
    if (!isWorkoutActive) return;

    console.log('[Back Button] Setting up beforeunload handler');

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('[Back Button] beforeunload triggered!');
      e.preventDefault();
      e.returnValue = '';
      setShowBackConfirm(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('[Back Button] Removing beforeunload handler');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isWorkoutActive]);

  const handlePauseWorkout = () => {
    setShowBackConfirm(false);
    if (handleCancelWorkout) {
      handleCancelWorkout();
    }
  };

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="app-container">
      {/* Desktop Sidebar - Hidden on mobile via CSS */}
      <div className="desktop-sidebar">
        {/* Logo */}
        {isWorkoutActive ? (
          <button
            onClick={() => {
              if (handleCancelWorkout) {
                handleCancelWorkout();
              }
            }}
            style={{
              padding: '1rem 1rem',
              marginBottom: '2rem',
              textDecoration: 'none',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit'
            }}
            title="Back"
          >
            <img src="/favicon.svg" alt="Prodegi" style={{
              width: '3.5rem',
              height: 'auto'
            }} />
          </button>
        ) : (
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
        )}

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
            <span style={{ fontSize: '0.95rem', fontWeight: location.pathname === '/' ? 500 : 400 }}>{t('workout')}</span>
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
            <span style={{ fontSize: '0.95rem', fontWeight: location.pathname === '/progress' ? 500 : 400 }}>{t('progress')}</span>
          </Link>
          <Link
            to="/friends"
            className={clsx('nav-item', location.pathname === '/friends' && 'active')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
              textDecoration: 'none',
              color: location.pathname === '/friends' ? '#C8956B' : '#6a6a6a',
              transition: 'all 0.2s',
              borderRadius: '8px',
              background: location.pathname === '/friends' ? 'rgba(200, 149, 107, 0.1)' : 'transparent'
            }}
          >
            <Users size={22} />
            <span style={{ fontSize: '0.95rem', fontWeight: location.pathname === '/friends' ? 500 : 400 }}>{t('friends')}</span>
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
            <span style={{ fontSize: '0.95rem', fontWeight: location.pathname === '/settings' ? 500 : 400 }}>{t('settings')}</span>
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
            © 2025 Prodegi. {t('all_rights_reserved')}
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
          <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#555', lineHeight: '1.4' }}>
            {t('recaptcha_protected')}{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'underline' }}>
              {t('privacy_policy')}
            </a>{' '}{t('and')}{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'underline' }}>
              {t('terms_of_service')}
            </a>{' '}{t('apply')}
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
          <span>{t('workout')}</span>
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
          <span>{t('progress')}</span>
        </Link>
        <Link
          to="/friends"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            padding: '0.5rem 1rem',
            textDecoration: 'none',
            color: location.pathname === '/friends' ? '#C8956B' : '#6a6a6a',
            transition: 'all 0.2s',
            fontSize: '0.7rem',
            flex: 1
          }}
        >
          <Users size={20} />
          <span>{t('friends')}</span>
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
          <span>{t('settings')}</span>
        </Link>
      </nav>

      {/* Back Confirmation Modal */}
      {showBackConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--surface-color)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            textAlign: 'center',
            border: '1px solid var(--primary-color)',
            position: 'relative'
          }}>
            {/* Close button (X) */}
            <button
              onClick={() => setShowBackConfirm(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Close"
            >
              ✕
            </button>

            <h2 style={{
              color: 'var(--text-primary)',
              marginTop: 0,
              marginBottom: '1.5rem',
              fontSize: '1.2rem',
              paddingRight: '2rem'
            }}>
              {t('back_during_workout')}
            </h2>
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexDirection: 'column'
            }}>
              <button
                onClick={handlePauseWorkout}
                style={{
                  padding: '0.75rem 1.5rem',
                  minHeight: '44px',
                  background: 'var(--primary-color)',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {t('pause_workout')}
              </button>
              <button
                onClick={() => {
                  setShowBackConfirm(false);
                  handleCancelWorkout?.();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  minHeight: '44px',
                  background: 'transparent',
                  color: '#f44336',
                  border: '1px solid #f44336',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(244, 67, 54, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {t('cancel_workout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize Layout to prevent unnecessary re-renders of navigation
const Layout = React.memo(LayoutContent);

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

  // Check if user needs to set username first
  if (!state.username) {
    return <Navigate to="/set-username" replace />;
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

const UsernameRoute: React.FC = () => {
  const { user } = useAuth();
  const { state, isLoaded } = useStore();
  const navigate = useNavigate();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user already has a username, redirect to onboarding or home
  if (state.username) {
    if (state.routine.length === 0) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <UsernamePrompt onComplete={() => navigate('/onboarding')} />;
};

const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWorkoutActive, setWorkoutActive] = useState(false);
  const [handleCancelWorkout, setHandleCancelWorkout] = useState<(() => void) | undefined>(undefined);

  return (
    <WorkoutContext.Provider value={{
      isWorkoutActive,
      setWorkoutActive,
      handleCancelWorkout,
      setHandleCancelWorkout
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

const InnerContent: React.FC = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isWorkoutActive, setWorkoutActive } = useWorkout();
  const previousPathRef = useRef(location.pathname);

  // Reset workout when navigating away from home
  useEffect(() => {
    if (isWorkoutActive && location.pathname !== '/' && location.pathname !== previousPathRef.current) {
      setWorkoutActive(false);
    }
    previousPathRef.current = location.pathname;
  }, [location.pathname, isWorkoutActive, setWorkoutActive]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/set-username" element={
        <UsernameRoute />
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
      <Route path="/friends" element={
        <ProtectedRoute>
          <Friends />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
    </Routes>
    </Layout>
  );
};

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <WorkoutProvider>
        <InnerContent />
      </WorkoutProvider>
    </Router>
  );
};

const App: React.FC = () => {
  console.log('[App] Using reCAPTCHA Site Key:', RECAPTCHA_SITE_KEY);
  return (
    <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
      <AuthProvider>
        <StoreProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </StoreProvider>
      </AuthProvider>
    </GoogleReCaptchaProvider>
  );
};

export default App;
