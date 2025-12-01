import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithCustomToken
} from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, functions, db } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import { Mail, Lock, Chrome, User, Eye, EyeOff, ArrowLeft, Key } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { isPWA } from '../utils/pwa';

type LoginStep = 'credentials' | 'verification';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<LoginStep>('credentials');
  const [accessKey, setAccessKey] = useState('');
  const inPWA = isPWA();

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Handle redirect result from Google Sign-In on mobile
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setLoading(true);
        console.log('[Login] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        if (result) {
          // Successfully signed in via redirect
          console.log('[Login] Redirect result received, user authenticated:', result.user.uid);
          // Small delay to ensure auth state updates propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          // Check if currentUser is set
          if (auth.currentUser) {
            console.log('[Login] Current user confirmed:', auth.currentUser.uid);
          }
        } else if (auth.currentUser) {
           console.log('[Login] User already signed in:', auth.currentUser.uid);
        } else {
          console.log('[Login] No redirect result found');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('[Login] Redirect result error:', err.code, err.message);
        if (err.code && err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
          setError(err.message || 'An error occurred during sign-in');
        }
        setLoading(false);
      }
    };

    handleRedirectResult();
  }, []);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (!/[A-Z]/.test(pwd)) errors.push(t('password_uppercase'));
    if (!/[a-z]/.test(pwd)) errors.push(t('password_lowercase'));
    if (!/[0-9]/.test(pwd)) errors.push(t('password_number'));
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pwd)) errors.push(t('password_special'));
    if (pwd.length < 8) errors.push(t('password_length'));
    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (isSignUp) {
      setPasswordErrors(validatePassword(newPassword));
    }
  };

  const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('[Login] Starting Google Sign-In (v2025-12-01-fix)');

      const standalone = isPWA();
      const isMobile = isMobileDevice();
      console.log('[Login] Environment:', { isMobile, isStandalone: standalone });

      // Use signInWithPopup for ALL devices
      // We reverted from signInWithRedirect because it was causing issues in PWA mode
      // (returning to login screen without user)
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        console.error('[Login] Popup error:', popupErr);
        // If popup fails, we could try redirect, but let's be careful about loops.
        // For now, let's just throw it so the user sees the error.
        // If it's a popup blocked error, we can suggest the user to allow popups.
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
             // Optional: You could enable redirect here as a last resort, 
             // but if redirect is broken in PWA, it's better to fail and let user know.
             // Let's try redirect ONLY if it's explicitly blocked, but log it clearly.
             console.log('[Login] Popup blocked, attempting redirect fallback...');
             await signInWithRedirect(auth, googleProvider);
             return;
        }
        throw popupErr;
      }
    } catch (err: any) {
      console.error('[Login] Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        const errorMessage = getErrorMessage(err.code, false);
        setError(errorMessage);
      }
    } finally {
      // Always stop loading if we finished (success or error)
      // Unless we triggered a redirect (which returns early above)
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string, isSignUp: boolean): string => {
    switch (errorCode) {
      case 'auth/invalid-credential':
        return t('error_no_account');
      case 'auth/user-not-found':
        return t('error_no_account');
      case 'auth/wrong-password':
        return t('error_wrong_password');
      case 'auth/email-already-in-use':
        return t('error_email_in_use');
      case 'auth/weak-password':
        return t('error_weak_password');
      case 'auth/invalid-email':
        return t('error_invalid_email');
      case 'auth/network-request-failed':
        return t('error_network');
      case 'auth/too-many-requests':
        return t('error_too_many_requests');
      default:
        return isSignUp ? t('error_signup_generic') : t('error_signin_generic');
    }
  };

  const handleSendVerificationCode = async () => {
    try {
      setError(null);
      setLoading(true);

      const sendCodeFn = httpsCallable(functions, 'sendVerificationCode');
      const result = await sendCodeFn({ email, name: name || email.split('@')[0] });
      const data = result.data as { success: boolean; error?: string };

      if (data.success) {
        setCurrentStep('verification');
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err: any) {
      console.error('Error sending code:', err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    const checkUsernameFn = httpsCallable(functions, 'checkUsernameAvailability');
    const result = await checkUsernameFn({ username: usernameToCheck });
    const data = result.data as { available: boolean; error?: string };
    if (data.error) throw new Error(data.error);
    return data.available;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Manual email validation since we disabled native validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('error_invalid_email'));
      return;
    }

    if (isSignUp) {
      const errors = validatePassword(password);
      if (errors.length > 0) {
        setPasswordErrors(errors);
        setError(t('error_weak_password'));
        return;
      }
      if (!username.trim()) {
        setError(t('error_enter_username'));
        return;
      }
      
      // Check username uniqueness
      try {
        setLoading(true);
        const isAvailable = await checkUsernameAvailability(username.trim());
        if (!isAvailable) {
          setError(t('error_username_taken'));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setError('Failed to validate username. Please try again.');
        setLoading(false);
        return;
      }
    }

    try {
      setError(null);
      setLoading(true);

      if (!executeRecaptcha) {
        setError(t('error_captcha_failed'));
        return;
      }

      const token = await executeRecaptcha(isSignUp ? 'signup' : 'signin');

      if (!token) {
        setError(t('error_captcha_failed'));
        return;
      }

      const verifyRecaptchaFn = httpsCallable(functions, 'verifyRecaptcha');
      const result = await verifyRecaptchaFn({ token });
      const data = result.data as { success: boolean; score?: number };

      if (!data.success) {
        setError(t('error_captcha_failed'));
        return;
      }

      // Send verification code
      await handleSendVerificationCode();
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code, isSignUp);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    try {
      setError(null);
      setLoading(true);

      const verifyCodeFn = httpsCallable(functions, 'verifyCode');
      const result = await verifyCodeFn({ email, code });
      const data = result.data as { success: boolean; error?: string };

      if (data.success) {
        // Code verified, proceed with authentication
        if (isSignUp) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);

          // Create user document in Firestore
          try {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              uid: userCredential.user.uid,
              username: username.trim(),
              email: email,
              name: name,
              createdAt: new Date().toISOString()
            });
          } catch (err) {
            console.error('Error creating user document:', err);
            // Continue even if firestore fails, auth is successful
          }

          // Ensure email is saved even if there's an issue with initial doc creation
          try {
            const userDocRef = doc(db, 'users', userCredential.user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.data()?.email) {
              await setDoc(userDocRef, { email: email }, { merge: true });
            }
          } catch (err) {
            console.error('Error ensuring email is saved:', err);
          }

          await updateProfile(userCredential.user, {
            displayName: name
          });

          // Removed alert to prevent PWA black screen/crash issues.
          // The progressive overload message can be shown in the onboarding flow instead.
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.code, isSignUp);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendVerificationCode();
  };

  const handleBackToCredentials = () => {
    setCurrentStep('credentials');
    setError(null);
  };

  const handleAccessKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessKey.trim()) {
      setError('Please enter your access key');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Remove dashes from access key for lookup
      const cleanAccessKey = accessKey.trim().replace(/-/g, '');

      // Call Firebase Function to find user by access key
      const findUserFn = httpsCallable(functions, 'findUserByAccessKey');
      const findResult = await findUserFn({ accessKey: cleanAccessKey });
      const findData = findResult.data as { uid?: string; email?: string; error?: string };

      if (findData.error || !findData.uid) {
        setError(findData.error || 'Invalid access key. Please check and try again.');
        setLoading(false);
        return;
      }

      // Call Firebase Function to generate custom token
      const generateTokenFn = httpsCallable(functions, 'generateCustomToken');
      const tokenResult = await generateTokenFn({ uid: findData.uid });
      const tokenData = tokenResult.data as { token?: string; error?: string };

      if (tokenData.error || !tokenData.token) {
        setError(tokenData.error || 'Failed to authenticate. Please try again.');
        setLoading(false);
        return;
      }

      // Sign in with custom token
      await signInWithCustomToken(auth, tokenData.token);

      // Navigation will happen automatically via useEffect
    } catch (err: any) {
      setError(`Failed to sign in: ${err.message || 'Please try again.'}`);
      setLoading(false);
    }
  };

  if (currentStep === 'verification') {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#000',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          padding: '2.5rem 2rem',
          borderRadius: '0',
          border: '1px solid #333',
          background: '#000'
        }}>
          <button
            onClick={handleBackToCredentials}
            style={{
              background: 'none',
              border: 'none',
              color: '#C8956B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              padding: '0.5rem 0',
              fontSize: '0.9rem'
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <VerificationCodeInput
            email={email}
            onComplete={handleVerifyCode}
            onResend={handleResendCode}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#000',
      flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
    }}>
      {/* Left side - Logo */}
      <div style={{
        flex: window.innerWidth <= 768 ? 0 : 1,
        display: window.innerWidth <= 768 ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <img src="/favicon.svg" alt="Prodegi" style={{
          maxWidth: '300px',
          width: '100%',
          height: 'auto'
        }} />
      </div>

      {/* Right side - Login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: window.innerWidth <= 768 ? '1rem' : '2rem'
      }}>
        {/* Show logo in PWA mode */}
        {inPWA && (
          <img src="/favicon.svg" alt="Prodegi" style={{
            width: '120px',
            height: 'auto',
            marginBottom: '2rem'
          }} />
        )}

        <h1 style={{
          fontSize: window.innerWidth <= 768 ? '2rem' : '3rem',
          marginBottom: window.innerWidth <= 768 ? '1.5rem' : '3rem',
          color: '#fff',
          fontFamily: "'Syne', sans-serif",
          letterSpacing: '1px'
        }}>
          Prodegi
        </h1>

        <div style={{
          width: '100%',
          maxWidth: '350px',
          padding: '2.5rem 2rem',
          borderRadius: '0',
          border: '1px solid #333',
          background: '#000'
        }}>
        <p style={{
          textAlign: 'center',
          marginBottom: '2rem',
          color: '#888',
          fontSize: '0.9rem'
        }}>
          {inPWA ? 'Enter your access key to sign in' : (isSignUp ? t('create_account') : t('sign_in_continue'))}
        </p>

        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            background: '#ff444420',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            color: '#ff4444',
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        {/* PWA Access Key Login - ONLY option in PWA */}
        {inPWA ? (
          <form onSubmit={handleAccessKeyLogin}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: '#ccc',
                fontSize: '0.9rem'
              }}>
                <Key size={16} />
                Access Key
              </label>
              <input
                type="text"
                value={accessKey}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  // Add dashes every 4 characters
                  if (value.length > 0) {
                    const parts = [];
                    for (let i = 0; i < value.length; i += 4) {
                      parts.push(value.substring(i, i + 4));
                    }
                    value = parts.join('-');
                  }
                  setAccessKey(value);
                }}
                required
                disabled={loading}
                spellCheck="false"
                placeholder="XXXX-XXXX-XXXX"
                maxLength={14}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  textAlign: 'center'
                }}
              />
              <p style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#666',
                lineHeight: '1.4'
              }}>
                Find your access key in Settings when logged in on the web browser
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--primary-color)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
            boxSizing: 'border-box'
          }}
        >
          <Chrome size={20} />
          {t('continue_with_google')}
        </button>

        <div style={{
          textAlign: 'center',
          margin: '1.5rem 0',
          color: '#666',
          fontSize: '0.85rem'
        }}>
          {t('or')}
        </div>

        <form onSubmit={handleEmailAuth} noValidate>
          {isSignUp && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: '#ccc',
                  fontSize: '0.9rem'
                }}>
                  <User size={16} />
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  spellCheck="false"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder={t('your_name')}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: '#ccc',
                  fontSize: '0.9rem'
                }}>
                  <User size={16} />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  spellCheck="false"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Username"
                />
              </div>
            </>
          )}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              color: '#ccc',
              fontSize: '0.9rem'
            }}>
              <Mail size={16} />
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              spellCheck="false"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder={t('your_email')}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              color: '#ccc',
              fontSize: '0.9rem'
            }}>
              <Lock size={16} />
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={loading}
                minLength={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: '2.5rem',
                  background: '#2a2a2a',
                  border: `1px solid ${isSignUp && passwordErrors.length > 0 && password.length > 0 ? '#f44336' : '#333'}`,
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isSignUp && password.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                {passwordErrors.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#f44336' }}>
                    {passwordErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#4CAF50' }}>{t('password_valid')}</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--primary-color)',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
          >
            {loading ? t('please_wait') : (isSignUp ? t('sign_up') : t('sign_in'))}
          </button>
        </form>
        </>
        )}

        {/* Hide Sign Up toggle in PWA mode */}
        {!inPWA && (
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <span style={{ color: '#888' }}>
              {isSignUp ? t('already_have_account') : t('dont_have_account')}
            </span>
            {' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.9rem'
              }}
            >
              {isSignUp ? t('sign_in') : t('sign_up')}
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Login;
