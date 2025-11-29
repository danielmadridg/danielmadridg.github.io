import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import { Dumbbell, LineChart, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/onboarding';

  return (
    <div className="container">
      {!hideNav && (
        <header style={{ padding: '1rem 0', textAlign: 'center', borderBottom: '1px solid #333', marginBottom: '1rem' }}>
          <a href="/" style={{ textDecoration: 'none', color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px' }}>
            PRODEGI
          </a>
        </header>
      )}
      <div style={{ flex: 1 }}>
        {children}
      </div>
      {!hideNav && (
        <nav className="nav-bar">
          <a href="/" className={clsx('nav-item', location.pathname === '/' && 'active')}>
            <Dumbbell size={24} />
            <span>Workout</span>
          </a>
          <a href="/progress" className={clsx('nav-item', location.pathname === '/progress' && 'active')}>
            <LineChart size={24} />
            <span>Progress</span>
          </a>
          <a href="/settings" className={clsx('nav-item', location.pathname === '/settings' && 'active')}>
            <SettingsIcon size={24} />
            <span>Settings</span>
          </a>
        </nav>
      )}
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useStore();
  if (state.routine.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={
            <ProtectedRoute>
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
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
