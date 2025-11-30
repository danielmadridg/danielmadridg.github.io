import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  style?: React.CSSProperties;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', ...style }}>
      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.875rem 1rem',
          fontSize: '1rem',
          background: 'var(--surface-color)',
          border: `1px solid ${isOpen ? 'var(--primary-color)' : '#252525'}`,
          borderRadius: '6px',
          color: 'var(--text-color)',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          fontFamily: 'inherit'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = '#3a3a3a';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = '#252525';
        }}
      >
        <span>{selectedOption?.name || 'Select...'}</span>
        <ChevronDown
          size={20}
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--primary-color)'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.25rem)',
            left: 0,
            right: 0,
            background: '#0a0a0a',
            border: '1px solid #252525',
            borderRadius: '6px',
            maxHeight: typeof window !== 'undefined' && window.innerWidth <= 480 ? '150px' : '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option.id)}
              style={{
                padding: typeof window !== 'undefined' && window.innerWidth <= 480 ? '0.65rem 1rem' : '0.875rem 1rem',
                cursor: 'pointer',
                background: option.id === value ? 'rgba(200, 149, 107, 0.15)' : 'transparent',
                color: option.id === value ? 'var(--primary-color)' : 'var(--text-color)',
                transition: 'all 0.15s',
                fontWeight: option.id === value ? 500 : 400,
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                fontSize: typeof window !== 'undefined' && window.innerWidth <= 480 ? '0.9rem' : '1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(200, 149, 107, 0.15)';
                e.currentTarget.style.color = 'var(--primary-color)';
              }}
              onMouseLeave={(e) => {
                if (option.id !== value) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-color)';
                } else {
                  e.currentTarget.style.background = 'rgba(200, 149, 107, 0.15)';
                }
              }}
            >
              {option.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
