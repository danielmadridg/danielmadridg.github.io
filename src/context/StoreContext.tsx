import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { UserState, RoutineDay, WorkoutSession, ExerciseResult } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Initial State
const initialState: UserState = {
  routine: [],
  history: [],
};

// Actions
type Action =
  | { type: 'SET_ROUTINE'; payload: RoutineDay[] }
  | { type: 'ADD_SESSION'; payload: WorkoutSession }
  | { type: 'CLEAR_DATA' }
  | { type: 'LOAD_DATA'; payload: UserState };

// Reducer
function reducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case 'SET_ROUTINE':
      return { ...state, routine: action.payload };
    case 'ADD_SESSION':
      return { ...state, history: [...state.history, action.payload] };
    case 'CLEAR_DATA':
      return initialState;
    case 'LOAD_DATA':
      return action.payload;
    default:
      return state;
  }
}

// Context
interface StoreContextType {
  state: UserState;
  setRoutine: (routine: RoutineDay[]) => void;
  addSession: (session: WorkoutSession) => void;
  clearData: () => void;
  getExerciseHistory: (exerciseId: string) => { result: ExerciseResult; date: string }[];
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load data on mount or when user changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoaded(false);
      
      if (user) {
        // Try to load from Firestore
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as UserState;
            dispatch({ type: 'LOAD_DATA', payload: data });
          } else {
            // If no data in Firestore, check if we have local data to migrate
            // Or just start fresh/keep current state
            // Ideally, if we have local data and just signed up, we might want to upload it.
            // For now, let's just save the current state to Firestore if it's not empty, 
            // or if it is empty, just initialize.
            
            // If we have data in localStorage that we want to preserve on first login:
            const localData = localStorage.getItem('prodegi_data');
            if (localData) {
                 const parsed = JSON.parse(localData);
                 // Optional: Merge or just use local data
                 dispatch({ type: 'LOAD_DATA', payload: parsed });
                 // We will save this to Firestore in the next effect
            }
          }
        } catch (e) {
          console.error("Error loading from Firestore:", e);
        }
      } else {
        // Fallback to localStorage for guest
        const stored = localStorage.getItem('prodegi_data');
        if (stored) {
          try {
            dispatch({ type: 'LOAD_DATA', payload: JSON.parse(stored) });
          } catch (e) {
            console.error("Failed to load local data", e);
          }
        } else {
            // Reset to initial if no local data and no user
            dispatch({ type: 'CLEAR_DATA' });
        }
      }
      setIsLoaded(true);
    };

    loadData();
  }, [user]);

  // Save data whenever state changes
  useEffect(() => {
    if (!isLoaded) return;

    const saveData = async () => {
      // Always save to localStorage as backup/cache
      localStorage.setItem('prodegi_data', JSON.stringify(state));

      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          await setDoc(docRef, state);
        } catch (e) {
          console.error("Error saving to Firestore:", e);
        }
      }
    };

    saveData();
  }, [state, user, isLoaded]);

  const setRoutine = (routine: RoutineDay[]) => dispatch({ type: 'SET_ROUTINE', payload: routine });
  const addSession = (session: WorkoutSession) => dispatch({ type: 'ADD_SESSION', payload: session });
  const clearData = () => {
      localStorage.removeItem('prodegi_data');
      dispatch({ type: 'CLEAR_DATA' });
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

  return (
    <StoreContext.Provider value={{ state, setRoutine, addSession, clearData, getExerciseHistory }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
