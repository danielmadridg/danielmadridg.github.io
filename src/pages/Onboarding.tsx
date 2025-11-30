import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { RoutineDay, ExerciseConfig } from '../types';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';

const Onboarding: React.FC = () => {
  const { state, setRoutine } = useStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Initialize state from context if available (Edit Mode)
  const [daysCount, setDaysCount] = useState<number | ''>(state.routine.length || '');
  const [step, setStep] = useState<number>(state.routine.length > 0 ? 2 : 1);
  const [routine, setRoutineState] = useState<RoutineDay[]>(state.routine.length > 0 ? state.routine : []);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [draggedItem, setDraggedItem] = useState<{ dayIndex: number; exIndex: number } | null>(null);

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
      targetReps: 0, // 0 will be displayed as empty string to show placeholder
      sets: 0, // 0 will be displayed as empty string to show placeholder
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
    if (confirm('Are you sure you want to delete this exercise?')) {
      const newRoutine = [...routine];
      newRoutine[dayIndex].exercises.splice(exIndex, 1);
      setRoutineState(newRoutine);
    }
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

  const hasChanges = () => {
    // Check if routine has been modified from the original state
    if (state.routine.length === 0) return false; // No changes if no original routine
    return JSON.stringify(routine) !== JSON.stringify(state.routine);
  };

  const handleCancel = () => {
    if (state.routine.length > 0) {
      // In edit mode, ask for confirmation if there are unsaved changes
      if (hasChanges()) {
        if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } else {
      // In create mode, go back to step 1
      setStep(1);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, dayIndex: number, exIndex: number) => {
    setDraggedItem({ dayIndex, exIndex });
    e.dataTransfer.effectAllowed = 'move';
    // Make the drag image transparent or style it if needed
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number, exIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedItem.dayIndex !== dayIndex) return; // Only allow reordering within the same day
    if (draggedItem.exIndex === exIndex) return;

    // Perform the swap
    const newRoutine = [...routine];
    const dayExercises = [...newRoutine[dayIndex].exercises];
    const draggedExercise = dayExercises[draggedItem.exIndex];
    
    // Remove from old position
    dayExercises.splice(draggedItem.exIndex, 1);
    // Insert at new position
    dayExercises.splice(exIndex, 0, draggedExercise);
    
    newRoutine[dayIndex].exercises = dayExercises;
    setRoutineState(newRoutine);
    setDraggedItem({ dayIndex, exIndex });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (step === 1) {
    return (
      <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ textAlign: 'center', marginTop: 0 }}>Welcome to Prodegi</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Let's set up your routine.</p>
          <label style={{ marginTop: '1.5rem' }}>{t('how_many_days')}</label>
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
          <button className="btn-primary" onClick={handleStart} style={{ marginTop: 0 }}>{t('next')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
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
        <h1 style={{ margin: 0 }}>{state.routine.length > 0 ? t('edit_routine_title') : t('create_routine')}</h1>
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
              <div 
                key={ex.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, dayIndex, exIndex)}
                onDragOver={(e) => handleDragOver(e, dayIndex, exIndex)}
                onDragEnd={handleDragEnd}
                style={{ 
                  marginBottom: '1rem', 
                  borderBottom: '1px solid #333', 
                  paddingBottom: '1rem',
                  opacity: draggedItem?.dayIndex === dayIndex && draggedItem?.exIndex === exIndex ? 0.5 : 1,
                  cursor: 'grab'
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', cursor: 'grab', paddingRight: '0.5rem', color: '#666' }}>
                    ⋮⋮
                  </div>
                  <input
                    placeholder={t('exercise_name')}
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
                    <label>{t('sets')}</label>
                    <input
                      type="number"
                      value={ex.sets === 0 ? '' : ex.sets}
                      placeholder="3"
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', e.target.value === '' ? 0 : Number(e.target.value))}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ boxSizing: 'border-box' }}>
                    <label>{t('target_reps')}</label>
                    <input
                      type="number"
                      value={ex.targetReps === 0 ? '' : ex.targetReps}
                      placeholder="10"
                      onChange={(e) => updateExercise(dayIndex, exIndex, 'targetReps', e.target.value === '' ? 0 : Number(e.target.value))}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn-secondary" onClick={() => addExercise(dayIndex)} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> {t('add_exercise')}
            </button>
          </div>
        </div>
      ))}
      <button className="btn-secondary" onClick={addDay} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Plus size={16} /> {t('add_day')}
      </button>
      <button className="btn-primary" onClick={handleSave} style={{ marginBottom: '5rem' }}>{t('save')}</button>
    </div>
  );
};

export default Onboarding;
