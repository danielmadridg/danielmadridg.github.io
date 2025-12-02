export interface ExerciseConfig {
  id: string;
  name: string;
  targetReps: number;
  sets: number;
  increment: number;
}

export interface RoutineDay {
  id: string;
  name: string;
  exercises: ExerciseConfig[];
}

export interface ExerciseSetResult {
  reps: number;
}

export interface ExerciseResult {
  exerciseId: string;
  weight: number;
  sets: number[]; // Array of reps
  nextWeight: number;
  decision: 'incrementar' | 'mantener' | 'deload';
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO string
  dayId: string;
  exercises: ExerciseResult[];
}

export interface PersonalRecordEntry {
  id: string;
  weight: number;
  date: string; // ISO string
}

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  entries: PersonalRecordEntry[];
}

export interface UserState {
  routine: RoutineDay[];
  history: WorkoutSession[];
  unitPreference?: 'kg' | 'lbs';
  personalRecords?: PersonalRecord[];
  weight?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
}
