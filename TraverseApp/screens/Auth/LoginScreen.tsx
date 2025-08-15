import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, registerUser, clearError } from '../../store/slices/authSlice';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { COLORS, SIZES } from '../../constants';

const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const { handleValidationError, showSuccess, handleError } = useErrorHandler();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    // Clear any existing errors
    if (error) {
      dispatch(clearError());
    }

    // Validate fields
    if (handleValidationError('email', email)) return;
    if (handleValidationError('password', password)) return;
    if (isSignUp && handleValidationError('name', name)) return;

    try {
      if (isSignUp) {
        await dispatch(registerUser({ email, password, name })).unwrap();
        showSuccess('Account Created!', 'Welcome to Traverse! You can now track your buses.');
      } else {
        await dispatch(loginUser({ email, password })).unwrap();
        showSuccess('Welcome Back!', 'You\'re now signed in to Traverse.');
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setName('');
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Traverse</Text>
            <Text style={styles.subtitle}>Your smart bus tracking companion</Text>
            <Text style={styles.tagline}>Never miss the bus again! 🚌</Text>
          </View>

          <View style={styles.form}>
            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={toggleMode}
              disabled={isLoading}
            >
              <Text style={styles.switchText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.features}>
            <Text style={styles.featuresTitle}>Features:</Text>
            <Text style={styles.featureItem}>• Real-time bus tracking</Text>
            <Text style={styles.featureItem}>• Smart route planning</Text>
            <Text style={styles.featureItem}>• Live arrival notifications</Text>
            <Text style={styles.featureItem}>• Favorite routes & stops</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SIZES.padding * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.gray,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.accent,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    marginBottom: SIZES.margin,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    alignItems: 'center',
    marginBottom: SIZES.margin,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    padding: 10,
  },
  switchText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: '#FFE6E6',
    padding: 10,
    borderRadius: 5,
  },
  features: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  featureItem: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 5,
  },
});

export default LoginScreen;