import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit, Trash2 } from 'lucide-react';
import ProfilePictureEditor from '../components/ProfilePictureEditor';

const Settings: React.FC = () => {
  const { clearData, clearHistory, state, setUnitPreference } = useStore();
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
  const currentUnit = state.unitPreference || 'kg';

  useEffect(() => {
    setNewDisplayName(user?.displayName || '');
  }, [user?.displayName]);

  useEffect(() => {
    return () => {
      setShowSuccessMessage(false);
    };
  }, []);

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
        alert('Error al borrar la cuenta. Por favor, intenta cerrar sesión y volver a iniciar para borrar tu cuenta.');
      }
    } else {
      alert('Please type "confirm" to delete your account.');
    }
  };

  const handleUpdateDisplayName = async () => {
    if (newDisplayName.trim() === '') {
      alert('Please enter a name.');
      return;
    }
    if (!/^[a-zA-Z]+$/.test(newDisplayName.trim())) {
      alert('Name can only contain letters (A-Z). No spaces or special characters allowed.');
      return;
    }
    try {
      await updateProfile({ displayName: newDisplayName.trim() });
      setShowEditNameDialog(false);
      setShowSuccessMessage(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      alert('Failed to update username.');
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;

  return (
    <div>
      <h1>{t('settings')}</h1>

      <div className="card" style={{marginBottom: '1rem'}}>
        <h2 style={{marginTop: '0', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600'}}>Profile</h2>

        <div style={{marginBottom: '1.5rem'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>{t('username')}</label>

          {!showEditNameDialog ? (
            // Display mode
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'stretch',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <span style={{
                flex: 1,
                padding: '0.75rem',
                background: 'var(--surface-color)',
                borderRadius: '6px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1rem',
                border: '1px solid #252525'
              }}>
                {user?.displayName || 'Not set'}
              </span>
              <button
                className="btn-secondary"
                onClick={() => setShowEditNameDialog(true)}
                style={{
                  minHeight: '44px',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Edit size={18} />
                {isMobile && <span>Edit Username</span>}
              </button>
            </div>
          ) : (
            // Edit mode
            <>
              <input
                type="text"
                name="username"
                id="username-input"
                value={newDisplayName}
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^a-zA-Z]/g, '');
                  setNewDisplayName(filtered);
                }}
                placeholder="Your username"
                spellCheck={false}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                inputMode="text"
                data-form-type="other"
                style={{
                  width: '100%',
                  marginBottom: '0.75rem',
                  padding: '0.75rem',
                  minHeight: '44px',
                  boxSizing: 'border-box',
                  fontSize: '16px',
                  background: '#2a2a2a'
                }}
              />
              <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
                <button
                  className="btn-primary"
                  onClick={handleUpdateDisplayName}
                  style={{flex: 1, height: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0}}
                >
                  Save
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setShowEditNameDialog(false);
                    setNewDisplayName(user?.displayName || '');
                  }}
                  style={{flex: 1, height: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: 0}}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {showSuccessMessage && !showEditNameDialog && (
            <p style={{marginTop: '0.75rem', color: '#4CAF50', fontSize: '0.9rem', fontWeight: '500', margin: '0.75rem 0 0 0'}}>
              ✓ Username updated successfully
            </p>
          )}
        </div>

        <div>
          <label style={{display: 'block', marginBottom: '0.75rem', fontSize: '0.9rem'}}>Profile Picture</label>
          <ProfilePictureEditor
            currentPhotoURL={user?.photoURL || undefined}
            onSave={(photoURL) => updateProfile({ photoURL })}
            compact={true}
          />
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
          <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
            <button
              onClick={() => setLanguage('en')}
              style={{
                flex: 1,
                padding: '0.75rem',
                minHeight: '44px',
                border: language === 'en' ? '2px solid var(--primary-color)' : '1px solid #252525',
                background: language === 'en' ? 'rgba(200, 149, 107, 0.1)' : 'var(--surface-color)',
                color: language === 'en' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: language === 'en' ? '600' : '500',
                transition: 'all 0.2s',
                fontSize: '0.9rem'
              }}
            >
              {t('english')}
            </button>
            <button
              onClick={() => setLanguage('es')}
              style={{
                flex: 1,
                padding: '0.75rem',
                minHeight: '44px',
                border: language === 'es' ? '2px solid var(--primary-color)' : '1px solid #252525',
                background: language === 'es' ? 'rgba(200, 149, 107, 0.1)' : 'var(--surface-color)',
                color: language === 'es' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: language === 'es' ? '600' : '500',
                transition: 'all 0.2s',
                fontSize: '0.9rem'
              }}
            >
              {t('spanish')}
            </button>
            <button
              onClick={() => setLanguage('fr')}
              style={{
                flex: 1,
                padding: '0.75rem',
                minHeight: '44px',
                border: language === 'fr' ? '2px solid var(--primary-color)' : '1px solid #252525',
                background: language === 'fr' ? 'rgba(200, 149, 107, 0.1)' : 'var(--surface-color)',
                color: language === 'fr' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: language === 'fr' ? '600' : '500',
                transition: 'all 0.2s',
                fontSize: '0.9rem'
              }}
            >
              {t('french')}
            </button>
            <button
              onClick={() => setLanguage('it')}
              style={{
                flex: 1,
                padding: '0.75rem',
                minHeight: '44px',
                border: language === 'it' ? '2px solid var(--primary-color)' : '1px solid #252525',
                background: language === 'it' ? 'rgba(200, 149, 107, 0.1)' : 'var(--surface-color)',
                color: language === 'it' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: language === 'it' ? '600' : '500',
                transition: 'all 0.2s',
                fontSize: '0.9rem'
              }}
            >
              {t('italian')}
            </button>
          </div>
        </div>

        <button className="btn-primary" onClick={handleEditRoutine} style={{width: '100%', minHeight: '44px', padding: '0.75rem', fontSize: isMobile ? '0.9rem' : '1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
          <Edit style={{width: '18px', height: '18px', flexShrink: 0}}/>
          {t('edit_routine')}
        </button>
      </div>

      <div className="card" style={{marginTop: '2rem'}}>
        <h3 style={{color: '#f44336', marginBottom: '1rem'}}>{t('danger_zone')}</h3>

        {/* Reset Data Section */}
        <button
          className="btn-danger"
          onClick={() => setShowResetDialog(!showResetDialog)}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1rem'}}
        >
          <Trash2 style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          {t('reset_all_data')}
        </button>

        {showResetDialog && (
          <div style={{marginTop: '0', marginBottom: '1rem', padding: isMobile ? '0.75rem' : '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
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

        {/* Clear History Section */}
        <button
          className="btn-danger"
          onClick={() => setShowClearHistoryDialog(!showClearHistoryDialog)}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1rem', marginTop: '1rem'}}
        >
          <Trash2 style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          Clear Workout History
        </button>

        {showClearHistoryDialog && (
          <div style={{marginTop: '0', marginBottom: '1rem', padding: isMobile ? '0.75rem' : '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
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

        {/* Logout Section */}
        <button
          className="btn-danger"
          onClick={handleLogout}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1rem', marginTop: '1rem', backgroundColor: '#ff9800', border: 'none'}}
        >
          <LogOut style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          {t('logout')}
        </button>

        {/* Delete Account Section */}
        <button
          className="btn-danger"
          onClick={() => setShowDeleteDialog(!showDeleteDialog)}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem'}}
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
