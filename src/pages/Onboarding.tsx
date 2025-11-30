import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { RoutineDay, ExerciseConfig } from '../types';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { state, setRoutine } = useStore();
  const navigate = useNavigate();

  // Initialize state from context if available (Edit Mode)
  const [daysCount, setDaysCount] = useState<number | ''>(state.routine.length || '');
  const [step, setStep] = useState<number>(state.routine.length > 0 ? 2 : 1);
  const [routine, setRoutineState] = useState<RoutineDay[]>(state.routine.length > 0 ? state.routine : []);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleStart = () => {
    if (!daysCount || daysCount < 1) {
      alert('Please enter at least 1 day for your routine.');
      return;
    }
    const initialRoutine = Array.from({ length: Number(daysCount) }, (_, i) => ({
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
      increment: 2.5 // Kept for compatibility but not used by new algorithm
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

  const addDay = () => {
    const newDay: RoutineDay = {
      id: `day-${routine.length + 1}`,
      name: `Day ${routine.length + 1}`,
      exercises: []
    };
    setRoutineState([...routine, newDay]);
  };

  const removeDay = (dayIndex: number) => {
    if (routine.length === 1) {
      alert('You must have at least one day in your routine.');
      return;
    }
    const newRoutine = routine.filter((_, index) => index !== dayIndex);
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

  const handleCancel = () => {
    if (state.routine.length > 0) {
      // In edit mode, discard changes and go back
      navigate('/');
    } else {
      // In create mode, go back to step 1
      setStep(1);
    }
  };

  if (step === 1) {
    return (
      <div className="container" style={{ justifyContent: 'center' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center' }}>Welcome to Prodegi</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Let's set up your routine.</p>
          <label>How many different days do you have in your routine?</label>
          <input
            type="number"
            value={daysCount}
            onChange={(e) => setDaysCount(e.target.value === '' ? '' : Number(e.target.value))}
            min={1}
            max={7}
            placeholder="3"
            spellCheck="false"
            style={{ width: '100%', marginBottom: '1rem', boxSizing: 'border-box' }}
          />
          <button className="btn-primary" onClick={handleStart}>Next</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={handleCancel}
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
        <h1 style={{ margin: 0 }}>{state.routine.length > 0 ? 'Edit Routine' : 'Create Routine'}</h1>
      </div>
      {routine.map((day, dayIndex) => (
        <div key={day.id} className="card">
          <div className="flex-row" style={{ alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(200, 149, 107, 0.08)', borderRadius: '6px', cursor: 'pointer' }} onClick={() => {
            setTimeout(() => inputRefs.current[dayIndex]?.focus(), 0);
          }}>
            <Edit size={18} style={{ color: 'var(--primary-color)', flexShrink: 0, cursor: 'pointer' }} />
            <input
              ref={(el) => {
                inputRefs.current[dayIndex] = el;
              }}
              value={day.name}
              onChange={(e) => {
                const newRoutine = [...routine];
                newRoutine[dayIndex].name = e.target.value;
                setRoutineState(newRoutine);
              }}
              spellCheck="false"
              autoCorrect="off"
              style={{ fontWeight: 'bold', border: 'none', background: 'transparent', fontSize: '1.3rem', padding: '0.25rem 0.5rem', color: 'var(--primary-color)', flex: 1, outline: 'none', fontFamily: 'Syne', cursor: 'text' }}
            />
            <button
              onClick={() => removeDay(dayIndex)}
              className="btn-danger"
              style={{ flexShrink: 0 }}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div style={{ marginTop: '1rem' }}>
            {day.exercises.map((ex, exIndex) => (
              <div key={ex.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    placeholder="Exercise Name"
                    value={ex.name}
                    onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)}
                    spellCheck="false"
                    style={{ flex: 1, minHeight: '44px', boxSizing: 'border-box' }}
                  />
                  <button onClick={() => removeExercise(dayIndex, exIndex)} className="btn-danger" style={{ height: '44px', width: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', boxSizing: 'border-box'}}>
                  <div style={{ boxSizing: 'border-box' }}>
                    <label>Sets</label>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', Number(e.target.value))}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ boxSizing: 'border-box' }}>
                    <label>Target Reps</label>
                    <input
                      type="number"
                      value={ex.targetReps}
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'targetReps', Number(e.target.value))}
                      style={{ width: '100%', boxSizing: 'border-box' }}
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
      <button className="btn-secondary" onClick={addDay} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Plus size={16} /> Add Day
      </button>
      <button className="btn-primary" onClick={handleSave} style={{ marginBottom: '5rem' }}>Save Routine</button>
    </div>
  );
};

export default Onboarding;
