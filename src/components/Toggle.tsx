import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false }) => {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '51px',
        minWidth: '51px',
        maxWidth: '51px',
        height: '31px',
        minHeight: '31px',
        borderRadius: '31px',
        backgroundColor: checked ? 'var(--primary-color)' : '#555',
        padding: '2px',
        boxSizing: 'border-box',
        flexShrink: 0,
        flexGrow: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        transition: 'background-color 0.3s ease',
        isolation: 'isolate'
      }}
    >
      <div style={{
        width: '27px',
        height: '27px',
        borderRadius: '50%',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        marginLeft: checked ? 'calc(100% - 27px)' : '0',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        willChange: 'margin-left'
      }} />
    </div>
  );
};

export default Toggle;
