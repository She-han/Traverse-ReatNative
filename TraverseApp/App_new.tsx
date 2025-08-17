import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store';
import { RootState } from './types';
import { AuthService } from './services/authService';
import { setUser, clearAuth } from './store/slices/authSlice';
import { setupDevData } from './utils/initializeData';

// Import Leaflet CSS for web platforms
if (Platform.OS === 'web') {
  require('leaflet/dist/leaflet.css');
}

// Import Auth Screens
import WelcomeScreen from './screens/Auth/WelcomeScreen';
import LoginScreen from './screens/Auth/LoginScreenNew';
import RegisterScreen from './screens/Auth/RegisterScreen';
import MapScreen from './screens/Map/MapScreen';
import RoutesScreen from './screens/Routes/RoutesScreen';
import ProfileScreen from './screens/Profile/ProfileScreenNew';

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
        component={RoutesScreen}
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
    // Initialize sample data for development
    setupDevData();
    
    // Listen for auth state changes
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get their data and update Redux
        try {
          const userData = await AuthService.getUserData(firebaseUser.uid);
          if (userData) {
            dispatch(setUser(userData));
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          dispatch(clearAuth());
        }
      } else {
        // User is signed out
        dispatch(clearAuth());
      }
    });

    return unsubscribe;
  }, [dispatch]);

  if (isLoading) {
    // Loading screen
    return (
      <View style={styles.loadingContainer}>
        <Image 
          source={require('./assets/splash-icon.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.loadingText}>Traverse</Text>
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
  logoImage: {
    width: 60,
    height: 60,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28283E',
    marginTop: 20,
  },
});

// Wrapper component with Redux Provider
export default function AppWithProvider() {
  return (
    <Provider store={store}>
      <AppNavigation />
    </Provider>
  );
}
