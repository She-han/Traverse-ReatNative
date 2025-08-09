import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Web-compatible fallback for MapView
const WebMapFallback: React.FC = () => {
  return (
    <View style={styles.webMapContainer}>
      <Text style={styles.webMapTitle}>🗺️ Interactive Map</Text>
      <Text style={styles.webMapSubtitle}>
        Maps are available on mobile devices
      </Text>
      <Text style={styles.webMapInfo}>
        To test the full map functionality:
        {'\n'}• Scan the QR code with Expo Go on your phone
        {'\n'}• Or run on Android/iOS simulator
      </Text>
      <View style={styles.mockMapArea}>
        <Text style={styles.mockMapText}>🚌 Bus tracking area</Text>
        <Text style={styles.mockMapText}>📍 Your location here</Text>
        <Text style={styles.mockMapText}>🚏 Bus stops nearby</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  webMapTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 16,
    textAlign: 'center',
  },
  webMapSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  webMapInfo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  mockMapArea: {
    width: Math.min(width * 0.8, 400),
    height: 200,
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E86AB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mockMapText: {
    fontSize: 16,
    color: '#2E86AB',
    marginVertical: 4,
    textAlign: 'center',
  },
});

export default WebMapFallback;
