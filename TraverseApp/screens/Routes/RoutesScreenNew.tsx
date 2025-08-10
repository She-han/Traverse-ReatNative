import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { routeService, Route } from '../../services/routeService';

const RoutesScreen: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteRoutes, setFavoriteRoutes] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'active'>('all');

  useEffect(() => {
    loadRoutes();
    loadUserData();
  }, []);

  useEffect(() => {
    filterRoutes();
  }, [routes, searchQuery, selectedFilter, favoriteRoutes]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const routesData = await routeService.getAllRoutes();
      setRoutes(routesData);
    } catch (error) {
      console.error('Error loading routes:', error);
      Alert.alert('Error', 'Failed to load routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    if (!user?.id) return;
    
    try {
      const userData = await routeService.getUserRouteData(user.id);
      if (userData) {
        setFavoriteRoutes(userData.favoriteRoutes);
        setRecentSearches(userData.recentSearches);
      } else {
        await routeService.initializeUserRouteData(user.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const filterRoutes = () => {
    let filtered = routes;

    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(route =>
        route.number.toLowerCase().includes(lowercaseQuery) ||
        route.name.toLowerCase().includes(lowercaseQuery) ||
        route.startLocation.toLowerCase().includes(lowercaseQuery) ||
        route.endLocation.toLowerCase().includes(lowercaseQuery)
      );
    }

    switch (selectedFilter) {
      case 'favorites':
        filtered = filtered.filter(route => favoriteRoutes.includes(route.id));
        break;
      case 'active':
        filtered = filtered.filter(route => route.status === 'active');
        break;
    }

    setFilteredRoutes(filtered);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() && user?.id) {
      await routeService.addToRecentSearches(user.id, query.trim());
    }
  };

  const toggleFavorite = async (routeId: string) => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in to add favorites.');
      return;
    }

    try {
      const isFavorite = favoriteRoutes.includes(routeId);
      if (isFavorite) {
        await routeService.removeFromFavorites(user.id, routeId);
        setFavoriteRoutes(prev => prev.filter(id => id !== routeId));
      } else {
        await routeService.addToFavorites(user.id, routeId);
        setFavoriteRoutes(prev => [...prev, routeId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRoutes(), loadUserData()]);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'delayed': return '#f59e0b';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'delayed': return 'time';
      case 'suspended': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const renderFilterTab = (filter: typeof selectedFilter, label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.filterTab, selectedFilter === filter && styles.activeFilterTab]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={selectedFilter === filter ? '#fff' : '#64748b'} 
      />
      <Text style={[
        styles.filterTabText, 
        selectedFilter === filter && styles.activeFilterTabText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRoute = ({ item }: { item: Route }) => {
    const isFavorite = favoriteRoutes.includes(item.id);
    
    return (
      <TouchableOpacity style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <View style={styles.routeLeft}>
            <View style={[styles.routeBadge, { backgroundColor: item.color }]}>
              <Text style={styles.routeBadgeText}>{item.number}</Text>
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>{item.name}</Text>
              <Text style={styles.routePath}>
                {item.startLocation} → {item.endLocation}
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
              color={isFavorite ? '#ef4444' : '#9ca3af'} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.routeDetails}>
          <View style={styles.routeDetailItem}>
            <Ionicons name="time-outline" size={16} color="#64748b" />
            <Text style={styles.routeDetailText}>Every {item.frequency}</Text>
          </View>
          <View style={styles.routeDetailItem}>
            <Ionicons name="bus-outline" size={16} color="#64748b" />
            <Text style={styles.routeDetailText}>{item.activeBuses}/{item.totalBuses} active</Text>
          </View>
          <View style={styles.routeDetailItem}>
            <Ionicons 
              name={getStatusIcon(item.status)} 
              size={16} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[styles.routeDetailText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.routeFooter}>
          <Text style={styles.routeFare}>LKR {item.fare}</Text>
          <Text style={styles.routeDuration}>{item.estimatedDuration} min</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentSearch = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.recentSearchItem}
      onPress={() => setSearchQuery(item)}
    >
      <Ionicons name="time-outline" size={16} color="#9ca3af" />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚌 Routes</Text>
        <Text style={styles.headerSubtitle}>Find your perfect route</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6366f1" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by route number or destination..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Searches */}
        {!searchQuery && recentSearches.length > 0 && (
          <View style={styles.recentSearchesContainer}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            <FlatList
              data={recentSearches.slice(0, 3)}
              renderItem={renderRecentSearch}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentSearchesList}
            />
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {renderFilterTab('all', 'All', 'list-outline')}
        {renderFilterTab('favorites', 'Favorites', 'heart-outline')}
        {renderFilterTab('active', 'Active', 'checkmark-circle-outline')}
      </View>

      {/* Routes List */}
      <FlatList
        data={filteredRoutes}
        renderItem={renderRoute}
        keyExtractor={item => item.id}
        style={styles.routesList}
        contentContainerStyle={styles.routesListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366f1']}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bus-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No routes found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery ? 'Try a different search term' : 'No routes available'}
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchContainer: {
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
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  recentSearchesContainer: {
    marginTop: 16,
  },
  recentSearchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  recentSearchesList: {
    flexGrow: 0,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  recentSearchText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeFilterTab: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  activeFilterTabText: {
    color: '#fff',
  },
  routesList: {
    flex: 1,
  },
  routesListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 48,
    alignItems: 'center',
  },
  routeBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  routePath: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 4,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeDetailText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  routeFare: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  routeDuration: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RoutesScreen;
