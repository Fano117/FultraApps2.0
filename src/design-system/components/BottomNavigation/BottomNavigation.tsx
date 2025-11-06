import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../../theme';

export interface NavigationItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
}

export interface BottomNavigationProps {
  items: NavigationItem[];
  activeItemId: string;
  style?: ViewStyle;
  variant?: 'default' | 'floating';
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeItemId,
  style,
  variant = 'default',
}) => {
  return (
    <View style={[
      styles.container,
      variant === 'floating' && styles.floating,
      style,
    ]}>
      {items.map((item) => {
        const isActive = item.id === activeItemId;
        const iconName = isActive && item.activeIcon ? item.activeIcon : item.icon;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={iconName}
                size={24}
                color={isActive ? colors.primary[600] : colors.text.secondary}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingBottom: spacing[2],
    paddingTop: spacing[3],
    paddingHorizontal: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  floating: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    borderRadius: 24,
    borderTopWidth: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error[600],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
});
