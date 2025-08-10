import { routeService } from '../services/routeService';

// Sample routes data near Colombo, Sri Lanka
const sampleRoutes = [
  {
    number: '100',
    name: 'Colombo - Kandy',
    startLocation: 'Fort Railway Station',
    endLocation: 'Kandy Central',
    color: '#3b82f6',
    fare: 150,
    estimatedDuration: 180,
    frequency: '15 min',
    activeBuses: 12,
    totalBuses: 15,
    status: 'active' as const,
    distance: 115,
    operatingHours: { start: '05:00', end: '22:00' },
    stops: [
      { id: 's1', name: 'Fort', latitude: 6.9271, longitude: 79.8612, sequence: 1 },
      { id: 's2', name: 'Pettah', latitude: 6.9390, longitude: 79.8538, sequence: 2 },
      { id: 's3', name: 'Maradana', latitude: 6.9244, longitude: 79.8732, sequence: 3 },
      { id: 's4', name: 'Kandy Central', latitude: 7.2906, longitude: 80.6337, sequence: 4 }
    ]
  },
  {
    number: '101',
    name: 'Colombo - Galle',
    startLocation: 'Colombo Fort',
    endLocation: 'Galle Bus Stand',
    color: '#ef4444',
    fare: 120,
    estimatedDuration: 150,
    frequency: '20 min',
    activeBuses: 8,
    totalBuses: 10,
    status: 'active' as const,
    distance: 120,
    operatingHours: { start: '05:30', end: '21:30' },
    stops: [
      { id: 's5', name: 'Fort', latitude: 6.9271, longitude: 79.8612, sequence: 1 },
      { id: 's6', name: 'Bambalapitiya', latitude: 6.8905, longitude: 79.8565, sequence: 2 },
      { id: 's7', name: 'Wellawatte', latitude: 6.8777, longitude: 79.8565, sequence: 3 },
      { id: 's8', name: 'Galle', latitude: 6.0535, longitude: 80.2210, sequence: 4 }
    ]
  },
  {
    number: '102',
    name: 'Colombo - Negombo',
    startLocation: 'Pettah',
    endLocation: 'Negombo Central',
    color: '#10b981',
    fare: 80,
    estimatedDuration: 90,
    frequency: '10 min',
    activeBuses: 15,
    totalBuses: 18,
    status: 'active' as const,
    distance: 37,
    operatingHours: { start: '05:00', end: '23:00' },
    stops: [
      { id: 's9', name: 'Pettah', latitude: 6.9390, longitude: 79.8538, sequence: 1 },
      { id: 's10', name: 'Kelaniya', latitude: 6.9553, longitude: 79.9220, sequence: 2 },
      { id: 's11', name: 'Gampaha', latitude: 7.0873, longitude: 79.9990, sequence: 3 },
      { id: 's12', name: 'Negombo', latitude: 7.2083, longitude: 79.8358, sequence: 4 }
    ]
  },
  {
    number: '103',
    name: 'Colombo - Ratnapura',
    startLocation: 'Maharagama',
    endLocation: 'Ratnapura',
    color: '#8b5cf6',
    fare: 100,
    estimatedDuration: 120,
    frequency: '25 min',
    activeBuses: 6,
    totalBuses: 8,
    status: 'active' as const,
    distance: 95,
    operatingHours: { start: '06:00', end: '20:00' },
    stops: [
      { id: 's13', name: 'Maharagama', latitude: 6.8464, longitude: 79.9269, sequence: 1 },
      { id: 's14', name: 'Nugegoda', latitude: 6.8649, longitude: 79.8997, sequence: 2 },
      { id: 's15', name: 'Homagama', latitude: 6.8442, longitude: 80.0022, sequence: 3 },
      { id: 's16', name: 'Ratnapura', latitude: 6.6828, longitude: 80.4000, sequence: 4 }
    ]
  },
  {
    number: '104',
    name: 'Colombo - Matara',
    startLocation: 'Colombo Fort',
    endLocation: 'Matara',
    color: '#f59e0b',
    fare: 180,
    estimatedDuration: 200,
    frequency: '30 min',
    activeBuses: 5,
    totalBuses: 7,
    status: 'active' as const,
    distance: 160,
    operatingHours: { start: '05:00', end: '21:00' },
    stops: [
      { id: 's17', name: 'Fort', latitude: 6.9271, longitude: 79.8612, sequence: 1 },
      { id: 's18', name: 'Galle', latitude: 6.0535, longitude: 80.2210, sequence: 2 },
      { id: 's19', name: 'Matara', latitude: 5.9549, longitude: 80.5550, sequence: 3 }
    ]
  },
  {
    number: '105',
    name: 'Pettah - Malabe',
    startLocation: 'Pettah',
    endLocation: 'Malabe',
    color: '#06b6d4',
    fare: 45,
    estimatedDuration: 60,
    frequency: '8 min',
    activeBuses: 20,
    totalBuses: 25,
    status: 'active' as const,
    distance: 15,
    operatingHours: { start: '05:00', end: '23:30' },
    stops: [
      { id: 's20', name: 'Pettah', latitude: 6.9390, longitude: 79.8538, sequence: 1 },
      { id: 's21', name: 'Nugegoda', latitude: 6.8649, longitude: 79.8997, sequence: 2 },
      { id: 's22', name: 'Malabe', latitude: 6.9078, longitude: 79.9737, sequence: 3 }
    ]
  },
  {
    number: '106',
    name: 'Kadawatha - Kaduwela',
    startLocation: 'Kadawatha',
    endLocation: 'Kaduwela',
    color: '#84cc16',
    fare: 35,
    estimatedDuration: 45,
    frequency: '12 min',
    activeBuses: 10,
    totalBuses: 12,
    status: 'active' as const,
    distance: 25,
    operatingHours: { start: '05:30', end: '22:30' },
    stops: [
      { id: 's23', name: 'Kadawatha', latitude: 7.0013, longitude: 79.9897, sequence: 1 },
      { id: 's24', name: 'Ragama', latitude: 7.0263, longitude: 79.9247, sequence: 2 },
      { id: 's25', name: 'Kaduwela', latitude: 6.9331, longitude: 79.9925, sequence: 3 }
    ]
  },
  {
    number: '107',
    name: 'Colombo - Kegalle',
    startLocation: 'Fort',
    endLocation: 'Kegalle',
    color: '#f97316',
    fare: 90,
    estimatedDuration: 110,
    frequency: '35 min',
    activeBuses: 4,
    totalBuses: 6,
    status: 'delayed' as const,
    distance: 70,
    operatingHours: { start: '06:00', end: '20:00' },
    stops: [
      { id: 's26', name: 'Fort', latitude: 6.9271, longitude: 79.8612, sequence: 1 },
      { id: 's27', name: 'Gampaha', latitude: 7.0873, longitude: 79.9990, sequence: 2 },
      { id: 's28', name: 'Kegalle', latitude: 7.2513, longitude: 80.3464, sequence: 3 }
    ]
  }
];

export const initializeSampleRoutes = async () => {
  try {
    console.log('Starting to add sample routes to Firebase...');
    
    for (const route of sampleRoutes) {
      await routeService.addRoute(route);
      console.log(`Added route: ${route.number} - ${route.name}`);
    }
    
    console.log('All sample routes added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding sample routes:', error);
    return false;
  }
};
