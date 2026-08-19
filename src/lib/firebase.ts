import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  type User,
  type Auth
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDohZW50fMnkcvMWCyPhoeUjMGNY5CeNIc',
  authDomain: 'ideasmkt-53500.firebaseapp.com',
  projectId: 'ideasmkt-53500',
  storageBucket: 'ideasmkt-53500.firebasestorage.app',
  messagingSenderId: '163056663420',
  appId: '1:163056663420:web:536a237e65f795f2bc82f9',
  measurementId: 'G-Y562LQCCZJ'
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function initFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}

const { auth: firebaseAuth, db: firestore, app: firebaseApp } = (() => initFirebase())();

const googleProvider = new GoogleAuthProvider();

export {
  firebaseApp,
  firebaseAuth as auth,
  firestore as db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
};

export type { User };
