import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, deleteUser, updateProfile } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import logger from '../utils/logger';

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
      logger.log('[AuthContext] Auth state changed:', user?.uid || 'null');
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('prodegi_data');
    } catch (error) {
      logger.error('Error signing out:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // Delete all user data from Firestore
      const { db } = await import('../config/firebase');
      const { doc, deleteDoc, getDoc } = await import('firebase/firestore');
      
      console.log('[AuthContext] Starting account deletion for user:', user.uid);
      
      // 1. Get the public profile to find the username
      const publicProfileRef = doc(db, 'publicProfiles', user.uid);
      const publicProfileSnap = await getDoc(publicProfileRef);
      
      if (publicProfileSnap.exists()) {
        const username = publicProfileSnap.data().username;
        
        // Delete username reservation
        if (username) {
          console.log('[AuthContext] Deleting username reservation:', username);
          const usernameRef = doc(db, 'usernames', username.toLowerCase());
          await deleteDoc(usernameRef);
        }
        
        // Delete public profile
        console.log('[AuthContext] Deleting public profile');
        await deleteDoc(publicProfileRef);
      }
      
      // 2. Delete user data (routine, history, personal records, etc.)
      console.log('[AuthContext] Deleting user data');
      const userDataRef = doc(db, 'users', user.uid);
      await deleteDoc(userDataRef);
      
      // 3. Clear local storage
      console.log('[AuthContext] Clearing local storage');
      localStorage.removeItem('prodegi_data');
      localStorage.removeItem('activeWorkout');
      
      // 4. Finally, delete the Firebase Auth account
      console.log('[AuthContext] Deleting Firebase Auth account');
      await deleteUser(user);
      
      console.log('[AuthContext] Account deletion completed successfully');
    } catch (error) {
      logger.error('Error deleting account:', error);
      throw error;
    }
  };

  const handleUpdateProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      // Filter out empty strings from updates
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([, value]) => value !== '')
      );

      await updateProfile(currentUser, cleanedUpdates);
      // Refresh user state by getting the updated auth.currentUser
      // This ensures we have the latest data from Firebase
      const refreshedUser = auth.currentUser;
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } catch (error) {
      logger.error('Error updating profile:', error);
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
