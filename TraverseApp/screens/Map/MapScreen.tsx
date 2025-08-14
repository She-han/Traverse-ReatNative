import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { traccarService, BusLocation, RouteData } from '../../services/traccarService';

// Import map components
let WebMapView: any = null;

if (Platform.OS === 'web') {
  try {
    WebMapView = require('../../components/Map/WebMapView').default;
    console.log('✅ WebMapView loaded successfully');
  } catch (error) {
    console.log('❌ WebMapView not available:', error);
  }
}

// Universal map that works on both platforms
let UniversalMapView: any = null;
try {
  UniversalMapView = require('../../components/Map/UniversalMapView').default;
  console.log('✅ UniversalMapView loaded successfully');
} catch (error) {
  console.log('❌ UniversalMapView not available:', error);
}

const { width, height } = Dimensions.get('window');

// Conditionally import MapView for mobile platforms
let ExpoMap: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const ExpoMaps = require('expo-maps');
    ExpoMap = ExpoMaps.MapView;
    Marker = ExpoMaps.Marker;
    Polyline = ExpoMaps.Polyline;
    console.log('✅ Expo Maps loaded successfully');
  } catch (error) {
    console.log('❌ Expo Maps not available, using fallback:', error);
  }
}

interface Route {
  id: string;
  number: string;
  name: string;
  startLocation: string;
  endLocation: string;
  activeBuses: number;
  totalBuses: number;
}

const MapScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [buses, setBuses] = useState<BusLocation[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'demo' | 'error'>('connecting');
  const [refreshing, setRefreshing] = useState(false);
  
  // User location states
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  
  const mapRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    console.log('🚀 MapScreen useEffect running - initializing...');
    initializeTraccar();
    requestLocationPermission();
    
    return () => {
      // Cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      traccarService.destroy();
    };
  }, []);

  useEffect(() => {
    console.log('🗺️ Map rendering effect - UniversalMapView:', !!UniversalMapView, 'ExpoMap:', !!ExpoMap, 'Platform:', Platform.OS);
    console.log('📍 Current userLocation:', userLocation);
    console.log('🚌 Current buses count:', buses.length);
  });

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = routes.map(route => ({
        id: route.id,
        number: route.routeNumber,
        name: route.routeName,
        startLocation: route.startLocation,
        endLocation: route.endLocation,
        activeBuses: route.activeBuses,
        totalBuses: route.totalBuses,
      })).filter(route =>
        route.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.startLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.endLocation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRoutes(filtered);
      setShowSearchResults(true);
    } else {
      setFilteredRoutes([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, routes]);

  const initializeTraccar = async () => {
    try {
      setConnectionStatus('connecting');
      console.log('🚀 Initializing Traccar integration...');

      // Test connection first
      const connectionTest = await traccarService.testConnection();
      console.log('Connection test result:', connectionTest);
      
      if (!connectionTest.success) {
        setConnectionStatus('error');
        Alert.alert(
          'Connection Failed',
          `Could not connect to Traccar server: ${connectionTest.message}`,
          [
            { text: 'Retry', onPress: initializeTraccar },
            { text: 'Use Demo Mode', onPress: () => {
              setConnectionStatus('demo');
              setIsLoading(false);
            }}
          ]
        );
        return;
      } 
      
      if (connectionTest.data?.demoMode) {
        console.log('Using demo mode as requested by service');
        setConnectionStatus('demo');
        
        // Show helpful message for CORS issues
        if (connectionTest.data?.corsIssue) {
          Alert.alert(
            'CORS Issue Detected',
            'The web browser is blocking direct connection to Traccar server due to CORS policy. Using demo mode for now.\n\nTo fix this:\n1. Add <entry key="web.origin">*</entry> to your traccar.xml\n2. Or install a CORS browser extension\n3. Or test on mobile device',
            [{ text: 'OK' }]
          );
        }
      } else {
        console.log('Real Traccar connection established');
        setConnectionStatus('connected');
      }

      // Initialize service (will use demo mode if connection failed)
      const initialized = await traccarService.initialize();
      if (!initialized) {
        setConnectionStatus('error');
        Alert.alert('Initialization Error', 'Failed to initialize tracking service');
        setIsLoading(false);
        return;
      }

      // Final status check
      console.log('Final connection status:', connectionStatus);

      // Subscribe to all buses
      unsubscribeRef.current = traccarService.subscribeToAllBuses((updatedBuses) => {
        console.log(`📍 Received ${updatedBuses.length} bus updates`);
        setBuses(updatedBuses);
      });

      // Subscribe to route data
      traccarService.subscribeToRoutes((updatedRoutes) => {
        console.log(`📊 Received ${updatedRoutes.length} route updates`);
        setRoutes(updatedRoutes);
      });

      setIsLoading(false);
      console.log('✅ Traccar integration initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing Traccar:', error);
      setConnectionStatus('demo'); // Use demo mode
      setIsLoading(false);
      Alert.alert(
        'Demo Mode', 
        'Running in demo mode with mock bus data. For real tracking, ensure Traccar server is running and accessible.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    setSearchQuery(`Route ${route.number} - ${route.name}`);
    setShowSearchResults(false);

    // Unsubscribe from all buses and subscribe to specific route
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = traccarService.subscribeToRoute(route.number, (routeBuses) => {
      console.log(`📍 Route ${route.number}: ${routeBuses.length} buses`);
      setBuses(routeBuses);
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedRoute(null);
    setShowSearchResults(false);
    
    // Unsubscribe from route-specific and subscribe to all buses
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = traccarService.subscribeToAllBuses((allBuses) => {
      setBuses(allBuses);
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await traccarService.syncToFirebase();
    setRefreshing(false);
  };

  // Location permission and user location functions
  const requestLocationPermission = async () => {
    try {
      console.log('📋 Requesting location permission...');
      
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform detected - using browser geolocation API');
        await getWebLocation();
        return;
      }
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('📋 Location permission status:', status);
      
      if (status === 'granted') {
        console.log('✅ Location permission granted');
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        console.log('❌ Location permission denied, status:', status);
        setLocationPermission(false);
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show your position on the map and help you find nearby buses. Please enable location access in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Error requesting location permission:', error);
      setLocationPermission(false);
    }
  };

  const getWebLocation = async () => {
    try {
      console.log('🌐 Requesting web geolocation...');
      setLocationLoading(true);
      
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported by this browser');
        Alert.alert('Location Error', 'Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          
          setUserLocation(userCoords);
          setLocationPermission(true);
          console.log('✅ Web location obtained:', userCoords);
          
          setLocationLoading(false);
        },
        (error) => {
          console.error('❌ Web geolocation error:', error);
          setLocationLoading(false);
          setLocationPermission(false);
          
          let errorMessage = 'Could not get your location. ';
          switch (error.code) {
            case 1:
              errorMessage += 'Location access denied by user.';
              break;
            case 2:
              errorMessage += 'Location information unavailable.';
              break;
            case 3:
              errorMessage += 'Location request timed out.';
              break;
            default:
              errorMessage += 'Unknown error occurred.';
              break;
          }
          
          Alert.alert('Location Error', errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (error) {
      console.error('❌ Error in web geolocation:', error);
      setLocationLoading(false);
      setLocationPermission(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      console.log('🔍 Getting current location...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(userCoords);
      console.log('📍 User location obtained:', userCoords);
      
      // Center map on user location if mapRef is available
      if (mapRef.current) {
        console.log('🎯 Centering map on user location');
        mapRef.current.animateToRegion({
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }, 1500);
      } else {
        console.log('⚠️ Map reference not available for centering');
      }
      
    } catch (error) {
      console.error('❌ Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. Please check your GPS settings and try again.',
        [
          { text: 'Retry', onPress: getCurrentLocation },
          { text: 'Cancel' }
        ]
      );
    } finally {
      setLocationLoading(false);
      console.log('📍 Location loading finished');
    }
  };

  const centerOnUserLocation = () => {
    console.log('🎯 centerOnUserLocation called');
    
    if (!userLocation) {
      console.log('🔄 No user location available, requesting...');
      getCurrentLocation();
      return;
    }

    if (mapRef.current) {
      console.log('🗺️ Centering map on user location:', userLocation);
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } else {
      console.log('⚠️ Map reference not available');
    }
  };

  const getBusStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2ECC71';
      case 'inactive': return '#FFA500';
      case 'maintenance': return '#9B59B6';
      case 'offline': return '#95A5A6';
      default: return '#95A5A6';
    }
  };

  const getBusStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '🟡';
      case 'maintenance': return '🔧';
      case 'offline': return '⚪';
      default: return '⚪';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#2ECC71';
      case 'demo': return '#3498DB';
      case 'connecting': return '#FFA500';
      case 'error': return '#E74C3C';
      default: return '#95A5A6';
    }
  };

  const renderSearchResult = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleRouteSelect(item)}
    >
      <View style={styles.resultItemLeft}>
        <Text style={styles.resultRouteNumber}>Route {item.number}</Text>
        <Text style={styles.resultDestination}>
          {item.startLocation} → {item.endLocation}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e1" style={styles.resultArrow} />
    </TouchableOpacity>
  );

  const BusInfoModal = () => (
    <Modal
      visible={!!selectedBus}
      transparent
      animationType="slide"
      onRequestClose={() => setSelectedBus(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.busInfoModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bus Information</Text>
            <TouchableOpacity onPress={() => setSelectedBus(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {selectedBus && (
            <View style={styles.busInfoContent}>
              <View style={styles.busInfoRow}>
                <Text style={styles.busInfoLabel}>Route:</Text>
                <View style={[styles.routeBadge, { backgroundColor: '#2ECC71' }]}>
                  <Text style={styles.routeBadgeText}>{selectedBus.routeNumber}</Text>
                </View>
              </View>
              
              <View style={styles.busInfoRow}>
                <Text style={styles.busInfoLabel}>Bus Number:</Text>
                <Text style={styles.busInfoValue}>{selectedBus.busNumber}</Text>
              </View>

             
              
              <View style={styles.busInfoRow}>
                <Text style={styles.busInfoLabel}>Status:</Text>
                <Text style={[styles.busInfoValue, 
                  { color: getBusStatusColor(selectedBus.status) }
                ]}>
                  {getBusStatusIcon(selectedBus.status)} {selectedBus.status.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.busInfoRow}>
                <Text style={styles.busInfoLabel}>Speed:</Text>
                <Text style={styles.busInfoValue}>{selectedBus.speed.toFixed(1)} km/h</Text>
              </View>
              
              <View style={styles.busInfoRow}>
                <Text style={styles.busInfoLabel}>Location:</Text>
                <Text style={styles.busInfoValue}>
                  {selectedBus.latitude.toFixed(6)}, {selectedBus.longitude.toFixed(6)}
                </Text>
              </View>

              <View style={styles.busInfoRow}>
                <Text style={styles.busInfoLabel}>Last Update:</Text>
                <Text style={styles.busInfoValue}>
                  {selectedBus.lastUpdate.toLocaleTimeString()}
                </Text>
              </View>

              {selectedBus.driver && (
                <View style={styles.busInfoRow}>
                  <Text style={styles.busInfoLabel}>Driver:</Text>
                  <Text style={styles.busInfoValue}>{selectedBus.driver.name}</Text>
                </View>
              )}

              <View style={styles.busInfoRow}>
                <Text style={styles.busInfoLabel}>Ignition:</Text>
                <Text style={styles.busInfoValue}>
                  {selectedBus.attributes.ignition ? '🔥 ON' : '⚫ OFF'}
                </Text>
              </View>

              <View style={styles.busInfoRow}>
                <Text style={styles.busInfoLabel}>Motion:</Text>
                <Text style={styles.busInfoValue}>
                  {selectedBus.attributes.motion ? '🚌 Moving' : '⏸️ Stopped'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={styles.loadingText}>Connecting to Traccar server...</Text>
        <Text style={styles.loadingSubtext}>
          Status: {connectionStatus}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
     

      {/* Modern Search Container */}
      <View style={styles.modernSearchContainer}>
        <View style={styles.modernSearchInputContainer}>
          <Ionicons name="search" size={20} color="#6366f1" style={styles.searchIcon} />
          <TextInput
            style={styles.modernSearchInput}
            placeholder="Search routes, destinations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.modernClearButton}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modern Search Results */}
      {showSearchResults && (
        <View style={styles.modernSearchResults}>
          <FlatList
            data={filteredRoutes}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            style={styles.searchResultsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' && WebMapView ? (
          <View style={styles.mapContainer}>
            <WebMapView
              buses={buses}
              selectedBus={selectedBus}
              onBusSelect={setSelectedBus}
              userLocation={userLocation}
            />
            
            {/* Web Location Button */}
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  getWebLocation();
                } else {
                  centerOnUserLocation();
                }
              }}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons 
                  name={userLocation ? "location" : "location-outline"} 
                  size={24} 
                  color="#ffffff" 
                />
              )}
            </TouchableOpacity>
          </View>
        ) : ExpoMap && Platform.OS !== 'web' ? (
          <View style={styles.mapContainer}>
            <ExpoMap
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: userLocation?.latitude || 6.9271,
                longitude: userLocation?.longitude || 79.8612,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              showsUserLocation={false}
              showsMyLocationButton={false}
            >
              {/* Bus Markers */}
              {buses.map((bus) => (
                <Marker
                  key={bus.id}
                  coordinate={{
                    latitude: bus.latitude,
                    longitude: bus.longitude,
                  }}
                  onPress={() => setSelectedBus(bus)}
                >
                  <View style={[styles.busMarker, 
                    { backgroundColor: getBusStatusColor(bus.status) }
                  ]}>
                    <Text style={styles.busMarkerText}>{bus.routeNumber}</Text>
                  </View>
                </Marker>
              ))}
              
              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  title="Your Location"
                  description={`Lat: ${userLocation.latitude.toFixed(6)}, Lng: ${userLocation.longitude.toFixed(6)}`}
                >
                  <Ionicons name="radio-button-on" size={30} color="#6366f1" />
                </Marker>
              )}
            </ExpoMap>
            
            {/* My Location Button */}
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={centerOnUserLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons 
                  name={userLocation ? "location" : "location-outline"} 
                  size={24} 
                  color="#ffffff" 
                />
              )}
            </TouchableOpacity>
          </View>
        ) : UniversalMapView ? (
          <View style={styles.mapContainer}>
            <UniversalMapView
              buses={buses}
              selectedBus={selectedBus}
              onBusSelect={setSelectedBus}
              userLocation={userLocation}
            />
            
            {/* Mobile Location Button for UniversalMapView */}
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={centerOnUserLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons 
                  name={userLocation ? "location" : "location-outline"} 
                  size={24} 
                  color="#ffffff" 
                />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.busListContainer}>
            <FlatList
              data={buses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.busItem}
                  onPress={() => setSelectedBus(item)}
                >
                  <View style={styles.busItemHeader}>
                    <View style={styles.busItemLeft}>
                      <View style={[styles.busStatusIndicator, { backgroundColor: getBusStatusColor(item.status) }]} />
                      <View>
                        <Text style={styles.busItemRoute}>Route {item.routeNumber}</Text>
                        <Text style={styles.busItemNumber}>Bus {item.busNumber}</Text>
                      </View>
                    </View>
                    <Text style={styles.busItemSpeed}>{item.speed.toFixed(1)} km/h</Text>
                  </View>
                  
                  <View style={styles.busItemDetails}>
                    <Text style={styles.busItemLocation}>
                      📍 {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                    </Text>
                    <Text style={styles.busItemStatus}>
                      {getBusStatusIcon(item.status)} {item.status} • Updated {item.lastUpdate.toLocaleTimeString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#2ECC71']}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="bus-outline" size={60} color="#ccc" />
                  <Text style={styles.emptyStateText}>No buses found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    {connectionStatus === 'connected' 
                      ? 'Make sure bus drivers have started the Traccar client app'
                      : connectionStatus === 'demo'
                      ? 'Demo mode - mock data will appear shortly'
                      : 'Check Traccar server connection'
                    }
                  </Text>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Stats Footer */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{buses.length}</Text>
          <Text style={styles.statLabel}>Total Buses</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {buses.filter(bus => bus.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {new Set(buses.map(bus => bus.routeNumber)).size}
          </Text>
          <Text style={styles.statLabel}>Routes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {buses.length > 0 ? (buses.reduce((acc, bus) => acc + bus.speed, 0) / buses.length).toFixed(1) : '0'}
          </Text>
          <Text style={styles.statLabel}>Avg Speed</Text>
        </View>
      </View>

      {/* Bus Info Modal */}
      <BusInfoModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  
  // Modern Header Styles
  modernHeader: {
    backgroundColor: '#6366f1',
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Modern Search Styles
  modernSearchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
  },
  modernSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modernSearchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  modernClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  // Modern Search Results
  modernSearchResults: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 16,
    maxHeight: 200,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  webFallbackText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  mapFallbackText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  mapFallbackSubtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  mockDataContainer: {
    marginTop: 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  mockDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  busItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  busDetails: {
    flex: 1,
  },
  busRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  busInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  busOccupancy: {
    fontSize: 12,
    color: '#999',
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 80,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchResultsList: {
    padding: 8,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultItemLeft: {
    flex: 1,
  },
  resultRouteNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  resultDestination: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  resultArrow: {
    marginLeft: 12,
    opacity: 0.7,
  },
  searchResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  routeBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchResultRoute: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    backgroundColor: '#2ECC71',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  routeInfoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeInfoName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  routeInfoDetails: {
    fontSize: 14,
    color: '#666',
  },
  busMarker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  busMarkerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  busInfoModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  busInfoContent: {
    gap: 15,
  },
  busInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  busInfoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  busInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  // New styles for Traccar integration
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
  },
  mapContainer: {
    flex: 1,
  },
  busListContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  busItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  busItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  busItemRoute: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  busItemNumber: {
    fontSize: 14,
    color: '#666',
  },
  busItemSpeed: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  busItemDetails: {
    gap: 4,
  },
  busItemLocation: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  busItemStatus: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  searchResultStats: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 20,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Location button style
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default MapScreen;