import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Note: Firebase messaging is not available on React Native, use expo-notifications instead
// import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
// Configuration based on your google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyD_XAt0ftWO86YUU6hATqYkyEHX65jJ-5g",
  authDomain: "traverse-bus-app.firebaseapp.com",
  projectId: "traverse-bus-app",
  storageBucket: "traverse-bus-app.firebasestorage.app",
  messagingSenderId: "729262919472",
  appId: "1:729262919472:android:80fb1aaabfc518a52442f5"
};

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// Note: Use expo-notifications for push notifications instead of Firebase messaging

export default app;