import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import type { ExerciseResult, WorkoutSession } from '../types';
import { calculateProgressiveOverload } from '../utils/algorithm';
import { Play, Check } from 'lucide-react';
import { format } from 'date-fns';

const Home: React.FC = () => {
  const { state, addSession, getExerciseHistory } = useStore();
  const [selectedDayId, setSelectedDayId] = useState<string>(state.routine[0]?.id || '');
  const [activeWorkout, setActiveWorkout] = useState<{
    dayId: string;
    startTime: string;
    exercises: Record<string, { weight: string; reps: string[] }>;
  } | null>(null);

  const selectedDay = state.routine.find(d => d.id === selectedDayId);

  const handleStartWorkout = () => {
    if (!selectedDay) return;
    
    const initialExercises: Record<string, { weight: string; reps: string[] }> = {};
    
    selectedDay.exercises.forEach(ex => {
      const history = getExerciseHistory(ex.id);
      // history is sorted oldest to newest (based on how we push to array), but getExerciseHistory returns {result, date}
      // Let's assume the order is preserved from state.history which is chronological.
      const lastSession = history.length > 0 ? history[history.length - 1].result : null;
      
      const suggestedWeight = lastSession?.nextWeight ?? lastSession?.weight ?? '';
      
      initialExercises[ex.id] = {
        weight: suggestedWeight.toString(),
        reps: Array(ex.sets).fill('')
      };
    });

    setActiveWorkout({
      dayId: selectedDayId,
      startTime: new Date().toISOString(),
      exercises: initialExercises
    });
  };

  const handleFinishWorkout = () => {
    if (!activeWorkout || !selectedDay) return;

    const results: ExerciseResult[] = [];

    selectedDay.exercises.forEach(ex => {
      const input = activeWorkout.exercises[ex.id];
      const weight = parseFloat(input.weight) || 0;
      const reps = input.reps.map(r => parseInt(r) || 0);
      
      const history = getExerciseHistory(ex.id).map(h => h.result);
      
      let failures = 0;
      const reversedHistory = [...history].reverse();
      for (const h of reversedHistory) {
         const hSets = h.sets.length;
         if (hSets === 0) continue;
         const hTop = h.sets[0];
         const hVol = h.sets.reduce((a, b) => a + b, 0);
         const pTop = (hTop - ex.targetReps) / ex.targetReps;
         const pVol = (hVol - (ex.targetReps * hSets)) / (ex.targetReps * hSets);
         
         if (pTop <= -0.10 || pVol <= -0.15) {
             failures++;
         } else {
             break;
         }
      }

      const algoResult = calculateProgressiveOverload({
        currentWeight: weight,
        repsPerformed: reps,
        targetReps: ex.targetReps,
        increment: ex.increment,
        previousFailures: failures
      });

      results.push({
        exerciseId: ex.id,
        weight,
        sets: reps,
        nextWeight: algoResult.nextWeight,
        decision: algoResult.decision
      });
    });

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      dayId: activeWorkout.dayId,
      exercises: results
    };

    addSession(session);
    setActiveWorkout(null);
  };

  if (activeWorkout && selectedDay) {
    return (
        <div className="container">
            <h2>{selectedDay.name}</h2>
            {selectedDay.exercises.map(ex => {
                const exState = activeWorkout.exercises[ex.id];
                return (
                    <div key={ex.id} className="card">
                        <div className="flex-row">
                            <h3>{ex.name}</h3>
                            <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                                Goal: {ex.sets} x {ex.targetReps}
                            </div>
                        </div>
                        <div style={{marginBottom: '1rem'}}>
                            <label>Weight (kg)</label>
                            <input 
                                type="number" 
                                value={exState.weight}
                                onChange={e => {
                                    const newExState = {...activeWorkout.exercises};
                                    newExState[ex.id].weight = e.target.value;
                                    setActiveWorkout({...activeWorkout, exercises: newExState});
                                }}
                                style={{width: '100px'}}
                            />
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                            {exState.reps.map((rep, i) => (
                                <div key={i}>
                                    <label style={{fontSize: '0.8rem'}}>Set {i+1}</label>
                                    <input 
                                        type="number"
                                        value={rep}
                                        onChange={e => {
                                            const newExState = {...activeWorkout.exercises};
                                            const newReps = [...newExState[ex.id].reps];
                                            newReps[i] = e.target.value;
                                            newExState[ex.id].reps = newReps;
                                            setActiveWorkout({...activeWorkout, exercises: newExState});
                                        }}
                                        style={{width: '50px'}}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            <button className="btn-primary" onClick={handleFinishWorkout}>
                <Check style={{verticalAlign: 'middle', marginRight: '8px'}}/>
                Finish Workout
            </button>
        </div>
    );
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      
      <div className="card">
        <label>Select Routine Day</label>
        <select 
            value={selectedDayId} 
            onChange={e => setSelectedDayId(e.target.value)}
            style={{width: '100%', padding: '0.8rem', fontSize: '1rem'}}
        >
            {state.routine.map(day => (
                <option key={day.id} value={day.id}>{day.name}</option>
            ))}
        </select>
      </div>

      {selectedDay && (
          <div className="card">
              <h3>{selectedDay.name} Preview</h3>
              <ul style={{paddingLeft: '1.2rem', color: 'var(--text-secondary)'}}>
                  {selectedDay.exercises.map(ex => (
                      <li key={ex.id} style={{marginBottom: '0.5rem'}}>
                          {ex.name} - {ex.sets} x {ex.targetReps}
                      </li>
                  ))}
              </ul>
              <button className="btn-primary" onClick={handleStartWorkout}>
                  <Play style={{verticalAlign: 'middle', marginRight: '8px'}}/>
                  Start Workout
              </button>
          </div>
      )}
      
      <div style={{marginTop: '2rem'}}>
          <h3>Recent Activity</h3>
          {state.history.slice().reverse().slice(0, 5).map(session => {
              const dayName = state.routine.find(d => d.id === session.dayId)?.name || 'Unknown Day';
              return (
                  <div key={session.id} className="card" style={{padding: '1rem'}}>
                      <div className="flex-row">
                          <span style={{fontWeight: 'bold', color: 'var(--primary-color)'}}>{dayName}</span>
                          <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                              {format(new Date(session.date), 'MMM d, yyyy')}
                          </span>
                      </div>
                  </div>
              );
          })}
          {state.history.length === 0 && <p style={{color: 'var(--text-secondary)'}}>No workouts yet.</p>}
      </div>
    </div>
  );
};

export default Home;
