import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
export const functions = getFunctions(app);

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

// Email/Password Authentication
export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (err) {
    console.error('Sign-up failed:', err);
    throw err;
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (err) {
    console.error('Sign-in failed:', err);
    throw err;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    console.error('Password reset failed:', err);
    throw err;
  }
};

// Guest sign-in function
export const signInAsGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (err) {
    console.error('Guest sign-in failed:', err);
    throw err;
  }
};

// ✅ ADD THIS: matches your Dashboard import
export async function generateContent(prompt) {
  try {
    const call = httpsCallable(functions, 'generateContent');
    const res = await call({ prompt });

    // expected: { text: "..." }
    const text = res?.data?.text;
    return (typeof text === 'string' && text.trim()) ? text.trim() : 'No response';
  } catch (err) {
    console.error('generateContent failed:', err);
    return 'AI request failed';
  }
}
