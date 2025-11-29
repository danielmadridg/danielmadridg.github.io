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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/onboarding' || location.pathname === '/login';

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0a0a0a' }}>
      {/* Sidebar */}
      <div style={{
        width: '200px',
        background: '#0a0a0a',
        borderRight: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0'
      }}>
        {/* Logo */}
        <Link to="/" style={{
          padding: '1rem 1rem',
          marginBottom: '2rem',
          textDecoration: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img src="/prodegilogo.png" alt="Prodegi" style={{
            width: '140px',
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
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2rem'
      }}>
        {children}
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireRoutine?: boolean }> = ({ children, requireRoutine = false }) => {
  const { user, loading } = useAuth();
  const { state } = useStore();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
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

const OnboardingRoute: React.FC = () => {
  const { user } = useAuth();
  const { state } = useStore();
  const location = useLocation();

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
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
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
