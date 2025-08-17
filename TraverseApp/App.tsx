import React from 'react';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './store';
import { setupDevData } from './utils/initializeData';
import { ToastProvider } from './contexts/ToastContext';
import AppWithPersistentAuth from './AppWithPersistentAuth';

// Import Leaflet CSS for web platforms
if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');
}

export default function App() {
  // Initialize dev data if needed
  React.useEffect(() => {
    setupDevData();
  }, []);

  return (
    <Provider store={store}>
      <ToastProvider>
        <AppWithPersistentAuth />
      </ToastProvider>
    </Provider>
  );
}
