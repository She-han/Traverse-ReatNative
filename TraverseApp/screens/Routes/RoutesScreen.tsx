import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

const RoutesScreen: React.FC = () => {
  // Mock route data
  const mockRoutes = [
    {
      id: '1',
      name: 'Route 138',
      longName: 'Colombo - Maharagama',
      color: '#FF6B6B',
      frequency: '5-10 mins',
      status: 'Active',
      activeBuses: 8
    },
    {
      id: '2',
      name: 'Route 122',
      longName: 'Fort - Nugegoda',
      color: '#4ECDC4',
      frequency: '7-12 mins',
      status: 'Active',
      activeBuses: 6
    },
    {
      id: '3',
      name: 'Route 177',
      longName: 'Pettah - Kottawa',
      color: '#45B7D1',
      frequency: '10-15 mins',
      status: 'Active',
      activeBuses: 4
    },
    {
      id: '4',
      name: 'Route 155',
      longName: 'Colombo - Homagama',
      color: '#96CEB4',
      frequency: '8-12 mins',
      status: 'Delayed',
      activeBuses: 5
    }
  ];

  const renderRouteCard = (route: any) => (
    <TouchableOpacity key={route.id} style={styles.routeCard}>
      <View style={styles.routeHeader}>
        <View style={[styles.routeColorBar, { backgroundColor: route.color }]} />
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.routeLongName}>{route.longName}</Text>
        </View>
        <View style={styles.routeStatus}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: route.status === 'Active' ? COLORS.success : COLORS.warning }
          ]}>
            <Text style={styles.statusText}>{route.status}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.routeDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>Every {route.frequency}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="bus-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{route.activeBuses} buses active</Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bus Routes</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterTab, styles.activeTab]}>
          <Text style={[styles.filterText, styles.activeFilterText]}>All Routes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterText}>Favorites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterText}>Nearby</Text>
        </TouchableOpacity>
      </View>

      {/* Routes List */}
      <ScrollView style={styles.routesList} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        {mockRoutes.map(renderRouteCard)}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  searchButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: COLORS.background,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activeFilterText: {
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  routesList: {
    flex: 1,
    paddingTop: 20,
  },
  routeCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  routeLongName: {
    fontSize: 14,
    color: COLORS.gray,
  },
  routeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
    marginRight: 16,
  },
  favoriteButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bottomPadding: {
    height: 100,
  },
});

export default RoutesScreen;
