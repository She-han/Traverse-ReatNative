import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusRoute } from '../../types';
import { BusUtils } from '../../utils/busUtils';
import { COLORS } from '../../constants';

interface RouteCardProps {
  route: BusRoute;
  onPress: () => void;
  showNextBus?: boolean;
  userLocation?: { latitude: number; longitude: number };
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onPress,
  showNextBus = true,
  userLocation,
}) => {
  const isOperating = BusUtils.isRouteOperating(route);
  const statusMessage = BusUtils.getRouteStatusMessage(route);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <View style={[styles.routeNumber, { backgroundColor: route.color }]}>
            <Text style={styles.routeNumberText}>{route.shortName}</Text>
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeName}>{route.name}</Text>
            <Text style={styles.routeDescription}>
              {route.longName || `${route.stops.length} stops`}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isOperating ? COLORS.success : COLORS.error }
          ]} />
          <Text style={styles.statusText}>
            {isOperating ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            Every {route.frequency} min
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="card-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            Rs. {route.fare.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>
            {route.distance.toFixed(1)} km
          </Text>
        </View>
      </View>

      {showNextBus && (
        <View style={styles.nextBusContainer}>
          <Text style={styles.nextBusLabel}>Next Bus:</Text>
          <Text style={styles.nextBusTime}>
            {isOperating ? 'Loading...' : 'Not operating'}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.statusMessage}>{statusMessage}</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeNumberText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeDetails: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 2,
  },
  routeDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusContainer: {
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
    color: COLORS.gray,
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  nextBusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  nextBusLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  nextBusTime: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusMessage: {
    fontSize: 12,
    color: COLORS.gray,
    flex: 1,
  },
});

export default RouteCard;
