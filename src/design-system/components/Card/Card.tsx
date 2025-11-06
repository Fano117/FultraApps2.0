import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, TouchableOpacityProps, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../../theme';

type CardVariant = 'default' | 'elevated' | 'outline' | 'gradient';
type CardPadding = 'none' | 'small' | 'medium' | 'large';

export interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: CardVariant;
  padding?: CardPadding;
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'medium',
  children,
  style,
  gradient,
  onPress,
  ...props
}) => {
  const containerStyle = [
    styles.base,
    styles[variant],
    styles[`padding_${padding}` as keyof typeof styles],
    style,
  ].filter(Boolean);

  if (variant === 'gradient' && gradient) {
    const content = <View style={styles.gradientContent}>{children}</View>;

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} {...props}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={containerStyle}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={containerStyle}
      >
        {content}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.9}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  default: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  elevated: {
    backgroundColor: colors.white,
    ...shadows.lg,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  gradient: {
    ...shadows.md,
  },

  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: spacing[3],
  },
  padding_medium: {
    padding: spacing[4],
  },
  padding_large: {
    padding: spacing[6],
  },

  gradientContent: {
    flex: 1,
  },
});
