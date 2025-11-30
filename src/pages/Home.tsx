import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import type { ExerciseResult, WorkoutSession } from '../types';
import { calculateProgressiveOverload } from '../utils/algorithm';
import { Check, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import CustomSelect from '../components/CustomSelect';

const Home: React.FC = () => {
  const { state, addSession, getExerciseHistory } = useStore();
  const { user } = useAuth();
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

      // history is sorted oldest to newest (based on how we push to array), but getExerciseHistory returns {result, date}
      // Let's assume the order is preserved from state.history which is chronological.

      initialExercises[ex.id] = {
        weight: '',
        reps: Array(ex.sets).fill('')
      };
    });

    setActiveWorkout({
      dayId: selectedDayId,
      startTime: new Date().toISOString(),
      exercises: initialExercises
    });
  };

  const handleCancelWorkout = () => {
    if (confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      setActiveWorkout(null);
    }
  };

  const handleFinishWorkout = () => {
    if (!activeWorkout || !selectedDay) return;

    // Validate that all exercises have data
    const hasEmptyData = selectedDay.exercises.some(ex => {
      const input = activeWorkout.exercises[ex.id];
      const weight = parseFloat(input.weight) || 0;
      const reps = input.reps.map(r => parseInt(r) || 0);
      return weight === 0 || reps.every(r => r === 0);
    });

    if (hasEmptyData) {
      alert('Please complete all exercises with weight and reps before finishing the workout.');
      return;
    }

    const results: ExerciseResult[] = [];

    selectedDay.exercises.forEach(ex => {
      const input = activeWorkout.exercises[ex.id];
      const weight = parseFloat(input.weight) || 0;
      const reps = input.reps.map(r => parseInt(r) || 0);

      const algoResult = calculateProgressiveOverload({
        currentWeight: weight,
        repsPerformed: reps,
        targetReps: ex.targetReps
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
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button
                    onClick={handleCancelWorkout}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ margin: 0 }}>{selectedDay.name}</h2>
            </div>
            {selectedDay.exercises.map(ex => {
                const exState = activeWorkout.exercises[ex.id];
                const history = getExerciseHistory(ex.id);
                const lastSession = history.length > 0 ? history[history.length - 1].result : null;
                const suggestedWeight = lastSession?.nextWeight ?? lastSession?.weight ?? 0;

                return (
                    <div key={ex.id} className="card">
                        <div className="flex-row">
                            <h3>{ex.name}</h3>
                            <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                                Goal: {ex.sets} x {ex.targetReps}
                            </div>
                        </div>

                        {lastSession && (
                            <div style={{
                                marginBottom: '1rem',
                                padding: '0.5rem',
                                background: 'rgba(212, 175, 55, 0.1)',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Last session: {lastSession.weight} kg × {lastSession.sets.join(', ')} reps
                                {lastSession.decision === 'incrementar' && ' → 📈 Increase weight'}
                                {lastSession.decision === 'deload' && ' → 📉 Deload'}
                            </div>
                        )}

                        <div style={{marginBottom: '1rem'}}>
                            <label>Weight (kg)</label>
                            <input
                                type="number"
                                value={exState.weight}
                                placeholder={suggestedWeight > 0 ? `${suggestedWeight}` : 'Enter weight'}
                                onChange={e => {
                                    const newExState = {...activeWorkout.exercises};
                                    newExState[ex.id].weight = e.target.value;
                                    setActiveWorkout({...activeWorkout, exercises: newExState});
                                }}
                                style={{width: '100px'}}
                            />
                        </div>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '0.5rem'}}>
                            {exState.reps.map((rep, i) => {
                                const lastReps = lastSession?.sets[i];
                                return (
                                    <div key={i}>
                                        <label style={{fontSize: '0.8rem'}}>
                                            Set {i+1}
                                            {lastReps && <span style={{color: 'var(--text-secondary)', marginLeft: '0.25rem'}}>({lastReps})</span>}
                                        </label>
                                        <input
                                            type="number"
                                            value={rep}
                                            placeholder={lastReps ? `${lastReps}` : ''}
                                            onChange={e => {
                                                const newExState = {...activeWorkout.exercises};
                                                const newReps = [...newExState[ex.id].reps];
                                                newReps[i] = e.target.value;
                                                newExState[ex.id].reps = newReps;
                                                setActiveWorkout({...activeWorkout, exercises: newExState});
                                            }}
                                            style={{width: '100%'}}
                                        />
                                    </div>
                                );
                            })}
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

  const getUserName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0]; // Get first name
    }
    return 'there';
  };

  const getRandomGreeting = () => {
    const hour = new Date().getHours();
    const name = getUserName();

    // Time-based greetings
    let timeGreetings: string[] = [];
    if (hour >= 5 && hour < 12) {
      timeGreetings = [`Good morning, ${name}`, `Morning, ${name}`];
    } else if (hour >= 12 && hour < 18) {
      timeGreetings = [`Good afternoon, ${name}`, `Afternoon, ${name}`];
    } else {
      timeGreetings = [`Good evening, ${name}`, `Evening, ${name}`];
    }

    // General greetings
    const generalGreetings = [
      `Hi, ${name}`,
      `Hello, ${name}`,
      `Hey, ${name}`,
      `Welcome back, ${name}`,
    ];

    // Combine all greetings
    const allGreetings = [...timeGreetings, ...generalGreetings];

    // Return random greeting
    return allGreetings[Math.floor(Math.random() * allGreetings.length)];
  };

  return (
    <div>
      <h1>{getRandomGreeting()}</h1>

      {selectedDay && (
          <div className="card">
              <label style={{fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem'}}>Select Routine Day</label>
              <CustomSelect
                  value={selectedDayId}
                  onChange={setSelectedDayId}
                  options={state.routine}
                  style={{ marginBottom: '1rem' }}
              />

              <h3>{selectedDay.name} Preview</h3>
              <ul style={{paddingLeft: '1.2rem', color: 'var(--text-secondary)'}}>
                  {selectedDay.exercises.map(ex => (
                      <li key={ex.id} style={{marginBottom: '0.5rem'}}>
                          {ex.name} - {ex.sets} x {ex.targetReps}
                      </li>
                  ))}
              </ul>
              <button className="btn-primary" onClick={handleStartWorkout} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'}}>
                  <img src="/favicon.svg" alt="" style={{width: '24px', height: '24px'}}/>
                  Start Workout
              </button>
          </div>
      )}
      
      <div style={{marginTop: '2rem'}}>
          <h3>Recent Activity</h3>
          {state.history.slice().reverse().slice(0, 5).map((session, idx, arr) => {
              const dayName = state.routine.find(d => d.id === session.dayId)?.name || 'Unknown Day';

              // Find previous session for the same day
              const previousSessionIndex = arr.findIndex((s, i) => i > idx && s.dayId === session.dayId);
              const previousSession = previousSessionIndex !== -1 ? arr[previousSessionIndex] : null;

              return (
                  <div key={session.id} className="card" style={{padding: '1rem'}}>
                      <div className="flex-row" style={{marginBottom: '0.5rem'}}>
                          <span style={{fontWeight: 'bold', color: 'var(--primary-color)'}}>{dayName}</span>
                          <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                              {format(new Date(session.date), 'MMM d, yyyy HH:mm')}
                          </span>
                      </div>

                      {/* Show exercise changes */}
                      <div style={{marginTop: '0.5rem'}}>
                          {session.exercises.map(ex => {
                              const exerciseName = state.routine
                                  .flatMap(d => d.exercises)
                                  .find(e => e.id === ex.exerciseId)?.name || 'Unknown';

                              const prevEx = previousSession?.exercises.find(e => e.exerciseId === ex.exerciseId);

                              let weightChange = 0;
                              let volumeChange = 0;

                              if (prevEx) {
                                  weightChange = ((ex.weight - prevEx.weight) / prevEx.weight) * 100;
                                  const currentVolume = ex.weight * ex.sets.reduce((a, b) => a + b, 0);
                                  const prevVolume = prevEx.weight * prevEx.sets.reduce((a, b) => a + b, 0);
                                  volumeChange = ((currentVolume - prevVolume) / prevVolume) * 100;
                              }

                              return (
                                  <div key={ex.exerciseId} style={{
                                      fontSize: '0.85rem',
                                      color: 'var(--text-secondary)',
                                      marginBottom: '0.25rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                  }}>
                                      <span>{exerciseName}: {ex.weight} kg × {ex.sets.join(', ')}</span>
                                      {prevEx && (
                                          <div style={{display: 'flex', gap: '0.5rem', fontSize: '0.75rem'}}>
                                              <span style={{color: weightChange > 0 ? '#4CAF50' : weightChange < 0 ? '#f44336' : '#888'}}>
                                                  W: {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}%
                                              </span>
                                              <span style={{color: volumeChange > 0 ? '#4CAF50' : volumeChange < 0 ? '#f44336' : '#888'}}>
                                                  V: {volumeChange > 0 ? '+' : ''}{volumeChange.toFixed(1)}%
                                              </span>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
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
