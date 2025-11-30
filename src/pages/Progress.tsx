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
import CustomSelect from '../components/CustomSelect';
import './Progress.css';

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
  const allExercises = useMemo(() => {
    return state.routine.flatMap(day => day.exercises);
  }, [state.routine]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  const selectedExercise = allExercises.find(ex => ex.id === selectedExerciseId);
  const selectedDay = state.routine.find(day => day.id === selectedDayId);

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
  };

  const handleSelectDay = (dayId: string) => {
    setSelectedDayId(dayId);
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
        borderColor: '#C8956B',
        backgroundColor: 'rgba(200, 149, 107, 0.2)',
        tension: 0.3,
        yAxisID: 'y',
        borderWidth: 2,
      },
      {
        label: 'Volume (kg × reps)',
        data: exerciseHistory.map(h => {
          const totalReps = h.result.sets.reduce((a, b) => a + b, 0);
          return h.result.weight * totalReps;
        }),
        borderColor: '#03dac6',
        backgroundColor: 'rgba(3, 218, 198, 0.2)',
        tension: 0.3,
        yAxisID: 'y1',
        borderWidth: 2,
      },
    ],
  };

  const dayData = {
    labels: dayHistory.map(h => format(new Date(h.date), 'MMM d')),
    datasets: [
      {
        label: 'Total Volume (kg × reps)',
        data: dayHistory.map(h => h.totalVolume),
        borderColor: '#C8956B',
        backgroundColor: 'rgba(200, 149, 107, 0.2)',
        tension: 0.3,
        yAxisID: 'y',
        borderWidth: 2,
      },
      {
        label: 'Average Weight (kg)',
        data: dayHistory.map(h => h.avgWeight),
        borderColor: '#03dac6',
        backgroundColor: 'rgba(3, 218, 198, 0.2)',
        tension: 0.3,
        yAxisID: 'y1',
        borderWidth: 2,
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
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          color: '#FFF',
          font: { size: 14, weight: 500 as const },
          padding: 25,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10
        }
      },
      title: {
        display: true,
        text: viewMode === 'exercise'
          ? `${selectedExercise?.name || 'Exercise'} Progress`
          : `${selectedDay?.name || 'Day'} Progress`,
        color: '#FFF',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: false
        },
        ticks: { color: '#B3B3B3' },
        grid: { color: '#333' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: false
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
  const hasSelection = viewMode === 'exercise' ? !!selectedExerciseId : !!selectedDayId;
  const hasData = viewMode === 'exercise' ? exerciseHistory.length > 0 : dayHistory.length > 0;

  return (
    <div className="progress-container">
      <h1>Progress</h1>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button
          onClick={() => {
            setViewMode('exercise');
          }}
          className={`view-mode-btn ${viewMode === 'exercise' ? 'active' : 'inactive'}`}
        >
          By Exercise
        </button>
        <button
          onClick={() => {
            setViewMode('day');
          }}
          className={`view-mode-btn ${viewMode === 'day' ? 'active' : 'inactive'}`}
        >
          By Day
        </button>
      </div>

      {/* Select Input */}
      <div className="card search-container">
        <label>{viewMode === 'exercise' ? 'Select Exercise' : 'Select Day'}</label>
        <CustomSelect
          value={viewMode === 'exercise' ? selectedExerciseId : selectedDayId}
          onChange={(value) => {
            if (viewMode === 'exercise') {
              handleSelectExercise(value);
            } else {
              handleSelectDay(value);
            }
          }}
          options={viewMode === 'exercise' 
            ? allExercises.sort((a, b) => a.name.localeCompare(b.name))
            : state.routine.sort((a, b) => a.name.localeCompare(b.name))
          }
          placeholder={`Select ${viewMode === 'exercise' ? 'Exercise' : 'Day'}`}
        />
      </div>

      {/* Chart */}
      <div className="card chart-card">
        {hasSelection ? (
          hasData ? (
            <div className="chart-wrapper">
              <Line options={chartOptions} data={currentData} />
            </div>
          ) : (
            <p className="no-data-message">
              No data available for this {viewMode === 'exercise' ? 'exercise' : 'day'}.
            </p>
          )
        ) : (
          <p className="no-data-message">
            Please select {viewMode === 'exercise' ? 'an exercise' : 'a day'} to view progress.
          </p>
        )}
      </div>

    </div>
  );
};

export default Progress;
