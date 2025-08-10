import { routeService } from '../services/routeService';

// Initialize sample data for development
export const initializeSampleData = async () => {
  try {
    console.log('Initializing sample routes...');
    await routeService.initializeSampleRoutes();
    console.log('Sample routes initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

// Call this function when the app starts (for development)
export const setupDevData = async () => {
  // Only run in development mode
  if (__DEV__) {
    await initializeSampleData();
  }
};
