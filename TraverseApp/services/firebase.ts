import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
// Get this from Firebase Console → Project Settings → General → Your apps
const firebaseConfig = {
  apiKey: "AIzaSyD_XAt0ftWO86YUU6hATqYkyEHX65jJ-5g",
  authDomain: "traverse-bus-app.firebaseapp.com",
  projectId: "729262919472",
  storageBucket: "traverse-bus-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:729262919472:android:80fb1aaabfc518a52442f5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

export default app;