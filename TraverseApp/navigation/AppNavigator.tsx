import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAppSelector, useAppDispatch } from '../store';
import { setUser } from '../store/slices/authSlice';
import { AuthService } from '../services/authService';
import LoginScreen from '../screens/Auth/LoginScreen';
import MapScreen from '../screens/Map/MapScreen';
import SriLankanRoutesScreen from '../screens/Routes/SriLankanRoutesScreen';
import ProfileScreen from '../screens/Profile/ProfileScreenNew';
import { serializeUserData } from '../utils/serializeUser';

import { COLORS } from '../constants';
import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator
const MainNavigator: React.FC = () => {
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
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Routes" component={SriLankanRoutesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Root Navigator (no NavigationContainer here since it's in App.tsx)
const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore and set in Redux
        try {
          const userData = await AuthService.getUserData(firebaseUser.uid);
          if (userData) {
            dispatch(setUser(serializeUserData(userData)));
          }
        } catch (error) {
          console.log('Error fetching user data:', error);
        }
      }
    });

    return unsubscribe;
  }, [dispatch]);

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;