// Firebase Mock Data Cleanup Script
// Run this once to clean up any remaining mock data from Firebase

import { getFirestore, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Initialize Firebase (you need to import your config)
// import { firebaseConfig } from './firebase';
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

const cleanupMockData = async () => {
  try {
    console.log('🧹 Starting Firebase mock data cleanup...');
    
    // Get reference to bus locations collection
    const db = getFirestore();
    const busLocationsRef = collection(db, 'busLocations');
    
    // Query for all documents
    const allSnapshot = await getDocs(busLocationsRef);
    
    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];
    
    allSnapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;
      
      // Identify mock data by various criteria:
      const isMockData = 
        data.isRealData === false ||                    // Explicitly marked as fake
        docId.startsWith('mock_') ||                   // Mock ID prefix
        data.id?.startsWith('mock_') ||                // Mock data ID
        (data.routeNumber && ['120', '138', '177'].includes(data.routeNumber) && 
         data.busNumber?.match(/^(NB|NC|ND)-\d{4}$/));  // Mock plate format
      
      if (isMockData) {
        console.log(`🗑️ Deleting mock bus: ${docId} (Route: ${data.routeNumber})`);
        deletePromises.push(deleteDoc(doc.ref));
        deletedCount++;
      }
    });
    
    // Execute all deletions
    await Promise.all(deletePromises);
    
    console.log(`✅ Cleaned up ${deletedCount} mock bus records from Firebase`);
    
    // Also clean up mock routes if any exist
    const routesRef = collection(db, 'routes');
    const routesSnapshot = await getDocs(routesRef);
    
    let deletedRoutes = 0;
    const routeDeletePromises: Promise<void>[] = [];
    
    routesSnapshot.forEach((doc) => {
      const data = doc.data();
      const docId = doc.id;
      
      // Check if it's a mock route
      if (docId.startsWith('route_') && ['route_138', 'route_177', 'route_120'].includes(docId)) {
        console.log(`🗑️ Deleting mock route: ${docId}`);
        routeDeletePromises.push(deleteDoc(doc.ref));
        deletedRoutes++;
      }
    });
    
    await Promise.all(routeDeletePromises);
    console.log(`✅ Cleaned up ${deletedRoutes} mock route records from Firebase`);
    
    console.log('🎉 Firebase cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during Firebase cleanup:', error);
  }
};

export default cleanupMockData;

// If running directly, execute cleanup
// cleanupMockData();
