import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

// Simple Map Screen (without maps for now)
function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Live Map</Text>
      <Text style={styles.subtitle}>Your location and nearby buses</Text>
      <View style={styles.placeholder}>
        <Ionicons name="location" size={50} color="#2E86AB" />
        <Text style={styles.placeholderText}>Map will load here</Text>
      </View>
    </View>
  );
}

// Routes Screen
function RoutesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚌 Bus Routes</Text>
      <Text style={styles.subtitle}>Available bus routes in your area</Text>
      
      {/* Sample Route Cards */}
      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeNumber}>138</Text>
          <Text style={styles.routeName}>Pettah → Kaduwela</Text>
        </View>
        <Text style={styles.routeStatus}>🟢 Active • Next bus in 5 min</Text>
      </View>

      <View style={styles.routeCard}>
        <View style={styles.routeHeader}>
          <Text style={styles.routeNumber}>177</Text>
          <Text style={styles.routeName}>Fort → Nugegoda</Text>
        </View>
        <Text style={styles.routeStatus}>🟡 Delayed • Next bus in 12 min</Text>
      </View>
    </View>
  );
}

// Profile Screen
function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>
      <Text style={styles.subtitle}>Manage your account and preferences</Text>
      
      <View style={styles.profileCard}>
        <Ionicons name="person-circle" size={80} color="#2E86AB" />
        <Text style={styles.userName}>Shehan</Text>
        <Text style={styles.userEmail}>user@traverse.com</Text>
      </View>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="heart" size={24} color="#2E86AB" />
        <Text style={styles.menuText}>Favorite Routes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="notifications" size={24} color="#2E86AB" />
        <Text style={styles.menuText}>Notifications</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Map') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'Routes') {
              iconName = focused ? 'bus' : 'bus-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons  size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2E86AB',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#2E86AB',
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
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholderText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#2E86AB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  routeStatus: {
    fontSize: 14,
    color: '#666',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
});