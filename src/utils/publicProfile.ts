import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { PublicProfile, UserState, PublicStats, PublicPersonalRecord } from '../types';
import { reserveUsername } from './username';

/**
 * Create or update a user's public profile
 */
export async function updatePublicProfile(
  userId: string,
  username: string,
  userState: UserState,
  displayName?: string,
  photoURL?: string
): Promise<void> {
  // Reserve the username first (this ensures uniqueness)
  const reserved = await reserveUsername(username, userId);
  if (!reserved) {
    console.error('[updatePublicProfile] Username already taken:', username);
    throw new Error('Username is already taken');
  }

  // Get existing profile to preserve createdAt
  const existingProfileRef = doc(db, 'publicProfiles', userId);
  const existingProfile = await getDoc(existingProfileRef);
  const createdAt = existingProfile.exists() ? existingProfile.data().createdAt : new Date().toISOString();

  const publicProfile: PublicProfile = {
    userId,
    username: username.toLowerCase(), // Store lowercase for case-insensitive search
    displayName: displayName || username,
    photoURL,
    createdAt,
    updatedAt: new Date().toISOString(),
    // Privacy settings
    shareProfile: userState.shareProfile ?? true,
    shareStats: userState.shareStats ?? true,
    sharePersonalRecords: userState.sharePersonalRecords ?? true,
    sharePersonalInfo: userState.sharePersonalInfo ?? false,
  };

  // Add personal info if sharing is enabled, otherwise explicitly set to undefined
  if (userState.sharePersonalInfo) {
    publicProfile.name = userState.name;
    publicProfile.age = userState.age;
    publicProfile.gender = userState.gender;
    publicProfile.weight = userState.weight;
  } else {
    // Explicitly remove personal info when sharing is disabled
    publicProfile.name = undefined;
    publicProfile.age = undefined;
    publicProfile.gender = undefined;
    publicProfile.weight = undefined;
  }

  // Add stats if sharing is enabled, otherwise clear them
  if (userState.shareStats) {
    publicProfile.totalWorkouts = userState.history?.length || 0;

    // Calculate total volume and exercise count
    let totalVolume = 0;
    const exerciseSet = new Set<string>();

    userState.history?.forEach(session => {
      session.exercises.forEach(exercise => {
        exerciseSet.add(exercise.exerciseId);
        const sets = exercise.sets || [];
        const exerciseVolume = sets.reduce((sum, reps) => sum + reps, 0) * exercise.weight;
        totalVolume += exerciseVolume;
      });
    });

    publicProfile.totalVolume = totalVolume;
    publicProfile.exerciseCount = exerciseSet.size;

    if (userState.history && userState.history.length > 0) {
      // Sort by date and get the most recent
      const sortedHistory = [...userState.history].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      publicProfile.lastWorkoutDate = sortedHistory[0].date;
    }
  } else {
    // Clear stats when sharing is disabled
    publicProfile.totalWorkouts = undefined;
    publicProfile.totalVolume = undefined;
    publicProfile.exerciseCount = undefined;
    publicProfile.lastWorkoutDate = undefined;
  }

  await setDoc(existingProfileRef, publicProfile);
}

/**
 * Search for users by username
 */
export async function searchUsersByUsername(searchTerm: string): Promise<PublicProfile[]> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  const searchLower = searchTerm.toLowerCase().trim();
  const profilesRef = collection(db, 'publicProfiles');
  
  // Search for usernames that start with the search term
  const q = query(
    profilesRef,
    where('username', '>=', searchLower),
    where('username', '<=', searchLower + '\uf8ff'),
    limit(20)
  );

  const querySnapshot = await getDocs(q);
  const profiles: PublicProfile[] = [];

  querySnapshot.forEach((doc) => {
    profiles.push(doc.data() as PublicProfile);
  });

  return profiles;
}

/**
 * Get a user's public profile by userId
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const profileRef = doc(db, 'publicProfiles', userId);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    return profileSnap.data() as PublicProfile;
  }

  return null;
}

/**
 * Get public stats for a user
 */
export async function getPublicStats(userId: string): Promise<PublicStats | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  const userData = userSnap.data() as UserState;

  // Check if user allows sharing stats
  if (!userData.shareStats) {
    return null;
  }

  const history = userData.history || [];
  
  // Calculate total volume
  let totalVolume = 0;
  const exerciseSet = new Set<string>();

  history.forEach(session => {
    session.exercises.forEach(exercise => {
      exerciseSet.add(exercise.exerciseId);
      const sets = exercise.sets || [];
      const exerciseVolume = sets.reduce((sum, reps) => sum + reps, 0) * exercise.weight;
      totalVolume += exerciseVolume;
    });
  });

  const stats: PublicStats = {
    totalVolume,
    totalWorkouts: history.length,
    exerciseCount: exerciseSet.size,
  };

  if (history.length > 0) {
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    stats.lastWorkoutDate = sortedHistory[0].date;
  }

  return stats;
}

/**
 * Get public personal records for a user
 */
export async function getPublicPersonalRecords(userId: string): Promise<PublicPersonalRecord[]> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const userData = userSnap.data() as UserState;

  // Check if user allows sharing personal records
  if (!userData.sharePersonalRecords) {
    return [];
  }

  const personalRecords = userData.personalRecords || [];
  
  return personalRecords.map(pr => {
    // Get the max weight from all entries
    const maxEntry = pr.entries.reduce((max, entry) => 
      entry.weight > max.weight ? entry : max
    , pr.entries[0]);

    return {
      exerciseName: pr.exerciseName,
      maxWeight: maxEntry.weight,
      date: maxEntry.date,
    };
  });
}

/**
 * Get user's routine (exercise names only, no weights/sets details)
 */
export async function getPublicRoutine(userId: string): Promise<{ dayName: string; exercises: string[] }[]> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const userData = userSnap.data() as UserState;

  // Check if user allows sharing stats (routine is part of stats)
  if (!userData.shareStats) {
    return [];
  }

  const routine = userData.routine || [];

  return routine.map(day => ({
    dayName: day.name,
    exercises: day.exercises.map(ex => ex.name),
  }));
}

/**
 * Get public workout history for a user
 */
export async function getPublicWorkoutHistory(userId: string): Promise<any[]> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return [];
  }

  const userData = userSnap.data() as UserState;

  // Check if user allows sharing stats
  if (!userData.shareStats) {
    return [];
  }

  const history = userData.history || [];

  // Return workouts sorted by date (newest first)
  return [...history].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
