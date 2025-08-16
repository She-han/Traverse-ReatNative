import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, onSnapshot, query, where, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import { sriLankanBusRouteService, SriLankanBusRoute } from './sriLankanBusRouteService';

// Import the class for static methods
class SriLankanBusRouteService {
  static extractRouteFromIdentifier(identifier: string): string | null {
    try {
      // Match pattern: routeNo-busId
      const match = identifier.match(/^([^-]+)-\d+$/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting route from identifier:', error);
      return null;
    }
  }
}

// Types for Traccar data
export interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: 'online' | 'offline' | 'unknown';
  lastUpdate: string;
  phone?: string;
  model?: string;
  contact?: string;
  category?: string;
  disabled: boolean;
}

export interface TraccarPosition {
  id: number;
  deviceId: number;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  course: number;
  accuracy: number;
  valid: boolean;
  fixTime: string;
  deviceTime: string;
  serverTime: string;
  attributes: {
    ignition?: boolean;
    motion?: boolean;
    distance?: number;
    totalDistance?: number;
    [key: string]: any;
  };
}

// Enhanced types for your app
export interface BusLocation {
  id: string;
  deviceId: number;
  routeNumber: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  status: 'active' | 'inactive' | 'maintenance' | 'offline';
  lastUpdate: Date;
  busInfo: {
    plateNumber: string;
    capacity: number;
    type: string;
    model?: string;
  };
  driver?: {
    name: string;
    phone: string;
  };
  attributes: {
    ignition: boolean;
    motion: boolean;
    distance: number;
    totalDistance: number;
    accuracy: number;
  };
  // Added Sri Lankan route integration
  routeInfo?: {
    routeName: string;
    startLocation: string;
    endLocation: string;
    distance?: number;
    estimatedDuration?: number;
    fare?: number;
    operatingHours?: {
      start: string;
      end: string;
    };
  };
}

export interface RouteData {
  id: string;
  routeNumber: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  activeBuses: number;
  totalBuses: number;
  averageSpeed: number;
  lastUpdate: Date;
}

class TraccarService {
  private traccarUrl: string;
  private username: string;
  private password: string;
  private db: any;
  private sessionCookie: string | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private maxRetries = 5;
  private demoMode = false;

  constructor() {
    // Updated Traccar server configuration
    const isWeb = typeof window !== 'undefined' && window.location;
    
    // Use the new remote Traccar server for both web and mobile
    this.traccarUrl = 'http://157.245.48.195:8082';
    
    if (isWeb) {
      console.log('🌐 Web mode: Using remote Traccar server');
    } else {
      console.log('📱 Mobile mode: Using remote Traccar server');
    }
    
    this.username = 'shehangarusinghe@gmail.com'; // Default Traccar username
    this.password = 'gaasi1021'; // Default Traccar password
    this.db = getFirestore();
    
    console.log(`🔗 Traccar URL configured: ${this.traccarUrl}`);
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Traccar service...');
      
      if (this.demoMode) {
        console.log('🎭 Running in demo mode with mock data');
        this.startMockDataGeneration();
        return true;
      }

      // Try to get real data from Traccar
      console.log('📡 Attempting to fetch real data from Traccar...');
      try {
        const devices = await this.getDevices();
        const positions = await this.getPositions();
        
        console.log(`📊 Traccar data: ${devices.length} devices, ${positions.length} positions`);
        
        if (devices.length > 0 || positions.length > 0) {
          console.log('✅ Real Traccar data available, using live mode');
          // Stop demo mode if it was running
          this.stopDemoMode();
          // Immediately sync data to Firebase before starting subscriptions
          await this.syncToFirebase();
          this.startPeriodicSync();
          return true;
        } else {
          console.log('⚠️ No devices/positions found in Traccar, falling back to demo mode');
          this.demoMode = true;
          this.startMockDataGeneration();
          return true;
        }
      } catch (error) {
        console.error('❌ Failed to fetch Traccar data:', error);
        console.log('🔄 Falling back to demo mode');
        this.demoMode = true;
        this.startMockDataGeneration();
        return true;
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize Traccar service, using demo mode:', error);
      this.demoMode = true;
      this.startMockDataGeneration();
      return true;
    }
  }

  // Authenticate with Traccar server
  async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Authenticating with Traccar server...');
      
