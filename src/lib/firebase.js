import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyARKmGKLLjAvhdHPRNXhLvRi7f5V1nRLGQ",
  authDomain: "linguahub-1271a.firebaseapp.com",
  projectId: "linguahub-1271a",
  storageBucket: "linguahub-1271a.firebasestorage.app",
  messagingSenderId: "272359986762",
  appId: "1:272359986762:web:f711567143cbfe059e78b3",
  measurementId: "G-LDC63MT6XT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// SETUP PROVIDER WITH SCOPES
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

export const logout = () => signOut(auth);

export const onUserStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};