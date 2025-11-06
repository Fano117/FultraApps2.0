import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { colors, spacing, typography, shadows } from '../../theme';

export interface HeaderProps {
  userName?: string;
  greeting?: string;
  avatarUrl?: string;
  notificationCount?: number;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'transparent';
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  greeting = 'Hola',
  avatarUrl,
  notificationCount = 0,
  onAvatarPress,
  onNotificationPress,
  onMenuPress,
  style,
  variant = 'default',
}) => {
  return (
    <View style={[styles.container, variant === 'transparent' && styles.transparent, style]}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
          <Avatar
            source={avatarUrl ? { uri: avatarUrl } : undefined}
            size="medium"
            name={userName || 'U'}
          />
        </TouchableOpacity>

        {userName && (
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
          {notificationCount > 0 && (
            <Badge
              variant="error"
              size="small"
              style={styles.notificationBadge}
            >
              {notificationCount > 99 ? '99+' : String(notificationCount)}
            </Badge>
          )}
        </TouchableOpacity>

        {onMenuPress && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.primary,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  userName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
});
