import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { UserState, RoutineDay, WorkoutSession, ExerciseResult, PersonalRecord } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updatePublicProfile } from '../utils/publicProfile';

// Initial State
const initialState: UserState = {
  routine: [],
  history: [],
  personalRecords: [],
};

// Actions
type Action =
  | { type: 'SET_ROUTINE'; payload: RoutineDay[] }
  | { type: 'ADD_SESSION'; payload: WorkoutSession }
  | { type: 'EDIT_SESSION'; payload: WorkoutSession }
  | { type: 'CLEAR_DATA' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'LOAD_DATA'; payload: UserState }
  | { type: 'SET_UNIT_PREFERENCE'; payload: 'kg' | 'lbs' }
  | { type: 'SET_USERNAME'; payload: string | undefined }
  | { type: 'SET_NAME'; payload: string | undefined }
  | { type: 'SET_WEIGHT'; payload: number | undefined }
  | { type: 'SET_AGE'; payload: number | undefined }
  | { type: 'SET_GENDER'; payload: 'male' | 'female' | 'other' | undefined }
  | { type: 'ADD_PERSONAL_RECORD'; payload: PersonalRecord }
  | { type: 'ADD_PR_ENTRY'; payload: { prId: string; entry: any } }
  | { type: 'EDIT_PR_ENTRY'; payload: { prId: string; entry: any } }
  | { type: 'DELETE_PR_ENTRY'; payload: { prId: string; entryId: string } }
  | { type: 'DELETE_PERSONAL_RECORD'; payload: string }
  | { type: 'SET_SHARE_PROFILE'; payload: boolean }
  | { type: 'SET_SHARE_STATS'; payload: boolean }
  | { type: 'SET_SHARE_PERSONAL_RECORDS'; payload: boolean }
  | { type: 'SET_SHARE_PERSONAL_INFO'; payload: boolean };

// Migration function to handle legacy PR data
function migrateUserState(state: UserState): UserState {
  if (!state.personalRecords) return state;

  const migratedPRs = state.personalRecords
    .map((pr: any) => {
      // If PR already has entries array, it's already migrated
      if (Array.isArray(pr.entries)) {
        return pr;
      }
      // If PR has old structure (with weight, date), convert to new structure
      if (pr.weight && pr.date) {
        return {
          id: pr.id,
          exerciseName: pr.exerciseName,
          entries: [{
            id: pr.id,
            weight: pr.weight,
            date: pr.date
          }]
        };
      }
      // Invalid PR, skip it
      return null;
    })
    .filter((pr: any) => pr !== null && pr.entries && pr.entries.length > 0);

  return { ...state, personalRecords: migratedPRs };
}

// Reducer
function reducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case 'SET_ROUTINE':
      return { ...state, routine: action.payload };
    case 'ADD_SESSION':
      return { ...state, history: [...state.history, action.payload] };
    case 'EDIT_SESSION':
      return {
        ...state,
        history: state.history.map(s => s.id === action.payload.id ? action.payload : s)
      };
    case 'CLEAR_DATA':
      return initialState;
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'LOAD_DATA':
      return action.payload;
    case 'SET_UNIT_PREFERENCE':
      return { ...state, unitPreference: action.payload };
    case 'SET_USERNAME':
      return { ...state, username: action.payload };
    case 'SET_NAME':
      return { ...state, name: action.payload };
    case 'SET_WEIGHT':
      return { ...state, weight: action.payload };
    case 'SET_AGE':
      return { ...state, age: action.payload };
    case 'SET_GENDER':
      return { ...state, gender: action.payload };
    case 'ADD_PERSONAL_RECORD':
      return { ...state, personalRecords: [...(state.personalRecords || []), action.payload] };
    case 'ADD_PR_ENTRY':
      return {
        ...state,
        personalRecords: (state.personalRecords || []).map(pr =>
          pr.id === action.payload.prId
            ? { ...pr, entries: [...pr.entries, action.payload.entry] }
            : pr
        )
      };
    case 'EDIT_PR_ENTRY':
      return {
        ...state,
        personalRecords: (state.personalRecords || []).map(pr =>
          pr.id === action.payload.prId
            ? { ...pr, entries: pr.entries.map(e => e.id === action.payload.entry.id ? action.payload.entry : e) }
            : pr
        )
      };
    case 'DELETE_PR_ENTRY':
      return {
        ...state,
        personalRecords: (state.personalRecords || []).map(pr =>
          pr.id === action.payload.prId
            ? { ...pr, entries: pr.entries.filter(e => e.id !== action.payload.entryId) }
            : pr
        )
      };
    case 'DELETE_PERSONAL_RECORD':
      return {
        ...state,
        personalRecords: (state.personalRecords || []).filter(pr => pr.id !== action.payload)
      };
    case 'SET_SHARE_PROFILE':
      return { ...state, shareProfile: action.payload };
    case 'SET_SHARE_STATS':
      return { ...state, shareStats: action.payload };
    case 'SET_SHARE_PERSONAL_RECORDS':
      return { ...state, sharePersonalRecords: action.payload };
    case 'SET_SHARE_PERSONAL_INFO':
      return { ...state, sharePersonalInfo: action.payload };
    default:
      return state;
  }
}

