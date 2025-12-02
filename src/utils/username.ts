import { db } from '../config/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const usernameLower = username.toLowerCase().trim();
  const usernameRef = doc(db, 'usernames', usernameLower);
  const usernameSnap = await getDoc(usernameRef);
  return !usernameSnap.exists();
}

/**
 * Reserve a username for a user
 * Returns true if successful, false if username is already taken
 */
export async function reserveUsername(username: string, userId: string): Promise<boolean> {
  const usernameLower = username.toLowerCase().trim();
  const usernameRef = doc(db, 'usernames', usernameLower);
  
  try {
    // Check if username is already taken
    const usernameSnap = await getDoc(usernameRef);
    if (usernameSnap.exists()) {
      // Check if it's owned by the same user (updating their own username)
      const existingUserId = usernameSnap.data().userId;
      if (existingUserId !== userId) {
        return false; // Username taken by another user
      }
    }
    
    // Reserve the username
    await setDoc(usernameRef, {
      userId,
      createdAt: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('Error reserving username:', error);
    return false;
  }
}

/**
 * Release a username (when user changes their username)
 */
export async function releaseUsername(username: string, userId: string): Promise<void> {
  const usernameLower = username.toLowerCase().trim();
  const usernameRef = doc(db, 'usernames', usernameLower);
  
  try {
    // Verify ownership before deleting
    const usernameSnap = await getDoc(usernameRef);
    if (usernameSnap.exists() && usernameSnap.data().userId === userId) {
      await deleteDoc(usernameRef);
    }
  } catch (error) {
    console.error('Error releasing username:', error);
  }
}

/**
 * Get userId from username
 */
export async function getUserIdFromUsername(username: string): Promise<string | null> {
  const usernameLower = username.toLowerCase().trim();
  const usernameRef = doc(db, 'usernames', usernameLower);
  const usernameSnap = await getDoc(usernameRef);
  
  if (usernameSnap.exists()) {
    return usernameSnap.data().userId;
  }
  
  return null;
}
