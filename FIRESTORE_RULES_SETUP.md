# Firestore Rules Setup - Visual Guide

## The ONLY Thing You Need to Do

Go to Firebase Console and copy-paste the security rules. That's it!

---

## How to Access Firestore Rules

1. Open: https://console.firebase.google.com
2. Select: **progredi-1**
3. Click: **Firestore Database** (left sidebar)
4. Click: **Rules** (tab at top)

You should see a code editor like this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Your existing rules here...
  }
}
```

---

## Copy-Paste This Code

Delete everything in the editor and replace with:

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

---

## Click Publish

After pasting, you'll see:

- Blue **Publish** button (bottom right)
- Or might say **Create** if first time

Click it and wait for:
```
Rules published successfully
Version: 1
```

---

## Why These Rules?

| Rule | Purpose |
|------|---------|
| `match /users/{userId}` | Users can only see their own workout data |
| `allow read, write: if request.auth.uid == userId` | Only the user can access their data |
| `match /publicProfiles/{userId}` | Public user profiles (for search) |
| `allow read: if true` | **Anyone can search** (without login even) |
| `allow create, update, delete: if request.auth.uid == userId` | Only user can change their own profile |
| `match /usernameReservations/{username}` | Prevent duplicate usernames |
| `allow write: if request.auth != null` | Only logged-in users can reserve usernames |

---

## That's It!

After publishing rules:

1. ✅ Go back to Prodegi app
2. ✅ Hard refresh: **Ctrl+Shift+R**
3. ✅ Set your username in Settings
4. ✅ Have friends set their usernames
5. ✅ Search for them in Friends page

**Everything else in the app is ready to go!**

---

## If You Get an Error

### "PERMISSION_DENIED"
→ Rules not published yet. Click **Publish** again.

### "NOT_FOUND"
→ Firestore database doesn't exist. Go to Firestore → click "Create Database"

### "Invalid syntax"
→ Copy-paste the rules again, character by character

### Any other error
→ Check browser console (F12) and paste the full error message

---

## Verify It Worked

After publishing rules, in app DevTools console:

```javascript
await window.__testPublicProfile()
```

Should show your profile if you set a username. ✅

If empty, check:
1. Did you set username in Settings?
2. Wait 3 seconds
3. Try the test again

---

**That's the main fix!** The app code is already ready. Just update the Firebase rules and you're done. 🎉
