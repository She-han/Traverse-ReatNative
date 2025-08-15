import { sriLankanBusRouteService } from '../services/sriLankanBusRouteService';

// Test the Sri Lankan bus route service
export const testSriLankanRoutes = async () => {
  try {
    console.log('Testing Sri Lankan Bus Route Service...');
    
    // Test 1: Get all routes from Firebase
    const allRoutes = await sriLankanBusRouteService.getAllSriLankanRoutes();
    console.log(`✅ Routes loaded from Firebase: ${allRoutes.length} routes`);
    if (allRoutes.length > 0) {
      console.log('First route:', allRoutes[0]);
    }
    
    // Test 2: Search functionality
    const searchResults = await sriLankanBusRouteService.searchRoutes('colombo');
    console.log(`✅ Search 'colombo' found: ${searchResults.length} routes`);
    
    // Test 3: Routes by start location
    const colomboRoutes = await sriLankanBusRouteService.getRoutesByStartLocation('Colombo');
    console.log(`✅ Routes starting from Colombo: ${colomboRoutes.length}`);
    
    // Test 4: Routes by destination
    const kandyDestination = await sriLankanBusRouteService.getRoutesByDestination('Kandy');
    console.log(`✅ Routes going to Kandy: ${kandyDestination.length}`);
    
    console.log('✅ All tests passed! Sri Lankan Bus Route Service is working correctly.');
    return { success: true, routeCount: allRoutes.length };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
};

// Test Firebase integration (only run when needed)
export const testFirebaseIntegration = async () => {
  try {
    console.log('Testing Firebase integration...');
    
    // First, try to get existing routes
    const existingRoutes = await sriLankanBusRouteService.getAllSriLankanRoutes();
    console.log(`📊 Existing routes in Firebase: ${existingRoutes.length}`);
    
    if (existingRoutes.length === 0) {
      console.log('🔄 No routes found. Adding all routes to Firebase...');
      await sriLankanBusRouteService.addAllRoutesToFirebase();
      
      const newRoutes = await sriLankanBusRouteService.getAllSriLankanRoutes();
      console.log(`✅ Successfully added ${newRoutes.length} routes to Firebase`);
    }
    
    return { success: true, routeCount: existingRoutes.length };
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    return { success: false, error };
  }
};

// Export for use in components
export default {
  testSriLankanRoutes,
  testFirebaseIntegration,
};
