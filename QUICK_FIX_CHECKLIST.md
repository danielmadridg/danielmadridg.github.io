# Quick Fix Checklist for User Search

Follow these steps in order to fix the search not working:

## ✅ Step 1: Verify Firestore is Set Up (5 min)

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your Prodegi project
3. Click **Firestore Database** on the left
4. Do you see a database listed?
   - **YES** → Go to Step 2
   - **NO** → You need to create one:
     - Click "Create Database"
     - Choose "Start in test mode"
     - Click Create
     - Wait for it to initialize

## ✅ Step 2: Check Firestore Security Rules (2 min)

1. In Firestore, go to **Rules** tab
2. Replace ALL existing text with this:

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

3. Click **Publish** (blue button on right)
4. Wait for "Rules updated" confirmation

## ✅ Step 3: Refresh the App

1. Go back to your Prodegi app
2. Press **Ctrl+Shift+R** (hard refresh) or **Cmd+Shift+R** (Mac)
3. If logged in, stay logged in
4. If not, log in again

## ✅ Step 4: Set Your Username

1. Go to **Settings** page
2. Look for "Name & Username" section
3. Click **Edit** button
4. Set a Username (e.g., "john" or "daniel")
5. Click **Save**
6. Wait 2-3 seconds (you should see "Settings updated" message)

## ✅ Step 5: Verify Profile Was Created

1. Open **DevTools** (F12)
2. Click **Console** tab
3. Run this command:

```javascript
await window.__testPublicProfile()
```

4. Look at the output:
   - **See your username in the list?** → Go to Step 6
   - **Empty list or error?** → Check console errors (see Troubleshooting below)

## ✅ Step 6: Have Friend Set Their Username

1. Send this to your friend (daniel):
   - "Go to Settings → Name & Username → Click Edit"
   - "Set your username to: daniel"
   - "Click Save and wait 3 seconds"

2. Wait a few seconds

3. Go to **Friends** page in YOUR app
4. Search for "daniel"
5. Should see your friend!

---

## 🔧 Troubleshooting

### Problem: `await window.__testPublicProfile()` shows empty list

**Possible causes:**
1. Firestore database not created
2. Security rules blocking access
3. User doesn't have displayName set
4. Profile sync hasn't run yet

**Fix:**
```javascript
// Check if you're logged in
firebase.auth().currentUser

// Should show your user info. Look for:
// - uid: "xxxxx"
// - displayName: "your username" (or null)
// - email: "your@email.com"
```

If `displayName` is null or undefined:
- Go to Settings
- Set your username
- Wait 3 seconds
- Run `await window.__testPublicProfile()` again

### Problem: Permission denied error in console

**Cause:** Firestore security rules not set correctly

**Fix:**
1. Go to Firestore → Rules
2. Clear everything and paste the rules from Step 2
3. Click **Publish**
4. Refresh app (Ctrl+Shift+R)
5. Try again

### Problem: Profile created but can't search for user

**Possible causes:**
1. User's `shareProfile` is false
2. Username doesn't match
3. Search results are filtered out

**Fix:**
1. Go to Settings → Privacy Settings
2. Make sure "Share my profile with other users" is **ON**
3. Go to Friends page
4. Search for the username

### Problem: Search shows results but they don't display

**Check:**
1. Open DevTools → Console
2. Go to Friends page
3. Search for something
4. Look for errors in console
5. Check if results are being filtered out

---

## 📋 Final Verification Checklist

Before saying search is broken, verify:

- [ ] Firestore Database exists
- [ ] Firestore Rules are published (Rule #1)
- [ ] You're logged in (check `firebase.auth().currentUser`)
- [ ] You set a username in Settings
- [ ] Your profile appears in `await window.__testPublicProfile()`
- [ ] Your `shareProfile` setting is ON
- [ ] Friend also has username set
- [ ] Friend's profile appears in `await window.__testPublicProfile()`
- [ ] Friend's `shareProfile` is ON
- [ ] You can search for friend by username

If all items are checked ✅, search should work!

---

## 🆘 Still Not Working?

Open DevTools (F12) → Console and show me these:

1. Type and run:
```javascript
await window.__testPublicProfile()
```
Copy the output.

2. Type and run:
```javascript
firebase.auth().currentUser
```
Copy the output (hide sensitive info if needed).

3. Look for red errors in console, copy them.

4. Check Firestore → Data tab, verify `publicProfiles` collection exists.

Send me this info and I can debug further!
