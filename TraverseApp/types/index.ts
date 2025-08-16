// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  favoriteRoutes: string[];
  favoriteStops: string[];
  preferences: UserPreferences;
  profile?: UserProfile;
  createdAt: Date;
  lastLoginAt: Date;
  updatedAt?: Date; // Optional since not all users may have this field
}

export interface UserProfile {
  avatar?: string;
  homeLocation?: Location;
  workLocation?: Location;
  frequentRoutes: string[];
  totalTrips: number;
  badges: string[];
  points: number;
}

export interface UserPreferences {
  notifications: boolean;
  darkMode: boolean;
  defaultLocation?: Location;
  language: string;
  distanceUnit: 'km' | 'miles';
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  busArrival: boolean;
  busDelays: boolean;
  routeUpdates: boolean;
  weeklyReport: boolean;
  arrivalReminder: number; // minutes before
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LocationWithDistance extends Location {
  distance: number; // in meters
}

// Bus types
export interface Bus {
  id: string;
  routeId: string;
  driverId: string;
  currentLocation: Location;
  nextStopId: string;
  previousStopId?: string;
  eta: number; // minutes to next stop
  speed: number; // km/h
  heading: number; // degrees
  capacity: BusCapacity;
  amenities: BusAmenities;
  status: BusStatus;
  lastUpdated: Date;
  passengers?: number;
  maxCapacity: number;
}

export type BusCapacity = 'low' | 'medium' | 'high' | 'full';
export type BusStatus = 'active' | 'inactive' | 'maintenance' | 'delayed';

export interface BusAmenities {
  wifi: boolean;
  ac: boolean;
  accessibility: boolean;
  charging: boolean;
  audio: boolean;
}

// Route types
export interface BusRoute {
  id: string;
  name: string;
  shortName: string;
  longName: string;
  color: string;
  textColor: string;
  stops: BusStop[];
  path: Location[]; // route path coordinates
  isActive: boolean;
  operatingHours: OperatingHours;
  frequency: number; // minutes between buses
  fare: number;
  distance: number; // total route distance in km
  estimatedDuration: number; // minutes
}

export interface OperatingHours {
  weekdays: { start: string; end: string };
  weekends: { start: string; end: string };
  holidays: { start: string; end: string };
}

// Bus Stop types
export interface BusStop {
  id: string;
  name: string;
  shortName?: string;
  location: Location;
  routes: string[]; // route IDs
  amenities: StopAmenities;
  facilities: string[];
  nextBuses: NextBusInfo[];
  isActive: boolean;
  zone?: string;
}

export interface StopAmenities {
  shelter: boolean;
  seating: boolean;
  lighting: boolean;
  realTimeDisplay: boolean;
  ticketing: boolean;
}

export interface NextBusInfo {
  routeId: string;
  busId: string;
  eta: number;
  destination: string;
  capacity: BusCapacity;
  isRealTime: boolean;
}

// Trip Planning types
export interface TripPlan {
  id: string;
  from: Location;
  to: Location;
  routes: TripRoute[];
  totalDuration: number;
  totalDistance: number;
  totalWalkingDistance: number;
  fare: number;
  departureTime: Date;
  arrivalTime: Date;
  confidence: number; // reliability score 0-1
}

export interface TripRoute {
  type: 'walking' | 'bus';
  routeId?: string;
  busId?: string;
  fromStopId?: string;
  toStopId?: string;
  duration: number;
  distance: number;
  instructions: string[];
  path: Location[];
}

// Notification types
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  scheduledFor?: Date;
}

export type NotificationType = 
  | 'bus_arrival' 
  | 'bus_delay' 
  | 'route_update' 
  | 'service_alert' 
  | 'weekly_report'
  | 'achievement';

// Alert types
export interface ServiceAlert {
  id: string;
  type: 'delay' | 'disruption' | 'maintenance' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedRoutes: string[];
  affectedStops: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

// Real-time data types
export interface RealTimeUpdate {
  busId: string;
  location: Location;
  speed: number;
  heading: number;
  timestamp: Date;
  passengers?: number;
}

// Gamification types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: 'travel' | 'social' | 'eco' | 'exploration';
  requirements: any;
}

export interface UserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  progress: number;
  target: number;
  isCompleted: boolean;
  completedAt?: Date;
  reward: number; // points
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type MainTabParamList = {
  Map: undefined;
  Routes: undefined;
  Profile: undefined;
  More: undefined;
};

export type MapStackParamList = {
  MapMain: undefined;
  BusDetails: { busId: string };
  StopDetails: { stopId: string };
  RouteDetails: { routeId: string };
  TripPlanner: undefined;
  TripResults: { tripPlan: TripPlan };
};

export type RoutesStackParamList = {
  RoutesList: undefined;
  RouteDetails: { routeId: string };
  StopDetails: { stopId: string };
  Favorites: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Notifications: undefined;
  Achievements: undefined;
  TravelHistory: undefined;
  Support: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Search types
export interface SearchResult {
  type: 'route' | 'stop' | 'location';
  id: string;
  name: string;
  description?: string;
  location?: Location;
  distance?: number;
}

// Filter types
export interface RouteFilter {
  amenities?: (keyof BusAmenities)[];
  capacity?: BusCapacity[];
  maxWalkingDistance?: number;
  departureTime?: { start: string; end: string };
}

// Redux Store types
export interface RootState {
  auth: AuthState;
  user: UserState;
  buses: BusState;
  routes: RouteState;
  stops: StopState;
  location: LocationState;
  notifications: NotificationState;
  app: AppState;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserState {
  profile: UserProfile | null;
  preferences: UserPreferences;
  favorites: {
    routes: string[];
    stops: string[];
  };
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;
}

export interface BusState {
  buses: { [busId: string]: Bus };
  activeBuses: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface RouteState {
  routes: { [routeId: string]: BusRoute };
  activeRoutes: string[];
  isLoading: boolean;
  error: string | null;
}

export interface StopState {
  stops: { [stopId: string]: BusStop };
  nearbyStops: string[];
  isLoading: boolean;
  error: string | null;
}

export interface LocationState {
  currentLocation: Location | null;
  isLocationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface AppState {
  isOnboarded: boolean;
  theme: 'light' | 'dark';
  isConnected: boolean;
  alerts: ServiceAlert[];
}