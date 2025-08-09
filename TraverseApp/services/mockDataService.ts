// Mock data for development and testing
import { 
  BusRoute, 
  BusStop, 
  Bus, 
  User,
  Location,
  BusCapacity,
  ServiceAlert 
} from '../types';

// Sri Lankan bus routes and stops (Colombo area)
export const mockLocations = {
  colombo: { latitude: 6.9271, longitude: 79.8612 },
  kandy: { latitude: 7.2906, longitude: 80.6337 },
  galle: { latitude: 6.0535, longitude: 80.2210 },
  negombo: { latitude: 7.2084, longitude: 79.8358 },
  fort: { latitude: 6.9344, longitude: 79.8428 },
  pettah: { latitude: 6.9389, longitude: 79.8556 },
  bambalapitiya: { latitude: 6.8905, longitude: 79.8561 },
  wellawatte: { latitude: 6.8781, longitude: 79.8583 },
  dehiwala: { latitude: 6.8465, longitude: 79.8647 },
  mount_lavinia: { latitude: 6.8382, longitude: 79.8636 },
};

export const mockBusStops: BusStop[] = [
  {
    id: 'stop-001',
    name: 'Fort Railway Station',
    shortName: 'Fort',
    location: mockLocations.fort,
    routes: ['route-001', 'route-002', 'route-003'],
    amenities: {
      shelter: true,
      seating: true,
      lighting: true,
      realTimeDisplay: true,
      ticketing: true,
    },
    facilities: ['ATM', 'Food Court', 'Restrooms'],
    nextBuses: [
      {
        routeId: 'route-001',
        busId: 'bus-001',
        eta: 3,
        destination: 'Galle',
        capacity: 'medium',
        isRealTime: true,
      },
      {
        routeId: 'route-002',
        busId: 'bus-002',
        eta: 7,
        destination: 'Kandy',
        capacity: 'low',
        isRealTime: true,
      },
    ],
    isActive: true,
    zone: 'Zone 1',
  },
  {
    id: 'stop-002',
    name: 'Pettah Central Bus Stand',
    shortName: 'Pettah',
    location: mockLocations.pettah,
    routes: ['route-001', 'route-003', 'route-004'],
    amenities: {
      shelter: true,
      seating: true,
      lighting: true,
      realTimeDisplay: false,
      ticketing: true,
    },
    facilities: ['Market', 'Food Stalls'],
    nextBuses: [
      {
        routeId: 'route-001',
        busId: 'bus-001',
        eta: 8,
        destination: 'Galle',
        capacity: 'high',
        isRealTime: false,
      },
    ],
    isActive: true,
    zone: 'Zone 1',
  },
  {
    id: 'stop-003',
    name: 'Bambalapitiya Junction',
    shortName: 'Bambalapitiya',
    location: mockLocations.bambalapitiya,
    routes: ['route-001', 'route-005'],
    amenities: {
      shelter: true,
      seating: false,
      lighting: true,
      realTimeDisplay: false,
      ticketing: false,
    },
    facilities: ['Shopping Mall'],
    nextBuses: [
      {
        routeId: 'route-001',
        busId: 'bus-003',
        eta: 12,
        destination: 'Mount Lavinia',
        capacity: 'low',
        isRealTime: true,
      },
    ],
    isActive: true,
    zone: 'Zone 2',
  },
  {
    id: 'stop-004',
    name: 'Wellawatte Station',
    shortName: 'Wellawatte',
    location: mockLocations.wellawatte,
    routes: ['route-001'],
    amenities: {
      shelter: true,
      seating: true,
      lighting: true,
      realTimeDisplay: false,
      ticketing: false,
    },
    facilities: ['Railway Station'],
    nextBuses: [
      {
        routeId: 'route-001',
        busId: 'bus-003',
        eta: 15,
        destination: 'Mount Lavinia',
        capacity: 'medium',
        isRealTime: true,
      },
    ],
    isActive: true,
    zone: 'Zone 2',
  },
  {
    id: 'stop-005',
    name: 'Mount Lavinia Beach',
    shortName: 'Mt. Lavinia',
    location: mockLocations.mount_lavinia,
    routes: ['route-001'],
    amenities: {
      shelter: true,
      seating: true,
      lighting: true,
      realTimeDisplay: false,
      ticketing: false,
    },
    facilities: ['Beach Access', 'Hotels'],
    nextBuses: [
      {
        routeId: 'route-001',
        busId: 'bus-001',
        eta: 25,
        destination: 'Fort',
        capacity: 'low',
        isRealTime: false,
      },
    ],
    isActive: true,
    zone: 'Zone 3',
  },
];

