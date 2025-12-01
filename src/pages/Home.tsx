import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../App';
import { useLanguage } from '../context/LanguageContext';
import type { ExerciseResult, WorkoutSession } from '../types';
import { calculateProgressiveOverload } from '../utils/algorithm';
import { convertWeight } from '../utils/unitConversion';
import logger from '../utils/logger';
import { Check, Dumbbell, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es, fr, it } from 'date-fns/locale';
import CustomSelect from '../components/CustomSelect';
import './Home.css';

const Home: React.FC = () => {
  const { state, addSession, editSession, getExerciseHistory } = useStore();
  const { user } = useAuth();
  const { setWorkoutActive, setHandleCancelWorkout } = useWorkout();
  const { t, language } = useLanguage();
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [filterByDayId, setFilterByDayId] = useState<string>('');
  const [activeWorkout, setActiveWorkout] = useState<{
    dayId: string;
    startTime: string;
    exercises: Record<string, { weight: string; reps: string[] }>;
  } | null>(null);
  const [savedWorkout, setSavedWorkout] = useState<{
    dayId: string;
    startTime: string;
    exercises: Record<string, { weight: string; reps: string[] }>;
  } | null>(null);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
  const navigate = useNavigate();

  // Load saved workout from local storage on mount (but don't activate it)
  useEffect(() => {
    const saved = localStorage.getItem('activeWorkout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that the day still exists
        const dayExists = state.routine.some(d => d.id === parsed.dayId);
        if (dayExists) {
          setSavedWorkout(parsed);
        } else {
          localStorage.removeItem('activeWorkout');
        }
      } catch (e) {
        logger.error('Failed to parse saved workout', e);
        localStorage.removeItem('activeWorkout');
      }
    }
  }, [state.routine]);

  // Save active workout to local storage whenever it changes
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('activeWorkout', JSON.stringify(activeWorkout));
      setSavedWorkout(activeWorkout);
    } else if (!savedWorkout) {
      // Only remove if we don't have a saved workout (handled by finish/cancel)
      // Actually, if activeWorkout becomes null, we might want to keep it in localStorage if it was just closed?
      // But here activeWorkout becomes null when we finish or cancel.
      // If we unmount, activeWorkout is lost from state but we want it in localStorage.
      // This effect runs when activeWorkout changes.
      // If we finish/cancel, we explicitly remove it.
      // If we just close the app, this effect doesn't run with null.
    }
  }, [activeWorkout]);

  // Get the appropriate locale for date-fns
  const getDateLocale = () => {
    switch (language) {
      case 'es':
        return es;
      case 'fr':
        return fr;
      case 'it':
        return it;
      default:
        return undefined; // English is the default in date-fns
    }
  };

  const selectedDay = state.routine.find(d => d.id === selectedDayId);

  const handleCancelWorkout = () => {
    if (confirm('Are you sure you want to cancel this workout? All progress will be lost.')) {
      setActiveWorkout(null);
      setSavedWorkout(null);
      setWorkoutActive(false);
      localStorage.removeItem('activeWorkout');
      navigate('/');
    }
  };

  // Update the context with the handleCancelWorkout function
  useEffect(() => {
    if (setHandleCancelWorkout) {
      setHandleCancelWorkout(() => handleCancelWorkout);
    }
  }, [setHandleCancelWorkout, handleCancelWorkout]);

  const handleResumeWorkout = () => {
    if (savedWorkout) {
      setActiveWorkout(savedWorkout);
      setWorkoutActive(true);
      setSelectedDayId(savedWorkout.dayId);
    }
  };

  const handleStartWorkout = () => {
    if (!selectedDay) return;

    if (savedWorkout) {
      if (!confirm('You have a workout in progress. Starting a new one will discard it. Continue?')) {
        return;
      }
      localStorage.removeItem('activeWorkout');
      setSavedWorkout(null);
    }

    const initialExercises: Record<string, { weight: string; reps: string[] }> = {};

    selectedDay.exercises.forEach(ex => {
      initialExercises[ex.id] = {
        weight: '',
        reps: Array(ex.sets).fill('')
      };
    });

    const newWorkout = {
      dayId: selectedDayId,
      startTime: new Date().toISOString(),
      exercises: initialExercises
    };

    setActiveWorkout(newWorkout);
    setWorkoutActive(true);
  };

  const handleFinishWorkout = () => {
    if (!activeWorkout || !selectedDay) return;

    // Validate that all exercises have data
    const hasEmptyData = selectedDay.exercises.some(ex => {
      const input = activeWorkout.exercises[ex.id];
      const weight = parseFloat(input.weight) || 0;
      const reps = input.reps.map(r => parseInt(r, 10) || 0);
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
      const reps = input.reps.map(r => parseInt(r, 10) || 0);

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
    setSavedWorkout(null);
    setWorkoutActive(false);
    localStorage.removeItem('activeWorkout');
  };

  const handleEditSession = (session: WorkoutSession) => {
    const day = state.routine.find(d => d.id === session.dayId);
    if (!day) return;

    setEditingSession(session);
    setSelectedDayId(session.dayId);

    const exercises: Record<string, { weight: string; reps: string[] }> = {};
    session.exercises.forEach(ex => {
      exercises[ex.exerciseId] = {
        weight: ex.weight.toString(),
        reps: ex.sets.map(r => r.toString())
      };
    });

    setActiveWorkout({
      dayId: session.dayId,
      startTime: session.date,
      exercises
    });
    setWorkoutActive(true);
  };

  const handleSaveEdit = () => {
    if (!activeWorkout || !editingSession || !selectedDay) return;

    const hasEmptyData = selectedDay.exercises.some(ex => {
      const input = activeWorkout.exercises[ex.id];
      const weight = parseFloat(input.weight) || 0;
      const reps = input.reps.map(r => parseInt(r, 10) || 0);
      return weight === 0 || reps.every(r => r === 0);
    });

    if (hasEmptyData) {
      alert('Please complete all exercises with weight and reps.');
      return;
    }

    const results: ExerciseResult[] = [];

    selectedDay.exercises.forEach(ex => {
      const input = activeWorkout.exercises[ex.id];
      const weight = parseFloat(input.weight) || 0;
      const reps = input.reps.map(r => parseInt(r, 10) || 0);

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

    const updatedSession: WorkoutSession = {
      id: editingSession.id,
      date: editingSession.date,
      dayId: editingSession.dayId,
      exercises: results
    };

    editSession(updatedSession);
    setActiveWorkout(null);
    setEditingSession(null);
    setWorkoutActive(false);
  };

  const getUserName = () => {
    if (user?.displayName) {
      return user.displayName.split(' ')[0]; // Get first name
    }
    return 'there';
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = getUserName();

    // Time-based greetings
    let timeGreetings: string[] = [];
    if (hour >= 5 && hour < 12) {
      timeGreetings = [`${t('greeting_morning')}, ${name}`];
    } else if (hour >= 12 && hour < 18) {
      timeGreetings = [`${t('greeting_afternoon')}, ${name}`];
    } else {
      timeGreetings = [`${t('greeting_evening')}, ${name}`];
    }

    // Return random greeting
    return timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
  }, [user?.displayName, t]);

  useEffect(() => {
    console.log('[Home] activeWorkout state:', activeWorkout);
    console.log('[Home] isWorkoutActive state:', );
  }, [activeWorkout]);

  if (activeWorkout && selectedDay) {
    console.log('[Home] Rendering workout view because activeWorkout is set');
    return (
        <div>
            <div className="workout-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                        title="Go back"
                    >
                        ← Back
                    </button>
                </div>
                <h2 style={{ margin: 0, flex: 1, textAlign: 'center' }}>{selectedDay.name} {editingSession && '(Editing)'}</h2>
                <div style={{ width: '60px' }}></div>
            </div>
            {selectedDay.exercises.map(ex => {
                const exState = activeWorkout.exercises[ex.id];
                const history = getExerciseHistory(ex.id);
                const lastSession = history.length > 0 ? history[history.length - 1].result : null;
                const suggestedWeightKg = lastSession?.nextWeight ?? lastSession?.weight ?? 0;
                const suggestedWeight = convertWeight(suggestedWeightKg, 'kg', state.unitPreference || 'kg');

                return (
                    <div key={ex.id} className="card exercise-card">
                        <div className="exercise-header">
                            <h3>{ex.name}</h3>
                            <div className="exercise-goal">
                                {t('goal')}: {ex.sets} x {ex.targetReps}
                            </div>
                        </div>

                        {lastSession && (
                            <div className="last-session-info">
                                {t('last_session')}: {convertWeight(lastSession.weight, 'kg', state.unitPreference || 'kg').toFixed(1)} {state.unitPreference || 'kg'} × {lastSession.sets.join(', ')} reps
                                {lastSession.decision === 'incrementar' && ' → 📈 Increase weight'}
                                {lastSession.decision === 'deload' && ' → 📉 Deload'}
                            </div>
                        )}

                        <div className="weight-input-container">
                            <label>{t('weight_label')} ({state.unitPreference || 'kg'})</label>
                            <input
                                type="number"
                                value={exState.weight}
                                placeholder={suggestedWeight > 0 ? `${suggestedWeight.toFixed(1)}` : 'Enter weight'}
                                onChange={e => {
                                    const newExState = {...activeWorkout.exercises};
                                    newExState[ex.id].weight = e.target.value;
                                    setActiveWorkout({...activeWorkout, exercises: newExState});
                                }}
                                spellCheck="false"
                                className="weight-input"
                            />
                        </div>
                        <div className="sets-grid">
                            {exState.reps.map((rep, i) => {
                                const lastReps = lastSession?.sets[i];
                                return (
                                    <div key={i} className="set-input-container">
                                        <label className="set-label">
                                            Set {i+1}
                                            {lastReps && <span style={{marginLeft: '0.25rem'}}>({lastReps})</span>}
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
                                            spellCheck="false"
                                            style={{width: '100%', boxSizing: 'border-box'}}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            <button className="btn-primary" onClick={editingSession ? handleSaveEdit : handleFinishWorkout}>
                <Check style={{verticalAlign: 'middle', marginRight: '8px'}}/>
                {editingSession ? t('save_changes') : t('finish_workout')}
            </button>
        </div>
    );
  }

  return (
    <div>
      <h1>{greeting}</h1>

      {savedWorkout && !activeWorkout && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary-color)', background: 'rgba(200, 149, 107, 0.1)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--primary-color)' }}>Workout in Progress</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            You have an unfinished workout for <strong>{state.routine.find(d => d.id === savedWorkout.dayId)?.name || 'Unknown Day'}</strong>.
          </p>
          <button 
            className="btn-primary" 
            onClick={handleResumeWorkout}
            style={{ width: '100%' }}
          >
            Resume Workout
          </button>
        </div>
      )}

      <div className="card">
        <label style={{fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.75rem'}}>{t('select_routine_day')}</label>
        <CustomSelect
          value={selectedDayId}
          onChange={setSelectedDayId}
          options={state.routine}
          placeholder={t('select_routine_day')}
          style={{ marginBottom: '1rem' }}
        />

        {selectedDay && (
          <>
            <h3>{selectedDay.name} Preview</h3>
            <ul style={{paddingLeft: '1.2rem', color: 'var(--text-secondary)'}}>
              {selectedDay.exercises.map(ex => (
                <li key={ex.id} style={{marginBottom: '0.5rem'}}>
                  {ex.name} - {ex.sets} x {ex.targetReps}
                </li>
              ))}
            </ul>
            <button className="btn-primary" onClick={handleStartWorkout}>
              <Dumbbell style={{verticalAlign: 'middle', marginRight: '8px'}}/>
              {t('start_workout')}
            </button>
          </>
        )}
      </div>
      
      <div style={{marginTop: '2rem', marginBottom: '1rem'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap'}}>
              <h3 style={{margin: 0}}>{t('recent_activity')}</h3>
              <select
                  value={filterByDayId}
                  onChange={(e) => setFilterByDayId(e.target.value)}
                  style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #252525',
                      background: 'var(--surface-color)',
                      color: 'var(--text-color)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                  }}
              >
                  <option value="">{t('all_days')}</option>
                  {state.routine.map(day => (
                      <option key={day.id} value={day.id}>{day.name}</option>
                  ))}
              </select>
          </div>
          {(() => {
              const fullHistory = state.history.slice().reverse();
              const filteredHistory = filterByDayId ? fullHistory.filter(s => s.dayId === filterByDayId) : fullHistory;
              const displayedHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 5);

              return displayedHistory.map((session, idx) => {
                  const dayName = state.routine.find(d => d.id === session.dayId)?.name || 'Unknown Day';

                  // Find previous session for the same day in FULL history, not just displayed
                  const previousSessionIndex = fullHistory.findIndex((s, i) => i > idx && s.dayId === session.dayId);
                  const previousSession = previousSessionIndex !== -1 ? fullHistory[previousSessionIndex] : null;

              return (
                  <div key={session.id} className="card history-card">
                      <div className="history-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between', width: '100%' }}>
                              <span className="history-day-name">{dayName}</span>
                              <button
                                  onClick={() => handleEditSession(session)}
                                  style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--primary-color)',
                                      cursor: 'pointer',
                                      padding: '0.5rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      flexShrink: 0
                                  }}
                                  title="Edit workout"
                              >
                                  <Edit size={18} />
                              </button>
                          </div>
                          <span className="history-date">
                              {format(new Date(session.date), 'MMM d, yyyy HH:mm', { locale: getDateLocale() }).replace(/^./, (char) => char.toUpperCase())}
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
                                  <div key={ex.exerciseId} className="history-exercise-item">
                                      <span>{exerciseName}: {convertWeight(ex.weight, 'kg', state.unitPreference || 'kg').toFixed(1)} {state.unitPreference || 'kg'} × {ex.sets.join(', ')}</span>
                                      {prevEx && (
                                          <div className="history-stats">
                                              <span style={{color: weightChange > 0 ? '#4CAF50' : weightChange < 0 ? '#f44336' : '#888'}}>
                                                  {t('weight_abbr')}: {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}%
                                              </span>
                                              <span style={{color: volumeChange > 0 ? '#4CAF50' : volumeChange < 0 ? '#f44336' : '#888'}}>
                                                  {t('volume_abbr')}: {volumeChange > 0 ? '+' : ''}{volumeChange.toFixed(1)}%
                                              </span>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              );
              });
          })()}
          {(() => {
              const fullHistory = state.history.slice().reverse();
              const filteredHistory = filterByDayId ? fullHistory.filter(s => s.dayId === filterByDayId) : fullHistory;

              return (
                  <>
                      {!showAllHistory && filteredHistory.length > 5 && (
                          <button
                              onClick={() => setShowAllHistory(true)}
                              style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  marginTop: '1rem',
                                  background: 'none',
                                  border: '1px solid var(--primary-color)',
                                  color: 'var(--primary-color)',
                                  cursor: 'pointer',
                                  borderRadius: '8px',
                                  fontWeight: '500',
                                  transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(200, 149, 107, 0.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                          >
                              {t('see_more')}
                          </button>
                      )}
                      {filteredHistory.length === 0 && <p style={{color: 'var(--text-secondary)'}}>{t('no_workouts')}</p>}
                  </>
              );
          })()}
      </div>
    </div>
  );
};

export default Home;
