import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  iconColor?: string;
  iconSize?: number;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'medium',
  variant = 'default',
  disabled = false,
  style,
  iconColor,
  iconSize,
}) => {
  const getIconSize = () => {
    if (iconSize) return iconSize;
    switch (size) {
      case 'small':
        return 18;
      case 'medium':
        return 24;
      case 'large':
        return 28;
    }
  };

  const getIconColor = () => {
    if (iconColor) return iconColor;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return colors.white;
      case 'ghost':
        return colors.primary[600];
      default:
        return colors.text.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={getIconSize()} color={getIconColor()} />
    </TouchableOpacity>
  );
};

export const FAB: React.FC<IconButtonProps & { position?: 'bottom-right' | 'bottom-center' }> = ({
  position = 'bottom-right',
  ...props
}) => {
  return (
    <IconButton
      {...props}
      size={props.size || 'large'}
      variant={props.variant || 'primary'}
      style={[
        styles.fab,
        position === 'bottom-right' ? styles.fabBottomRight : styles.fabBottomCenter,
        props.style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  default: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  primary: {
    backgroundColor: colors.primary[600],
    ...shadows.md,
  },
  secondary: {
    backgroundColor: colors.secondary[600],
    ...shadows.md,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  size_small: {
    width: 36,
    height: 36,
  },
  size_medium: {
    width: 44,
    height: 44,
  },
  size_large: {
    width: 56,
    height: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    borderRadius: 100,
    ...shadows.xl,
  },
  fabBottomRight: {
    bottom: spacing[6],
    right: spacing[6],
  },
  fabBottomCenter: {
    bottom: spacing[6],
    alignSelf: 'center',
  },
});
