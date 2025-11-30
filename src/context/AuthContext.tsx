import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, deleteUser, getRedirectResult } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  processingRedirect: boolean;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingRedirect, setProcessingRedirect] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    // Handle redirect result FIRST, then set up auth state listener
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log('[AuthContext] Redirect sign-in successful:', result.user.uid);
        }
      })
      .catch((error) => {
        console.error('[AuthContext] Error handling redirect:', error);
      })
      .finally(() => {
        console.log('[AuthContext] Redirect processing complete');
        setProcessingRedirect(false);
        
        // NOW set up the auth state listener
        unsubscribe = onAuthStateChanged(auth, (user) => {
          console.log('[AuthContext] Auth state changed:', user?.uid || 'null');
          setUser(user);
          setLoading(false);
        });
      });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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

  return (
    <AuthContext.Provider value={{ user, loading, processingRedirect, signOut, deleteAccount }}>
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
