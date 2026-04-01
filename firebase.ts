
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, getDoc, collection, onSnapshot, query, where, updateDoc, deleteDoc, getDocs, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, onAuthStateChanged, signOut, signInAnonymously, doc, setDoc, getDoc, collection, onSnapshot, query, where, updateDoc, deleteDoc, getDocs, getDocFromServer };
