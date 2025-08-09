import { Location, LocationWithDistance } from '../types';

export class LocationUtils {
  // Calculate distance between two coordinates using Haversine formula
  static calculateDistance(
    coord1: Location,
    coord2: Location,
    unit: 'km' | 'miles' = 'km'
  ): number {
    const R = unit === 'km' ? 6371 : 3959; // Earth's radius in km or miles
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert degrees to radians
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Find nearby locations within a radius
  static findNearbyLocations(
    userLocation: Location,
    locations: Location[],
    radiusKm: number = 1
  ): LocationWithDistance[] {
    return locations
      .map(location => ({
        ...location,
        distance: this.calculateDistance(userLocation, location) * 1000, // Convert to meters
      }))
      .filter(location => location.distance <= radiusKm * 1000)
      .sort((a, b) => a.distance - b.distance);
  }

  // Format distance for display
  static formatDistance(distanceMeters: number): string {
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)}m`;
    } else {
      return `${(distanceMeters / 1000).toFixed(1)}km`;
    }
  }

  // Calculate bearing between two coordinates
  static calculateBearing(coord1: Location, coord2: Location): number {
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
  }

  // Get compass direction from bearing
  static getCompassDirection(bearing: number): string {
    const directions = [
      'N', 'NNE', 'NE', 'ENE',
      'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW',
      'W', 'WNW', 'NW', 'NNW'
    ];
    
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  }

  // Check if location is within bounds
  static isLocationWithinBounds(
    location: Location,
    bounds: {
      northEast: Location;
      southWest: Location;
    }
  ): boolean {
    return (
      location.latitude <= bounds.northEast.latitude &&
      location.latitude >= bounds.southWest.latitude &&
      location.longitude <= bounds.northEast.longitude &&
      location.longitude >= bounds.southWest.longitude
    );
  }

  // Create bounds from center point and radius
  static createBounds(center: Location, radiusKm: number): {
    northEast: Location;
    southWest: Location;
  } {
    const latDelta = radiusKm / 111; // Approximate km per degree latitude
    const lonDelta = radiusKm / (111 * Math.cos(this.toRadians(center.latitude)));

    return {
      northEast: {
        latitude: center.latitude + latDelta,
        longitude: center.longitude + lonDelta,
      },
      southWest: {
        latitude: center.latitude - latDelta,
        longitude: center.longitude - lonDelta,
      },
    };
  }

  // Interpolate between two points (for smooth animations)
  static interpolateLocation(
    start: Location,
    end: Location,
    progress: number // 0 to 1
  ): Location {
    return {
      latitude: start.latitude + (end.latitude - start.latitude) * progress,
      longitude: start.longitude + (end.longitude - start.longitude) * progress,
    };
  }

  // Validate coordinate values
  static isValidCoordinate(location: Location): boolean {
    return (
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180
    );
  }

  // Get map region from coordinates array
  static getMapRegion(
    coordinates: Location[],
    padding: number = 0.01
  ): {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } {
    if (coordinates.length === 0) {
      return {
        latitude: 6.9271, // Default to Colombo
        longitude: 79.8612,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
    }

    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) + padding;
    const lngDelta = (maxLng - minLng) + padding;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }
}

export default LocationUtils;
