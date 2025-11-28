import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHLLbo6zbVryKiCH96r84dGX8cOXfzTHE",
  authDomain: "progredi-1.firebaseapp.com",
  projectId: "progredi-1",
  storageBucket: "progredi-1.firebasestorage.app",
  messagingSenderId: "603628930060",
  appId: "1:603628930060:web:2336837d9f7be899771a29",
  measurementId: "G-Z3PEPCMLN3"
};

let appInstance, analytics, auth, db;

export function initFirebase(onSignIn, onSignOut) {
    appInstance = initializeApp(firebaseConfig);
    analytics = getAnalytics(appInstance);
    auth = getAuth(appInstance);
    db = getFirestore(appInstance);
    
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Persistence failed: Multiple tabs open");
        } else if (err.code == 'unimplemented') {
            console.warn("Persistence failed: Browser not supported");
        }
    });
    
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (onSignIn) onSignIn(user);
        } else {
            if (onSignOut) onSignOut();
        }
    });
}

export function handleGoogleLogin() {
    if (!auth) return alert("Firebase not configured.");
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => alert(error.message));
}

export function handleLogout() {
    if (auth) {
        signOut(auth).then(() => {
            location.reload();
        }).catch((error) => {
            console.error("Logout error:", error);
        });
    }
}

export { auth, db };
