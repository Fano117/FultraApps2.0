import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../Card/Card';
import { colors, spacing, typography, borderRadius } from '../../theme';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  color = colors.primary[600],
  onPress,
  style,
}) => {
  return (
    <Card
      variant="elevated"
      padding="medium"
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>

        {trend && (
          <View
            style={[
              styles.trendBadge,
              trend.isPositive ? styles.trendPositive : styles.trendNegative,
            ]}
          >
            <Ionicons
              name={trend.isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.isPositive ? colors.success[600] : colors.error[600]}
            />
            <Text
              style={[
                styles.trendText,
                trend.isPositive ? styles.trendTextPositive : styles.trendTextNegative,
              ]}
            >
              {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>

      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  value: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  trendPositive: {
    backgroundColor: colors.success[50],
  },
  trendNegative: {
    backgroundColor: colors.error[50],
  },
  trendText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  trendTextPositive: {
    color: colors.success[700],
  },
  trendTextNegative: {
    color: colors.error[700],
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
