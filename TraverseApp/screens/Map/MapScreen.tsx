import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  requestLocationPermission, 
  getCurrentLocation,
  updateCurrentLocation 
} from '../../store/slices/locationSlice';
import { COLORS } from '../../constants';
import WebMapFallback from '../../components/common/WebMapFallback';

// Conditionally import MapView only for native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
  PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
}

const MapScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentLocation, isLocationEnabled, isLoading, error } = useAppSelector(
    state => state.location
  );
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9271, // Default to Colombo, Sri Lanka
    longitude: 79.8612,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      setMapRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [currentLocation]);

  const initializeLocation = async () => {
    try {
      await dispatch(requestLocationPermission()).unwrap();
      await dispatch(getCurrentLocation()).unwrap();
    } catch (error) {
      Alert.alert(
        'Location Permission',
        'Location access is required for the best experience. Please enable location services.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: initializeLocation },
        ]
      );
    }
  };

  const handleMyLocation = async () => {
    if (!isLocationEnabled) {
      initializeLocation();
      return;
    }

    try {
      await dispatch(getCurrentLocation()).unwrap();
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    console.log('Map pressed at:', coordinate);
    // You can add functionality here for adding custom markers, etc.
  };

  // Show web fallback for web platform
  if (Platform.OS === 'web') {
    return <WebMapFallback />;
  }

  if (isLoading && !currentLocation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {/* Example bus stops - replace with real data */}
        <Marker
          coordinate={{ latitude: 6.9271, longitude: 79.8612 }}
          title="Fort Railway Station"
          description="Main bus terminal"
          pinColor={COLORS.primary}
        />
        
        <Marker
          coordinate={{ latitude: 6.9344, longitude: 79.8428 }}
          title="Pettah Bus Stand"
          description="Central bus hub"
          pinColor={COLORS.accent}
        />
      </MapView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleMyLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons 
              name="locate" 
              size={24} 
              color={COLORS.white} 
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar Placeholder */}
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <Text style={styles.searchPlaceholder}>Search routes, stops...</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Placeholder */}
      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>Nearby Stops</Text>
        <Text style={styles.sheetSubtitle}>
          {isLocationEnabled 
            ? 'Finding bus stops near you...' 
            : 'Enable location to see nearby stops'
          }
        </Text>
      </View>

      {/* Status Bar */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.gray,
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 200,
    right: 16,
    zIndex: 1,
  },
  fab: {
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
    opacity: 0.3,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  errorBanner: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: COLORS.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  errorText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MapScreen;