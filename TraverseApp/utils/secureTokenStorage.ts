import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for secure storage
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  USER_EMAIL: 'user_email',
} as const;

export class SecureTokenStorage {
  // Save auth token securely
  static async saveAuthToken(token: string, userId: string, email: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to localStorage for web
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
        localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
      } else {
        // Use expo-secure-store for mobile
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_ID, userId);
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_EMAIL, email);
      }
      console.log('✅ Auth token saved securely');
    } catch (error) {
      console.error('❌ Failed to save auth token:', error);
      throw error;
    }
  }

  // Get saved auth token
  static async getAuthToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      } else {
        return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      return null;
    }
  }

  // Get saved user info
  static async getSavedUserInfo(): Promise<{ userId: string; email: string } | null> {
    try {
      if (Platform.OS === 'web') {
        const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        const email = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
        
        if (userId && email) {
          return { userId, email };
        }
        return null;
      } else {
        const userId = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ID);
        const email = await SecureStore.getItemAsync(STORAGE_KEYS.USER_EMAIL);
        
        if (userId && email) {
          return { userId, email };
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get saved user info:', error);
      return null;
    }
  }

  // Check if user is logged in (has valid token)
  static async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      console.error('❌ Failed to check login status:', error);
      return false;
    }
  }

  // Clear all auth data (logout)
  static async clearAuthData(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_ID);
        localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_ID);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_EMAIL);
      }
      console.log('✅ Auth data cleared securely');
    } catch (error) {
      console.error('❌ Failed to clear auth data:', error);
      throw error;
    }
  }

  // Validate token (check if it's not expired)
  static async validateToken(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      // For Firebase JWT tokens, you can decode and check expiration
      // This is a simplified version - in production, you might want to validate against your backend
      try {
        // Basic token format validation
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return false;

        // Decode payload to check expiration
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Check if token is expired (with 5-minute buffer)
        return payload.exp > (currentTime + 300);
      } catch (decodeError) {
        console.warn('⚠️ Token validation failed, treating as invalid:', decodeError);
        return false;
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  }
}
