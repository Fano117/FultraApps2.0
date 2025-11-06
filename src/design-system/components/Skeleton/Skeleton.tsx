import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  variant?: 'text' | 'circular' | 'rectangular';
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  variant = 'rectangular',
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const getVariantStyle = () => {
    switch (variant) {
      case 'circular':
        return {
          borderRadius: width === '100%' ? height / 2 : (width as number) / 2,
          width: width === '100%' ? height : width,
        };
      case 'text':
        return { borderRadius: borderRadius.sm };
      case 'rectangular':
      default:
        return { borderRadius: borderRadius.md };
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          opacity,
        },
        getVariantStyle(),
        style,
      ]}
    />
  );
};

export const SkeletonGroup: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({
  children,
  style,
}) => {
  return <View style={[styles.group, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.neutral[200],
  },
  group: {
    gap: spacing[2],
  },
});
