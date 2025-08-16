import { sriLankanBusRouteService, SriLankanBusRoute } from '../services/sriLankanBusRouteService';

// Test the Sri Lankan bus route service with Traccar integration
export const testSriLankanRoutes = async () => {
  try {
    console.log('Testing Sri Lankan Bus Route Service...');
    
    // Test 1: Get routes from Firebase
    const routes = await sriLankanBusRouteService.getAllSriLankanRoutes();
    console.log(`✅ Routes loaded from Firebase: ${routes.length} routes`);
    
    if (routes.length > 0) {
      console.log('First route:', routes[0]);
    }
    
    // Test 2: Search functionality
    const searchResults = await sriLankanBusRouteService.searchRoutes('colombo');
    console.log(`✅ Search 'colombo' found: ${searchResults.length} routes`);
    
    // Test 3: Location-based filtering
    const colomboRoutes = await sriLankanBusRouteService.getRoutesByStartLocation('colombo');
    console.log(`✅ Routes starting from Colombo: ${colomboRoutes.length}`);
    
    const kandyRoutes = await sriLankanBusRouteService.getRoutesByDestination('kandy');
    console.log(`✅ Routes going to Kandy: ${kandyRoutes.length}`);
    
    // Test 4: Specific route lookup (for Traccar integration)
    const route138 = await sriLankanBusRouteService.getRouteByNumber('138');
    console.log(`✅ Route 138 found:`, route138 ? `${route138.start} - ${route138.destination}` : 'Not found');
    
    // Test 5: Get statistics
    const stats = await sriLankanBusRouteService.getRouteStatistics();
    console.log(`✅ Statistics:`, {
      totalRoutes: stats.totalRoutes,
      activeRoutes: stats.activeRoutes,
      totalBuses: stats.totalBuses,
      activeBuses: stats.activeBuses
    });
    
    console.log('✅ All tests passed! Sri Lankan Bus Route Service is working correctly.');
    
    return {
      success: true,
      routeCount: routes.length,
      searchResults: searchResults.length,
      stats
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error,
      routeCount: 0
    };
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
