import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GoogleMapsAPITest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    geocoding: string;
    places: string;
    staticMaps: string;
  }>({
    geocoding: 'Not tested',
    places: 'Not tested',
    staticMaps: 'Not tested',
  });

  const API_KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';

  const testGeocodingAPI = async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Colombo,Sri Lanka&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK') {
        return 'Working ✅';
      } else if (data.status === 'REQUEST_DENIED') {
        return `Error: ${data.error_message || 'API key invalid or restricted'}`;
      } else {
        return `Error: ${data.status}`;
      }
    } catch (error) {
      return `Network Error: ${error}`;
    }
  };

  const testPlacesAPI = async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=bus+station+Colombo&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === 'OK') {
        return 'Working ✅';
      } else if (data.status === 'REQUEST_DENIED') {
        return `Error: ${data.error_message || 'API key invalid or restricted'}`;
      } else {
        return `Error: ${data.status}`;
      }
    } catch (error) {
      return `Network Error: ${error}`;
    }
  };

  const testStaticMapsAPI = async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/staticmap?center=Colombo,Sri Lanka&zoom=13&size=400x400&key=${API_KEY}`,
        { method: 'HEAD' }
      );
      
      if (response.status === 200) {
        return 'Working ✅';
      } else if (response.status === 403) {
        return 'Error: API key invalid or restricted';
      } else {
        return `Error: HTTP ${response.status}`;
      }
    } catch (error) {
      return `Network Error: ${error}`;
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    
    try {
      const [geocodingResult, placesResult, staticMapsResult] = await Promise.all([
        testGeocodingAPI(),
        testPlacesAPI(),
        testStaticMapsAPI(),
      ]);

      setTestResults({
        geocoding: geocodingResult,
        places: placesResult,
        staticMaps: staticMapsResult,
      });
    } catch (error) {
      Alert.alert('Test Error', 'Failed to run API tests');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAPIKeyFormat = () => {
    if (!API_KEY) {
      return 'API key not configured ❌';
    }
    if (API_KEY.length < 30) {
      return 'API key too short ❌';
    }
    if (!API_KEY.startsWith('AIza')) {
      return 'Invalid API key format ❌';
    }
    return 'API key format looks correct ✅';
  };

  const getRecommendations = () => {
    const hasErrors = Object.values(testResults).some(result => 
      result.includes('Error') || result.includes('❌')
    );

    if (hasErrors) {
      return [
        '1. Check if your API key is correctly configured',
        '2. Enable the following APIs in Google Cloud Console:',
        '   • Maps SDK for Android',
        '   • Maps SDK for iOS', 
        '   • Geocoding API',
        '   • Places API',
        '   • Maps Static API',
        '3. Check API key restrictions and billing',
        '4. Ensure your API key has no IP/domain restrictions for testing',
      ];
    }

    return [
      '✅ Your Google Maps API key is working correctly!',
      '🚀 You can now build your app with:',
      '   • npx expo install expo-dev-client',
      '   • eas build --platform android --profile development',
      '   • Or use EAS Build for production',
    ];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="key" size={40} color="#2ECC71" />
        <Text style={styles.title}>Google Maps API Test</Text>
        <Text style={styles.subtitle}>Testing API key functionality</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Key Status</Text>
        <View style={styles.testItem}>
          <Text style={styles.testName}>Format Check:</Text>
          <Text style={styles.testResult}>{checkAPIKeyFormat()}</Text>
        </View>
        <Text style={styles.apiKeyDisplay}>
          Key: {API_KEY.substring(0, 10)}...{API_KEY.substring(API_KEY.length - 4)}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Endpoints Test</Text>
        
        <View style={styles.testItem}>
          <Text style={styles.testName}>Geocoding API:</Text>
          <Text style={styles.testResult}>{testResults.geocoding}</Text>
        </View>

        <View style={styles.testItem}>
          <Text style={styles.testName}>Places API:</Text>
          <Text style={styles.testResult}>{testResults.places}</Text>
        </View>

        <View style={styles.testItem}>
          <Text style={styles.testName}>Static Maps API:</Text>
          <Text style={styles.testResult}>{testResults.staticMaps}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.testButton} 
        onPress={runAllTests}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Run API Tests</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.recommendations}>
        <Text style={styles.recommendationsTitle}>Recommendations:</Text>
        {getRecommendations().map((recommendation, index) => (
          <Text key={index} style={styles.recommendationItem}>
            {recommendation}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  testName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  testResult: {
    fontSize: 14,
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  apiKeyDisplay: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 10,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recommendations: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default GoogleMapsAPITest;
