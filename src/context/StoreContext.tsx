import React, { createContext, useContext, useEffect, useReducer } from 'react';
import type { UserState, RoutineDay, WorkoutSession, ExerciseResult } from '../types';

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
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('prodegi_data');
    if (stored) {
      try {
        dispatch({ type: 'LOAD_DATA', payload: JSON.parse(stored) });
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage whenever state changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('prodegi_data', JSON.stringify(state));
    }
  }, [state, isLoaded]);

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
