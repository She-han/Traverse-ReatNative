import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import { RootState } from './types';
import { AuthService } from './services/authService';
import { setUser, clearAuth, setAuthLoading } from './store/slices/authSlice';
import { setupDevData } from './utils/initializeData';
import { ToastProvider } from './contexts/ToastContext';

// Import Leaflet CSS for web platforms
if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');
}

// Import Auth Screens
import WelcomeScreen from './screens/Auth/WelcomeScreen';
import LoginScreen from './screens/Auth/LoginScreenNew';
import RegisterScreen from './screens/Auth/RegisterScreen';
import MapScreen from './screens/Map/MapScreen';
import SriLankanRoutesScreen from './screens/Routes/SriLankanRoutesScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator (after authentication)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Routes') {
            iconName = focused ? 'bus' : 'bus-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2ECC71',
        tabBarInactiveTintColor: '#A0A0A0',
        headerStyle: {
          backgroundColor: '#2ECC71',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Live Map' }}
      />
      <Tab.Screen 
        name="Routes" 
        component={SriLankanRoutesScreen}
        options={{ title: 'Bus Routes' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// App Navigation Component (inside Redux Provider)
function AppNavigation() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Initialize sample data for development
        setupDevData();
        
        // Check if user is already authenticated
        const authData = await AuthService.checkAuthState();
        if (isMounted) {
          if (authData) {
            console.log('User already authenticated:', authData.user.email);
            dispatch(setUser(authData.user));
          } else {
            console.log('No authenticated user found');
            dispatch(setAuthLoading(false));
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          dispatch(setAuthLoading(false));
        }
      }
    };

    // Initialize auth state
    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        // User is signed in, get their data and update Redux
        try {
          const userData = await AuthService.getUserData(firebaseUser.uid);
          if (userData && isMounted) {
            console.log('Auth state changed - user signed in:', userData.email);
            dispatch(setUser(userData));
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          if (isMounted) {
            dispatch(clearAuth());
          }
        }
      } else {
        // User is signed out
        console.log('Auth state changed - user signed out');
        if (isMounted) {
          dispatch(clearAuth());
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [dispatch]);

  if (isLoading) {
    // Show loading screen while checking authentication state
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('./assets/splash-icon.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Traverse</Text>
        </View>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Checking authentication...</Text>
          <ActivityIndicator size="large" color="#2ECC71" />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user ? (
          // User is authenticated, show main app
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          // User is not authenticated, show auth screens
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28283E',
    marginTop: 16,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 24,
  },
});

// Wrapper component with Redux Provider
export default function AppWithProvider() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AppNavigation />
      </ToastProvider>
    </Provider>
  );
}
