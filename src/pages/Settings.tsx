import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit, Trash2 } from 'lucide-react';

const Settings: React.FC = () => {
  const { clearData } = useStore();
  const { signOut, deleteAccount, user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
    } catch (error) {
      alert('Failed to update display name.');
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;

  return (
    <div>
      <h1>Settings</h1>

      <div className="card" style={{marginBottom: '1rem'}}>
        <div style={{marginBottom: '1rem'}}>
          <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Display Name</label>
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
              {isMobile && <span>Edit Name</span>}
            </button>
          </div>
          {showSuccessMessage && (
            <p style={{marginTop: '0.75rem', color: '#4CAF50', fontSize: '0.9rem', fontWeight: '500', margin: '0.75rem 0 0 0'}}>
              ✓ Display name updated successfully
            </p>
          )}
        </div>

        {showEditNameDialog && (
          <div style={{marginTop: '1rem', padding: isMobile ? '0.75rem' : '1rem', background: 'rgba(200, 149, 107, 0.1)', borderRadius: '4px', border: '1px solid var(--primary-color)'}}>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>Enter your first name:</label>
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => {
                const filtered = e.target.value.replace(/[^a-zA-Z]/g, '');
                setNewDisplayName(filtered);
              }}
              placeholder="Your first name"
              spellCheck="false"
              style={{width: '100%', marginBottom: '1rem', padding: '0.75rem', minHeight: '44px', boxSizing: 'border-box', fontSize: '16px'}}
            />
            <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
              <button
                className="btn-primary"
                onClick={handleUpdateDisplayName}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                Save
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowEditNameDialog(false);
                  setNewDisplayName(user?.displayName || '');
                }}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <button className="btn-primary" onClick={handleEditRoutine} style={{marginBottom: '1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minHeight: '44px', width: '100%', padding: '0.75rem', fontSize: isMobile ? '0.9rem' : '1rem', flexWrap: 'wrap'}}>
          <Edit style={{width: '18px', height: '18px', flexShrink: 0}}/>
          Edit Routine
        </button>

        <button className="btn-primary" onClick={handleLogout} style={{width: '100%', minHeight: '44px', padding: '0.75rem', fontSize: isMobile ? '0.9rem' : '1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
          <LogOut style={{width: '18px', height: '18px', flexShrink: 0}}/>
          Logout
        </button>
      </div>

      <div className="card" style={{marginTop: '2rem'}}>
        <h3 style={{color: '#f44336', marginBottom: '1rem'}}>Danger Zone</h3>

        {/* Reset Data Section */}
        <button
          className="btn-danger"
          onClick={() => setShowResetDialog(!showResetDialog)}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '1rem'}}
        >
          <Trash2 style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          Reset All Data
        </button>

        {showResetDialog && (
          <div style={{marginTop: '0', marginBottom: '1rem', padding: isMobile ? '0.75rem' : '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4'}}>
              This will permanently delete all your workout data, routine, and history. This action cannot be undone.
            </p>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>
              Type "confirm" to reset your data:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type confirm"
              spellCheck="false"
              style={{width: '100%', marginBottom: '1rem', padding: '0.75rem', minHeight: '44px', boxSizing: 'border-box', fontSize: '16px'}}
            />
            <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
              <button
                className="btn-danger"
                onClick={handleResetData}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                Confirm Reset
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowResetDialog(false);
                  setConfirmText('');
                }}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Delete Account Section */}
        <button
          className="btn-danger"
          onClick={() => setShowDeleteDialog(!showDeleteDialog)}
          style={{width: '100%', padding: '0.75rem', fontSize: '1rem'}}
        >
          <Trash2 style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          Delete Account
        </button>

        {showDeleteDialog && (
          <div style={{marginTop: '1rem', padding: isMobile ? '0.75rem' : '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4'}}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem'}}>
              Type "confirm" to delete your account:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type confirm"
              spellCheck="false"
              style={{width: '100%', marginBottom: '1rem', padding: '0.75rem', minHeight: '44px', boxSizing: 'border-box', fontSize: '16px'}}
            />
            <div style={{display: 'flex', gap: '0.5rem', flexDirection: isMobile ? 'column' : 'row'}}>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                Delete Account
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                style={{flex: 1, padding: '0.75rem', minHeight: '44px'}}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
