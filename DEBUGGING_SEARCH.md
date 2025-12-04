# Debugging User Search

If user search isn't working, follow these steps:

## Step 1: Check if Public Profiles Exist

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this command:

```javascript
await window.__testPublicProfile()
```

This will:
- List all public profiles in Firestore
- Show their usernames and IDs
- Tell you if any profiles exist

## Step 2: Verify Your User Has a DisplayName

1. Check your user object:
```javascript
firebase.auth().currentUser
```

Look for the `displayName` property - it should NOT be null.

2. If `displayName` is null or missing, you need to set it:
   - Go to Settings page
   - Set your username (this will set your Firebase displayName)
   - Wait 2-3 seconds for sync to complete

## Step 3: Check Console Logs

Watch the browser console while:
1. Logging in
2. Setting username in Settings
3. Going to Friends page
4. Searching

Look for logs starting with:
- `[StoreContext]` - Public profile sync logs
- `[searchUsersByUsername]` - Search function logs
- `[updatePublicProfile]` - Profile creation logs

## Step 4: Manual Search Test

1. Go to Friends page
2. Type a username in the search box
3. Check console for:
   - How many profiles were fetched
   - If search results were found
   - Any errors

## Common Issues

### No profiles found
- ✅ Check: Do all users have displayNames set?
- ✅ Check: Are users' `shareProfile` settings enabled?
- ✅ Check: Look at Firestore under "publicProfiles" collection manually

### Search returns results but doesn't display
- ✅ Check: Are results filtered out by the `shareProfile !== false` check in Friends.tsx?
- ✅ Check: Console for errors in profile loading

### Search is very slow
- ✅ Note: This is normal with client-side filtering. It fetches all profiles and filters them.
- ✅ If you have thousands of users, consider server-side indexing

## Database Structure

Expected Firestore structure:

```
users/
  {userId}/
    name: string
    age: number
    weight: number
    displayName: string (set via Firebase)
    ...

publicProfiles/
  {userId}/
    userId: string
    username: string (lowercase)
    displayName: string
    photoURL: string
    shareProfile: boolean
    shareStats: boolean
    sharePersonalInfo: boolean
    createdAt: string
    updatedAt: string
    ...
```

The key is that:
- Users need a `displayName` set in Firebase Auth
- This triggers creation of `publicProfiles` document
- `publicProfiles/username` must be lowercase for search to work
