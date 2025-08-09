import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      borderWidth: 1,
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = 12;
        baseStyle.paddingVertical = 8;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingHorizontal = 24;
        baseStyle.paddingVertical = 16;
        baseStyle.minHeight = 56;
        break;
      default:
        baseStyle.paddingHorizontal = 16;
        baseStyle.paddingVertical = 12;
        baseStyle.minHeight = 44;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = COLORS.gray;
        baseStyle.borderColor = COLORS.gray;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderColor = COLORS.primary;
        break;
      case 'danger':
        baseStyle.backgroundColor = COLORS.error;
        baseStyle.borderColor = COLORS.error;
        break;
      default:
        baseStyle.backgroundColor = COLORS.primary;
        baseStyle.borderColor = COLORS.primary;
    }

    // Disabled state
    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.fontSize = 14;
        break;
      case 'large':
        baseStyle.fontSize = 18;
        break;
      default:
        baseStyle.fontSize = 16;
    }

    // Color styles
    switch (variant) {
      case 'outline':
        baseStyle.color = COLORS.primary;
        break;
      case 'secondary':
        baseStyle.color = COLORS.white;
        break;
      default:
        baseStyle.color = COLORS.white;
    }

    return baseStyle;
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
  const iconColor = variant === 'outline' ? COLORS.primary : COLORS.white;

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'small'} 
          color={iconColor} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={iconColor} 
              style={{ marginRight: 8 }} 
            />
          )}
          
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={iconSize} 
              color={iconColor} 
              style={{ marginLeft: 8 }} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
