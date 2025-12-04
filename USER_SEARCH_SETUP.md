# Complete User Search Setup Guide

The user search feature requires proper Firebase/Firestore configuration. Follow this guide to get it working.

## TL;DR (Quick Setup - 10 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create Firestore Database (if not exists)
3. Go to Firestore → Rules
4. Copy-paste the rules from `public/firestore.rules` file
5. Click Publish
6. Refresh your app (Ctrl+Shift+R)
7. Set your username in Settings
8. Have friends set their usernames
9. Search should work!

---

## Detailed Setup

### 1. Create Firestore Database

1. Open [Firebase Console](https://console.firebase.google.com)
2. Click your Prodegi project
3. In left sidebar, click **Firestore Database**
4. If no database exists, click **Create Database**
5. In the dialog:
   - **Location**: Choose nearest to you (us-central1 default)
   - **Start in**: Select **Test mode**
   - Click **Create**
6. Wait 1-2 minutes for initialization

### 2. Update Security Rules

1. In Firestore, click **Rules** tab
2. Select ALL text (Ctrl+A)
3. Delete it
4. Copy-paste this entire rule set:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Public profiles can be read by anyone (for search)
    // Only the user can write to their own profile
    match /publicProfiles/{userId} {
      allow read: if true;
      allow create, update, delete: if request.auth.uid == userId;
    }

    // Username reservations - prevent duplicate usernames
    match /usernameReservations/{username} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

5. Click the **Publish** button (blue button on right side)
6. Wait for "Rules published successfully" message
7. Refresh your browser

### 3. Verify Database Structure

Go to Firestore → **Data** tab. You should see (or see after users sign up):

- `users/` collection
  - Contains user workout data, history, routines
  - Each user can only see their own document
  - Only visible to that user

- `publicProfiles/` collection
  - Contains searchable user profiles
  - Anyone can read (for search)
  - Only the user can write
  - This is what enables user discovery

- `usernameReservations/` collection
  - Prevents duplicate usernames
  - Anyone can read
  - Authenticated users can write

### 4. How User Search Works

1. **User sets username** in Settings page
2. **Firebase Auth** stores username as `displayName`
3. **StoreContext** creates public profile in Firestore
4. **Public profile** contains: username, displayName, photo, privacy settings
5. **Search** queries `publicProfiles` collection
6. **Results** filtered client-side with `.includes()` for flexibility

### 5. Testing the Setup

#### Test 1: Check if profiles are created

```javascript
// In browser console (F12)
await window.__testPublicProfile()
```

Should show all public profiles. If empty:
- Check if users have set usernames
- Check console for errors
- Verify Firestore Rules are published

#### Test 2: Check your user

```javascript
// In browser console
firebase.auth().currentUser
```

Should show:
- `uid`: Your user ID
- `displayName`: Your username (or null if not set)
- `email`: Your email

If `displayName` is null:
- Go to Settings
- Set your username
- Wait 3 seconds
- Run the test again

#### Test 3: Search for a user

1. Go to Friends page
2. Type a username in search (2+ characters)
3. Check console for search logs
4. Results should appear

---

## Understanding the Collections

### `users` Collection
**Purpose**: Stores user's private data

**Structure**:
```
users/{userId}/
├── name: "John Doe"
├── age: 25
├── weight: 72
├── gender: "male"
├── shareProfile: true
├── shareStats: true
├── sharePersonalInfo: false
├── sharePersonalRecords: true
├── history: [ ... workout sessions ... ]
├── routine: [ ... routine days ... ]
└── personalRecords: [ ... PRs ... ]
```

**Security**: Only user themselves can read/write

### `publicProfiles` Collection
**Purpose**: Makes users searchable and discoverable

**Structure**:
```
publicProfiles/{userId}/
├── userId: "user123"
├── username: "johndoe"        // lowercase for case-insensitive search
├── displayName: "John Doe"    // shown in search results
├── photoURL: "https://..."
├── shareProfile: true         // main privacy flag
├── shareStats: true           // control what's visible
├── sharePersonalInfo: false
├── sharePersonalRecords: true
├── totalWorkouts: 15
├── totalVolume: 5000
├── exerciseCount: 8
├── createdAt: "2025-12-03T..."
└── updatedAt: "2025-12-03T..."
```

**Security**: Everyone can read (for search), only user can write

### `usernameReservations` Collection
**Purpose**: Prevent duplicate usernames

**Structure**:
```
usernameReservations/{username}/
├── userId: "user123"
└── reservedAt: "2025-12-03T..."
```

**Security**: Everyone can read, authenticated users can write

---

## Troubleshooting

### ❌ "Permission denied" error

**Problem**: Firestore Rules blocking access

**Solution**:
1. Go to Firestore → Rules
2. Make sure rules are exactly as above
3. Click **Publish**
4. Refresh page (Ctrl+Shift+R)

### ❌ No profiles showing in `__testPublicProfile()`

**Problem**: Users don't have usernames set

**Solution**:
1. Go to Settings
2. Set your username
3. Wait 3 seconds for sync
4. Run test again

**Why**: Usernames trigger public profile creation

### ❌ Search returns 0 results

**Problem 1**: User's `shareProfile` is false
- **Solution**: Go to Settings → Privacy → Enable "Share my profile"

**Problem 2**: Username doesn't match
- **Solution**: Search uses `.includes()`, so "john" finds "johnny"

**Problem 3**: User document not fully synced
- **Solution**: Wait a few seconds and try again

### ❌ Can see profile but not other privacy settings

**Expected behavior!** Privacy settings work like this:
- `shareProfile: true` → User is searchable
- `shareStats: true` → Can see workouts/routine
- `sharePersonalRecords: true` → Can see PRs
- `sharePersonalInfo: true` → Can see age/gender/weight

You can have `shareProfile: true` but `shareStats: false` = user is findable but details are hidden.

---

## Common Issues and Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `PERMISSION_DENIED` | Rules not published | Publish rules |
| No profiles found | Username not set | Go to Settings, set username |
| Search is slow | Large user base | Normal, uses client-side filtering |
| Can't find friend | Friend's shareProfile is false | Friend goes to Settings, enables sharing |
| Empty displayName | Never set username | Go to Settings, set username |
| Username shows as null | Sync hasn't completed | Wait 3 seconds, refresh |

---

## How Privacy Works

### All users see:
- Your `displayName` (required to display)
- Your `username` (required for search)
- Whether you have a public profile

### Based on `shareProfile`:
- **true**: You appear in search results
- **false**: You don't appear in search (but friends who follow you still see you)

### Based on `shareStats`:
- **true**: Others see your routine, workout history, total workouts
- **false**: That info is hidden

### Based on `sharePersonalRecords`:
- **true**: Others see your personal records (PR list)
- **false**: Personal records are hidden

### Based on `sharePersonalInfo`:
- **true**: Others see your age, gender, weight
- **false**: That info is hidden

---

## Database Limits

These are Firestore free tier limits (more than enough for most apps):

| Metric | Limit |
|--------|-------|
| Documents | 1 million |
| Data storage | 1 GB |
| Reads/day | 50,000 |
| Writes/day | 20,000 |
| Deletes/day | 20,000 |

For user search with < 10k users, you'll use ~2-5% of free tier.

---

## Performance Notes

### Current approach:
- Fetches ALL profiles client-side
- Filters with `.includes()`
- Works great for < 10k users
- Search takes ~100-200ms for 1000 users

### For large scale (100k+ users):
- Consider Algolia or similar
- Implement server-side pagination
- Use Firestore full-text search (when available)

---

## Next Steps

1. ✅ Create Firestore Database
2. ✅ Set Security Rules
3. ✅ Set your username in Settings
4. ✅ Have friends set their usernames
5. ✅ Search for friends in Friends page
6. ✅ Share your profile with friends

**Questions?** Check the console logs or review this guide again.

Good luck! 🚀
