import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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
    console.log("Firebase init starting...");
    appInstance = initializeApp(firebaseConfig);
    console.log("App initialized");
    analytics = getAnalytics(appInstance);
    console.log("Analytics initialized");
    auth = getAuth(appInstance);
    console.log("Auth initialized");
    db = getFirestore(appInstance);
    console.log("Firestore initialized");

    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Persistence failed: Multiple tabs open");
        } else if (err.code == 'unimplemented') {
            console.warn("Persistence failed: Browser not supported");
        }
    });

    console.log("Setting up auth state listener...");
    onAuthStateChanged(auth, (user) => {
        console.log("Auth state changed. User:", user);
        if (user) {
            if (onSignIn) onSignIn(user);
        } else {
            if (onSignOut) onSignOut();
        }
    });
    console.log("Firebase init complete");
}

export function handleGoogleLogin() {
    if (!auth) return alert("Firebase not configured.");
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => alert(error.message));
}

export function handleEmailSignup(email, password) {
    if (!auth) return alert("Firebase not configured.");
    return createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("User created:", userCredential.user);
            return userCredential.user;
        })
        .catch((error) => {
            console.error("Signup error:", error);
            alert(error.message);
            throw error;
        });
}

export function handleEmailLogin(email, password) {
    if (!auth) return alert("Firebase not configured.");
    return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("User logged in:", userCredential.user);
            return userCredential.user;
        })
        .catch((error) => {
            console.error("Login error:", error);
            alert(error.message);
            throw error;
        });
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
