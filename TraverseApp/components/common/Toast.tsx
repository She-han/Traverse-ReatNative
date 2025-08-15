import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserFriendlyError } from '../../utils/errorHandler';

interface ToastProps {
  error: UserFriendlyError | null;
  onHide: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

const Toast: React.FC<ToastProps> = ({ error, onHide, duration = 4000 }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!error) return null;

  const getIconName = (type: string) => {
    switch (type) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      case 'info':
        return 'information-circle';
      default:
        return 'alert-circle';
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'error':
        return {
          background: '#FEF2F2',
          border: '#FECACA',
          icon: '#EF4444',
          title: '#DC2626',
          message: '#7F1D1D',
          action: '#DC2626',
        };
      case 'warning':
        return {
          background: '#FFFBEB',
          border: '#FED7AA',
          icon: '#F59E0B',
          title: '#D97706',
          message: '#92400E',
          action: '#D97706',
        };
      case 'success':
        return {
          background: '#F0FDF4',
          border: '#BBF7D0',
          icon: '#22C55E',
          title: '#16A34A',
          message: '#15803D',
          action: '#16A34A',
        };
      case 'info':
        return {
          background: '#EFF6FF',
          border: '#BFDBFE',
          icon: '#3B82F6',
          title: '#1D4ED8',
          message: '#1E40AF',
          action: '#1D4ED8',
        };
      default:
        return {
          background: '#FEF2F2',
          border: '#FECACA',
          icon: '#EF4444',
          title: '#DC2626',
          message: '#7F1D1D',
          action: '#DC2626',
        };
    }
  };

  const colors = getColors(error.type);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.content}
          onPress={hideToast}
          activeOpacity={0.9}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIconName(error.type) as any}
              size={24}
              color={colors.icon}
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.title }]}>
              {error.title}
            </Text>
            <Text style={[styles.message, { color: colors.message }]}>
              {error.message}
            </Text>
            {error.action && (
              <Text style={[styles.action, { color: colors.action }]}>
                💡 {error.action}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={hideToast}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.icon} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  action: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default Toast;
