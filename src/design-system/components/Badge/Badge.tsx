import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'medium',
  children,
  style,
}) => {
  const containerStyle: ViewStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    style,
  ].filter(Boolean) as ViewStyle;

  const textStyles: TextStyle = [
    styles.text,
    styles[`text_${size}`],
  ].filter(Boolean) as TextStyle;

  return (
    <View style={containerStyle}>
      <Text style={textStyles}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },

  success: {
    backgroundColor: colors.success[100],
  },
  warning: {
    backgroundColor: colors.warning[100],
  },
  error: {
    backgroundColor: colors.error[100],
  },
  info: {
    backgroundColor: colors.primary[100],
  },
  neutral: {
    backgroundColor: colors.neutral[200],
  },

  size_small: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  size_medium: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  size_large: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },

  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  text_small: {
    fontSize: 10,
  },
  text_medium: {
    fontSize: 12,
  },
  text_large: {
    fontSize: 14,
  },
});
