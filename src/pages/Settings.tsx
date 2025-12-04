import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit, Trash2 } from 'lucide-react';
import ProfilePictureEditor from '../components/ProfilePictureEditor';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ACCESS_KEY_LENGTH, ACCESS_KEY_SEGMENT_LENGTH } from '../utils/constants';
import { isUsernameAvailable, releaseUsername } from '../utils/username';
import { convertWeight } from '../utils/unitConversion';

// Note: db, doc, getDoc, setDoc are still needed for access key management

const Settings: React.FC = () => {
  const { clearData, clearHistory, state, setUnitPreference, setUsername, setName, setWeight, setAge, setGender, setShareProfile, setShareStats, setSharePersonalRecords, setSharePersonalInfo } = useStore();
  const { signOut, deleteAccount, user, updateProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [clearHistoryConfirmText, setClearHistoryConfirmText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageType, setSuccessMessageType] = useState<'username' | 'profile'>('username');
  const [accessKey, setAccessKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);
  const [keyCopied, setKeyCopied] = useState(false);
  const [showAccessKeyWarning, setShowAccessKeyWarning] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>(state.name || '');
  const [weightInput, setWeightInput] = useState<number | string>(state.weight || '');
  const [ageInput, setAgeInput] = useState<number | string>(state.age || '');
  const [genderInput, setGenderInput] = useState<'male' | 'female' | 'other' | ''>(state.gender || '');
  const currentUnit = state.unitPreference || 'kg';

  useEffect(() => {
    setNewDisplayName(state.username || '');
  }, [state.username]);

  useEffect(() => {
    return () => {
      setShowSuccessMessage(false);
    };
  }, []);

  // Load or generate access key
  useEffect(() => {
    const loadAccessKey = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Ensure email is saved in the document (fixes "User account is incomplete" error)
          if (!data.email && user.email) {
            await setDoc(userDocRef, { email: user.email }, { merge: true });
          }

          if (data.accessKey) {
            setAccessKey(data.accessKey);
          } else {
            // Generate new access key
            const newKey = generateAccessKey();
            await setDoc(userDocRef, { accessKey: newKey, email: user.email }, { merge: true });
            setAccessKey(newKey);
          }
        } else {
          // Create document if it doesn't exist
          const newKey = generateAccessKey();
          await setDoc(userDocRef, { 
            accessKey: newKey,
            email: user.email,
            createdAt: new Date().toISOString()
          });
          setAccessKey(newKey);
        }
      } catch (error) {
        console.error('Error loading access key:', error);
      } finally {
        setLoadingKey(false);
      }
    };
    
    loadAccessKey();
  }, [user]);

  const generateAccessKey = (): string => {
    // Generate access key with format: XXXX-XXXX-XXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters (I, O, 0)
    let key = '';
    for (let i = 0; i < ACCESS_KEY_LENGTH; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % ACCESS_KEY_SEGMENT_LENGTH === 0 && i < ACCESS_KEY_LENGTH - 1) key += '-';
    }
    return key;
  };

  const copyAccessKey = async () => {
    if (!accessKey) return;
    
    try {
      await navigator.clipboard.writeText(accessKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = accessKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await signOut();
      navigate('/login');
    }
  };

  const handleResetData = () => {
    if (confirmText.toLowerCase() === 'confirm') {
      clearData();
      setShowResetDialog(false);
      setConfirmText('');
      alert('All data has been reset successfully.');
    } else {
      alert('Please type "confirm" to reset your data.');
    }
  };

  const handleClearHistory = () => {
    if (clearHistoryConfirmText.toLowerCase() === 'confirm') {
      clearHistory();
      setShowClearHistoryDialog(false);
      setClearHistoryConfirmText('');
      alert('Workout history has been cleared successfully.');
    } else {
      alert('Please type "confirm" to clear your history.');
    }
  };

  const handleEditRoutine = () => {
    navigate('/onboarding?edit=true');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() === 'confirm') {
      try {
        clearData(); // Clear all data first
        await deleteAccount(); // Then delete the Firebase account
        navigate('/login');
      } catch (error) {
        alert(t('error_delete_account'));
      }
    } else {
      alert('Please type "confirm" to delete your account.');
    }
  };

  const handleUpdateDisplayName = async () => {
    const trimmedName = newDisplayName.trim();

    if (trimmedName === '') {
      alert('Please enter a username.');
      return;
    }

    // Allow letters only for usernames (matching UsernamePrompt validation)
    if (!/^[a-zA-Z]+$/.test(trimmedName)) {
      alert('Username can only contain letters (A-Z). No spaces or special characters allowed.');
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 20) {
      alert('Username must be between 3 and 20 characters.');
      return;
    }

    // If username hasn't changed, just close dialog
    if (state.username === trimmedName) {
      setShowEditNameDialog(false);
      setUsernameError(null);
      return;
    }

    try {
      // Check if username is available
      const available = await isUsernameAvailable(trimmedName);
      if (!available) {
        setUsernameError('Username is already taken');
        return;
      }

      // Release the old username so others can use it
      if (state.username && state.username !== trimmedName && user) {
        await releaseUsername(state.username, user.uid);
        console.log('[Settings] Released old username:', state.username);
      }

      // Update Firebase Auth displayName first (this is the source of truth)
      if (user) {
        await updateProfile({ displayName: trimmedName });
        console.log('[Settings] Updated Firebase displayName to:', trimmedName);
      }

      // Update local state
      setUsername(trimmedName);
      setShowEditNameDialog(false);
      setUsernameError(null);
      setSuccessMessageType('username');
      setShowSuccessMessage(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating username:', error);
      alert('Failed to update username.');
    }
  };

  const handleUpdateProfile = async () => {
    // Update personal info (name, weight, age, gender)
    const weightNum = weightInput ? parseFloat(weightInput.toString()) : undefined;
    const ageNum = ageInput ? parseFloat(ageInput.toString()) : undefined;
    const genderVal = genderInput || undefined;
    const nameVal = nameInput.trim() || undefined;

    if (weightNum !== undefined && (weightNum < 0 || !Number.isFinite(weightNum))) {
      alert('Please enter a valid weight.');
      return;
    }
    if (ageNum !== undefined && (ageNum < 0 || !Number.isFinite(ageNum))) {
      alert('Please enter a valid age.');
      return;
    }

    try {
      // Update state through StoreContext
      setName(nameVal);
      setWeight(weightNum);
      setAge(ageNum);
      setGender(genderVal as 'male' | 'female' | 'other' | undefined);

      setShowEditProfile(false);
      setSuccessMessageType('profile');
      setShowSuccessMessage(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      alert('Failed to update profile information.');
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;

  return (
    <div>
      <h1>{t('settings')}</h1>

      <div className="card" style={{marginBottom: '1rem'}}>
        <h2 style={{marginTop: '0', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600'}}>{t('profile')}</h2>

        <div style={{marginBottom: '1.5rem'}}>
          <label style={{fontSize: '0.9rem', margin: 0, marginBottom: '0.75rem', display: 'block'}}>Name & Username</label>

          {!showEditNameDialog ? (
            // Display mode
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              marginBottom: '1rem',
              flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '0.75rem',
                flex: 1
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--surface-color)',
                  borderRadius: '6px',
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid #252525',
                  boxSizing: 'border-box'
                }}>
                  <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem'}}>Name</span>
                  <span style={{fontSize: '0.95rem'}}>{state.name || 'Not set'}</span>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--surface-color)',
                  borderRadius: '6px',
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid #252525',
                  boxSizing: 'border-box'
                }}>
                  <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem'}}>Username</span>
                  <span style={{fontSize: '0.95rem'}}>@{state.username || 'Not set'}</span>
                </div>
              </div>
              {!showEditNameDialog && (
                <button
                  className="btn-secondary"
                  onClick={() => setShowEditNameDialog(true)}
                  style={{
                    height: '60px',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Edit size={14} />
                  {!isMobile && 'Edit'}
                </button>
              )}
            </div>
          ) : (
            // Edit mode
            <>
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length > 0) {
                      setNameInput(value.charAt(0).toUpperCase() + value.slice(1));
                    } else {
                      setNameInput(value);
                    }
                  }}
                  placeholder="Your name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    fontSize: '16px',
                    background: '#2a2a2a'
                  }}
                />
              </div>
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>Username</label>
                <input
                  type="text"
                  name="username"
                  id="username-input"
                  value={newDisplayName}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                    setNewDisplayName(filtered);
                  }}
                  placeholder="Your username"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  inputMode="text"
                  data-form-type="other"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    fontSize: '16px',
                    background: '#2a2a2a'
                  }}
                />
                {usernameError && (
                  <p style={{color: '#ff4444', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: 0}}>
                    {usernameError}
                  </p>
                )}
              </div>
              <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row', marginBottom: '1rem'}}>
                <button
                  className="btn-primary"
                  onClick={async () => {
                    // Save both name and username sequentially
                    // First validate username if it changed
                    const trimmedUsername = newDisplayName.trim();
                    const usernameChanged = user?.displayName !== trimmedUsername;

                    if (usernameChanged) {
                      if (trimmedUsername === '') {
                        alert('Please enter a username.');
                        return;
                      }
                      if (!/^[a-zA-Z0-9]+$/.test(trimmedUsername)) {
                        alert('Username can only contain letters and numbers.');
                        return;
                      }
                      
                      try {
                        const available = await isUsernameAvailable(trimmedUsername);
                        if (!available) {
                          setUsernameError('Username is already taken');
                          return; // Stop here, don't save name either
                        }
                      } catch (error) {
                        console.error('Error checking username:', error);
                        return;
                      }
                    }

                    // If we get here, username is valid or hasn't changed
                    // Update profile name first
                    await handleUpdateProfile();
                    
                    // Then update username if changed
                    if (usernameChanged) {
                      await handleUpdateDisplayName();
                    } else {
                      // If only name changed, we still want to close dialog and show success
                      setShowEditNameDialog(false);
                      setUsernameError(null);
                      setSuccessMessageType('username');
                      setShowSuccessMessage(true);
                      setTimeout(() => setShowSuccessMessage(false), 3000);
                    }
                  }}
                  style={{flex: 1, height: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0}}
                >
                  Save
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditNameDialog(false);
                    setUsernameError(null);
                    setNameInput(state.name || '');
                    setNewDisplayName(user?.displayName || '');
                  }}
                  style={{flex: 1, height: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0}}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {showSuccessMessage && !showEditNameDialog && successMessageType === 'username' && (
            <p style={{marginTop: '0.75rem', color: '#4CAF50', fontSize: '0.9rem', fontWeight: '500', margin: '0.75rem 0 0 0'}}>
              {t('username_updated')}
            </p>
          )}
        </div>

        <div>
          <label style={{display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem'}}>{t('profile_picture')}</label>
          <ProfilePictureEditor
            currentPhotoURL={user?.photoURL || undefined}
            onSave={(photoURL) => updateProfile({ photoURL })}
            compact={true}
          />
        </div>

        <div style={{marginTop: '1.5rem'}}>
          <label style={{fontSize: '0.9rem', margin: 0, marginBottom: '0.75rem', display: 'block'}}>Personal Information</label>

          {!showEditProfile ? (
            // Display mode
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start',
              marginBottom: '1rem',
              flexWrap: isMobile ? 'wrap' : 'nowrap'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '0.75rem',
                flex: 1
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--surface-color)',
                  borderRadius: '6px',
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid #252525',
                  boxSizing: 'border-box'
                }}>
                  <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem'}}>{t('weight')}</span>
                  <span style={{fontSize: '0.95rem'}}>{state.weight ? `${Math.round(convertWeight(state.weight, 'kg', currentUnit) * 10) / 10} ${currentUnit}` : 'Not set'}</span>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--surface-color)',
                  borderRadius: '6px',
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid #252525',
                  boxSizing: 'border-box'
                }}>
                  <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem'}}>{t('age')}</span>
                  <span style={{fontSize: '0.95rem'}}>{state.age ? `${state.age} years` : 'Not set'}</span>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--surface-color)',
                  borderRadius: '6px',
                  height: '60px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid #252525',
                  boxSizing: 'border-box'
                }}>
                  <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem'}}>{t('gender')}</span>
                  <span style={{fontSize: '0.95rem'}}>
                    {state.gender ? t(state.gender) : 'Not set'}
                  </span>
                </div>
              </div>
              {!showEditProfile && (
                <button
                  className="btn-secondary"
                  onClick={() => setShowEditProfile(true)}
                  style={{
                    height: '60px',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <Edit size={14} />
                  {!isMobile && 'Edit Info'}
                </button>
              )}
            </div>
          ) : null}

          {showSuccessMessage && !showEditProfile && successMessageType === 'profile' && (
            <p style={{marginTop: '0.75rem', color: '#4CAF50', fontSize: '0.9rem', fontWeight: '500', margin: '0.75rem 0 0 0'}}>
              {t('profile_updated')}
            </p>
          )}

          {showEditProfile ? (
            // Edit mode
            <>
              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>{t('weight')} ({currentUnit})</label>
                <input
                  type="number"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder={`Your weight in ${currentUnit}`}
                  min="0"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    fontSize: '16px',
                    background: '#2a2a2a'
                  }}
                />
              </div>

              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>{t('age')}</label>
                <input
                  type="number"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  placeholder="Your age"
                  min="0"
                  max="150"
                  step="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    fontSize: '16px',
                    background: '#2a2a2a'
                  }}
                />
              </div>

              <div style={{marginBottom: '1rem'}}>
                <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>{t('gender')}</label>
                <select
                  value={genderInput}
                  onChange={(e) => setGenderInput(e.target.value as 'male' | 'female' | 'other' | '')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    minHeight: '44px',
                    boxSizing: 'border-box',
                    fontSize: '16px',
                    background: '#2a2a2a',
                    color: '#fff',
                    border: '1px solid #252525',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">{t('select_day')}</option>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>

              <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
                <button
                  className="btn-primary"
                  onClick={handleUpdateProfile}
                  style={{flex: 1, height: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0}}
                >
                  Save
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditProfile(false);
                    setWeightInput(state.weight || '');
                    setAgeInput(state.age || '');
                    setGenderInput(state.gender || '');
                  }}
                  style={{flex: 1, height: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0}}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>


      <div className="card" style={{marginBottom: '1rem'}}>
        <h2 style={{marginTop: '0', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600'}}>Preferences</h2>

        <div style={{marginBottom: '1.5rem'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>{t('weight_unit')}</label>
          <div style={{display: 'flex', gap: '0.5rem'}}>
            <button
              onClick={() => setUnitPreference('kg')}
              style={{
                flex: 1,
                padding: '0.75rem',
                minHeight: '44px',
                border: currentUnit === 'kg' ? '2px solid var(--primary-color)' : '1px solid #252525',
                background: currentUnit === 'kg' ? 'rgba(200, 149, 107, 0.1)' : 'var(--surface-color)',
                color: currentUnit === 'kg' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: currentUnit === 'kg' ? '600' : '500',
                transition: 'all 0.2s'
              }}
            >
              {t('kilograms')}
            </button>
            <button
              onClick={() => setUnitPreference('lbs')}
              style={{
                flex: 1,
                padding: '0.75rem',
                minHeight: '44px',
                border: currentUnit === 'lbs' ? '2px solid var(--primary-color)' : '1px solid #252525',
                background: currentUnit === 'lbs' ? 'rgba(200, 149, 107, 0.1)' : 'var(--surface-color)',
                color: currentUnit === 'lbs' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: currentUnit === 'lbs' ? '600' : '500',
                transition: 'all 0.2s'
              }}
            >
              {t('pounds')}
            </button>
          </div>
        </div>

        <div style={{marginBottom: '1.5rem'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>{t('language')}</label>
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {/* Slider container */}
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative'}}>
              <button
                onClick={() => {
                  const currentIndex = ['en', 'es', 'fr', 'it'].indexOf(language);
                  const nextIndex = currentIndex === 0 ? 3 : currentIndex - 1;
                  setLanguage(['en', 'es', 'fr', 'it'][nextIndex] as any);
                }}
                style={{
                  padding: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ‹
              </button>

              {/* Slide content */}
              <div style={{
                flex: 1,
                padding: '1.5rem',
                background: 'var(--surface-color)',
                borderRadius: '8px',
                border: '1px solid var(--primary-color)',
                textAlign: 'center',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)'}}>
                  {language === 'en' && t('english')}
                  {language === 'es' && t('spanish')}
                  {language === 'fr' && t('french')}
                  {language === 'it' && t('italian')}
                </span>
              </div>

              <button
                onClick={() => {
                  const currentIndex = ['en', 'es', 'fr', 'it'].indexOf(language);
                  const nextIndex = currentIndex === 3 ? 0 : currentIndex + 1;
                  setLanguage(['en', 'es', 'fr', 'it'][nextIndex] as any);
                }}
                style={{
                  padding: '0.5rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ›
              </button>
            </div>

            {/* Indicator dots */}
            <div style={{display: 'flex', gap: isMobile ? '0.2rem' : '0.5rem', justifyContent: 'center'}}>
              {['en', 'es', 'fr', 'it'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang as any)}
                  style={{
                    width: isMobile ? '6px' : '10px',
                    height: isMobile ? '6px' : '10px',
                    borderRadius: '50%',
                    border: 'none',
                    background: language === lang ? 'var(--primary-color)' : '#555',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={handleEditRoutine} style={{width: '100%', minHeight: '44px', padding: '0.75rem', fontSize: isMobile ? '0.9rem' : '1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
          <Edit style={{width: '18px', height: '18px', flexShrink: 0}}/>
          {t('edit_routine')}
        </button>
      </div>

      {/* Privacy Settings Section */}
      <div className="card" style={{marginBottom: '1rem'}}>
        <h2 style={{marginTop: '0', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600'}}>{t('privacy_settings')}</h2>
        
        <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.5'}}>
          {t('privacy_description')}
        </p>

        {/* Share Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          background: 'var(--surface-color)',
          borderRadius: '8px',
          marginBottom: '0.75rem',
          border: '1px solid #252525'
        }}>
          <div style={{flex: 1, paddingRight: '1rem'}}>
            <div style={{fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.25rem'}}>
              {t('share_profile')}
            </div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
              Allow other users to find and view your profile
            </div>
          </div>
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '50px',
            height: '28px',
            flexShrink: 0
          }}>
            <input
              type="checkbox"
              checked={state.shareProfile ?? true}
              onChange={(e) => setShareProfile(e.target.checked)}
              style={{opacity: 0, width: 0, height: 0}}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: state.shareProfile ?? true ? 'var(--primary-color)' : '#555',
              transition: '0.3s',
              borderRadius: '28px'
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '20px',
                width: '20px',
                left: state.shareProfile ?? true ? '26px' : '4px',
                bottom: '4px',
                background: 'white',
                transition: '0.3s',
                borderRadius: '50%'
              }} />
            </span>
          </label>
        </div>

        {/* Share Stats */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          background: 'var(--surface-color)',
          borderRadius: '8px',
          marginBottom: '0.75rem',
          border: '1px solid #252525',
          opacity: state.shareProfile ?? true ? 1 : 0.5
        }}>
          <div style={{flex: 1, paddingRight: '1rem'}}>
            <div style={{fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.25rem'}}>
              {t('share_stats')}
            </div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
              Share workout statistics and routine
            </div>
          </div>
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '50px',
            height: '28px',
            flexShrink: 0
          }}>
            <input
              type="checkbox"
              checked={state.shareStats ?? true}
              onChange={(e) => setShareStats(e.target.checked)}
              disabled={!(state.shareProfile ?? true)}
              style={{opacity: 0, width: 0, height: 0}}
            />
            <span style={{
              position: 'absolute',
              cursor: state.shareProfile ?? true ? 'pointer' : 'not-allowed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: state.shareStats ?? true ? 'var(--primary-color)' : '#555',
              transition: '0.3s',
              borderRadius: '28px'
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '20px',
                width: '20px',
                left: state.shareStats ?? true ? '26px' : '4px',
                bottom: '4px',
                background: 'white',
                transition: '0.3s',
                borderRadius: '50%'
              }} />
            </span>
          </label>
        </div>

        {/* Share Personal Records */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          background: 'var(--surface-color)',
          borderRadius: '8px',
          marginBottom: '0.75rem',
          border: '1px solid #252525',
          opacity: state.shareProfile ?? true ? 1 : 0.5
        }}>
          <div style={{flex: 1, paddingRight: '1rem'}}>
            <div style={{fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.25rem'}}>
              {t('share_personal_records')}
            </div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
              Share your personal records with others
            </div>
          </div>
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '50px',
            height: '28px',
            flexShrink: 0
          }}>
            <input
              type="checkbox"
              checked={state.sharePersonalRecords ?? true}
              onChange={(e) => setSharePersonalRecords(e.target.checked)}
              disabled={!(state.shareProfile ?? true)}
              style={{opacity: 0, width: 0, height: 0}}
            />
            <span style={{
              position: 'absolute',
              cursor: state.shareProfile ?? true ? 'pointer' : 'not-allowed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: state.sharePersonalRecords ?? true ? 'var(--primary-color)' : '#555',
              transition: '0.3s',
              borderRadius: '28px'
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '20px',
                width: '20px',
                left: state.sharePersonalRecords ?? true ? '26px' : '4px',
                bottom: '4px',
                background: 'white',
                transition: '0.3s',
                borderRadius: '50%'
              }} />
            </span>
          </label>
        </div>

        {/* Share Personal Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          background: 'var(--surface-color)',
          borderRadius: '8px',
          border: '1px solid #252525',
          opacity: state.shareProfile ?? true ? 1 : 0.5
        }}>
          <div style={{flex: 1, paddingRight: '1rem'}}>
            <div style={{fontSize: '0.95rem', fontWeight: '500', marginBottom: '0.25rem'}}>
              {t('share_personal_info')}
            </div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
              Share age, gender, and weight
            </div>
          </div>
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '50px',
            height: '28px',
            flexShrink: 0
          }}>
            <input
              type="checkbox"
              checked={state.sharePersonalInfo ?? false}
              onChange={(e) => setSharePersonalInfo(e.target.checked)}
              disabled={!(state.shareProfile ?? true)}
              style={{opacity: 0, width: 0, height: 0}}
            />
            <span style={{
              position: 'absolute',
              cursor: state.shareProfile ?? true ? 'pointer' : 'not-allowed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: state.sharePersonalInfo ?? false ? 'var(--primary-color)' : '#555',
              transition: '0.3s',
              borderRadius: '28px'
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '20px',
                width: '20px',
                left: state.sharePersonalInfo ?? false ? '26px' : '4px',
                bottom: '4px',
                background: 'white',
                transition: '0.3s',
                borderRadius: '50%'
              }} />
            </span>
          </label>
        </div>
      </div>

      {/* PWA Access Key Section */}
      <div className="card" style={{marginBottom: '1rem'}}>
        <h2 style={{marginTop: '0', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600'}}>{t('pwa_access_key')}</h2>

        <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.5'}}>
          {t('pwa_access_key_description')}
        </p>

        {!showAccessKeyWarning ? (
          <button
            onClick={() => setShowAccessKeyWarning(true)}
            className="btn-secondary"
            style={{width: '100%', minHeight: '44px', padding: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
          >
            {t('show_access_key')}
          </button>
        ) : (
          <>
            {/* Security Warning */}
            <div style={{marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 152, 0, 0.1)', borderRadius: '6px', border: '1px solid #FF9800'}}>
              <p style={{color: '#FF9800', fontSize: '0.9rem', fontWeight: '600', marginTop: 0, marginBottom: '0.5rem'}}>
                {t('security_warning')}
              </p>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: '1.5'}}>
                {t('security_warning_message')}
              </p>
            </div>

            {/* Access Key Display */}
            {loadingKey ? (
              <div style={{
                padding: '1rem',
                background: 'var(--surface-color)',
                borderRadius: '6px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                marginBottom: '1rem'
              }}>
                Loading key...
              </div>
            ) : (
              <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row', marginBottom: '1rem'}}>
                <div style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'var(--surface-color)',
                  borderRadius: '6px',
                  border: '2px solid var(--primary-color)',
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: '600',
                  letterSpacing: '0.05em',
                  color: 'var(--primary-color)',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '44px',
                  wordBreak: 'break-all'
                }}>
                  {accessKey || 'Error loading key'}
                </div>
                <button
                  onClick={copyAccessKey}
                  className="btn-secondary"
                  style={{
                    minHeight: '44px',
                    padding: '0.75rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap',
                    background: keyCopied ? '#4CAF50' : undefined,
                    borderColor: keyCopied ? '#4CAF50' : undefined
                  }}
                >
                  {keyCopied ? t('copied_button') : t('copy_button')}
                </button>
              </div>
            )}

            {/* Hide Button */}
            <button
              onClick={() => setShowAccessKeyWarning(false)}
              className="btn-secondary"
              style={{width: '100%', minHeight: '44px', padding: '0.75rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
            >
              {t('hide_access_key')}
            </button>
          </>
        )}
      </div>

      <div className="card" style={{marginTop: '2rem'}}>
        <h3 style={{color: '#f44336', marginBottom: '1.5rem'}}>{t('danger_zone')}</h3>

        {/* Logout Section */}
        <button
          className="btn-secondary"
          onClick={handleLogout}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}
        >
          <LogOut style={{verticalAlign: 'middle'}}/>
          {t('logout')}
        </button>

        {/* Clear History Section */}
        <button
          className="btn-danger"
          onClick={() => setShowClearHistoryDialog(!showClearHistoryDialog)}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1.5rem'}}
        >
          <Trash2 style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          Clear Workout History
        </button>

        {showClearHistoryDialog && (
          <div style={{marginTop: '0', marginBottom: '1.5rem', padding: isMobile ? '0.75rem' : '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4'}}>
              This will permanently delete all your workout records, but your routine settings will be preserved.
            </p>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>
              {t('type_confirm_reset')}
            </label>
            <input
              type="text"
              value={clearHistoryConfirmText}
              onChange={(e) => setClearHistoryConfirmText(e.target.value)}
              placeholder="Type confirm"
              spellCheck={false}
              style={{width: '100%', marginBottom: '1rem', padding: '0.75rem', minHeight: '44px', boxSizing: 'border-box', fontSize: '16px'}}
            />
            <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
              <button
                className="btn-danger"
                onClick={handleClearHistory}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                Clear History
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowClearHistoryDialog(false);
                  setClearHistoryConfirmText('');
                }}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Reset Data Section */}
        <button
          className="btn-danger"
          onClick={() => setShowResetDialog(!showResetDialog)}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1.5rem'}}
        >
          <Trash2 style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          {t('reset_all_data')}
        </button>

        {showResetDialog && (
          <div style={{marginTop: '0', marginBottom: '1.5rem', padding: isMobile ? '0.75rem' : '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4'}}>
              {t('reset_warning')}
            </p>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>
              {t('type_confirm_reset')}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type confirm"
              spellCheck={false}
              style={{width: '100%', marginBottom: '1rem', padding: '0.75rem', minHeight: '44px', boxSizing: 'border-box', fontSize: '16px'}}
            />
            <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
              <button
                className="btn-danger"
                onClick={handleResetData}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                {t('confirm_reset')}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowResetDialog(false);
                  setConfirmText('');
                }}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Delete Account Section */}
        <button
          className="btn-danger"
          onClick={() => setShowDeleteDialog(!showDeleteDialog)}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1rem'}}
        >
          <Trash2 style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          {t('delete_account')}
        </button>

        {showDeleteDialog && (
          <div style={{marginTop: '1rem', padding: isMobile ? '0.75rem' : '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4'}}>
              {t('delete_warning')}
            </p>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>
              {t('type_confirm_delete')}
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type confirm"
              spellCheck={false}
              style={{width: '100%', marginBottom: '1rem', padding: '0.75rem', minHeight: '44px', boxSizing: 'border-box', fontSize: '16px'}}
            />
            <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                {t('delete_account')}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