// Context
interface StoreContextType {
  state: UserState;
  setRoutine: (routine: RoutineDay[]) => void;
  addSession: (session: WorkoutSession) => void;
  editSession: (session: WorkoutSession) => void;
  clearData: () => void;
  clearHistory: () => void;
  getExerciseHistory: (exerciseId: string) => { result: ExerciseResult; date: string }[];
  setUnitPreference: (unit: 'kg' | 'lbs') => void;
  setUsername: (username: string | undefined) => void;
  setName: (name: string | undefined) => void;
  setWeight: (weight: number | undefined) => void;
  setAge: (age: number | undefined) => void;
  setGender: (gender: 'male' | 'female' | 'other' | undefined) => void;
  addPersonalRecord: (pr: PersonalRecord) => void;
  addPREntry: (prId: string, entry: any) => void;
  editPREntry: (prId: string, entry: any) => void;
  deletePREntry: (prId: string, entryId: string) => void;
  deletePersonalRecord: (prId: string) => void;
  setShareProfile: (share: boolean) => void;
  setShareStats: (share: boolean) => void;
  setSharePersonalRecords: (share: boolean) => void;
  setSharePersonalInfo: (share: boolean) => void;
  isLoaded: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user, loading: authLoading } = useAuth();
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load data on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;
      console.log('[StoreContext] Loading data, user:', user?.uid);
      setIsLoaded(false);

      if (user) {
        // Try to load from Firestore
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as UserState;
            const migratedData = migrateUserState(data);
            console.log('[StoreContext] Loaded from Firestore:', migratedData);
            dispatch({ type: 'LOAD_DATA', payload: migratedData });
          } else {
            console.log('[StoreContext] No Firestore data, checking localStorage');
            // If no data in Firestore, check if we have local data to migrate
            const localData = localStorage.getItem('prodegi_data');
            if (localData) {
                 const parsed = JSON.parse(localData);
                 const migratedData = migrateUserState(parsed);
                 console.log('[StoreContext] Migrating localStorage to Firestore:', migratedData);
                 dispatch({ type: 'LOAD_DATA', payload: migratedData });
            }
          }
          // Only set isLoaded to true if we successfully queried Firestore (found data or confirmed no data)
          setIsLoaded(true);
        } catch (e) {
          console.error("[StoreContext] Error loading from Firestore:", e);
          // Fallback to localStorage if Firestore fails
          const localData = localStorage.getItem('prodegi_data');
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              const migratedData = migrateUserState(parsed);
              console.log('[StoreContext] Firestore failed, loaded from localStorage fallback:', migratedData);
              dispatch({ type: 'LOAD_DATA', payload: migratedData });
            } catch (parseErr) {
              console.error("Failed to parse local data:", parseErr);
              dispatch({ type: 'CLEAR_DATA' });
            }
          } else {
            console.log('[StoreContext] Firestore failed and no localStorage data, resetting to initial');
            dispatch({ type: 'CLEAR_DATA' });
          }
          // Always set loaded to true so we don't get stuck on black screen
          setIsLoaded(true);
        }
      } else {
        // User logged out - clear local state
        console.log('[StoreContext] User logged out, clearing local state');
        localStorage.removeItem('prodegi_data');
        dispatch({ type: 'CLEAR_DATA' });
        setIsLoaded(true);
      }
    };

    loadData();
  }, [user, authLoading]);

  // Save data whenever state changes
  useEffect(() => {
    if (!isLoaded) return;

    // Don't save empty state (when clearing data on logout)
    if (state.routine.length === 0 && state.history.length === 0) {
      console.log('[StoreContext] Not saving empty state (logout in progress)');
      return;
    }

    const saveData = async () => {
      // Always save to localStorage as backup/cache
      localStorage.setItem('prodegi_data', JSON.stringify(state));
      console.log('[StoreContext] Saved to localStorage:', state);

      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);

          // Create a clean copy of state without undefined values
          // Firestore doesn't support undefined values
          // JSON.stringify/parse is a simple way to strip undefined values from nested objects
          const cleanState = JSON.parse(JSON.stringify(state));

          console.log('[StoreContext] Saving to Firestore for user:', user.uid, 'Data:', cleanState);
          await setDoc(docRef, cleanState);
          console.log('[StoreContext] Successfully saved to Firestore');
        } catch (e) {
          console.error("[StoreContext] Error saving to Firestore:", e);
        }
      } else {
        console.log('[StoreContext] Not saving to Firestore (no user logged in)');
      }
    };

    saveData();
  }, [state, user, isLoaded]);

  // Sync public profile when relevant data changes
  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncPublicProfile = async () => {
      try {
        // Get username from user's displayName
        let username = user.displayName || user.email?.split('@')[0] || 'user';

        if (!username) {
          console.log('[StoreContext] No username available, skipping public profile sync');
          return;
        }

        // If user signed in with Google and doesn't have a name set, use their Google display name
        if (user.displayName && !state.name) {
          console.log('[StoreContext] Setting name from Google displayName:', user.displayName);
          dispatch({ type: 'SET_NAME', payload: user.displayName });
        }

        console.log('[StoreContext] Syncing public profile for:', user.uid, 'username:', username);

        // Try to update/create profile
        try {
          await updatePublicProfile(
            user.uid,
            username,
            state,
            user.displayName || undefined,
            user.photoURL || undefined
          );
          console.log('[StoreContext] Public profile created/updated successfully');
        } catch (error: any) {
          // If username is taken (and it's not our own), try appending a random number
          if (error.message === 'Username is already taken') {
            const randomSuffix = Math.floor(Math.random() * 10000).toString();
            username = `${username}${randomSuffix}`;
            console.log('[StoreContext] Username taken, trying:', username);

            await updatePublicProfile(
              user.uid,
              username,
              state,
              user.displayName || undefined,
              user.photoURL || undefined
            );
          } else {
            throw error;
          }
        }
        console.log('[StoreContext] Public profile synced');
      } catch (error) {
        console.error('[StoreContext] Error syncing public profile:', error);
      }
    };

    syncPublicProfile();
  }, [
    state.shareProfile,
    state.shareStats,
    state.sharePersonalRecords,
    state.sharePersonalInfo,
    state.name,
    state.age,
    state.gender,
    state.weight,
    state.history.length,
    state.routine.length,
    user?.uid,
    user?.displayName,
    user?.photoURL,
    isLoaded
  ]);

  const setRoutine = (routine: RoutineDay[]) => dispatch({ type: 'SET_ROUTINE', payload: routine });
  const addSession = (session: WorkoutSession) => dispatch({ type: 'ADD_SESSION', payload: session });
  const editSession = (session: WorkoutSession) => dispatch({ type: 'EDIT_SESSION', payload: session });
  const clearData = () => {
      localStorage.removeItem('prodegi_data');
      dispatch({ type: 'CLEAR_DATA' });
  };

  const clearHistory = () => {
      dispatch({ type: 'CLEAR_HISTORY' });
  };

  const getExerciseHistory = (exerciseId: string) => {
    // Return history with dates
    return state.history
      .map(session => {
        const ex = session.exercises.find(e => e.exerciseId === exerciseId);
        return ex ? { result: ex, date: session.date } : null;
      })
      .filter((item): item is { result: ExerciseResult; date: string } => item !== null);
  };

  const setUnitPreference = (unit: 'kg' | 'lbs') => dispatch({ type: 'SET_UNIT_PREFERENCE', payload: unit });
  const setUsername = (username: string | undefined) => dispatch({ type: 'SET_USERNAME', payload: username });
  const setName = (name: string | undefined) => dispatch({ type: 'SET_NAME', payload: name });
  const setWeight = (weight: number | undefined) => dispatch({ type: 'SET_WEIGHT', payload: weight });
  const setAge = (age: number | undefined) => dispatch({ type: 'SET_AGE', payload: age });
  const setGender = (gender: 'male' | 'female' | 'other' | undefined) => dispatch({ type: 'SET_GENDER', payload: gender });

  const addPersonalRecord = (pr: PersonalRecord) => dispatch({ type: 'ADD_PERSONAL_RECORD', payload: pr });
  const addPREntry = (prId: string, entry: any) => dispatch({ type: 'ADD_PR_ENTRY', payload: { prId, entry } });
  const editPREntry = (prId: string, entry: any) => dispatch({ type: 'EDIT_PR_ENTRY', payload: { prId, entry } });
  const deletePREntry = (prId: string, entryId: string) => dispatch({ type: 'DELETE_PR_ENTRY', payload: { prId, entryId } });
  const deletePersonalRecord = (prId: string) => dispatch({ type: 'DELETE_PERSONAL_RECORD', payload: prId });

  const setShareProfile = (share: boolean) => dispatch({ type: 'SET_SHARE_PROFILE', payload: share });
  const setShareStats = (share: boolean) => dispatch({ type: 'SET_SHARE_STATS', payload: share });
  const setSharePersonalRecords = (share: boolean) => dispatch({ type: 'SET_SHARE_PERSONAL_RECORDS', payload: share });
  const setSharePersonalInfo = (share: boolean) => dispatch({ type: 'SET_SHARE_PERSONAL_INFO', payload: share });

  return (
    <StoreContext.Provider value={{ state, setRoutine, addSession, editSession, clearData, clearHistory, getExerciseHistory, setUnitPreference, setUsername, setName, setWeight, setAge, setGender, addPersonalRecord, addPREntry, editPREntry, deletePREntry, deletePersonalRecord, setShareProfile, setShareStats, setSharePersonalRecords, setSharePersonalInfo, isLoaded }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
