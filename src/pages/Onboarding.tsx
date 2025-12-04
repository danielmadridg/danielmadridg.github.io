import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import type { RoutineDay, ExerciseConfig } from '../types';
import { Plus, Trash2, Edit, ArrowLeft, GripVertical } from 'lucide-react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';

interface SortableExerciseItemProps {
  id: string;
  exercise: ExerciseConfig;
  dayIndex: number;
  exIndex: number;
  updateExercise: (dayIndex: number, exIndex: number, field: keyof ExerciseConfig, value: string | number) => void;
  removeExercise: (dayIndex: number, exIndex: number) => void;
  t: (key: string) => string;
}

const SortableExerciseItem = ({ id, exercise, dayIndex, exIndex, updateExercise, removeExercise, t }: SortableExerciseItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginBottom: '1rem',
    borderBottom: '1px solid #333',
    paddingBottom: '1rem',
    touchAction: 'none', // Important for touch devices to prevent scrolling while dragging
    position: 'relative' as const,
    zIndex: isDragging ? 999 : 'auto',
    background: isDragging ? '#1a1a1a' : 'transparent',
    borderRadius: isDragging ? '8px' : '0',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'grab', paddingRight: '0.5rem', color: '#666' }}>
          <GripVertical size={20} />
        </div>
        <input
          placeholder={t('exercise_name')}
          value={exercise.name}
          onChange={(e) => updateExercise(dayIndex, exIndex, 'name', e.target.value)}
          spellCheck="false"
          // Stop propagation to prevent drag start when typing immediately
          onPointerDown={(e) => e.stopPropagation()}
          // Prevent keyboard sensor from interfering with text input
          onKeyDown={(e) => e.stopPropagation()}
          style={{ flex: 1, minHeight: '44px', boxSizing: 'border-box' }}
        />
        <button 
          onClick={() => removeExercise(dayIndex, exIndex)} 
          className="btn-danger" 
          style={{ height: '44px', width: '44px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking delete
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', boxSizing: 'border-box'}}>
        <div style={{ boxSizing: 'border-box' }}>
          <label>{t('sets')}</label>
          <input
            type="number"
            value={exercise.sets === 0 ? '' : exercise.sets}
            placeholder="3"
            onChange={(e) => updateExercise(dayIndex, exIndex, 'sets', e.target.value === '' ? 0 : Number(e.target.value))}
            style={{ width: '100%', boxSizing: 'border-box' }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <div style={{ boxSizing: 'border-box' }}>
          <label>{t('target_reps')}</label>
          <input
            type="number"
            value={exercise.targetReps === 0 ? '' : exercise.targetReps}
            placeholder="10"
            onChange={(e) => updateExercise(dayIndex, exIndex, 'targetReps', e.target.value === '' ? 0 : Number(e.target.value))}
            style={{ width: '100%', boxSizing: 'border-box' }}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

const Onboarding: React.FC = () => {
  const { state, setRoutine } = useStore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Initialize state from context if available (Edit Mode)
  const [step, setStep] = useState<number>(state.routine.length > 0 ? 2 : 1);
  const [routine, setRoutineState] = useState<RoutineDay[]>(
    state.routine.length > 0
      ? state.routine
      : [{ id: 'day-1', name: 'Day 1', exercises: [] }]
  );
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

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

  const updateExercise = (dayIndex: number, exIndex: number, field: keyof ExerciseConfig, value: string | number) => {
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
    // Trim leading/trailing spaces from all exercise names while preserving internal spaces
    const trimmedRoutine = routine.map(day => ({
      ...day,
      exercises: day.exercises.map(exercise => ({
        ...exercise,
        name: exercise.name.trim()
      }))
    }));
    setRoutine(trimmedRoutine);
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
      // In create mode, go back to previous step or exit
      if (step === 1) {
        navigate('/');
      } else {
        setStep(step - 1);
      }
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, dayIndex: number) => {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = routine[dayIndex].exercises.findIndex(e => e.id === active.id);
      const newIndex = routine[dayIndex].exercises.findIndex(e => e.id === over.id);
      
      const newRoutine = [...routine];
      newRoutine[dayIndex].exercises = arrayMove(newRoutine[dayIndex].exercises, oldIndex, newIndex);
      setRoutineState(newRoutine);
    }
  };

  if (step === 1) {
    return (
      <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ textAlign: 'center', marginTop: 0 }}>Pro Tip</h1>
          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            marginTop: '0.5rem',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}>
            We strongly recommend taking your sets as close to failure as possible to ensure more accurate progress analysis.
          </p>
          <div style={{
            background: 'rgba(200, 149, 107, 0.1)',
            border: '1px solid rgba(200, 149, 107, 0.2)',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            Taking sets close to failure means pushing until you can only complete 1-2 more reps with good form. This helps Prodegi track your true strength and provide accurate progress metrics.
          </div>
          <button
            className="btn-primary"
            onClick={() => setStep(2)}
            style={{ marginTop: 0 }}
          >
            Got it, let's build my routine
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Routine builder (default return below)
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
              onKeyDown={(e) => e.stopPropagation()}
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
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, dayIndex)}
              modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            >
              <SortableContext 
                items={day.exercises.map(e => e.id)}
                strategy={verticalListSortingStrategy}
              >
                {day.exercises.map((ex, exIndex) => (
                  <SortableExerciseItem
                    key={ex.id}
                    id={ex.id}
                    exercise={ex}
                    dayIndex={dayIndex}
                    exIndex={exIndex}
                    updateExercise={updateExercise}
                    removeExercise={removeExercise}
                    t={t}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
