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
import { es, fr, it } from 'date-fns/locale';
import { Edit, Trash2 } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import './Progress.css';
import { useLanguage } from '../context/LanguageContext';
import { convertWeight } from '../utils/unitConversion';
import type { PersonalRecord } from '../types';

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
  const { t, language } = useLanguage();
  const { state, getExerciseHistory, addPersonalRecord, addPREntry, editPREntry, deletePREntry, deletePersonalRecord } = useStore();
  
  // ... (other state hooks)

  const getDateLocale = () => {
    switch (language) {
      case 'es': return es;
      case 'fr': return fr;
      case 'it': return it;
      default: return undefined;
    }
  };
  const [viewMode, setViewMode] = useState<'exercise' | 'day' | 'personal_records'>('exercise');
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [showPRForm, setShowPRForm] = useState(false);
  const [editingPR, setEditingPR] = useState<{ prId: string; entryId: string } | null>(null);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [prFormData, setPrFormData] = useState({ name: '', weight: '', date: format(new Date(), 'yyyy-MM-dd') });

  const allExercises = useMemo(() => {
    return state.routine.flatMap(day => day.exercises);
  }, [state.routine]);

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [weightError, setWeightError] = useState<string>('');

  // Get the maximum weight from previous PR entries (when not editing)
  const getMinWeightForPR = () => {
    if (!prFormData.name || editingPR) return 0; // No restriction when editing
    const pr = state.personalRecords?.find(p => p.exerciseName === prFormData.name);
    if (!pr || !Array.isArray(pr.entries) || pr.entries.length === 0) return 0;

    // Get the maximum weight from all entries
    const maxWeight = pr.entries.reduce((max, current) => {
      return current.weight > max ? current.weight : max;
    }, 0);

    return maxWeight;
  };

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

  const handleAddPR = () => {
    setDateError('');
    setWeightError('');

    if (!prFormData.name || !prFormData.weight || !prFormData.date) {
      alert('Please fill in all fields');
      return;
    }

    // Check if PR with this name already exists
    const existingPR = state.personalRecords?.find(pr => pr.exerciseName === prFormData.name);
    const newDate = new Date(prFormData.date).getTime();
    const newWeight = parseFloat(prFormData.weight);

    // If adding to existing PR, check that date is not earlier than the oldest entry
    if (existingPR && !editingPR) {
      const entries = Array.isArray(existingPR.entries) ? existingPR.entries : [];
      if (entries.length > 0) {
        const oldestEntry = entries.reduce((oldest, current) => {
          const oldestTime = new Date(oldest.date).getTime();
          const currentTime = new Date(current.date).getTime();
          return currentTime < oldestTime ? current : oldest;
        });
        const oldestDate = new Date(oldestEntry.date).getTime();

        if (newDate < oldestDate) {
          setDateError('Cannot choose a date before the oldest entry');
          return;
        }

        // Check that weight is not lower than the previous maximum
        const maxWeight = entries.reduce((max, current) => {
          return current.weight > max ? current.weight : max;
        }, 0);

        if (newWeight < maxWeight) {
          setWeightError(`Weight cannot be lower than the previous PR (${maxWeight})`);
          return;
        }
      }
    }

    if (editingPR) {
      // Edit existing entry
      const entry = {
        id: editingPR.entryId,
        weight: parseFloat(prFormData.weight),
        date: new Date(prFormData.date).toISOString()
      };
      editPREntry(editingPR.prId, entry);
      setEditingPR(null);
    } else if (existingPR) {
      // Add entry to existing PR
      const entry = {
        id: crypto.randomUUID(),
        weight: parseFloat(prFormData.weight),
        date: new Date(prFormData.date).toISOString()
      };
      addPREntry(existingPR.id, entry);
    } else {
      // Create new PR with first entry
      const newPR: PersonalRecord = {
        id: crypto.randomUUID(),
        exerciseName: prFormData.name,
        entries: [{
          id: crypto.randomUUID(),
          weight: parseFloat(prFormData.weight),
          date: new Date(prFormData.date).toISOString()
        }]
      };
      addPersonalRecord(newPR);
    }

    setPrFormData({ name: '', weight: '', date: format(new Date(), 'yyyy-MM-dd') });
    setShowPRForm(false);
    setQuickAddMode(false);
  };

  const handleEditPREntry = (prId: string, entry: any) => {
    setEditingPR({ prId, entryId: entry.id });
    setPrFormData({
      name: (state.personalRecords || []).find(pr => pr.id === prId)?.exerciseName || '',
      weight: entry.weight.toString(),
      date: format(new Date(entry.date), 'yyyy-MM-dd')
    });
    setShowPRForm(true);
  };

  const handleDeletePREntry = (prId: string, entryId: string) => {
    if (confirm('Are you sure you want to delete this PR entry?')) {
      deletePREntry(prId, entryId);
    }
  };

  const handleDeletePR = (prId: string) => {
    if (confirm('Are you sure you want to delete this entire PR and all its entries?')) {
      deletePersonalRecord(prId);
    }
  };

  const handleCancelPRForm = () => {
    setShowPRForm(false);
    setEditingPR(null);
    setQuickAddMode(false);
    setDateError('');
    setWeightError('');
    setPrFormData({ name: '', weight: '', date: format(new Date(), 'yyyy-MM-dd') });
  };

  const handleQuickAddPREntry = (exerciseName: string) => {
    setPrFormData({ name: exerciseName, weight: '', date: format(new Date(), 'yyyy-MM-dd') });
    setShowPRForm(true);
    setEditingPR(null);
    setQuickAddMode(true);
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
        label: `${t('weight_label')} (${state.unitPreference || 'kg'})`,
        data: exerciseHistory.map(h => convertWeight(h.result.weight, 'kg', state.unitPreference || 'kg')),
        borderColor: '#C8956B',
        backgroundColor: 'rgba(200, 149, 107, 0.2)',
        tension: 0.3,
        yAxisID: 'y',
        borderWidth: 2,
      },
      {
        label: `${t('volume_label')} (${state.unitPreference || 'kg'} * reps)`,
        data: exerciseHistory.map(h => {
          const totalReps = h.result.sets.reduce((a, b) => a + b, 0);
          return convertWeight(h.result.weight, 'kg', state.unitPreference || 'kg') * totalReps;
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
        label: `${t('total_volume')} (${state.unitPreference || 'kg'} * reps)`,
        data: dayHistory.map(h => {
           // Recalculate volume in correct unit
           return h.exercises.reduce((total, ex) => {
             const weightInUnit = convertWeight(ex.weight, 'kg', state.unitPreference || 'kg');
             const volume = weightInUnit * ex.sets.reduce((a, b) => a + b, 0);
             return total + volume;
           }, 0);
        }),
        borderColor: '#C8956B',
        backgroundColor: 'rgba(200, 149, 107, 0.2)',
        tension: 0.3,
        yAxisID: 'y',
        borderWidth: 2,
      },
      {
        label: `${t('average_weight')} (${state.unitPreference || 'kg'})`,
        data: dayHistory.map(h => convertWeight(h.avgWeight, 'kg', state.unitPreference || 'kg')),
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
        ticks: { color: '#FFF' },
        grid: { color: '#333' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: false
        },
        ticks: { color: '#FFF' },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        ticks: { color: '#FFF' },
        grid: { color: '#333' }
      }
    }
  };

  return (
    <div className="progress-container">
      <h1>{t('progress')}</h1>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <div className="view-mode-tabs-group">
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
        <div className="view-mode-tabs-divider"></div>
        <button
          onClick={() => {
            setViewMode('personal_records');
          }}
          className={`view-mode-btn pr-btn ${viewMode === 'personal_records' ? 'active' : 'inactive'}`}
        >
          {t('personal_records')}
        </button>
      </div>

      {/* Select Input */}
      {viewMode !== 'personal_records' && (
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
      )}

      {/* Chart or Personal Records */}
      {viewMode === 'personal_records' ? (
        <div className="card pr-container">
          {/* Debug: Ensure content is visible */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: 'var(--text-color)' }}>{t('personal_records')}</h2>
            <button
              onClick={() => setShowPRForm(true)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-color)',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              + {t('add_personal_record')}
            </button>
          </div>

          {/* PR Form */}
          {showPRForm && (
            <div style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: 'rgba(200, 149, 107, 0.1)',
              borderRadius: '8px',
              border: '1px solid var(--primary-color)'
            }}>
              <h3 style={{ marginTop: 0 }}>
                {editingPR ? t('edit_personal_record') : quickAddMode ? `Add entry for ${prFormData.name}` : t('add_personal_record')}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {t('personal_record_name')}
                  </label>
                  <input
                    type="text"
                    value={prFormData.name}
                    onChange={(e) => setPrFormData({ ...prFormData, name: e.target.value })}
                    placeholder="e.g. Bench Press"
                    disabled={editingPR !== null || quickAddMode}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      background: (editingPR || quickAddMode) ? 'rgba(255,255,255,0.05)' : 'var(--surface-color)',
                      color: 'var(--text-color)',
                      boxSizing: 'border-box',
                      cursor: (editingPR || quickAddMode) ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {t('personal_record_weight')} ({state.unitPreference || 'kg'})
                  </label>
                  <input
                    type="number"
                    value={prFormData.weight}
                    onChange={(e) => setPrFormData({ ...prFormData, weight: e.target.value })}
                    placeholder="0"
                    step="0.5"
                    min={editingPR ? undefined : getMinWeightForPR() || undefined}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: weightError ? '1px solid #f44336' : '1px solid #333',
                      borderRadius: '6px',
                      background: 'var(--surface-color)',
                      color: 'var(--text-color)',
                      boxSizing: 'border-box'
                    }}
                  />
                  {weightError && (
                    <p style={{ color: '#f44336', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                      {weightError}
                    </p>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {t('personal_record_date')}
                  </label>
                  <input
                    type="date"
                    value={prFormData.date}
                    onChange={(e) => setPrFormData({ ...prFormData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: dateError ? '1px solid #f44336' : '1px solid #333',
                      borderRadius: '6px',
                      background: 'var(--surface-color)',
                      color: 'var(--text-color)',
                      boxSizing: 'border-box'
                    }}
                  />
                  {dateError && (
                    <p style={{ color: '#f44336', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                      {dateError}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={handleAddPR}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'var(--primary-color)',
                      color: '#0a0a0a',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    {editingPR ? t('save_changes') : t('save')}
                  </button>
                  <button
                    onClick={handleCancelPRForm}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--text-secondary)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PR List with Entries */}
          {(state.personalRecords || []).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {[...(state.personalRecords || [])]
                .filter(pr => {
                  // Validate PR structure
                  if (!pr || !pr.exerciseName) return false;
                  const entries = Array.isArray(pr.entries) ? pr.entries : [];
                  return entries.length > 0;
                })
                .map(pr => {
                  try {
                    // Validate entries array
                    const entries = Array.isArray(pr.entries) ? pr.entries : [];
                    if (!entries || entries.length === 0) return null;

                    const sortedEntries = [...entries].sort((a, b) => {
                      const aTime = a && a.date ? new Date(a.date).getTime() : 0;
                      const bTime = b && b.date ? new Date(b.date).getTime() : 0;
                      return bTime - aTime;
                    });

                    const currentPR = sortedEntries[0];
                    if (!currentPR || !currentPR.weight) return null;

                    const currentWeight = convertWeight(currentPR.weight, 'kg', state.unitPreference || 'kg');
                    const previousPR = sortedEntries[1];
                    const previousWeight = previousPR ? convertWeight(previousPR.weight, 'kg', state.unitPreference || 'kg') : 0;

                    const improvement = previousPR && currentWeight && previousWeight
                      ? ((currentWeight - previousWeight) / previousWeight * 100).toFixed(1)
                      : null;
                    const improvementWeight = previousPR && currentWeight && previousWeight
                      ? (currentWeight - previousWeight).toFixed(1)
                      : null;

                    // Calculate average weight gain per month
                    let avgWeightGainPerMonth = null;
                    if (sortedEntries.length > 1) {
                      const newest = sortedEntries[0];
                      const oldest = sortedEntries[sortedEntries.length - 1];
                      
                      const newestWeight = convertWeight(newest.weight, 'kg', state.unitPreference || 'kg');
                      const oldestWeight = convertWeight(oldest.weight, 'kg', state.unitPreference || 'kg');
                      
                      const weightDiff = newestWeight - oldestWeight;
                      const dateDiff = new Date(newest.date).getTime() - new Date(oldest.date).getTime();
                      const months = dateDiff / (1000 * 60 * 60 * 24 * 30.44);
                      
                      if (months > 0) {
                        avgWeightGainPerMonth = (weightDiff / months).toFixed(1);
                      } else if (months === 0 && weightDiff !== 0) {
                         // Handle case where multiple entries on same day or very close
                         avgWeightGainPerMonth = weightDiff.toFixed(1); 
                      }
                    }

                    return (
                      <div key={pr.id} style={{
                        padding: '1.5rem',
                        background: 'var(--surface-color)',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        borderLeft: '3px solid var(--primary-color)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{pr.exerciseName}</h3>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                              {currentWeight.toFixed(1)} {state.unitPreference || 'kg'}
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              {format(new Date(currentPR.date), 'MMM d, yyyy', { locale: getDateLocale() })}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                            <button
                              onClick={() => handleQuickAddPREntry(pr.exerciseName)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--primary-color)',
                                color: '#0a0a0a',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '44px',
                                minHeight: '44px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.8';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                              }}
                              title="Add new entry"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleDeletePR(pr.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'transparent',
                                color: '#f44336',
                                border: '1px solid #f44336',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.85rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(244, 67, 54, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {t('delete_personal_record')}
                            </button>
                          </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      {improvement !== null && (
                        <div style={{ padding: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '6px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                          <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('last_improvement')}</p>
                          <p style={{ margin: 0, color: '#4CAF50', fontWeight: 'bold' }}>
                            +{improvement}% <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>(+{improvementWeight} {state.unitPreference || 'kg'})</span>
                          </p>
                        </div>
                      )}
                      {avgWeightGainPerMonth !== null && (
                        <div style={{ padding: '0.75rem', background: 'rgba(156, 39, 176, 0.1)', borderRadius: '6px', border: '1px solid rgba(156, 39, 176, 0.3)' }}>
                          <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('avg_weight_gain_month', { unit: state.unitPreference || 'kg' })}</p>
                          <p style={{ margin: 0, color: '#9c27b0', fontWeight: 'bold' }}>{Number(avgWeightGainPerMonth) > 0 ? '+' : ''}{avgWeightGainPerMonth}</p>
                        </div>
                      )}
                      {sortedEntries.length > 0 && (
                        <div style={{ padding: '0.75rem', background: 'rgba(200, 149, 107, 0.1)', borderRadius: '6px', border: '1px solid rgba(200, 149, 107, 0.3)' }}>
                          <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('total_entries')}</p>
                          <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 'bold' }}>{sortedEntries.length}</p>
                        </div>
                      )}
                    </div>

                    {/* Entry history timeline */}
                    {sortedEntries.length > 0 && (
                      <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #333' }}>
                        <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{t('history_entries', { count: sortedEntries.length })}</p>
                        <div className="pr-timeline">
                          {sortedEntries.map(entry => (
                            <div key={entry.id} className="pr-timeline-item">
                              <div className="pr-timeline-item-content">
                                <div className="pr-timeline-item-weight">
                                  {convertWeight(entry.weight, 'kg', state.unitPreference || 'kg').toFixed(1)} {state.unitPreference || 'kg'}
                                </div>
                                <p className="pr-timeline-item-date">
                                  {format(new Date(entry.date), 'MMM d, yyyy', { locale: getDateLocale() })}
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => handleEditPREntry(pr.id, entry)}
                                    title={t('edit')}
                                    style={{
                                      padding: '0.4rem 0.5rem',
                                      background: 'transparent',
                                      color: 'var(--primary-color)',
                                      border: 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      opacity: 0.6
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.opacity = '0.6';
                                    }}
                                  >
                                    <Edit size={20} />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePREntry(pr.id, entry.id)}
                                    title={t('delete_personal_record')}
                                    style={{
                                      padding: '0.4rem 0.5rem',
                                      background: 'transparent',
                                      color: '#f44336',
                                      border: 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      opacity: 0.6
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.opacity = '1';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.opacity = '0.6';
                                    }}
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                    );
                  } catch (error) {
                    console.error('Error rendering PR:', error);
                    return null;
                  }
                })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              {t('no_personal_records')}
            </p>
          )}
        </div>
      ) : (
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
      )}

    </div>
  );
};

export default Progress;
