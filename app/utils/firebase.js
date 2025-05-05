import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAh8nevgG_Aew32phcaY04_Owx-lZtX48Q",
  authDomain: "porttrack-19b41.firebaseapp.com",
  projectId: "porttrack-19b41",
  storageBucket: "porttrack-19b41.firebasestorage.app",
  messagingSenderId: "289654752294",
  appId: "1:289654752294:web:f2afdbc8f8a658fb80d2e7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set appropriate persistence to avoid warnings
// Use in-memory persistence for mobile to avoid warning messages
const configureAuth = async () => {
  try {
    // Use in-memory persistence to avoid the warning messages
    await setPersistence(auth, inMemoryPersistence);
  } catch (error) {
    console.error('Error setting auth persistence:', error);
  }
};

// Call the configuration function
configureAuth();

const db = getFirestore(app);

// Anonymous authentication function
export const signInAnonymous = async () => {
  try {
    return await signInAnonymously(auth);
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};

export { auth, db }; 