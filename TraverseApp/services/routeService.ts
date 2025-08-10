import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove 
} from 'firebase/firestore';
import { db } from './firebase';

export interface Route {
  id: string;
  number: string;
  name: string;
  startLocation: string;
  endLocation: string;
  color: string;
  frequency: string;
  status: 'active' | 'delayed' | 'suspended';
  activeBuses: number;
  totalBuses: number;
  operatingHours: {
    start: string;
    end: string;
  };
  stops: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    sequence: number;
  }>;
  fare: number;
  distance: number;
  estimatedDuration: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRouteData {
  userId: string;
  favoriteRoutes: string[];
  recentSearches: string[];
  travelHistory: Array<{
    routeId: string;
    date: Date;
    startStop: string;
    endStop: string;
    fare: number;
  }>;
  preferences: {
    notifications: boolean;
    favoriteStops: string[];
    theme: 'light' | 'dark' | 'auto';
  };
}

class RouteService {
  private routesCollection = collection(db, 'routes');
  private userDataCollection = collection(db, 'userData');

  // Get all routes
  async getAllRoutes(): Promise<Route[]> {
    try {
      const querySnapshot = await getDocs(
        query(this.routesCollection, orderBy('number'))
      );
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Route[];
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  }

  // Search routes
  async searchRoutes(searchTerm: string): Promise<Route[]> {
    try {
      const routes = await this.getAllRoutes();
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return routes.filter(route => 
        route.number.toLowerCase().includes(lowercaseSearch) ||
        route.name.toLowerCase().includes(lowercaseSearch) ||
        route.startLocation.toLowerCase().includes(lowercaseSearch) ||
        route.endLocation.toLowerCase().includes(lowercaseSearch)
      );
    } catch (error) {
      console.error('Error searching routes:', error);
      throw error;
    }
  }

  // Add a new route
  async addRoute(routeData: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const newRouteData = {
        ...routeData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = doc(this.routesCollection);
      await setDoc(docRef, newRouteData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding route:', error);
      throw error;
    }
  }

  // Get route by ID
  async getRouteById(routeId: string): Promise<Route | null> {
    try {
      const docSnapshot = await getDoc(doc(this.routesCollection, routeId));
      if (docSnapshot.exists()) {
        return {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          createdAt: docSnapshot.data().createdAt?.toDate(),
          updatedAt: docSnapshot.data().updatedAt?.toDate(),
        } as Route;
      }
      return null;
    } catch (error) {
      console.error('Error fetching route:', error);
      throw error;
    }
  }

  // Subscribe to routes (real-time)
  subscribeToRoutes(callback: (routes: Route[]) => void): () => void {
    const unsubscribe = onSnapshot(
      query(this.routesCollection, orderBy('number')),
      (querySnapshot) => {
        const routes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Route[];
        callback(routes);
      },
      (error) => {
        console.error('Error in routes subscription:', error);
      }
    );
    return unsubscribe;
  }

  // User route data management
  async getUserRouteData(userId: string): Promise<UserRouteData | null> {
    try {
      const docSnapshot = await getDoc(doc(this.userDataCollection, userId));
      if (docSnapshot.exists()) {
        return {
          ...docSnapshot.data(),
          travelHistory: docSnapshot.data().travelHistory?.map((item: any) => ({
            ...item,
            date: item.date?.toDate(),
          })),
        } as UserRouteData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user route data:', error);
      throw error;
    }
  }

  // Initialize user route data
  async initializeUserRouteData(userId: string): Promise<void> {
    try {
      const userRouteData: UserRouteData = {
        userId,
        favoriteRoutes: [],
        recentSearches: [],
        travelHistory: [],
        preferences: {
          notifications: true,
          favoriteStops: [],
          theme: 'auto',
        },
      };
      await setDoc(doc(this.userDataCollection, userId), userRouteData);
    } catch (error) {
      console.error('Error initializing user route data:', error);
      throw error;
    }
  }

  // Add route to favorites
  async addToFavorites(userId: string, routeId: string): Promise<void> {
    try {
      await updateDoc(doc(this.userDataCollection, userId), {
        favoriteRoutes: arrayUnion(routeId),
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  // Remove route from favorites
  async removeFromFavorites(userId: string, routeId: string): Promise<void> {
    try {
      await updateDoc(doc(this.userDataCollection, userId), {
        favoriteRoutes: arrayRemove(routeId),
      });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  // Add to recent searches
  async addToRecentSearches(userId: string, searchTerm: string): Promise<void> {
    try {
      const userData = await this.getUserRouteData(userId);
      if (userData) {
        const recentSearches = userData.recentSearches.filter(s => s !== searchTerm);
        recentSearches.unshift(searchTerm);
        // Keep only last 10 searches
        const limitedSearches = recentSearches.slice(0, 10);
        
        await updateDoc(doc(this.userDataCollection, userId), {
          recentSearches: limitedSearches,
        });
      }
    } catch (error) {
      console.error('Error adding to recent searches:', error);
      throw error;
    }
  }

  // Add travel history
  async addTravelHistory(
    userId: string, 
    routeId: string, 
    startStop: string, 
    endStop: string, 
    fare: number
  ): Promise<void> {
    try {
      const travelEntry = {
        routeId,
        date: new Date(),
        startStop,
        endStop,
        fare,
      };
      
      await updateDoc(doc(this.userDataCollection, userId), {
        travelHistory: arrayUnion(travelEntry),
      });
    } catch (error) {
      console.error('Error adding travel history:', error);
      throw error;
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserRouteData['preferences']>): Promise<void> {
    try {
      await updateDoc(doc(this.userDataCollection, userId), {
        [`preferences`]: preferences,
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Initialize sample routes (for development)
  async initializeSampleRoutes(): Promise<void> {
    const sampleRoutes: Partial<Route>[] = [
      {
        number: '138',
        name: 'Colombo - Maharagama Express',
        startLocation: 'Fort, Colombo',
        endLocation: 'Maharagama Junction',
        color: '#6366f1',
        frequency: '5-8 mins',
        status: 'active',
        activeBuses: 12,
        totalBuses: 15,
        operatingHours: { start: '05:30', end: '23:00' },
        fare: 25,
        distance: 18.5,
        estimatedDuration: 45,
        stops: [
          { id: '1', name: 'Fort Railway Station', latitude: 6.9319, longitude: 79.8478, sequence: 1 },
          { id: '2', name: 'Pettah', latitude: 6.9387, longitude: 79.8533, sequence: 2 },
          { id: '3', name: 'Nugegoda', latitude: 6.8649, longitude: 79.8997, sequence: 3 },
          { id: '4', name: 'Maharagama', latitude: 6.8481, longitude: 79.9267, sequence: 4 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        number: '177',
        name: 'Pettah - Kottawa',
        startLocation: 'Pettah Bus Stand',
        endLocation: 'Kottawa',
        color: '#10b981',
        frequency: '10-15 mins',
        status: 'active',
        activeBuses: 8,
        totalBuses: 12,
        operatingHours: { start: '06:00', end: '22:30' },
        fare: 30,
        distance: 22.3,
        estimatedDuration: 55,
        stops: [
          { id: '1', name: 'Pettah Bus Stand', latitude: 6.9387, longitude: 79.8533, sequence: 1 },
          { id: '2', name: 'Wellawatta', latitude: 6.8707, longitude: 79.8590, sequence: 2 },
          { id: '3', name: 'Dehiwala', latitude: 6.8520, longitude: 79.8678, sequence: 3 },
          { id: '4', name: 'Kottawa', latitude: 6.8063, longitude: 79.9733, sequence: 4 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    try {
      for (const route of sampleRoutes) {
        await setDoc(doc(this.routesCollection, route.number!), route);
      }
      console.log('Sample routes initialized successfully');
    } catch (error) {
      console.error('Error initializing sample routes:', error);
      throw error;
    }
  }
}

export const routeService = new RouteService();
