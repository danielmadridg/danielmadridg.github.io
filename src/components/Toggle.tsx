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
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                       !/Android|Windows Phone/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
  }, []);

  if (isIOS) {
    // Native iOS-style toggle
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
          background: checked ? '#34C759' : '#E5E5EA',
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
            borderRadius: '50%',
            boxShadow: '0 3px 1px 0 rgba(0, 0, 0, 0.04), 0 3px 8px 0 rgba(0, 0, 0, 0.12)'
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
