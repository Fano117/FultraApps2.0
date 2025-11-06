import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  variant?: 'default' | 'rounded' | 'thin';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  showPercentage = false,
  label,
  height,
  color = colors.primary[600],
  backgroundColor = colors.white,
  style,
  variant = 'default',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getHeight = () => {
    if (height) return height;
    switch (variant) {
      case 'thin':
        return 4;
      case 'rounded':
        return 12;
      default:
        return 8;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {(showLabel || label) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {showPercentage && (
            <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height: getHeight(),
            backgroundColor,
            borderRadius: variant === 'rounded' ? getHeight() / 2 : borderRadius.full,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
              borderRadius: variant === 'rounded' ? getHeight() / 2 : borderRadius.full,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  percentage: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
