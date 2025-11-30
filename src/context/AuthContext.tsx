import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, deleteUser, updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AuthContext] Auth state changed:', user?.uid || 'null');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');
      await deleteUser(user);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const handleUpdateProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      await updateProfile(currentUser, updates);
      // Refresh user state to reflect changes
      setUser({ ...currentUser, ...updates } as User);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, deleteAccount, updateProfile: handleUpdateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
