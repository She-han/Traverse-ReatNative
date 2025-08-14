import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  getIdToken
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebase';
import { User, UserPreferences } from '../types';

// Helper function to convert Firebase timestamps to Date objects
const convertFirestoreTimestamps = (userData: any): User => {
  return {
    ...userData,
    createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt),
    lastLoginAt: userData.lastLoginAt?.toDate ? userData.lastLoginAt.toDate() : new Date(userData.lastLoginAt),
  };
};

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase profile
      await updateProfile(firebaseUser, { displayName: name });

      // Create user document in Firestore
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        name: name,
        favoriteRoutes: [],
        favoriteStops: [],
        preferences: this.getDefaultPreferences(),
        profile: {
          totalTrips: 0,
          badges: [],
          points: 0,
          frequentRoutes: []
        },
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      // Get token
      const token = await getIdToken(firebaseUser);
      
      // Store token locally
      await AsyncStorage.setItem('userToken', token);

      return { user: userData, token };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      let userData: User;

      if (userDoc.exists()) {
        userData = convertFirestoreTimestamps(userDoc.data());
        // Update last login
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLoginAt: new Date()
        });
      } else {
        // Create user document if it doesn't exist
        userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || '',
          favoriteRoutes: [],
          favoriteStops: [],
          preferences: this.getDefaultPreferences(),
          profile: {
            totalTrips: 0,
            badges: [],
            points: 0,
            frequentRoutes: []
          },
          createdAt: new Date(),
          lastLoginAt: new Date()
        };

        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      }

      // Get token
      const token = await getIdToken(firebaseUser);
      
      // Store token locally
      await AsyncStorage.setItem('userToken', token);

      return { user: userData, token };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userToken');
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Send password reset email
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Refresh token
  static async refreshToken(): Promise<{ user: User; token: string }> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }

      const token = await getIdToken(firebaseUser, true);
      
      // Get updated user data
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      const userData = convertFirestoreTimestamps(userDoc.data());
      
      // Store token locally
      await AsyncStorage.setItem('userToken', token);

      return { user: userData, token };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get stored token
  static async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      return null;
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Get user data from Firestore
  static async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() ? convertFirestoreTimestamps(userDoc.data()) : null;
    } catch (error) {
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), updates);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get default user preferences
  private static getDefaultPreferences(): UserPreferences {
    return {
      notifications: true,
      darkMode: false,
      language: 'en',
      distanceUnit: 'km',
      notificationSettings: {
        busArrival: true,
        busDelays: true,
        routeUpdates: true,
        weeklyReport: false,
        arrivalReminder: 5
      }
    };
  }
}

// Export instance for easier importing
export const authService = AuthService;