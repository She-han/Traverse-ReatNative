import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { sriLankanBusRouteService, SriLankanBusRoute } from '../../services/sriLankanBusRouteService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { testSriLankanRoutes, testFirebaseIntegration } from '../../utils/testRoutes';

const SriLankanRoutesScreen: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const { showSuccess, handleError, showInfo } = useErrorHandler();
  
  const [routes, setRoutes] = useState<SriLankanBusRoute[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<SriLankanBusRoute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteRoutes, setFavoriteRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'colombo' | 'kandy'>('all');

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    filterRoutes();
  }, [routes, searchQuery, selectedFilter, favoriteRoutes]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      
      // Check if routes exist in Firebase
      let routesData = await sriLankanBusRouteService.getAllSriLankanRoutes();
      
      // If no routes found, add them to Firebase first
      if (routesData.length === 0) {
        showInfo(
          'Setting up routes...',
          'Loading Sri Lankan bus routes for the first time. This may take a moment.'
        );
        
        await sriLankanBusRouteService.addAllRoutesToFirebase();
        routesData = await sriLankanBusRouteService.getAllSriLankanRoutes();
        
        showSuccess(
          'Routes loaded!',
          `Successfully loaded ${routesData.length} Sri Lankan bus routes.`
        );
      }
      
      setRoutes(routesData);
    } catch (error) {
      console.error('Error loading routes:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutes();
    setRefreshing(false);
  };

  const filterRoutes = () => {
    let filtered = routes;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(route => 
        route.routeNo.toLowerCase().includes(query) ||
        route.start.toLowerCase().includes(query) ||
        route.destination.toLowerCase().includes(query) ||
        route.name?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'favorites':
        filtered = filtered.filter(route => favoriteRoutes.includes(route.id));
        break;
      case 'colombo':
        filtered = filtered.filter(route => 
          route.start.toLowerCase().includes('colombo') || 
          route.destination.toLowerCase().includes('colombo')
        );
        break;
      case 'kandy':
        filtered = filtered.filter(route => 
          route.start.toLowerCase().includes('kandy') || 
          route.destination.toLowerCase().includes('kandy')
        );
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    setFilteredRoutes(filtered);
  };

  const toggleFavorite = async (routeId: string) => {
    try {
      const isFavorite = favoriteRoutes.includes(routeId);
      let newFavorites: string[];
      
      if (isFavorite) {
        newFavorites = favoriteRoutes.filter(id => id !== routeId);
        showInfo('Removed from favorites', '');
      } else {
        newFavorites = [...favoriteRoutes, routeId];
        showInfo('Added to favorites', '');
      }
      
      setFavoriteRoutes(newFavorites);
      
      // TODO: Save to user preferences in Firebase
      // await userService.updateFavoriteRoutes(user?.id, newFavorites);
    } catch (error) {
      handleError(error);
    }
  };

  const runTests = async () => {
    showInfo('Running tests...', 'Testing Sri Lankan bus route service');
    
    const testResult = await testSriLankanRoutes();
    if (testResult.success) {
      showSuccess('Tests passed!', `Service working correctly with ${testResult.routeCount} routes`);
    } else {
      handleError(testResult.error);
    }
  };

  const handleRoutePress = (route: SriLankanBusRoute) => {
    Alert.alert(
      `Route ${route.routeNo}`,
      `${route.start} → ${route.destination}\n\n` +
      `Distance: ${route.distance} km\n` +
      `Duration: ${Math.floor((route.estimatedDuration || 0) / 60)}h ${(route.estimatedDuration || 0) % 60}m\n` +
      `Fare: LKR ${route.fare}\n` +
      `Frequency: ${route.frequency}\n` +
      `Operating: ${route.operatingHours.start} - ${route.operatingHours.end}\n` +
      `Active Buses: ${route.activeBuses}/${route.totalBuses}`
    );
  };

  const renderRouteItem = ({ item }: { item: SriLankanBusRoute }) => {
    const isFavorite = favoriteRoutes.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.routeCard} 
        onPress={() => handleRoutePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.routeHeader}>
          <View style={styles.routeNumberContainer}>
            <View style={[styles.routeNumber, { backgroundColor: item.color }]}>
              <Text style={styles.routeNumberText}>{item.routeNo}</Text>
            </View>
            <View style={styles.routeStatus}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: item.status === 'active' ? '#22C55E' : '#EF4444' }
              ]} />
              <Text style={styles.statusText}>
                {item.status === 'active' ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={() => toggleFavorite(item.id)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#E53E3E' : '#9CA3AF'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.routeLocation}>
              {item.start} → {item.destination}
            </Text>
          </View>
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.frequency}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="bus-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.activeBuses}/{item.totalBuses} active
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={14} color="#6B7280" />
            <Text style={styles.detailText}>LKR {item.fare}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ 
    label, 
    value, 
    count 
  }: { 
    label: string; 
    value: typeof selectedFilter; 
    count?: number; 
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === value && styles.activeFilterButton
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === value && styles.activeFilterButtonText
      ]}>
        {label} {count !== undefined && `(${count})`}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading Sri Lankan bus routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Sri Lankan Bus Routes</Text>
          <Text style={styles.subtitle}>{routes.length} routes available</Text>
        </View>
        <TouchableOpacity onPress={runTests} style={styles.testButton}>
          <Ionicons name="flask-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search routes, locations..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton label="All" value="all" count={routes.length} />
        <FilterButton 
          label="Favorites" 
          value="favorites" 
          count={favoriteRoutes.length} 
        />
        <FilterButton 
          label="Colombo" 
          value="colombo" 
          count={routes.filter(r => 
            r.start.toLowerCase().includes('colombo') || 
            r.destination.toLowerCase().includes('colombo')
          ).length} 
        />
        <FilterButton 
          label="Kandy" 
          value="kandy" 
          count={routes.filter(r => 
            r.start.toLowerCase().includes('kandy') || 
            r.destination.toLowerCase().includes('kandy')
          ).length} 
        />
      </View>

      {/* Routes List */}
      <FlatList
        data={filteredRoutes}
        keyExtractor={(item) => item.id}
        renderItem={renderRouteItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bus-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No routes found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery ? 'Try adjusting your search terms' : 'Pull to refresh and load routes'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  testButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  activeFilterButton: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumber: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  routeNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  routeStatus: {
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
    color: '#6B7280',
  },
  favoriteButton: {
    padding: 4,
  },
  routeInfo: {
    marginBottom: 12,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SriLankanRoutesScreen;