export const mockBusRoutes: BusRoute[] = [
  {
    id: 'route-001',
    name: 'Colombo - Mount Lavinia Express',
    shortName: '138',
    longName: 'Fort Railway Station to Mount Lavinia Beach',
    color: '#2E86AB',
    textColor: '#FFFFFF',
    stops: mockBusStops.filter(stop => 
      ['stop-001', 'stop-002', 'stop-003', 'stop-004', 'stop-005'].includes(stop.id)
    ),
    path: [
      mockLocations.fort,
      mockLocations.pettah,
      mockLocations.bambalapitiya,
      mockLocations.wellawatte,
      mockLocations.mount_lavinia,
    ],
    isActive: true,
    operatingHours: {
      weekdays: { start: '05:30', end: '22:00' },
      weekends: { start: '06:00', end: '21:00' },
      holidays: { start: '06:00', end: '20:00' },
    },
    frequency: 15,
    fare: 25.00,
    distance: 12.5,
    estimatedDuration: 45,
  },
  {
    id: 'route-002',
    name: 'Colombo - Kandy Highway',
    shortName: '1',
    longName: 'Fort to Kandy via Peradeniya',
    color: '#F18F01',
    textColor: '#FFFFFF',
    stops: [mockBusStops[0]], // Only Fort for now
    path: [
      mockLocations.fort,
      mockLocations.kandy,
    ],
    isActive: true,
    operatingHours: {
      weekdays: { start: '04:30', end: '21:00' },
      weekends: { start: '05:00', end: '20:00' },
      holidays: { start: '05:00', end: '19:00' },
    },
    frequency: 30,
    fare: 120.00,
    distance: 115.0,
    estimatedDuration: 180,
  },
  {
    id: 'route-003',
    name: 'Colombo - Galle Express',
    shortName: '2',
    longName: 'Fort to Galle via Southern Expressway',
    color: '#A23B72',
    textColor: '#FFFFFF',
    stops: [mockBusStops[0], mockBusStops[1]], // Fort and Pettah
    path: [
      mockLocations.fort,
      mockLocations.pettah,
      mockLocations.galle,
    ],
    isActive: true,
    operatingHours: {
      weekdays: { start: '05:00', end: '20:00' },
      weekends: { start: '05:30', end: '19:30' },
      holidays: { start: '06:00', end: '18:00' },
    },
    frequency: 45,
    fare: 150.00,
    distance: 119.0,
    estimatedDuration: 120,
  },
  {
    id: 'route-004',
    name: 'Pettah - Negombo',
    shortName: '240',
    longName: 'Pettah to Negombo via Ja-Ela',
    color: '#34C759',
    textColor: '#FFFFFF',
    stops: [mockBusStops[1]], // Only Pettah
    path: [
      mockLocations.pettah,
      mockLocations.negombo,
    ],
    isActive: true,
    operatingHours: {
      weekdays: { start: '05:00', end: '21:00' },
      weekends: { start: '05:30', end: '20:30' },
      holidays: { start: '06:00', end: '19:00' },
    },
    frequency: 20,
    fare: 45.00,
    distance: 37.0,
    estimatedDuration: 60,
  },
];

