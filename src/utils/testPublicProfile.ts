/**
 * Test utility for debugging public profile sync
 * Run in browser console: window.__testPublicProfile()
 */

import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function testPublicProfileSync() {
  try {
    console.log('=== Testing Public Profile Sync ===');

    // Get all public profiles from Firestore
    const profilesRef = collection(db, 'publicProfiles');
    const snapshot = await getDocs(profilesRef);

    console.log(`Total profiles in Firestore: ${snapshot.size}`);

    const profiles: any[] = [];
    snapshot.forEach((doc) => {
      const profile = doc.data();
      profiles.push(profile);
      console.log(`Profile: ${profile.username} (${doc.id})`, profile);
    });

    console.log('All profiles:', profiles);

    if (profiles.length === 0) {
      console.warn('⚠️ No profiles found! Make sure users have set their displayName/username.');
    } else {
      console.log(`✅ Found ${profiles.length} profiles`);
    }

    return profiles;
  } catch (error) {
    console.error('❌ Error testing profiles:', error);
    return [];
  }
}

// Expose to window for browser console access
declare global {
  interface Window {
    __testPublicProfile: () => Promise<any[]>;
  }
}

if (typeof window !== 'undefined') {
  window.__testPublicProfile = testPublicProfileSync;
}
