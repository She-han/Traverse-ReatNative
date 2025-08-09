// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  favoriteRoutes: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  defaultLocation?: Location;
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
}

// Bus types
export interface Bus {
  id: string;
  routeId: string;
  currentLocation: Location;
  nextStop: string;
  eta: number; // minutes
  capacity: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

// Route types
export interface BusRoute {
  id: string;
  name: string;
  shortName: string;
  color: string;
  stops: BusStop[];
  isActive: boolean;
}

// Bus Stop types
export interface BusStop {
  id: string;
  name: string;
  location: Location;
  routes: string[]; // route IDs
  amenities: string[];
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Map: undefined;
  Routes: undefined;
  Schedule: undefined;
  Profile: undefined;
};