import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Search, User, TrendingUp, Lock, Users } from 'lucide-react';
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
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import { searchUsersByUsername, getPublicPersonalRecords, getPublicRoutine, getPublicWorkoutHistory } from '../utils/publicProfile';
import type { PublicProfile, PublicPersonalRecord } from '../types';
import { useStore } from '../context/StoreContext';
import { convertWeight } from '../utils/unitConversion';

const Friends: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { state } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [profilePRs, setProfilePRs] = useState<PublicPersonalRecord[]>([]);
  const [profileRoutine, setProfileRoutine] = useState<{ dayName: string; exercises: string[] }[]>([]);
  const [profileWorkouts, setProfileWorkouts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [following, setFollowing] = useState<PublicProfile[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Search users
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsersByUsername(searchTerm);
      console.log('[Friends] Search results:', results);
      // Filter out current user and only show profiles that have shareProfile enabled (default true)
      const filtered = results.filter(profile =>
        profile.userId !== user?.uid && (profile.shareProfile === true || profile.shareProfile === undefined)
      );
      console.log('[Friends] Filtered results:', filtered);
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Load profile details
  const loadProfileDetails = async (profile: PublicProfile) => {
    setSelectedProfile(profile);
    setIsLoadingProfile(true);

    try {
      // Load routine if stats are shared (default to true)
      if (profile.shareStats !== false) {
        const routine = await getPublicRoutine(profile.userId);
        setProfileRoutine(routine);

        // Load workout history if stats are shared
        const workouts = await getPublicWorkoutHistory(profile.userId);
        setProfileWorkouts(workouts);
      } else {
        setProfileRoutine([]);
        setProfileWorkouts([]);
      }

      // Load personal records if sharing is enabled (default to true)
      if (profile.sharePersonalRecords !== false) {
        const prs = await getPublicPersonalRecords(profile.userId);
        setProfilePRs(prs);
      } else {
        setProfilePRs([]);
      }
    } catch (error) {
      console.error('Error loading profile details:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load following from localStorage on mount
  useEffect(() => {
    if (user?.uid) {
      const storageKey = `following_${user.uid}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setFollowing(JSON.parse(saved));
        } catch (error) {
          console.error('Error loading following list:', error);
        }
      }
    }
  }, [user?.uid]);

  // Clean up following list - remove deleted accounts
  // Use ref to track if cleanup has been done to prevent infinite loops
  const cleanupDoneRef = React.useRef(false);
  
  useEffect(() => {
    const cleanupFollowing = async () => {
      if (!user?.uid || following.length === 0 || cleanupDoneRef.current) return;

      try {
        const { db } = await import('../config/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        
        console.log('[Friends] Running cleanup check for', following.length, 'profiles');
        
        // Batch check all profiles in parallel for better performance
        const validationPromises = following.map(async (profile) => {
          const profileRef = doc(db, 'publicProfiles', profile.userId);
          const profileSnap = await getDoc(profileRef);
          return { profile, exists: profileSnap.exists() };
        });
        
        const results = await Promise.all(validationPromises);
        const validProfiles = results
          .filter(r => r.exists)
          .map(r => r.profile);
        
        const deletedCount = following.length - validProfiles.length;
        
        // Update following list if any profiles were removed
        if (deletedCount > 0) {
          console.log(`[Friends] Removing ${deletedCount} deleted account(s)`);
          setFollowing(validProfiles);
          const storageKey = `following_${user.uid}`;
          localStorage.setItem(storageKey, JSON.stringify(validProfiles));
        }
        
        // Mark cleanup as done
        cleanupDoneRef.current = true;
      } catch (error) {
        console.error('[Friends] Error cleaning up following list:', error);
      }
    };

    // Run cleanup only once when following list is first loaded
    if (following.length > 0 && !cleanupDoneRef.current) {
      cleanupFollowing();
    }
  }, [following.length, user?.uid]);


  // Search on enter
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const handleFollow = (profile: PublicProfile) => {
    setFollowing((prev) => {
      const isAlreadyFollowing = prev.some(p => p.userId === profile.userId);
      let updated;
      if (isAlreadyFollowing) {
        updated = prev.filter(p => p.userId !== profile.userId);
      } else {
        updated = [...prev, profile];
      }
      // Save to localStorage
      if (user?.uid) {
        localStorage.setItem(`following_${user.uid}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const isFollowing = (userId: string) => following.some(p => p.userId === userId);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const unitPreference = state.unitPreference || 'kg';

  // Get unique exercise names from profile workouts
  const exerciseNames = React.useMemo(() => {
    if (!profileWorkouts || profileWorkouts.length === 0) return [];
    const exercises = new Set<string>();
    profileWorkouts.forEach(w => {
      w.exercises.forEach((ex: any) => {
        if (ex.name) exercises.add(ex.name);
      });
    });
    return Array.from(exercises).sort();
  }, [profileWorkouts]);

  const chartData = React.useMemo(() => {
    if (!profileWorkouts || profileWorkouts.length === 0) return null;

    // Sort oldest to newest for chart
    const sortedWorkouts = [...profileWorkouts].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const labels = sortedWorkouts.map(w => {
      const date = new Date(w.date);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    let data;
    let label;

    if (selectedExercise) {
      // Filter data for selected exercise
      data = sortedWorkouts.map(w => {
        const exercise = w.exercises.find((ex: any) => ex.name === selectedExercise);
        if (!exercise) return 0;
        const weight = convertWeight(exercise.weight, 'kg', unitPreference);
        const reps = exercise.sets.reduce((a: number, b: number) => a + b, 0);
        return weight * reps;
      });
      label = `${selectedExercise} (${unitPreference} × reps)`;
    } else {
      // Total volume across all exercises
      data = sortedWorkouts.map(w => {
        return w.exercises.reduce((total: number, ex: any) => {
          const weight = convertWeight(ex.weight, 'kg', unitPreference);
          const reps = ex.sets.reduce((a: number, b: number) => a + b, 0);
          return total + (weight * reps);
        }, 0);
      });
      label = `${t('total_volume')} (${unitPreference} × reps)`;
    }

    return {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: '#C8956B',
          backgroundColor: 'rgba(200, 149, 107, 0.2)',
          tension: 0.3,
          pointBackgroundColor: '#C8956B',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#C8956B',
          fill: true,
        }
      ]
    };
  }, [profileWorkouts, unitPreference, t, selectedExercise]);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Users size={32} color="var(--primary-color)" />
          {t('friends')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {t('search_connect_friends')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedProfile ? '1fr 2fr' : '1fr', gap: '2rem' }}>
        {/* Search Section */}
        <div style={{ position: 'relative' }}>
          {/* Search Bar */}
          <div style={{
            background: 'var(--surface-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(200, 149, 107, 0.2)',
            marginBottom: '1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            maxWidth: '400px'
          }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)'
                }}
              />
              <input
                type="text"
                placeholder={t('search_by_username')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  background: '#0a0a0a',
                  border: '1px solid rgba(200, 149, 107, 0.3)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(200, 149, 107, 0.3)'}
              />
            </div>
          </div>

          {/* Search Results */}
          {isSearching ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              {t('searching')}...
            </div>
          ) : searchResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {searchResults.map((profile) => (
                <div
                  key={profile.userId}
                  onClick={() => loadProfileDetails(profile)}
                  style={{
                    background: selectedProfile?.userId === profile.userId 
                      ? 'rgba(200, 149, 107, 0.1)' 
                      : 'var(--surface-color)',
                    border: selectedProfile?.userId === profile.userId
                      ? '1px solid var(--primary-color)'
                      : '1px solid rgba(200, 149, 107, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProfile?.userId !== profile.userId) {
                      e.currentTarget.style.background = 'rgba(200, 149, 107, 0.05)';
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProfile?.userId !== profile.userId) {
                      e.currentTarget.style.background = 'var(--surface-color)';
                      e.currentTarget.style.borderColor = 'rgba(200, 149, 107, 0.2)';
                    }
                  }}
                >
                  {/* Profile Picture */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: profile.photoURL 
                      ? `url(${profile.photoURL}) center/cover` 
                      : 'linear-gradient(135deg, #C8956B 0%, #8B6F47 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {!profile.photoURL && (
                      <User size={24} color="#fff" />
                    )}
                  </div>

                  {/* Profile Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      marginBottom: '0.25rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {profile.displayName || profile.username}
                    </div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      @{profile.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm.trim().length >= 2 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
              background: 'var(--surface-color)',
              borderRadius: '12px',
              border: '1px solid rgba(200, 149, 107, 0.2)'
            }}>
              {t('no_users_found')}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
              background: 'var(--surface-color)',
              borderRadius: '12px',
              border: '1px solid rgba(200, 149, 107, 0.2)'
            }}>
              {t('search_users_hint')}
            </div>
          )}

          {/* Following Section */}
          {following.length > 0 && (
            <div style={{ marginBottom: '1.5rem', marginTop: '2rem' }}>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('following')} ({following.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {following.map((profile) => (
                  <div
                    key={profile.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(200, 149, 107, 0.08)',
                      border: '1px solid rgba(200, 149, 107, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => loadProfileDetails(profile)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(200, 149, 107, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(200, 149, 107, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(200, 149, 107, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(200, 149, 107, 0.2)';
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: profile.photoURL
                        ? `url(${profile.photoURL}) center/cover`
                        : 'linear-gradient(135deg, #C8956B 0%, #8B6F47 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '2px solid rgba(200, 149, 107, 0.3)'
                    }}>
                      {!profile.photoURL && (
                        <User size={20} color="#fff" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {profile.displayName || profile.username}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        @{profile.username}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Details Section */}
        {selectedProfile && (
          <div>
            {isLoadingProfile ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                {t('loading')}...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Profile Header */}
                <div style={{
                  background: 'var(--surface-color)',
                  borderRadius: '12px',
                  padding: '2rem',
                  border: '1px solid rgba(200, 149, 107, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: selectedProfile.photoURL 
                      ? `url(${selectedProfile.photoURL}) center/cover` 
                      : 'linear-gradient(135deg, #C8956B 0%, #8B6F47 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {!selectedProfile.photoURL && (
                      <User size={40} color="#fff" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div>
                        <h2 style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          marginBottom: '0.25rem'
                        }}>
                          {selectedProfile.displayName || selectedProfile.username}
                        </h2>
                        <p style={{
                          fontSize: '0.95rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '0.5rem'
                        }}>
                          @{selectedProfile.username}
                        </p>

                        {/* Personal Info (if shared) */}
                        {selectedProfile.sharePersonalInfo && (
                          <div style={{
                            display: 'flex',
                            gap: '1rem',
                            flexWrap: 'wrap',
                            fontSize: '0.9rem',
                            color: 'var(--text-secondary)'
                          }}>
                            {selectedProfile.age && (
                              <span>{selectedProfile.age} {t('years_old')}</span>
                            )}
                            {selectedProfile.gender && (
                              <span>• {t(selectedProfile.gender)}</span>
                            )}
                            {selectedProfile.weight && (
                              <span>• {Math.round(convertWeight(selectedProfile.weight, 'kg', unitPreference) * 10) / 10} {unitPreference}</span>
                            )}
                          </div>
                        )}

                        {/* Registration Date */}
                        {selectedProfile.createdAt && (
                          <div style={{
                            marginTop: '0.75rem',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)'
                          }}>
                            {t('joined')} {formatDate(selectedProfile.createdAt)}
                          </div>
                        )}
                      </div>

                      {/* Follow Button */}
                      <button
                        onClick={() => handleFollow(selectedProfile)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: isFollowing(selectedProfile.userId) ? '#666' : 'var(--primary-color)',
                          color: isFollowing(selectedProfile.userId) ? '#fff' : '#000',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {isFollowing(selectedProfile.userId) ? t('unfollow') : t('follow')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                {/* Routine */}
                {selectedProfile.shareStats && (
                  <div style={{
                    background: 'var(--surface-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(200, 149, 107, 0.2)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: 0
                      }}>
                        {t('routine')}
                      </h3>
                    </div>
                    {profileRoutine.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {profileRoutine.map((day, index) => (
                          <div key={index}>
                            <div style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: 'var(--primary-color)',
                              marginBottom: '0.5rem'
                            }}>
                              {day.dayName}
                            </div>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              {day.exercises.map((exercise, exIndex) => (
                                <span
                                  key={exIndex}
                                  style={{
                                    padding: '0.4rem 0.75rem',
                                    background: 'rgba(200, 149, 107, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    color: 'var(--text-primary)'
                                  }}
                                >
                                  {exercise}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {t('no_routine_shared') || "No routine shared yet."}
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Workouts */}
                {selectedProfile.shareStats && (
                  <div style={{
                    background: 'var(--surface-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(200, 149, 107, 0.2)'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '1rem'
                    }}>
                      {t('workout_history')}
                    </h3>
                    {profileWorkouts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {profileWorkouts.slice(0, 5).map((workout, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '1rem',
                              background: 'rgba(200, 149, 107, 0.05)',
                              borderRadius: '8px',
                              border: '1px solid rgba(200, 149, 107, 0.15)'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '0.75rem'
                            }}>
                              <div>
                                <div style={{
                                  fontSize: '0.95rem',
                                  fontWeight: '600',
                                  color: 'var(--text-primary)'
                                }}>
                                  {formatDate(workout.date)}
                                </div>
                                <div style={{
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '0.25rem'
                                }}>
                                  {workout.exercises.length} exercises
                                </div>
                              </div>
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                              gap: '0.75rem'
                            }}>
                              {workout.exercises.map((exercise: any, exIndex: number) => (
                                <div
                                  key={exIndex}
                                  style={{
                                    padding: '0.75rem',
                                    background: 'rgba(200, 149, 107, 0.1)',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  <div style={{
                                    fontWeight: '500',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.25rem'
                                  }}>
                                    {exercise.name || exercise.exerciseId}
                                  </div>
                                  <div style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.8rem'
                                  }}>
                                    {exercise.weight} {unitPreference} × {exercise.sets.join(', ')} reps
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {profileWorkouts.length > 5 && (
                          <div style={{
                            textAlign: 'center',
                            padding: '1rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem'
                          }}>
                            Showing 5 of {profileWorkouts.length} workouts
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {t('no_workouts_yet') || "No workouts recorded yet."}
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Chart */}
                {selectedProfile.shareStats && (
                  <div style={{
                    background: 'var(--surface-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(200, 149, 107, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <TrendingUp size={20} color="var(--primary-color)" />
                        {t('progress')}
                      </h3>
                      {exerciseNames.length > 0 && (
                        <select
                          value={selectedExercise || ''}
                          onChange={(e) => setSelectedExercise(e.target.value || null)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(200, 149, 107, 0.3)',
                            background: 'var(--bg-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          <option value="">{t('all_exercises_total_volume')}</option>
                          {exerciseNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    {chartData ? (
                      <div style={{ height: '300px', width: '100%' }}>
                        <Line
                          data={chartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              },
                              tooltip: {
                                mode: 'index',
                                intersect: false,
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#fff',
                                bodyColor: '#fff',
                                borderColor: 'rgba(200, 149, 107, 0.3)',
                                borderWidth: 1
                              }
                            },
                            scales: {
                              y: {
                                grid: {
                                  color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                  color: '#FFF'
                                }
                              },
                              x: {
                                grid: {
                                  display: false
                                },
                                ticks: {
                                  color: '#FFF',
                                  maxTicksLimit: 8
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {t('no_data_for_chart') || "No data available for chart."}
                      </div>
                    )}
                  </div>
                )}

                {/* Personal Records */}
                {selectedProfile.sharePersonalRecords && (
                  <div style={{
                    background: 'var(--surface-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(200, 149, 107, 0.2)'
                  }}>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '1rem'
                    }}>
                      {t('personal_records')}
                    </h3>
                    {profilePRs.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {profilePRs.map((pr, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '1rem',
                              background: 'rgba(200, 149, 107, 0.05)',
                              borderRadius: '8px',
                              border: '1px solid rgba(200, 149, 107, 0.15)'
                            }}
                          >
                            <div style={{
                              fontSize: '0.95rem',
                              fontWeight: '500',
                              color: 'var(--text-primary)',
                              marginBottom: '0.75rem',
                              textAlign: 'center'
                            }}>
                              {pr.exerciseName}
                            </div>
                            <div style={{
                              fontSize: '1.75rem',
                              fontWeight: '700',
                              color: 'var(--primary-color)',
                              textAlign: 'center',
                              marginBottom: '0.5rem'
                            }}>
                              {pr.maxWeight}
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              textAlign: 'center'
                            }}>
                              {unitPreference} • {formatDate(pr.date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        {t('no_personal_records') || "This user doesn't have any PR registered"}
                      </div>
                    )}
                  </div>
                )}

                {/* Privacy Notice */}
                {(!selectedProfile.shareStats && !selectedProfile.sharePersonalRecords && !selectedProfile.sharePersonalInfo) && (
                  <div style={{
                    background: 'var(--surface-color)',
                    borderRadius: '12px',
                    padding: '2rem',
                    border: '1px solid rgba(200, 149, 107, 0.2)',
                    textAlign: 'center'
                  }}>
                    <Lock size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      {t('profile_private')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
