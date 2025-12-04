# Firebase Setup for User Search

The user search feature requires proper Firestore setup. Here's what you need to do:

## 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your Prodegi project
3. Go to **Firestore Database** (left sidebar)
4. Click **Create Database**
5. Choose:
   - Location: Your preferred region
   - Security rules: Start in **test mode** (for development)
6. Click **Create**

## 2. Set Firestore Security Rules

Go to **Firestore Database** → **Rules** tab

Replace the rules with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Public profiles can be read by anyone, written by the owner
    match /publicProfiles/{userId} {
      allow read: if true;
      allow create, update, delete: if request.auth.uid == userId;
    }

    // Username reservation collection
    match /usernameReservations/{username} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish** to save.

## 3. Create Required Collections (Optional)

Firestore will auto-create collections when you first write data, but you can manually create them:

1. Click **Start Collection**
2. Create these collections (optional - they'll be created automatically):
   - `users` - stores user data (name, age, weight, workout history, etc.)
   - `publicProfiles` - stores publicly searchable user profiles
   - `usernameReservations` - stores reserved usernames

## 4. Verify Setup

### Check if data is being saved:

1. Go to **Firestore Database** → **Data** tab
2. You should see these collections after users sign up and set usernames:
   - `users/{userId}` - contains user's workout data
   - `publicProfiles/{userId}` - contains searchable profile
   - `usernameReservations/{username}` - contains username reservations

### Test public profile creation:

1. Log in to the app
2. Go to Settings
3. Set your username
4. Check Firestore:
   - Go to `publicProfiles` collection
   - You should see a document with your userId
   - It should contain: username, displayName, photoURL, shareProfile flags, etc.

## 5. Troubleshooting

### No data appearing in Firestore?

**Check 1: Authentication**
- Go to **Authentication** (left sidebar)
- Make sure you're logged in
- Check that your user appears in the Users list

**Check 2: Firestore Rules**
- Make sure rules are published
- Rules should allow `allow write:` for authenticated users
- Check browser console for "Permission denied" errors

**Check 3: Console Logs**
- Open DevTools (F12) → Console
- Look for errors like:
  - `Permission denied` - Rules issue
  - `PERMISSION_DENIED` - Rules issue
  - `public profile synced` - Success message

### Can't find profiles in search?

**Check 1: Profiles exist in Firestore**
```javascript
await window.__testPublicProfile()
```
This should list all profiles. If it returns 0, go back to "Check data appearing" above.

**Check 2: Username is lowercase**
- Profiles store username in lowercase
- Search converts to lowercase before searching
- Both should match

**Check 3: Share settings enabled**
- Check that `shareProfile: true` in the public profile
- Go to Settings → Privacy Settings and enable "Share my profile"

## 6. Database Structure

After setup, your Firestore should look like:

```
users/
├── user123/
│   ├── name: "John Doe"
│   ├── age: 25
│   ├── weight: 72 (in kg)
│   ├── gender: "male"
│   ├── history: [workout sessions...]
│   ├── routine: [routine days...]
│   ├── shareProfile: true
│   ├── shareStats: true
│   └── ...

publicProfiles/
├── user123/
│   ├── userId: "user123"
│   ├── username: "johndoe"
│   ├── displayName: "John Doe"
│   ├── photoURL: null or url
│   ├── shareProfile: true
│   ├── shareStats: true
│   ├── sharePersonalRecords: true
│   ├── sharePersonalInfo: false
│   ├── totalWorkouts: 15
│   ├── totalVolume: 5000
│   ├── exerciseCount: 8
│   ├── createdAt: "2025-12-03T..."
│   └── updatedAt: "2025-12-03T..."

usernameReservations/
├── johndoe/
│   ├── userId: "user123"
│   └── reservedAt: "2025-12-03T..."
```

## 7. Common Firestore Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `PERMISSION_DENIED` | Security rules blocking access | Update rules, ensure authenticated |
| `NOT_FOUND` | Collection doesn't exist | Collections are created automatically on first write |
| `INVALID_ARGUMENT` | Bad query syntax | Check that fields exist in documents |
| `Resource exhausted` | Too many reads | Optimize queries, use limits |

## 8. Performance Tips

- Search fetches ALL profiles client-side (works well for < 10k users)
- For large user bases, consider:
  - Server-side pagination
  - Algolia or similar search service
  - Firestore Full-Text Search (when available)

## Summary Checklist

- [ ] Firestore Database created
- [ ] Security rules published
- [ ] User can sign up / log in
- [ ] User can set username in Settings
- [ ] Public profile appears in `publicProfiles` collection
- [ ] `window.__testPublicProfile()` shows profiles
- [ ] Search in Friends page finds users
- [ ] Privacy settings are working

If you complete these steps and search still doesn't work, check:
1. Browser console for errors
2. Firestore data actually exists
3. Users have `displayName` set
4. `shareProfile` is `true` for searchable users
