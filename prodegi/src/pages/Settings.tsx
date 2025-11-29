import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit, Trash2 } from 'lucide-react';

const Settings: React.FC = () => {
  const { clearData } = useStore();
  const { signOut, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

  return (
    <div>
      <h1>Settings</h1>

      <div className="card">
        <button className="btn-primary" onClick={handleEditRoutine} style={{marginBottom: '1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)'}}>
          <Edit style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          Edit Routine
        </button>

        <button className="btn-primary" onClick={handleLogout} style={{width: '100%', padding: '0.75rem', fontSize: '1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)'}}>
          <LogOut style={{verticalAlign: 'middle', marginRight: '8px'}}/>
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
          <div style={{marginTop: '0', marginBottom: '1rem', padding: '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem'}}>
              This will permanently delete all your workout data, routine, and history. This action cannot be undone.
            </p>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>
              Type "confirm" to reset your data:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type confirm"
              style={{width: '100%', marginBottom: '1rem', padding: '0.75rem'}}
            />
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button
                className="btn-danger"
                onClick={handleResetData}
                style={{flex: 1, padding: '0.75rem'}}
              >
                Confirm Reset
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowResetDialog(false);
                  setConfirmText('');
                }}
                style={{flex: 1, padding: '0.75rem'}}
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
          <div style={{marginTop: '1rem', padding: '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '4px', border: '1px solid #f44336'}}>
            <p style={{color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem'}}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem'}}>
              Type "confirm" to delete your account:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type confirm"
              style={{width: '100%', marginBottom: '1rem', padding: '0.75rem'}}
            />
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                style={{flex: 1, padding: '0.75rem'}}
              >
                Delete Account
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                style={{flex: 1, padding: '0.75rem'}}
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
