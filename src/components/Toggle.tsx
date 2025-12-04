import React, { useState, useEffect } from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false }) => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS devices (iPhone, iPad)
    const isIOSDevice = () => {
      // Check user agent for iOS indicators
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        return true;
      }
      // Check if running in standalone mode (PWA on iOS)
      if ((navigator as any).standalone === true) {
        return true;
      }
      // Check for iOS platform
      if (/iPhone|iPad|iPod/.test(navigator.platform)) {
        return true;
      }
      // Check for MacIntel with touch events (iPad on modern Safari)
      if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
        return true;
      }
      return false;
    };

    setIsIOS(isIOSDevice());
  }, []);

  if (isIOS) {
    // Native iOS-style toggle (Apple's exact style)
    return (
      <label style={{
        position: 'relative',
        display: 'inline-block',
        width: '50px',
        height: '30px',
        flexShrink: 0,
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      } as React.CSSProperties}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={{opacity: 0, width: 0, height: 0}}
        />
        <span style={{
          position: 'absolute',
          cursor: disabled ? 'not-allowed' : 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: checked ? '#34C759' : '#EBEBF0',
          transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '15px',
          opacity: disabled ? 0.5 : 1
        }}>
          <span style={{
            position: 'absolute',
            height: '26px',
            width: '26px',
            left: checked ? '22px' : '2px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'white',
            transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: '13px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }} />
        </span>
      </label>
    );
  }

  // Web-style toggle (modern iOS-inspired design that works on all platforms)
  return (
    <label style={{
      position: 'relative',
      display: 'inline-block',
      width: '51px',
      height: '31px',
      flexShrink: 0
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{opacity: 0, width: 0, height: 0}}
      />
      <span style={{
        position: 'absolute',
        cursor: disabled ? 'not-allowed' : 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: checked ? 'var(--primary-color)' : '#555',
        transition: '0.3s ease',
        borderRadius: '31px',
        opacity: disabled ? 0.5 : 1
      }}>
        <span style={{
          position: 'absolute',
          height: '27px',
          width: '27px',
          left: checked ? '22px' : '2px',
          bottom: '2px',
          background: 'white',
          transition: '0.3s ease',
          borderRadius: '50%'
        }} />
      </span>
    </label>
  );
};

export default Toggle;
