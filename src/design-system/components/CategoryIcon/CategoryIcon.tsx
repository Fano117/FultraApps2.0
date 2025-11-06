import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius } from '../../theme';

export interface CategoryIconProps {
  category: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const categoryMap: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  food: { icon: 'restaurant', color: colors.warning[600] },
  restaurant: { icon: 'restaurant', color: colors.warning[600] },
  groceries: { icon: 'cart', color: colors.success[600] },
  transport: { icon: 'car', color: colors.info[600] },
  shopping: { icon: 'bag-handle', color: colors.secondary[600] },
  entertainment: { icon: 'game-controller', color: colors.error[600] },
  bills: { icon: 'receipt', color: colors.primary[600] },
  health: { icon: 'medical', color: colors.error[400] },
  education: { icon: 'school', color: colors.info[500] },
  travel: { icon: 'airplane', color: colors.secondary[500] },
  income: { icon: 'trending-up', color: colors.success[600] },
  salary: { icon: 'cash', color: colors.success[700] },
  investment: { icon: 'stats-chart', color: colors.primary[700] },
  other: { icon: 'ellipsis-horizontal-circle', color: colors.neutral[600] },
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 'medium',
  style,
}) => {
  const categoryData = categoryMap[category.toLowerCase()] || categoryMap.other;

  const iconSizes = {
    small: 20,
    medium: 24,
    large: 28,
  };

  const containerSizes = {
    small: 36,
    medium: 48,
    large: 56,
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSizes[size],
          height: containerSizes[size],
          backgroundColor: `${categoryData.color}15`,
        },
        style,
      ]}
    >
      <Ionicons
        name={categoryData.icon}
        size={iconSizes[size]}
        color={categoryData.color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
});
