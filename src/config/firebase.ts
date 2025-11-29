// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAHLLbo6zbVryKiCH96r84dGX8cOXfzTHE",
  authDomain: "progredi-1.firebaseapp.com",
  projectId: "progredi-1",
  storageBucket: "progredi-1.firebasestorage.app",
  messagingSenderId: "603628930060",
  appId: "1:603628930060:web:2336837d9f7be899771a29",
  measurementId: "G-Z3PEPCMLN3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { app };
