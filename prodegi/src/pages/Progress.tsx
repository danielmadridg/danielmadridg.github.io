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
  
  const allExercises = useMemo(() => {
    return state.routine.flatMap(day => day.exercises);
  }, [state.routine]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(allExercises[0]?.id || '');

  const history = useMemo(() => {
    if (!selectedExerciseId) return [];
    return getExerciseHistory(selectedExerciseId);
  }, [selectedExerciseId, getExerciseHistory]);

  const data = {
    labels: history.map(h => format(new Date(h.date), 'MMM d')),
    datasets: [
      {
        label: 'Weight (kg)',
        data: history.map(h => h.result.weight),
        borderColor: '#D4AF37',
        backgroundColor: 'rgba(212, 175, 55, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#FFF' }
      },
      title: {
        display: true,
        text: 'Progress Over Time',
        color: '#FFF'
      },
    },
    scales: {
      y: {
        ticks: { color: '#B3B3B3' },
        grid: { color: '#333' }
      },
      x: {
        ticks: { color: '#B3B3B3' },
        grid: { color: '#333' }
      }
    }
  };

  return (
    <div>
      <h1>Progress</h1>
      <div className="card">
        <label>Select Exercise</label>
        <select 
          value={selectedExerciseId} 
          onChange={e => setSelectedExerciseId(e.target.value)}
          style={{width: '100%', padding: '0.8rem', fontSize: '1rem'}}
        >
          {allExercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>
      
      <div className="card">
        {history.length > 0 ? (
          <Line options={options} data={data} />
        ) : (
          <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>No data available for this exercise.</p>
        )}
      </div>
    </div>
  );
};

export default Progress;
