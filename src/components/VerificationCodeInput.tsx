import React, { useState, useRef, useEffect } from 'react';
import { VERIFICATION_CODE_TIMEOUT, VERIFICATION_CODE_WARNING_TIME } from '../utils/constants';

interface VerificationCodeInputProps {
  onComplete: (code: string) => void;
  onResend: () => void;
  email: string;
  loading?: boolean;
  error?: string | null;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  onComplete,
  onResend,
  email,
  loading = false,
  error = null,
}) => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(VERIFICATION_CODE_TIMEOUT);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is complete
    if (newCode.every((digit) => digit !== '')) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setCode(newCode);

    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // If complete, trigger onComplete
    if (pastedData.length === 6) {
      onComplete(pastedData);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      width: '100%',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.25rem' }}>
          Enter Verification Code
        </h3>
        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
          We sent a 6-digit code to <strong style={{ color: '#C8956B' }}>{email}</strong>
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        justifyContent: 'center',
      }}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={loading}
            style={{
              width: '3rem',
              height: '3.5rem',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center',
              background: '#2a2a2a',
              border: `2px solid ${error ? '#ff4444' : digit ? '#C8956B' : '#333'}`,
              borderRadius: '8px',
              color: '#fff',
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: "'Courier New', monospace",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#C8956B';
              e.target.select();
            }}
            onBlur={(e) => {
              if (!digit && !error) {
                e.target.style.borderColor = '#333';
              }
            }}
          />
        ))}
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          background: '#ff444420',
          border: '1px solid #ff4444',
          borderRadius: '6px',
          color: '#ff4444',
          fontSize: '0.85rem',
          textAlign: 'center',
          width: '100%',
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
      }}>
        <div style={{
          fontSize: '0.85rem',
          color: timeLeft < 60 ? '#ff4444' : '#888',
          fontWeight: timeLeft < 60 ? '600' : '400',
        }}>
          {timeLeft > 0 ? (
            <>Code expires in {formatTime(timeLeft)}</>
          ) : (
            <>Code expired</>
          )}
        </div>

        <button
          onClick={() => {
            setCode(['', '', '', '', '', '']);
            setTimeLeft(VERIFICATION_CODE_TIMEOUT);
            onResend();
            inputRefs.current[0]?.focus();
          }}
          disabled={loading || timeLeft > VERIFICATION_CODE_WARNING_TIME}
          style={{
            background: 'none',
            border: 'none',
            color: loading || timeLeft > VERIFICATION_CODE_WARNING_TIME ? '#555' : '#C8956B',
            fontSize: '0.9rem',
            cursor: loading || timeLeft > VERIFICATION_CODE_WARNING_TIME ? 'not-allowed' : 'pointer',
            textDecoration: 'underline',
            padding: '0.5rem',
          }}
        >
          {loading ? 'Sending...' : 'Resend code'}
        </button>
      </div>
    </div>
  );
};

export default VerificationCodeInput;
