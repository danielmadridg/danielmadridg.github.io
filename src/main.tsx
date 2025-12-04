import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register Service Worker for caching and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed, app will still work
    });
  });
}

// Defer reCAPTCHA loading to after page interaction
// This prevents 695KB blocking the render path
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Load after 1.5s to let page interactive first
    setTimeout(() => {
      if (!(window as any).grecaptcha) {
        const script = document.createElement('script');
        script.src = 'https://www.google.com/recaptcha/api.js?render=6LesKB0sAAAAAJLdCi4ZO6CcBg9rzPxccGD9zu0M';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }, 1500);
  });
}
