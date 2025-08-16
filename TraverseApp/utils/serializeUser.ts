import { Timestamp } from 'firebase/firestore';

/**
 * Utility function to convert Firestore timestamps to serializable data
 * This ensures Redux store only contains serializable values
 */
export const serializeUserData = (userData: any): any => {
  if (!userData) return userData;

  const serialized = { ...userData };

  // Convert Firestore timestamps to ISO strings for Redux storage
  if (serialized.createdAt) {
    if (serialized.createdAt instanceof Timestamp || serialized.createdAt.toDate) {
      serialized.createdAt = serialized.createdAt.toDate().toISOString();
    } else if (serialized.createdAt instanceof Date) {
      serialized.createdAt = serialized.createdAt.toISOString();
    }
  }

  if (serialized.updatedAt) {
    if (serialized.updatedAt instanceof Timestamp || serialized.updatedAt.toDate) {
      serialized.updatedAt = serialized.updatedAt.toDate().toISOString();
    } else if (serialized.updatedAt instanceof Date) {
      serialized.updatedAt = serialized.updatedAt.toISOString();
    }
  }

  if (serialized.lastLoginAt) {
    if (serialized.lastLoginAt instanceof Timestamp || serialized.lastLoginAt.toDate) {
      serialized.lastLoginAt = serialized.lastLoginAt.toDate().toISOString();
    } else if (serialized.lastLoginAt instanceof Date) {
      serialized.lastLoginAt = serialized.lastLoginAt.toISOString();
    }
  }

  return serialized;
};

/**
 * Utility function to deserialize user data when reading from Redux
 * Converts ISO strings back to Date objects for use in components
 */
export const deserializeUserData = (userData: any): any => {
  if (!userData) return userData;

  const deserialized = { ...userData };

  // Convert ISO strings back to Date objects
  if (typeof deserialized.createdAt === 'string') {
    deserialized.createdAt = new Date(deserialized.createdAt);
  }

  if (typeof deserialized.updatedAt === 'string') {
    deserialized.updatedAt = new Date(deserialized.updatedAt);
  }

  if (typeof deserialized.lastLoginAt === 'string') {
    deserialized.lastLoginAt = new Date(deserialized.lastLoginAt);
  }

  return deserialized;
};
