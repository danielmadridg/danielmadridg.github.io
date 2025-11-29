import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { RoutineDay, ExerciseConfig } from '../types';
import { Plus, Trash2 } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { state, setRoutine } = useStore();
  const navigate = useNavigate();
  
  // Initialize state from context if available (Edit Mode)
  const [daysCount, setDaysCount] = useState<number>(state.routine.length || 3);
  const [step, setStep] = useState<number>(state.routine.length > 0 ? 2 : 1);
  const [routine, setRoutineState] = useState<RoutineDay[]>(state.routine.length > 0 ? state.routine : []);

  const handleStart = () => {
    const initialRoutine = Array.from({ length: daysCount }, (_, i) => ({
      id: `day-${i + 1}`,
      name: `Day ${i + 1}`,
      exercises: []
    }));
    setRoutineState(initialRoutine);
    setStep(2);
  };

  const addExercise = (dayIndex: number) => {
    const newExercise: ExerciseConfig = {
      id: crypto.randomUUID(),
      name: '',
      targetReps: 10,
      sets: 3,
      increment: 2.5
    };
    const newRoutine = [...routine];
    newRoutine[dayIndex].exercises.push(newExercise);
    setRoutineState(newRoutine);
  };

  const updateExercise = (dayIndex: number, exIndex: number, field: keyof ExerciseConfig, value: any) => {
    const newRoutine = [...routine];
    newRoutine[dayIndex].exercises[exIndex] = {
      ...newRoutine[dayIndex].exercises[exIndex],
      [field]: value
    };
    setRoutineState(newRoutine);
  };

  const removeExercise = (dayIndex: number, exIndex: number) => {
    const newRoutine = [...routine];
    newRoutine[dayIndex].exercises.splice(exIndex, 1);
    setRoutineState(newRoutine);
  };

  const handleSave = () => {
    const isValid = routine.every(day => day.exercises.length > 0 && day.exercises.every(e => e.name.trim() !== ''));
    if (!isValid) {
      alert("Please add at least one exercise per day and ensure all exercises have names.");
      return;
    }
    setRoutine(routine);
    navigate('/');
  };

  if (step === 1) {
    return (
      <div className="container" style={{ justifyContent: 'center' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center' }}>Welcome to Prodegi</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Let's set up your routine.</p>
          <label>How many days per week do you train?</label>
          <input 
            type="number" 
            value={daysCount} 
            onChange={(e) => setDaysCount(Number(e.target.value))} 
            min={1} 
            max={7} 
            style={{ width: '100%', marginBottom: '1rem', boxSizing: 'border-box' }}
          />
          <button className="btn-primary" onClick={handleStart}>Next</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{state.routine.length > 0 ? 'Edit Routine' : 'Create Routine'}</h1>
      {routine.map((day, dayIndex) => (
        <div key={day.id} className="card">
          <div className="flex-row">
            <input 
              value={day.name} 
              onChange={(e) => {
                const newRoutine = [...routine];
                newRoutine[dayIndex].name = e.target.value;
                setRoutineState(newRoutine);
              }}
              style={{ fontWeight: 'bold', border: 'none', background: 'transparent', fontSize: '1.2rem', padding: 0, color: 'var(--primary-color)' }}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            {day.exercises.map((ex, exIndex) => (
              <div key={ex.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                <div className="flex-row" style={{ marginBottom: '0.5rem' }}>
                  <input 
                    placeholder="Exercise Name" 
                    value={ex.name} 
                    onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button onClick={() => removeExercise(dayIndex, exIndex)} className="btn-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex-row">
                  <div>
                    <label>Sets</label>
                    <input 
                      type="number" 
                      value={ex.sets} 
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', Number(e.target.value))}
                      style={{ width: '60px' }}
                    />
                  </div>
                  <div>
                    <label>Target Reps</label>
                    <input 
                      type="number" 
                      value={ex.targetReps} 
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'targetReps', Number(e.target.value))}
                      style={{ width: '60px' }}
                    />
                  </div>
                   <div>
                    <label>Inc (kg)</label>
                    <input 
                      type="number" 
                      value={ex.increment} 
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'increment', Number(e.target.value))}
                      style={{ width: '60px' }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn-secondary" onClick={() => addExercise(dayIndex)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Exercise
            </button>
          </div>
        </div>
      ))}
      <button className="btn-primary" onClick={handleSave} style={{ marginBottom: '5rem' }}>Save Routine</button>
    </div>
  );
};

export default Onboarding;
