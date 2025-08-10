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
import { traccarService, BusLocation, RouteData } from '../../services/traccarService';

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
  } catch (error) {
    console.log('Expo Maps not available, using fallback');
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
  const mapRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initializeTraccar();
    
    return () => {
      // Cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      traccarService.destroy();
    };
  }, []);

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
      <View style={styles.searchResultHeader}>
        <View style={[styles.routeBadge, { backgroundColor: '#2ECC71' }]}>
          <Text style={styles.routeBadgeText}>{item.number}</Text>
        </View>
        <View style={styles.searchResultText}>
          <Text style={styles.searchResultName}>{item.name}</Text>
          <Text style={styles.searchResultRoute}>
            {item.startLocation} → {item.endLocation}
          </Text>
          <Text style={styles.searchResultStats}>
            {item.activeBuses}/{item.totalBuses} buses active
          </Text>
        </View>
      </View>
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
                <Text style={styles.busInfoLabel}>Plate Number:</Text>
                <Text style={styles.busInfoValue}>{selectedBus.busInfo.plateNumber}</Text>
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
      {/* Header with Connection Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Live Bus Tracking</Text>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} />
            <Text style={styles.statusText}>{connectionStatus}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons 
            name={refreshing ? "refresh" : "refresh-outline"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      {/* Search Header */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search route number or destination..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {showSearchResults && (
        <View style={styles.searchResults}>
          <FlatList
            data={filteredRoutes}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            style={styles.searchResultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Map/Bus List Container */}
      <View style={styles.mapContainer}>
        {ExpoMap && Platform.OS !== 'web' ? (
          <ExpoMap
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: 6.9271,
              longitude: 79.8612,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true}
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
          </ExpoMap>
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
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
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
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
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
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ECC71',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default MapScreen;