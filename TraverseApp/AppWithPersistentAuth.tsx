import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { store } from './store';
import { RootState } from './types';
import { AuthService } from './services/authService';
import { setUser, clearAuth, setAuthLoading } from './store/slices/authSlice';
import { serializeUserData } from './utils/serializeUser';
import { COLORS } from './constants';

// Import Screens
import WelcomeScreen from './screens/Auth/WelcomeScreen';
import LoginScreen from './screens/Auth/LoginScreenNew';
import RegisterScreen from './screens/Auth/RegisterScreen';
import MainNavigator from './navigation/MainNavigator';

// Define navigation types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Auth Navigator Component
function AuthNavigator() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkInitialAuth = async () => {
      try {
        console.log('🔍 Checking initial authentication state...');
        
        // Check if user has valid stored authentication
        const authData = await AuthService.checkAuthState();
        
        if (isMounted) {
          if (authData) {
            console.log('✅ Found valid stored auth for:', authData.user.email);
            dispatch(setUser(serializeUserData(authData.user)));
          } else {
            console.log('❌ No valid stored auth found');
            dispatch(setAuthLoading(false));
          }
        }
      } catch (error) {
        console.error('❌ Error checking initial auth:', error);
        if (isMounted) {
          dispatch(clearAuth());
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    checkInitialAuth();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // Show loading screen while checking auth
  if (initializing || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // User is authenticated, go directly to main app
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          // User is not authenticated, show welcome/login flow
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

// Main App Component
export default function App() {
  return (
    <Provider store={store}>
      <AuthNavigator />
    </Provider>
  );
}
