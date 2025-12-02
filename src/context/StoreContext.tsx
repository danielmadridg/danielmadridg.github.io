import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { UserState, RoutineDay, WorkoutSession, ExerciseResult, PersonalRecord } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  | { type: 'ADD_PERSONAL_RECORD'; payload: PersonalRecord }
  | { type: 'ADD_PR_ENTRY'; payload: { prId: string; entry: any } }
  | { type: 'EDIT_PR_ENTRY'; payload: { prId: string; entry: any } }
  | { type: 'DELETE_PR_ENTRY'; payload: { prId: string; entryId: string } }
  | { type: 'DELETE_PERSONAL_RECORD'; payload: string };

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
  addPersonalRecord: (pr: PersonalRecord) => void;
  addPREntry: (prId: string, entry: any) => void;
  editPREntry: (prId: string, entry: any) => void;
  deletePREntry: (prId: string, entryId: string) => void;
  deletePersonalRecord: (prId: string) => void;
  isLoaded: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load data on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      console.log('[StoreContext] Loading data, user:', user?.uid);
      setIsLoaded(false);

      if (user) {
        // Try to load from Firestore
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as UserState;
            console.log('[StoreContext] Loaded from Firestore:', data);
            dispatch({ type: 'LOAD_DATA', payload: data });
          } else {
            console.log('[StoreContext] No Firestore data, checking localStorage');
            // If no data in Firestore, check if we have local data to migrate
            const localData = localStorage.getItem('prodegi_data');
            if (localData) {
                 const parsed = JSON.parse(localData);
                 console.log('[StoreContext] Migrating localStorage to Firestore:', parsed);
                 dispatch({ type: 'LOAD_DATA', payload: parsed });
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
              console.log('[StoreContext] Firestore failed, loaded from localStorage fallback:', parsed);
              dispatch({ type: 'LOAD_DATA', payload: parsed });
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
        // User logged out - keep local state from before logout, don't clear it
        // Just mark as loaded without changing state
        console.log('[StoreContext] User logged out, keeping local state');
        setIsLoaded(true);
      }
    };

    loadData();
  }, [user]);

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
          console.log('[StoreContext] Saving to Firestore for user:', user.uid, 'Data:', state);
          await setDoc(docRef, state);
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

  const addPersonalRecord = (pr: PersonalRecord) => dispatch({ type: 'ADD_PERSONAL_RECORD', payload: pr });
  const addPREntry = (prId: string, entry: any) => dispatch({ type: 'ADD_PR_ENTRY', payload: { prId, entry } });
  const editPREntry = (prId: string, entry: any) => dispatch({ type: 'EDIT_PR_ENTRY', payload: { prId, entry } });
  const deletePREntry = (prId: string, entryId: string) => dispatch({ type: 'DELETE_PR_ENTRY', payload: { prId, entryId } });
  const deletePersonalRecord = (prId: string) => dispatch({ type: 'DELETE_PERSONAL_RECORD', payload: prId });

  return (
    <StoreContext.Provider value={{ state, setRoutine, addSession, editSession, clearData, clearHistory, getExerciseHistory, setUnitPreference, addPersonalRecord, addPREntry, editPREntry, deletePREntry, deletePersonalRecord, isLoaded }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
