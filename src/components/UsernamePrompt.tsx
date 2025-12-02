import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { isUsernameAvailable } from '../utils/username';

interface UsernamePromptProps {
  onComplete: () => void;
}

const UsernamePrompt: React.FC<UsernamePromptProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const { setUsername } = useStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validateUsername = (username: string): string | null => {
    if (!username || username.trim().length === 0) {
      return t('please_enter_name') || 'Please enter a username.';
    }
    if (!/^[a-zA-Z]+$/.test(username)) {
      return t('name_letters_only') || 'Username can only contain letters (A-Z). No spaces or special characters allowed.';
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters long.';
    }
    if (username.length > 20) {
      return 'Username must be at most 20 characters long.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateUsername(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsChecking(true);
    try {
      const available = await isUsernameAvailable(input);
      if (!available) {
        setError(t('error_username_taken') || 'Username is already taken. Please choose another one.');
        setIsChecking(false);
        return;
      }

      setIsSaving(true);
      setUsername(input);
      // Give a moment for the state to update and sync
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (err) {
      console.error('Error checking username:', err);
      setError('Error checking username availability. Please try again.');
      setIsChecking(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        background: 'var(--surface-color)',
        borderRadius: '12px',
        padding: '2.5rem',
        border: '1px solid rgba(200, 149, 107, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/favicon.svg" alt="Prodegi" style={{
            width: '80px',
            height: 'auto',
            marginBottom: '1.5rem'
          }} />
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Choose Your Username
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.5'
          }}>
            This will be your unique identifier that others can use to find and follow you.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Username
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              placeholder="johndoe"
              autoFocus
              disabled={isSaving}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                background: '#1a1a1a',
                border: error ? '1px solid #f44336' : '1px solid rgba(200, 149, 107, 0.3)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!error) e.currentTarget.style.borderColor = 'var(--primary-color)';
              }}
              onBlur={(e) => {
                if (!error) e.currentTarget.style.borderColor = 'rgba(200, 149, 107, 0.3)';
              }}
            />
            {error && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: '#f44336'
              }}>
                {error}
              </div>
            )}
            <div style={{
              marginTop: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              Letters only, 3-20 characters
            </div>
          </div>

          <button
            type="submit"
            disabled={isChecking || isSaving || !input}
            style={{
              width: '100%',
              padding: '0.875rem',
              fontSize: '1rem',
              fontWeight: '600',
              background: (isChecking || isSaving || !input) ? '#555' : 'var(--primary-color)',
              color: (isChecking || isSaving || !input) ? '#999' : '#0a0a0a',
              border: 'none',
              borderRadius: '6px',
              cursor: (isChecking || isSaving || !input) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: (isChecking || isSaving || !input) ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isChecking && !isSaving && input) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isChecking && !isSaving && input) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {isSaving ? 'Saving...' : isChecking ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernamePrompt;
