import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getApps } from 'firebase/app';

// Use existing Firebase app instance
const db = getFirestore(getApps()[0]);

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  favoriteRoutes: string[];
  travelHistory: any[];
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
    autoRefresh: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  private db = db;

  // Get user profile data
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Create or update user profile
  async createOrUpdateUserProfile(userId: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const existingUser = await getDoc(userRef);
      
      const updateData = {
        ...userData,
        id: userId,
        updatedAt: new Date(),
      };

      if (!existingUser.exists()) {
        // Create new user profile
        await setDoc(userRef, {
          ...updateData,
          favoriteRoutes: [],
          travelHistory: [],
          preferences: {
            notifications: true,
            darkMode: false,
            language: 'English',
            autoRefresh: true,
            ...(userData.preferences || {}),
          },
          createdAt: new Date(),
        });
        console.log('✅ User profile created successfully');
      } else {
        // Update existing user profile
        await updateDoc(userRef, updateData);
        console.log('✅ User profile updated successfully');
      }
    } catch (error) {
      console.error('❌ Error creating/updating user profile:', error);
      throw error;
    }
  }

  // Add route to favorites
  async addToFavorites(userId: string, routeId: string): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      
      // Ensure user profile exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await this.createOrUpdateUserProfile(userId, {
          favoriteRoutes: [routeId],
        });
      } else {
        await updateDoc(userRef, {
          favoriteRoutes: arrayUnion(routeId),
          updatedAt: new Date(),
        });
      }
      
      console.log(`✅ Route ${routeId} added to favorites for user ${userId}`);
    } catch (error) {
      console.error('❌ Error adding route to favorites:', error);
      throw error;
    }
  }

  // Remove route from favorites
  async removeFromFavorites(userId: string, routeId: string): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        favoriteRoutes: arrayRemove(routeId),
        updatedAt: new Date(),
      });
      console.log(`✅ Route ${routeId} removed from favorites for user ${userId}`);
    } catch (error) {
      console.error('❌ Error removing route from favorites:', error);
      throw error;
    }
  }

  // Get user's favorite routes
  async getFavoriteRoutes(userId: string): Promise<string[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      return userProfile?.favoriteRoutes || [];
    } catch (error) {
      console.error('❌ Error getting favorite routes:', error);
      return [];
    }
  }

  // Toggle favorite route
  async toggleFavoriteRoute(userId: string, routeId: string): Promise<boolean> {
    try {
      const favoriteRoutes = await this.getFavoriteRoutes(userId);
      const isFavorite = favoriteRoutes.includes(routeId);
      
      if (isFavorite) {
        await this.removeFromFavorites(userId, routeId);
        return false; // Not favorite anymore
      } else {
        await this.addToFavorites(userId, routeId);
        return true; // Now favorite
      }
    } catch (error) {
      console.error('❌ Error toggling favorite route:', error);
      throw error;
    }
  }

  // Update user preferences
  async updatePreferences(userId: string, preferences: Partial<UserProfile['preferences']>): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentPreferences = userDoc.data().preferences || {};
        await updateDoc(userRef, {
          preferences: { ...currentPreferences, ...preferences },
          updatedAt: new Date(),
        });
      }
      console.log('✅ User preferences updated successfully');
    } catch (error) {
      console.error('❌ Error updating user preferences:', error);
      throw error;
    }
  }

  // Add travel history entry
  async addTravelHistory(userId: string, tripData: any): Promise<void> {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        travelHistory: arrayUnion({
          ...tripData,
          date: new Date(),
          id: Date.now().toString(), // Simple ID generation
        }),
        updatedAt: new Date(),
      });
      console.log('✅ Travel history added successfully');
    } catch (error) {
      console.error('❌ Error adding travel history:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
