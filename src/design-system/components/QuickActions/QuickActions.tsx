import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../theme';

export interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  style?: ViewStyle;
  columns?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  style,
  columns = 4,
}) => {
  return (
    <View style={[styles.container, style]}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[styles.actionButton, { width: `${100 / columns - 2}%` }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: action.backgroundColor || colors.primary[50] },
            ]}
          >
            <Ionicons
              name={action.icon}
              size={24}
              color={action.color || colors.primary[600]}
            />
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing[2],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  label: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
