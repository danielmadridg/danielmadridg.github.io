import React, { lazy, Suspense } from 'react';

// Loading fallback component
const LoadingFallback = () => (
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

// HOC to wrap lazy-loaded components with Suspense
export const lazyLoad = (importFunc: () => Promise<{ default: React.ComponentType<any> }>) => {
  const Component = lazy(importFunc);
  return (props: any) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};
