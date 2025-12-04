import { db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
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
    username: username.toLowerCase(),
    displayName: displayName || username,
    photoURL,
    createdAt,
    updatedAt: new Date().toISOString(),
    shareProfile: userState.shareProfile ?? true,
    shareStats: userState.shareStats ?? true,
    sharePersonalRecords: userState.sharePersonalRecords ?? true,
    sharePersonalInfo: userState.sharePersonalInfo ?? false,
  };

  // Add personal info only if sharing is enabled and values exist
  // Firestore does not support undefined values, so only add fields with actual values
  if (userState.sharePersonalInfo) {
    if (userState.name) publicProfile.name = userState.name;
    if (userState.age) publicProfile.age = userState.age;
    if (userState.gender) publicProfile.gender = userState.gender;
    if (userState.weight) publicProfile.weight = userState.weight;
  }

  // Add stats if sharing is enabled (default to true)
  if (userState.shareStats !== false) {
    publicProfile.totalWorkouts = userState.history?.length || 0;

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
      const sortedHistory = [...userState.history].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      publicProfile.lastWorkoutDate = sortedHistory[0].date;
    }
  }

  await setDoc(existingProfileRef, publicProfile);
}

/**
 * Search for users by username
 * Simple approach: fetch all profiles and filter client-side
 * This is the most reliable and widely used method across platforms
 */
export async function searchUsersByUsername(searchTerm: string): Promise<PublicProfile[]> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  const searchLower = searchTerm.toLowerCase().trim();
  const profilesRef = collection(db, 'publicProfiles');

  try {
    const querySnapshot = await getDocs(profilesRef);
    const profiles: PublicProfile[] = [];

    querySnapshot.forEach((doc) => {
      const profile = doc.data() as PublicProfile;
      if (profile.username && profile.username.toLowerCase().includes(searchLower)) {
        profiles.push(profile);
      }
    });

    profiles.sort((a, b) => {
      const aUsername = a.username?.toLowerCase() || '';
      const bUsername = b.username?.toLowerCase() || '';

      if (aUsername === searchLower) return -1;
      if (bUsername === searchLower) return 1;

      if (aUsername.startsWith(searchLower) && !bUsername.startsWith(searchLower)) return -1;
      if (bUsername.startsWith(searchLower) && !aUsername.startsWith(searchLower)) return 1;

      return aUsername.localeCompare(bUsername);
    });

    console.log(`[searchUsersByUsername] Found ${profiles.length} profiles for "${searchTerm}"`);
    return profiles.slice(0, 20);
  } catch (error) {
    console.error('[searchUsersByUsername] Error:', error);
    return [];
  }
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

  if (userData.shareStats === false) {
    return null;
  }

  const history = userData.history || [];

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

  if (userData.sharePersonalRecords === false) {
    return [];
  }

  const personalRecords = userData.personalRecords || [];

  return personalRecords.map(pr => {
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

  if (userData.shareStats === false) {
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

  if (userData.shareStats === false) {
    return [];
  }

  const history = userData.history || [];

  // Build a map of exerciseId -> exerciseName from the routine
  const exerciseNameMap = new Map<string, string>();
  (userData.routine || []).forEach(day => {
    day.exercises.forEach(exercise => {
      exerciseNameMap.set(exercise.id, exercise.name);
    });
  });

  // Add exercise names to workout data
  const enrichedHistory = history.map(({ notes, ...session }) => ({
    ...session,
    exercises: session.exercises.map(exercise => ({
      ...exercise,
      name: exerciseNameMap.get(exercise.exerciseId) || exercise.exerciseId
    }))
  }));

  return enrichedHistory.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
