# Complete User Search Fix - Step by Step

Your Prodegi app is properly configured. The issue is likely in Firebase Firestore security rules. Follow these exact steps to fix it.

## Your Project Info
- **Project ID**: progredi-1
- **Auth Domain**: progredi-1.firebaseapp.com
- **Database**: progredi-1 (Firestore)

---

## STEP 1: Go to Firebase Console

1. Open: https://console.firebase.google.com
2. Make sure you're logged in with the Google account that owns the Prodegi project
3. Click on the **progredi-1** project

---

## STEP 2: Navigate to Firestore

1. In the left sidebar, click **Firestore Database**
2. You should see a Firestore database (or option to create one)
3. If no database exists:
   - Click "Create Database"
   - Choose region: **us-central1** (or your preferred region)
   - Start mode: **Test mode** (for development)
   - Click **Create**

---

## STEP 3: Update Security Rules (IMPORTANT!)

1. In Firestore, click the **Rules** tab
2. Delete all existing text
3. Copy-paste **EXACTLY** this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /publicProfiles/{userId} {
      allow read: if true;
      allow create, update, delete: if request.auth.uid == userId;
    }
    match /usernameReservations/{username} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

4. Click **Publish** (big blue button on the right)
5. Wait for "Rules published successfully" message
6. Do NOT close the tab yet

---

## STEP 4: Check If Database Exists

Still in Firestore:

1. Click **Data** tab
2. Do you see any collections? (users, publicProfiles, usernameReservations)
   - **YES** → Go to STEP 5
   - **NO** → Don't worry, they'll be created automatically

---

## STEP 5: Go Back to Your App

1. Close Firebase console
2. Open your Prodegi app in browser
3. Do a **hard refresh**: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
4. If you're logged out, log back in

---

## STEP 6: Set Your Username

1. Go to **Settings** page
2. Look for section with "Name & Username"
3. Click **Edit** button
4. Fill in:
   - **Name**: Your full name
   - **Username**: Something unique (e.g., "john", "daniel123", "your_name")
5. Click **Save**
6. Wait 3 seconds - you should see a success message

**Important**: The username is what friends will search for!

---

## STEP 7: Verify Profile Was Created

1. Open browser DevTools: **F12**
2. Click **Console** tab
3. Paste this command:

```javascript
await window.__testPublicProfile()
```

4. Press **Enter**
5. You should see output like:

```
[searchUsersByUsername] Found 1 profiles for "admin"
Profile: {username: 'john', userId: 'user123', displayName: 'John', ...}
All profiles: Array(1) [ {...} ]
✅ Found 1 profiles
```

**If you see your profile** → Go to STEP 8
**If you see empty/0 profiles** → See "Troubleshooting" below

---

## STEP 8: Have Friends Set Their Username

Send your friend (daniel) this:

> 1. Log in to Prodegi app
> 2. Go to **Settings**
> 3. Click **Edit** in "Name & Username" section
> 4. Set **Username** to: daniel
> 5. Click **Save**
> 6. Wait 3 seconds

---

## STEP 9: Test Search

1. In YOUR Prodegi app
2. Go to **Friends** page
3. In the search box, type: **dan** or **daniel**
4. Press Enter or wait for results
5. Your friend should appear!

---

## STEP 10: Privacy Settings (Optional)

If friend appears but details aren't showing:

1. Your friend goes to **Settings**
2. Scroll to **Privacy Settings**
3. Enable what they want to share:
   - "Share my profile with others" ✅
   - "Share my workout stats" ✅
   - "Share my personal records" ✅
   - "Share my personal info" (age, weight, gender) - optional

---

## 🔍 Troubleshooting

### Problem: `await window.__testPublicProfile()` shows empty array

**Check 1**: Are you logged in?
```javascript
firebase.auth().currentUser
```
Should show your user info. If null, log in first.

**Check 2**: Did you set a username?
```javascript
firebase.auth().currentUser.displayName
```
Should show your username. If null:
- Go to Settings
- Set username
- Wait 3 seconds
- Try test again

