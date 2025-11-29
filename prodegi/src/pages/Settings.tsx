import React from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit } from 'lucide-react';

const Settings: React.FC = () => {
  const { clearData } = useStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout? This will clear all data.')) {
      clearData();
      await signOut();
      navigate('/login');
    }
  };

  const handleEditRoutine = () => {
    navigate('/onboarding?edit=true');
  };

  return (
    <div>
      <h1>Settings</h1>
      <div className="card">
        <button className="btn-primary" onClick={handleEditRoutine} style={{marginBottom: '1rem', backgroundColor: 'var(--surface-color)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)'}}>
          <Edit style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          Edit Routine
        </button>
        
        <button className="btn-danger" onClick={handleLogout} style={{width: '100%', padding: '0.75rem', fontSize: '1rem'}}>
          <LogOut style={{verticalAlign: 'middle', marginRight: '8px'}}/>
          Logout / Reset Data
        </button>
      </div>
    </div>
  );
};

export default Settings;