      const response = await fetch(`${this.traccarUrl}/api/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`,
      });

      if (response.ok) {
        // Extract session cookie
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          const sessionCookie = cookies.split(';')[0];
          this.sessionCookie = sessionCookie;
        }
        
        console.log('✅ Authentication successful');
        this.retryCount = 0;
        return true;
      } else {
        console.error('❌ Authentication failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return false;
    }
  }

  // Make authenticated request to Traccar API
  private async makeRequest(endpoint: string): Promise<any> {
    try {
      console.log(`🔗 Making request to: ${this.traccarUrl}/api/${endpoint}`);
      
      // Use basic authentication for reliability
      const credentials = btoa(`${this.username}:${this.password}`);
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`,
        // Removed Cache-Control to avoid CORS preflight
      };

      const response = await fetch(`${this.traccarUrl}/api/${endpoint}`, {
        method: 'GET',
        headers,
        mode: 'cors',
      });

      if (response.status === 401) {
        throw new Error('Authentication failed - check username/password');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Request successful for ${endpoint}:`, data.length ? `${data.length} items` : 'success');
      return data;
    } catch (error) {
      console.error(`❌ Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all devices from Traccar
  async getDevices(): Promise<TraccarDevice[]> {
    try {
      return await this.makeRequest('devices');
    } catch (error) {
      console.error('❌ Error fetching devices:', error);
      return [];
    }
  }

  // Get current positions of all devices
  async getPositions(): Promise<TraccarPosition[]> {
    try {
      return await this.makeRequest('positions');
    } catch (error) {
      console.error('❌ Error fetching positions:', error);
      return [];
    }
  }

  // Convert Traccar data to app format with Sri Lankan route integration
  private async convertToBusLocation(device: TraccarDevice, position: TraccarPosition): Promise<BusLocation> {
    // Extract route number from device name/uniqueId (format: "routeNo-busId" e.g., "138-001")
    const routeNumber = SriLankanBusRouteService.extractRouteFromIdentifier(device.uniqueId) || 
                       SriLankanBusRouteService.extractRouteFromIdentifier(device.name) ||
                       this.extractRouteFromLegacyFormat(device.name);
    
    // Extract bus number (the part after the dash)
    const busIdMatch = device.uniqueId.match(/-(\d+)$/) || device.name.match(/-(\d+)$/);
    const busNumber = busIdMatch ? busIdMatch[1] : device.uniqueId;

    // Try to get actual route data from Sri Lankan routes
    let routeInfo: SriLankanBusRoute | null = null;
    let routeName = `Route ${routeNumber}`;
    let startLocation = 'Unknown';
    let endLocation = 'Unknown';

    try {
      if (routeNumber) {
        routeInfo = await sriLankanBusRouteService.getRouteByNumber(routeNumber);
        if (routeInfo) {
          routeName = routeInfo.name || `${routeInfo.start} - ${routeInfo.destination}`;
          startLocation = routeInfo.start;
          endLocation = routeInfo.destination;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not fetch route info for ${routeNumber}:`, error);
    }

    const busLocation: BusLocation = {
      id: device.uniqueId,
      deviceId: device.id,
      routeNumber: routeNumber || 'Unknown',
      busNumber,
      latitude: position.latitude,
      longitude: position.longitude,
      speed: position.speed || 0,
      heading: position.course || 0,
      timestamp: new Date(position.fixTime),
      status: this.determineStatus(device, position),
      lastUpdate: new Date(),
      busInfo: {
        plateNumber: device.name,
        capacity: 50, // Default capacity
        type: 'Standard Bus',
        model: device.model || 'Unknown',
      },
      attributes: {
        ignition: position.attributes.ignition || false,
        motion: position.attributes.motion || false,
        distance: position.attributes.distance || 0,
        totalDistance: position.attributes.totalDistance || 0,
        accuracy: position.accuracy || 0,
      },
      // Add route info from Sri Lankan routes
      routeInfo: routeInfo ? {
        routeName,
        startLocation,
        endLocation,
        distance: routeInfo.distance,
        estimatedDuration: routeInfo.estimatedDuration,
        fare: routeInfo.fare,
        operatingHours: routeInfo.operatingHours
      } : undefined
    };

    // Only add driver if contact exists (Firebase doesn't allow undefined)
    if (device.contact) {
      busLocation.driver = {
        name: device.contact,
        phone: device.phone || '',
      };
    }

    return busLocation;
  }

  // Legacy format support (e.g., "Bus_138_001" -> "138")
  private extractRouteFromLegacyFormat(deviceName: string): string {
    const routeMatch = deviceName.match(/(?:Bus_|Route_)?(\d+)/i);
    return routeMatch ? routeMatch[1] : 'Unknown';
  }

  // Determine bus status based on device and position data
  private determineStatus(device: TraccarDevice, position: TraccarPosition): 'active' | 'inactive' | 'maintenance' | 'offline' {
    if (device.disabled) return 'maintenance';
    if (device.status === 'offline') return 'offline';
    
    const lastUpdateTime = new Date(position.fixTime);
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdateTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    // If last update is more than 10 minutes ago, consider offline
    if (minutesDiff > 10) return 'offline';
    
    // If moving and ignition on, consider active
    if (position.attributes.motion && position.attributes.ignition) return 'active';
    
    // If ignition on but not moving, consider inactive
    if (position.attributes.ignition) return 'inactive';
    
    return 'offline';
  }

  // Clear demo data from Firebase
  private async clearDemoData(): Promise<void> {
    try {
      console.log('🧹 Clearing demo data...');
      
      // Query for demo data (where isRealData is false or doesn't exist)
      const busLocationsRef = collection(this.db, 'busLocations');
      const q = query(busLocationsRef, where('isRealData', '!=', true));
      const snapshot = await getDocs(q);
      
      // Delete demo data
      const deletePromises = snapshot.docs.map((doc: any) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log(`🗑️ Cleared ${snapshot.docs.length} demo bus locations`);
    } catch (error) {
      console.error('❌ Error clearing demo data:', error);
    }
  }

  // Sync Traccar data to Firebase
  async syncToFirebase(): Promise<void> {
    try {
      console.log('🔄 Syncing data to Firebase...');
      
      // Clear any existing demo data first
      await this.clearDemoData();
      
      const [devices, positions] = await Promise.all([
        this.getDevices(),
        this.getPositions()
      ]);

      if (devices.length === 0) {
        console.log('⚠️ No devices found in Traccar');
        return;
      }

      // Create a map of latest positions by device ID
      const positionMap = new Map<number, TraccarPosition>();
      positions.forEach(pos => {
        const existing = positionMap.get(pos.deviceId);
        if (!existing || new Date(pos.fixTime) > new Date(existing.fixTime)) {
          positionMap.set(pos.deviceId, pos);
        }
      });

      // Sync each device with its latest position to Firebase
      const busLocations: BusLocation[] = [];
      const routeStats = new Map<string, { buses: BusLocation[], totalSpeed: number }>();

      for (const device of devices) {
        const position = positionMap.get(device.id);
        if (position) {
          const busLocation = await this.convertToBusLocation(device, position);
          busLocations.push(busLocation);

          // Save individual bus location to Firebase
          await setDoc(
            doc(this.db, 'busLocations', device.uniqueId),
            {
              ...busLocation,
              timestamp: busLocation.timestamp.toISOString(),
              lastUpdate: busLocation.lastUpdate.toISOString(),
              isRealData: true, // Mark as real Traccar data
            }
          );

          // Collect route statistics
          const routeNumber = busLocation.routeNumber;
          if (!routeStats.has(routeNumber)) {
            routeStats.set(routeNumber, { buses: [], totalSpeed: 0 });
          }
          const routeData = routeStats.get(routeNumber)!;
          routeData.buses.push(busLocation);
          routeData.totalSpeed += busLocation.speed;
        }
      }

      // Update Sri Lankan route statistics
      for (const [routeNumber, data] of routeStats) {
        const activeBuses = data.buses.filter(bus => bus.status === 'active').length;
        const totalBuses = data.buses.length;
        
        try {
          // Update the Sri Lankan routes collection with real bus counts
          await sriLankanBusRouteService.updateRouteActiveBuses(routeNumber, activeBuses, totalBuses);
        } catch (error) {
          console.warn(`⚠️ Could not update Sri Lankan route ${routeNumber}:`, error);
        }

        // Also update the legacy routes collection for backward compatibility
        const averageSpeed = data.buses.length > 0 ? data.totalSpeed / data.buses.length : 0;
        const routeData: RouteData = {
          id: routeNumber,
          routeNumber,
          routeName: data.buses[0]?.routeInfo?.routeName || `Route ${routeNumber}`,
          startLocation: data.buses[0]?.routeInfo?.startLocation || 'Unknown',
          endLocation: data.buses[0]?.routeInfo?.endLocation || 'Unknown',
          activeBuses,
          totalBuses,
          averageSpeed,
          lastUpdate: new Date(),
        };

        await setDoc(
          doc(this.db, 'routes', routeNumber),
          {
            ...routeData,
            lastUpdate: routeData.lastUpdate.toISOString(),
          }
        );
      }

      console.log(`✅ Synced ${busLocations.length} buses and ${routeStats.size} routes to Firebase`);
    } catch (error) {
      console.error('❌ Error syncing to Firebase:', error);
      
      // Retry logic
      this.retryCount++;
      if (this.retryCount < this.maxRetries) {
        console.log(`🔄 Retrying sync (${this.retryCount}/${this.maxRetries}) in 30 seconds...`);
        setTimeout(() => this.syncToFirebase(), 30000);
      } else {
        console.error('❌ Max retries reached, sync failed');
        this.retryCount = 0;
      }
    }
  }

  // Start periodic sync every 10 seconds
  startPeriodicSync(): void {
    console.log('⏰ Starting periodic sync every 10 seconds...');
    
    // Initial sync
    this.syncToFirebase();
    
    // Set up interval
    this.syncInterval = setInterval(() => {
      this.syncToFirebase();
    }, 10000); // 10 seconds
  }

  // Stop periodic sync
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️ Periodic sync stopped');
    }
  }

  // Subscribe to Firebase bus locations for real-time updates in your app
  subscribeToRoute(routeNumber: string, callback: (buses: BusLocation[]) => void): () => void {
    console.log(`👀 Subscribing to route ${routeNumber} updates...`);
    
    const q = query(
      collection(this.db, 'busLocations'),
      where('routeNumber', '==', routeNumber)
      // Removed orderBy to avoid composite index requirement
    );

    return onSnapshot(q, (snapshot) => {
      const buses: BusLocation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        buses.push({
          ...data,
          timestamp: new Date(data.timestamp),
          lastUpdate: new Date(data.lastUpdate),
        } as BusLocation);
      });
      
      // Sort by lastUpdate on client side instead of server side
      buses.sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());
      
      console.log(`📍 Route ${routeNumber}: ${buses.length} buses updated`);
      callback(buses);
    }, (error) => {
      console.error('❌ Error in route subscription:', error);
    });
  }

  // Subscribe to all bus locations
  subscribeToAllBuses(callback: (buses: BusLocation[]) => void): () => void {
    console.log('👀 Subscribing to all bus updates...');
    
    const q = query(
      collection(this.db, 'busLocations'),
      orderBy('lastUpdate', 'desc'),
      limit(100) // Limit to last 100 buses for performance
    );

    return onSnapshot(q, (snapshot) => {
      const buses: BusLocation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        buses.push({
          ...data,
          timestamp: new Date(data.timestamp),
          lastUpdate: new Date(data.lastUpdate),
        } as BusLocation);
      });
      
      console.log(`📍 All buses: ${buses.length} buses updated`);
      callback(buses);
    }, (error) => {
      console.error('❌ Error in all buses subscription:', error);
    });
  }

  // Subscribe to route statistics
  subscribeToRoutes(callback: (routes: RouteData[]) => void): () => void {
    console.log('👀 Subscribing to route statistics...');
    
    const q = query(
      collection(this.db, 'routes'),
      orderBy('lastUpdate', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const routes: RouteData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        routes.push({
          ...data,
          lastUpdate: new Date(data.lastUpdate),
        } as RouteData);
      });
      
      console.log(`📊 Routes: ${routes.length} routes updated`);
      callback(routes);
    }, (error) => {
      console.error('❌ Error in routes subscription:', error);
    });
  }

  // Test connection to Traccar server
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log(`🧪 Testing Traccar connection to ${this.traccarUrl}...`);
      
      // For web mode, try a simpler approach to avoid CORS preflight
      const isWeb = typeof window !== 'undefined';
      
      if (isWeb) {
        console.log('🌐 Web mode detected - attempting CORS-friendly connection...');
        // Try to access the server info endpoint with minimal headers
        try {
          const response = await fetch(`${this.traccarUrl}/api/server`);
          if (response.ok) {
            const serverInfo = await response.json();
            console.log('✅ Successfully connected to Traccar server:', serverInfo);
            this.demoMode = false;
            return {
              success: true,
              message: `Connected to Traccar server (${serverInfo.version || 'unknown version'})`,
              data: serverInfo,
            };
          }
        } catch (corsError) {
          console.warn('🌐 CORS policy blocks direct connection in web mode.');
          console.warn('💡 To fix this: Add the following to your Traccar server configuration:');
          console.warn('   1. Add to traccar.xml: <entry key="web.origin">*</entry>');
          console.warn('   2. Or use CORS browser extension for development');
          console.warn('   3. For now, falling back to demo mode...');
          
          this.demoMode = true;
          return {
            success: true, // Still return success but enable demo mode
            message: 'CORS policy blocks direct connection in web mode, using demo mode. See console for fix instructions.',
            data: { demoMode: true, corsIssue: true },
          };
        }
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.traccarUrl}/api/server`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          // Removed Cache-Control to avoid CORS preflight
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const serverInfo = await response.json();
        this.demoMode = false;
        console.log('✅ Successfully connected to Traccar server:', serverInfo);
        return {
          success: true,
          message: `Connected to Traccar server (${serverInfo.version || 'unknown version'})`,
          data: serverInfo,
        };
      } else {
        console.warn(`⚠️ Traccar server responded with status ${response.status}`);
        this.demoMode = true;
        return {
          success: true, // Still return success but enable demo mode
          message: `Server responded with ${response.status}, using demo mode`,
          data: { demoMode: true },
        };
      }
    } catch (error) {
      console.warn('⚠️ Traccar connection failed, enabling demo mode:', error);
      this.demoMode = true;
      return {
        success: true, // Return success to continue with demo mode
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}, using demo mode`,
        data: { demoMode: true },
      };
    }
  }

  // Cleanup
  destroy(): void {
    console.log('🧹 Cleaning up Traccar service...');
    this.stopPeriodicSync();
    this.sessionCookie = null;
  }

  // Stop demo mode and clean up
  private stopDemoMode(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.demoMode = false;
    console.log('🛑 Demo mode stopped');
  }

  // Mock data generation for demo mode
  private startMockDataGeneration(): void {
    console.log('🎭 Starting mock data generation...');
    
    // Generate initial mock data
    this.generateMockBuses();
    this.generateMockRoutes();
    
    // Update mock data every 5 seconds
    this.syncInterval = setInterval(() => {
      this.updateMockBuses();
    }, 5000);
  }

  private generateMockBuses(): void {
    const mockBuses: BusLocation[] = [
      {
        id: 'mock_bus_138_1',
        deviceId: 1,
        routeNumber: '138',
        busNumber: 'NB-1234',
        latitude: 6.9271 + (Math.random() - 0.5) * 0.01,
        longitude: 79.8612 + (Math.random() - 0.5) * 0.01,
        speed: 25 + Math.random() * 20,
        heading: Math.random() * 360,
        timestamp: new Date(),
        lastUpdate: new Date(),
        status: 'active',
        busInfo: {
          plateNumber: 'NB-1234',
          type: 'Bus',
          model: 'Ashok Leyland',
          capacity: 45
        },
        driver: {
          name: 'Kamal Perera',
          phone: '+94771234567'
        },
        attributes: {
          ignition: true,
          motion: true,
          distance: 156.2,
          totalDistance: 12453.8,
          accuracy: 5.0
        }
      },
      {
        id: 'mock_bus_177_1',
        deviceId: 2,
        routeNumber: '177',
        busNumber: 'NC-5678',
        latitude: 6.9200 + (Math.random() - 0.5) * 0.01,
        longitude: 79.8500 + (Math.random() - 0.5) * 0.01,
        speed: 15 + Math.random() * 25,
        heading: Math.random() * 360,
        timestamp: new Date(),
        lastUpdate: new Date(),
        status: 'active',
        busInfo: {
          plateNumber: 'NC-5678',
          type: 'Bus',
          model: 'Tata',
          capacity: 50
        },
        driver: {
          name: 'Nimal Silva',
          phone: '+94771234568'
        },
        attributes: {
          ignition: true,
          motion: true,
          distance: 89.5,
          totalDistance: 8765.3,
          accuracy: 3.2
        }
      },
      {
        id: 'mock_bus_120_1',
        deviceId: 3,
        routeNumber: '120',
        busNumber: 'ND-9012',
        latitude: 6.8700 + (Math.random() - 0.5) * 0.01,
        longitude: 79.9000 + (Math.random() - 0.5) * 0.01,
        speed: 0 + Math.random() * 10,
        heading: Math.random() * 360,
        timestamp: new Date(),
        lastUpdate: new Date(),
        status: 'inactive',
        busInfo: {
          plateNumber: 'ND-9012',
          type: 'Bus',
          model: 'Mahindra',
          capacity: 40
        },
        driver: {
          name: 'Saman Fernando',
          phone: '+94771234569'
        },
        attributes: {
          ignition: false,
          motion: false,
          distance: 0,
          totalDistance: 15678.9,
          accuracy: 8.1
        }
      }
    ];

    // Store in Firebase for real-time updates
    mockBuses.forEach(async (bus) => {
      try {
        await setDoc(doc(this.db, 'busLocations', bus.id), {
          ...bus,
          timestamp: bus.timestamp.toISOString(),
          lastUpdate: bus.lastUpdate.toISOString(),
          isRealData: false, // Mark as demo data
        });
      } catch (error) {
        console.log('Demo mode: Firebase not available, using local data');
      }
    });
  }

  private generateMockRoutes(): void {
    const mockRoutes: RouteData[] = [
      {
        id: 'route_138',
        routeNumber: '138',
        routeName: 'Pettah - Kaduwela',
        startLocation: 'Pettah',
        endLocation: 'Kaduwela',
        activeBuses: 2,
        totalBuses: 3,
        averageSpeed: 22.5,
        lastUpdate: new Date()
      },
      {
        id: 'route_177',
        routeNumber: '177',
        routeName: 'Fort - Nugegoda',
        startLocation: 'Fort',
        endLocation: 'Nugegoda',
        activeBuses: 1,
        totalBuses: 2,
        averageSpeed: 18.2,
        lastUpdate: new Date()
      },
      {
        id: 'route_120',
        routeNumber: '120',
        routeName: 'Maharagama - Colombo',
        startLocation: 'Maharagama',
        endLocation: 'Colombo',
        activeBuses: 0,
        totalBuses: 1,
        averageSpeed: 0,
        lastUpdate: new Date()
      }
    ];

    // Store in Firebase
    mockRoutes.forEach(async (route) => {
      try {
        await setDoc(doc(this.db, 'routes', route.id), {
          ...route,
          lastUpdate: route.lastUpdate.toISOString(),
        });
      } catch (error) {
        console.log('Demo mode: Firebase not available, using local data');
      }
    });
  }

  private updateMockBuses(): void {
    if (!this.demoMode) return;

    // Simulate bus movement
    const mockBusIds = ['mock_bus_138_1', 'mock_bus_177_1', 'mock_bus_120_1'];
    
    mockBusIds.forEach(async (busId) => {
      try {
        const busRef = doc(this.db, 'busLocations', busId);
        
        // Generate small random movement
        const latChange = (Math.random() - 0.5) * 0.001; // ~100m
        const lngChange = (Math.random() - 0.5) * 0.001; // ~100m
        const speedChange = (Math.random() - 0.5) * 10;
        
        // Update the document (this will trigger real-time listeners)
        await setDoc(busRef, {
          latitude: 6.9271 + latChange,
          longitude: 79.8612 + lngChange,
          speed: Math.max(0, 20 + speedChange),
          lastUpdate: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          isRealData: false, // Mark as demo data
        }, { merge: true });
        
      } catch (error) {
        console.log('Demo mode: Firebase update failed, continuing with local simulation');
      }
    });
  }
}

// Create and export singleton instance
export const traccarService = new TraccarService();

// Auto-initialize when service is imported
// traccarService.initialize().catch(console.error);