export const mockBuses: Bus[] = [
  {
    id: 'bus-001',
    routeId: 'route-001',
    driverId: 'driver-001',
    currentLocation: {
      latitude: 6.9344,
      longitude: 79.8428,
    },
    nextStopId: 'stop-002',
    previousStopId: 'stop-001',
    eta: 3,
    speed: 25,
    heading: 180,
    capacity: 'medium',
    amenities: {
      wifi: false,
      ac: true,
      accessibility: true,
      charging: false,
      audio: true,
    },
    status: 'active',
    lastUpdated: new Date(),
    passengers: 35,
    maxCapacity: 50,
  },
  {
    id: 'bus-002',
    routeId: 'route-002',
    driverId: 'driver-002',
    currentLocation: {
      latitude: 6.9271,
      longitude: 79.8612,
    },
    nextStopId: 'stop-001',
    eta: 7,
    speed: 0,
    heading: 0,
    capacity: 'low',
    amenities: {
      wifi: true,
      ac: true,
      accessibility: true,
      charging: true,
      audio: true,
    },
    status: 'active',
    lastUpdated: new Date(),
    passengers: 15,
    maxCapacity: 45,
  },
  {
    id: 'bus-003',
    routeId: 'route-001',
    driverId: 'driver-003',
    currentLocation: {
      latitude: 6.8905,
      longitude: 79.8561,
    },
    nextStopId: 'stop-004',
    previousStopId: 'stop-003',
    eta: 12,
    speed: 30,
    heading: 200,
    capacity: 'low',
    amenities: {
      wifi: false,
      ac: false,
      accessibility: false,
      charging: false,
      audio: true,
    },
    status: 'active',
    lastUpdated: new Date(),
    passengers: 12,
    maxCapacity: 40,
  },
];

export const mockServiceAlerts: ServiceAlert[] = [
  {
    id: 'alert-001',
    type: 'delay',
    severity: 'medium',
    title: 'Route 138 Delays',
    description: 'Traffic congestion causing 10-15 minute delays on Route 138',
    affectedRoutes: ['route-001'],
    affectedStops: ['stop-003', 'stop-004'],
    startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    isActive: true,
  },
  {
    id: 'alert-002',
    type: 'maintenance',
    severity: 'low',
    title: 'Scheduled Maintenance',
    description: 'Route 240 will have reduced frequency this weekend for maintenance',
    affectedRoutes: ['route-004'],
    affectedStops: [],
    startTime: new Date('2024-12-14T00:00:00'),
    endTime: new Date('2024-12-15T23:59:59'),
    isActive: false,
  },
];

export const mockUser: User = {
  id: 'user-001',
  email: 'john.doe@email.com',
  name: 'John Doe',
  favoriteRoutes: ['route-001', 'route-002'],
  favoriteStops: ['stop-001', 'stop-003'],
  preferences: {
    notifications: true,
    darkMode: false,
    language: 'en',
    distanceUnit: 'km',
    notificationSettings: {
      busArrival: true,
      busDelays: true,
      routeUpdates: true,
      weeklyReport: false,
      arrivalReminder: 5,
    },
  },
  profile: {
    totalTrips: 156,
    badges: ['Early Bird', 'Frequent Rider', 'Explorer'],
    points: 1250,
    frequentRoutes: ['route-001', 'route-002'],
  },
  createdAt: new Date('2024-01-15'),
  lastLoginAt: new Date(),
};

// Mock API class for development
export class MockDataService {
  static async getBusRoutes(): Promise<BusRoute[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockBusRoutes;
  }

  static async getBusStops(): Promise<BusStop[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockBusStops;
  }

  static async getBuses(): Promise<Bus[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockBuses;
  }

  static async getBusesByRoute(routeId: string): Promise<Bus[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockBuses.filter(bus => bus.routeId === routeId);
  }

  static async getNearbyStops(location: Location, radiusKm: number = 2): Promise<BusStop[]> {
    await new Promise(resolve => setTimeout(resolve, 700));
    // Simple distance calculation for demo
    return mockBusStops.filter(stop => {
      const distance = Math.sqrt(
        Math.pow(stop.location.latitude - location.latitude, 2) +
        Math.pow(stop.location.longitude - location.longitude, 2)
      );
      return distance < radiusKm * 0.01; // Rough conversion
    });
  }

  static async getServiceAlerts(): Promise<ServiceAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockServiceAlerts.filter(alert => alert.isActive);
  }

  static async searchRoutes(query: string): Promise<BusRoute[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockBusRoutes.filter(route => 
      route.name.toLowerCase().includes(query.toLowerCase()) ||
      route.shortName.toLowerCase().includes(query.toLowerCase())
    );
  }

  static async searchStops(query: string): Promise<BusStop[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockBusStops.filter(stop => 
      stop.name.toLowerCase().includes(query.toLowerCase()) ||
      (stop.shortName && stop.shortName.toLowerCase().includes(query.toLowerCase()))
    );
  }
}

export default MockDataService;
