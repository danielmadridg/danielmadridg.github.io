import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Progress: React.FC = () => {
  const { state, getExerciseHistory } = useStore();
  const [viewMode, setViewMode] = useState<'exercise' | 'day'>('exercise');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const allExercises = useMemo(() => {
    return state.routine.flatMap(day => day.exercises);
  }, [state.routine]);

  const filteredExercises = useMemo(() => {
    if (!searchQuery) return allExercises;
    return allExercises.filter(ex =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allExercises, searchQuery]);

  const filteredDays = useMemo(() => {
    if (!searchQuery) return state.routine;
    return state.routine.filter(day =>
      day.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [state.routine, searchQuery]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(allExercises[0]?.id || '');
  const [selectedDayId, setSelectedDayId] = useState<string>(state.routine[0]?.id || '');

  const selectedExercise = allExercises.find(ex => ex.id === selectedExerciseId);
  const selectedDay = state.routine.find(day => day.id === selectedDayId);

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    const exercise = allExercises.find(ex => ex.id === exerciseId);
    setSearchQuery(exercise?.name || '');
    setShowDropdown(false);
  };

  const handleSelectDay = (dayId: string) => {
    setSelectedDayId(dayId);
    const day = state.routine.find(d => d.id === dayId);
    setSearchQuery(day?.name || '');
    setShowDropdown(false);
  };

  // Exercise history data
  const exerciseHistory = useMemo(() => {
    if (!selectedExerciseId) return [];
    return getExerciseHistory(selectedExerciseId);
  }, [selectedExerciseId, getExerciseHistory]);

  // Day history data
  const dayHistory = useMemo(() => {
    if (!selectedDayId) return [];
    return state.history
      .filter(session => session.dayId === selectedDayId)
      .map(session => ({
        date: session.date,
        totalVolume: session.exercises.reduce((total, ex) => {
          const volume = ex.weight * ex.sets.reduce((a, b) => a + b, 0);
          return total + volume;
        }, 0),
        avgWeight: session.exercises.reduce((sum, ex) => sum + ex.weight, 0) / session.exercises.length,
        exercises: session.exercises
      }));
  }, [selectedDayId, state.history]);

  const exerciseData = {
    labels: exerciseHistory.map(h => format(new Date(h.date), 'MMM d')),
    datasets: [
      {
        label: 'Weight (kg)',
        data: exerciseHistory.map(h => h.result.weight),
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.5)',
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Volume (kg × reps)',
        data: exerciseHistory.map(h => {
          const totalReps = h.result.sets.reduce((a, b) => a + b, 0);
          return h.result.weight * totalReps;
        }),
        borderColor: '#03DAC6',
        backgroundColor: 'rgba(3, 218, 198, 0.5)',
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const dayData = {
    labels: dayHistory.map(h => format(new Date(h.date), 'MMM d')),
    datasets: [
      {
        label: 'Total Volume (kg × reps)',
        data: dayHistory.map(h => h.totalVolume),
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.5)',
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Average Weight (kg)',
        data: dayHistory.map(h => h.avgWeight),
        borderColor: '#03DAC6',
        backgroundColor: 'rgba(3, 218, 198, 0.5)',
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#FFF',
          font: { size: window.innerWidth <= 768 ? 12 : 14 }
        }
      },
      title: {
        display: true,
        text: viewMode === 'exercise'
          ? `${selectedExercise?.name || 'Exercise'} Progress`
          : `${selectedDay?.name || 'Day'} Progress`,
        color: '#FFF',
        font: { size: window.innerWidth <= 768 ? 14 : 16 }
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: viewMode === 'exercise' ? 'Weight (kg)' : 'Total Volume (kg × reps)',
          color: '#D4AF37'
        },
        ticks: { color: '#B3B3B3' },
        grid: { color: '#333' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: viewMode === 'exercise' ? 'Volume (kg × reps)' : 'Average Weight (kg)',
          color: '#03DAC6'
        },
        ticks: { color: '#B3B3B3' },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        ticks: { color: '#B3B3B3' },
        grid: { color: '#333' }
      }
    }
  };

  const currentData = viewMode === 'exercise' ? exerciseData : dayData;
  const hasData = viewMode === 'exercise' ? exerciseHistory.length > 0 : dayHistory.length > 0;

  return (
    <div>
      <h1>Progress</h1>

      {/* View Mode Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setViewMode('exercise');
            setSearchQuery(selectedExercise?.name || '');
          }}
          style={{
            flex: 1,
            minWidth: '100px',
            padding: window.innerWidth <= 480 ? '0.6rem 0.5rem' : '0.75rem',
            background: viewMode === 'exercise' ? 'var(--primary-color)' : 'var(--surface-color)',
            color: viewMode === 'exercise' ? '#000' : 'var(--text-secondary)',
            border: viewMode === 'exercise' ? 'none' : '1px solid #333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: window.innerWidth <= 480 ? '0.75rem' : 'clamp(0.85rem, 2vw, 1rem)',
            fontWeight: viewMode === 'exercise' ? 'bold' : 'normal',
            transition: 'all 0.2s',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          By Exercise
        </button>
        <button
          onClick={() => {
            setViewMode('day');
            setSearchQuery(selectedDay?.name || '');
          }}
          style={{
            flex: 1,
            minWidth: '100px',
            padding: window.innerWidth <= 480 ? '0.6rem 0.5rem' : '0.75rem',
            background: viewMode === 'day' ? 'var(--primary-color)' : 'var(--surface-color)',
            color: viewMode === 'day' ? '#000' : 'var(--text-secondary)',
            border: viewMode === 'day' ? 'none' : '1px solid #333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: window.innerWidth <= 480 ? '0.75rem' : 'clamp(0.85rem, 2vw, 1rem)',
            fontWeight: viewMode === 'day' ? 'bold' : 'normal',
            transition: 'all 0.2s',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          By Day
        </button>
      </div>

      {/* Search/Select Input */}
      <div className="card" style={{ position: 'relative', zIndex: 10 }}>
        <label>{viewMode === 'exercise' ? 'Select Exercise' : 'Select Day'}</label>
        <input
          type="text"
          placeholder={viewMode === 'exercise' ? 'Search exercises...' : 'Search days...'}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          spellCheck="false"
          style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', minHeight: '44px', boxSizing: 'border-box' }}
        />

        {/* Dropdown */}
        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '4px',
            marginTop: '0.25rem',
            maxHeight: window.innerWidth <= 480 ? '150px' : '200px',
            overflowY: 'auto',
            zIndex: 1001,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}>
            {viewMode === 'exercise' ? (
              filteredExercises.length > 0 ? (
                filteredExercises.map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => handleSelectExercise(ex.id)}
                    style={{
                      padding: window.innerWidth <= 480 ? '0.65rem' : '0.75rem',
                      cursor: 'pointer',
                      background: ex.id === selectedExerciseId ? '#333' : 'transparent',
                      color: '#fff',
                      borderBottom: '1px solid #333',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: window.innerWidth <= 480 ? '0.85rem' : '1rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.background = ex.id === selectedExerciseId ? '#333' : 'transparent'}
                  >
                    {ex.name}
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  No exercises found
                </div>
              )
            ) : (
              filteredDays.length > 0 ? (
                filteredDays.map(day => (
                  <div
                    key={day.id}
                    onClick={() => handleSelectDay(day.id)}
                    style={{
                      padding: window.innerWidth <= 480 ? '0.65rem' : '0.75rem',
                      cursor: 'pointer',
                      background: day.id === selectedDayId ? '#333' : 'transparent',
                      color: '#fff',
                      borderBottom: '1px solid #333',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: window.innerWidth <= 480 ? '0.85rem' : '1rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.background = day.id === selectedDayId ? '#333' : 'transparent'}
                  >
                    {day.name}
                  </div>
                ))
              ) : (
                <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                  No days found
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: window.innerWidth <= 480 ? '0.75rem' : '1.5rem', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
        {hasData ? (
          <div style={{ position: 'relative', height: window.innerWidth <= 480 ? '450px' : '600px', width: '100%' }}>
            <Line options={chartOptions} data={currentData} />
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            No data available for this {viewMode === 'exercise' ? 'exercise' : 'day'}.
          </p>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
};

export default Progress;
