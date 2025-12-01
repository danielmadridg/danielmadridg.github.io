import React, { useState, useMemo, useEffect } from 'react';
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
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();
  const { state, getExerciseHistory } = useStore();
  const [viewMode, setViewMode] = useState<'exercise' | 'day'>('exercise');
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth <= 768);

  const allExercises = useMemo(() => {
    return state.routine.flatMap(day => day.exercises);
  }, [state.routine]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');

  // Detect window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        label: t('weight_kg'),
        data: exerciseHistory.map(h => h.result.weight),
        borderColor: '#C8956B',
        backgroundColor: 'rgba(200, 149, 107, 0.2)',
        tension: 0.3,
        yAxisID: 'y',
        borderWidth: 2,
      },
      {
        label: t('volume_kg_reps'),
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
        label: t('total_volume_kg_reps'),
        data: dayHistory.map(h => h.totalVolume),
        borderColor: '#C8956B',
        backgroundColor: 'rgba(200, 149, 107, 0.2)',
        tension: 0.3,
        yAxisID: 'y',
        borderWidth: 2,
      },
      {
        label: t('average_weight_kg'),
        data: dayHistory.map(h => h.avgWeight),
        borderColor: '#03dac6',
        backgroundColor: 'rgba(3, 218, 198, 0.2)',
        tension: 0.3,
        yAxisID: 'y1',
        borderWidth: 2,
      },
    ],
  };

  const currentData = viewMode === 'exercise' ? exerciseData : dayData;
  const hasSelection = viewMode === 'exercise' ? !!selectedExerciseId : !!selectedDayId;
  const hasData = viewMode === 'exercise' ? exerciseHistory.length > 0 : dayHistory.length > 0;

  const legendPosition = isMobile ? 'bottom' : 'right';
  const legendPadding = isMobile ? 15 : 25;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: !isMobile,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: legendPosition as 'bottom' | 'right',
        align: 'center' as const,
        labels: {
          color: '#FFF',
          font: { size: 14, weight: 500 as const },
          padding: legendPadding,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10
        }
      },
      title: {
        display: true,
        text: viewMode === 'exercise'
          ? `${selectedExercise?.name || t('exercise')} ${t('exercise_progress')}`
          : `${selectedDay?.name || t('day')} ${t('day_progress')}`,
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

  return (
    <div className="progress-container">
      <h1>{t('progress')}</h1>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button
          onClick={() => {
            setViewMode('exercise');
          }}
          className={`view-mode-btn ${viewMode === 'exercise' ? 'active' : 'inactive'}`}
        >
          {t('by_exercise')}
        </button>
        <button
          onClick={() => {
            setViewMode('day');
          }}
          className={`view-mode-btn ${viewMode === 'day' ? 'active' : 'inactive'}`}
        >
          {t('by_day')}
        </button>
      </div>

      {/* Select Input */}
      <div className="card search-container">
        <label>{viewMode === 'exercise' ? t('select_exercise') : t('select_day')}</label>
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
          placeholder={viewMode === 'exercise' ? t('select_exercise') : t('select_day')}
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
              {viewMode === 'exercise' ? t('no_data_available_exercise') : t('no_data_available_day')}
            </p>
          )
        ) : (
          <p className="no-data-message">
            {viewMode === 'exercise' ? t('please_select_exercise') : t('please_select_day')}
          </p>
        )}
      </div>

    </div>
  );
};

export default Progress;