**Check 3**: Are Firestore rules published?
1. Go to Firebase Console
2. Firestore → Rules
3. Check if rules are there and show "Published" (green checkmark)
4. If not, click **Publish**

**Check 4**: Check browser console for errors
Look for red error messages like:
- `PERMISSION_DENIED` → Rules issue
- `not-found` → Database not created
- `Permission denied` → Rules not published

### Problem: Permission denied error

**Cause**: Firestore rules not properly published

**Fix**:
1. Go to Firebase Console → Firestore → Rules
2. Clear all text
3. Paste the rules from STEP 3 exactly
4. Click **Publish**
5. Refresh browser (Ctrl+Shift+R)

### Problem: Search shows 0 results

**Check 1**: Friend's profile exists
```javascript
await window.__testPublicProfile()
```
Should include your friend's profile.

**Check 2**: Friend's `shareProfile` is enabled
Your friend goes to Settings → Privacy Settings → "Share my profile with others" ✅

**Check 3**: You're searching correctly
- Search uses partial matching
- "dan" will find "daniel"
- Search is case-insensitive
- Searches in `username` field only

### Problem: "Settings updated" but profile doesn't appear

**Why**: Profile sync has slight delay (1-5 seconds)

**Fix**:
1. Wait 5 seconds
2. Open DevTools console
3. Run `await window.__testPublicProfile()` again
4. If still empty, check for errors in console

---

## Expected Data Structure

After setup, your Firestore should have:

```
users/
  {your_user_id}/
    - name: "Your Name"
    - age: 25
    - weight: 72
    - gender: "male"
    - shareProfile: true
    - history: [...]
    - routine: [...]

publicProfiles/
  {your_user_id}/
    - userId: "user123"
    - username: "john"
    - displayName: "Your Name"
    - shareProfile: true
    - shareStats: true
    - sharePersonalRecords: true
    - sharePersonalInfo: false
    - createdAt: "2025-12-03T..."
    - updatedAt: "2025-12-03T..."

usernameReservations/
  john/
    - userId: "user123"
    - reservedAt: "2025-12-03T..."
```

Check Firestore → Data tab to see if these collections exist with data.

---

## Quick Checklist ✅

- [ ] Firebase Console open, progredi-1 project selected
- [ ] Firestore Database created
- [ ] Security rules published (copy-pasted exactly)
- [ ] Browser hard-refreshed (Ctrl+Shift+R)
- [ ] Logged into Prodegi app
- [ ] Set your username in Settings
- [ ] Waited 3 seconds
- [ ] `await window.__testPublicProfile()` shows your profile
- [ ] Friend set their username
- [ ] Can search for and find friend in Friends page
- [ ] Friend's privacy settings allow sharing

---

## Still Not Working?

Open DevTools (F12) → Console and tell me:

1. Output of:
```javascript
await window.__testPublicProfile()
```

2. Output of:
```javascript
firebase.auth().currentUser
```

3. Any red errors visible in console

4. Check Firestore → Data tab:
   - Does `publicProfiles` collection exist?
   - Are there documents in it?
   - What fields do they have?

With this info, I can debug further!

---

## How It Works (Technical)

1. **User sets username** in Settings
2. **Firebase Auth** stores it as `displayName`
3. **StoreContext** detects change via dependency array
4. **updatePublicProfile** creates/updates entry in `publicProfiles` collection
5. **Public profile** contains searchable username (lowercase)
6. **Friends page** calls `searchUsersByUsername()`
7. **Search function** fetches all `publicProfiles`, filters client-side
8. **Results** sorted by relevance (exact → startsWith → contains)
9. **Privacy settings** applied (only show if `shareProfile: true`)

---

## Important Notes

- **Usernames are unique** (enforced by `usernameReservations`)
- **Usernames are case-insensitive** (stored lowercase, searched lowercase)
- **Search is client-side** (fetches all profiles, filters locally - works for <10k users)
- **Privacy works per-user** (each user controls what they share)
- **Sync has ~1-5 second delay** (wait a few seconds before testing)

---

Good luck! If you get stuck, check the console logs or let me know what error messages you see. 🚀
