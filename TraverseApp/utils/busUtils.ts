import { BusCapacity, TripPlan, BusRoute, BusStop, Location } from '../types';

export class BusUtils {
  // Get capacity color
  static getCapacityColor(capacity: BusCapacity): string {
    switch (capacity) {
      case 'low':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FF9800'; // Orange
      case 'high':
        return '#F44336'; // Red
      case 'full':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Gray
    }
  }

  // Get capacity text
  static getCapacityText(capacity: BusCapacity): string {
    switch (capacity) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'full':
        return 'Full';
      default:
        return 'Unknown';
    }
  }

  // Get capacity icon
  static getCapacityIcon(capacity: BusCapacity): string {
    switch (capacity) {
      case 'low':
        return 'people-outline';
      case 'medium':
        return 'people';
      case 'high':
        return 'people';
      case 'full':
        return 'people';
      default:
        return 'help-outline';
    }
  }

  // Format ETA
  static formatETA(minutes: number): string {
    if (minutes < 1) {
      return 'Now';
    } else if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  // Format time from date
  static formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Format duration in minutes to readable format
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  // Calculate trip cost
  static calculateTripCost(routes: BusRoute[]): number {
    return routes.reduce((total, route) => total + route.fare, 0);
  }

  // Get next bus arrival
  static getNextBusArrival(stop: BusStop, routeId?: string): {
    eta: number;
    routeId: string;
    destination: string;
  } | null {
    if (!stop.nextBuses || stop.nextBuses.length === 0) {
      return null;
    }

    let buses = stop.nextBuses;
    if (routeId) {
      buses = buses.filter(bus => bus.routeId === routeId);
    }

    if (buses.length === 0) {
      return null;
    }

    // Sort by ETA and return the earliest
    buses.sort((a, b) => a.eta - b.eta);
    const nextBus = buses[0];

    return {
      eta: nextBus.eta,
      routeId: nextBus.routeId,
      destination: nextBus.destination,
    };
  }

  // Check if bus is delayed
  static isBusDelayed(actualETA: number, scheduledETA: number, thresholdMinutes: number = 5): boolean {
    return actualETA > scheduledETA + thresholdMinutes;
  }

  // Check if bus is early
  static isBusEarly(actualETA: number, scheduledETA: number, thresholdMinutes: number = 2): boolean {
    return actualETA < scheduledETA - thresholdMinutes;
  }

  // Get delay status
  static getDelayStatus(actualETA: number, scheduledETA: number): {
    status: 'on-time' | 'early' | 'delayed';
    difference: number;
  } {
    const difference = actualETA - scheduledETA;
    
    if (Math.abs(difference) <= 2) {
      return { status: 'on-time', difference: 0 };
    } else if (difference < 0) {
      return { status: 'early', difference: Math.abs(difference) };
    } else {
      return { status: 'delayed', difference };
    }
  }

  // Filter routes by amenities
  static filterRoutesByAmenities(
    routes: BusRoute[],
    requiredAmenities: string[]
  ): BusRoute[] {
    return routes.filter(route => {
      // This would check if buses on this route have the required amenities
      // For now, we'll assume all routes have basic amenities
      return true;
    });
  }

  // Calculate walking time (assuming 5 km/h walking speed)
  static calculateWalkingTime(distanceKm: number): number {
    const walkingSpeedKmh = 5;
    return (distanceKm / walkingSpeedKmh) * 60; // Return in minutes
  }

  // Generate trip instructions
  static generateTripInstructions(tripPlan: TripPlan): string[] {
    const instructions: string[] = [];
    
    tripPlan.routes.forEach((route, index) => {
      if (route.type === 'walking') {
        if (index === 0) {
          instructions.push(`Walk ${route.distance.toFixed(1)}km to bus stop (${this.formatDuration(route.duration)})`);
        } else {
          instructions.push(`Walk ${route.distance.toFixed(1)}km to destination (${this.formatDuration(route.duration)})`);
        }
      } else if (route.type === 'bus') {
        instructions.push(`Take bus route ${route.routeId} for ${this.formatDuration(route.duration)}`);
      }
    });

    return instructions;
  }

  // Check if route is operating
  static isRouteOperating(route: BusRoute, currentTime: Date = new Date()): boolean {
    if (!route.isActive) {
      return false;
    }

    const day = currentTime.getDay(); // 0 = Sunday, 6 = Saturday
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    let operatingHours;
    if (day === 0 || day === 6) {
      // Weekend
      operatingHours = route.operatingHours.weekends;
    } else {
      // Weekday
      operatingHours = route.operatingHours.weekdays;
    }

    const [startHour, startMinute] = operatingHours.start.split(':').map(Number);
    const [endHour, endMinute] = operatingHours.end.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  }

  // Get route status message
  static getRouteStatusMessage(route: BusRoute): string {
    if (!route.isActive) {
      return 'Route is currently inactive';
    }

    if (!this.isRouteOperating(route)) {
      const currentTime = new Date();
      const day = currentTime.getDay();
      const operatingHours = (day === 0 || day === 6) 
        ? route.operatingHours.weekends 
        : route.operatingHours.weekdays;
      
      return `Route operates from ${operatingHours.start} to ${operatingHours.end}`;
    }

    return 'Route is active';
  }

  // Sort routes by relevance (distance, operating status, etc.)
  static sortRoutesByRelevance(
    routes: BusRoute[],
    userLocation?: Location,
    preferredAmenities?: string[]
  ): BusRoute[] {
    return routes.sort((a, b) => {
      // Operating routes first
      const aOperating = this.isRouteOperating(a) ? 1 : 0;
      const bOperating = this.isRouteOperating(b) ? 1 : 0;
      
      if (aOperating !== bOperating) {
        return bOperating - aOperating;
      }

      // Active routes first
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }

      // Then by frequency (higher frequency = better)
      return a.frequency - b.frequency;
    });
  }
}

export default BusUtils;
