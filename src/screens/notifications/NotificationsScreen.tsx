import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, Typography, colors, spacing, borderRadius } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  Notification,
} from '@/shared/store/slices';

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = selectedFilter === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      dispatch(markAsRead(notification.id));
    }
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllAsRead());
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Limpiar notificaciones',
      '¿Estás seguro de que deseas eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => dispatch(clearAllNotifications()),
        },
      ]
    );
  };

  const handleDeleteNotification = (id: string) => {
    Alert.alert(
      'Eliminar notificación',
      '¿Estás seguro de que deseas eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => dispatch(deleteNotification(id)),
        },
      ]
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: colors.success[600] };
      case 'warning':
        return { name: 'warning', color: colors.warning[600] };
      case 'error':
        return { name: 'alert-circle', color: colors.error[600] };
      default:
        return { name: 'information-circle', color: colors.primary[600] };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <Card
          variant="default"
          padding="none"
          style={[styles.notificationCard, !item.read && styles.unreadCard]}
        >
          <View style={styles.notificationContent}>
            <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
              <Ionicons name={icon.name as any} size={24} color={icon.color} />
            </View>

            <View style={styles.notificationTextContainer}>
              <View style={styles.notificationHeader}>
                <Typography
                  variant="subtitle2"
                  style={[styles.notificationTitle, !item.read && styles.unreadText]}
                >
                  {item.title}
                </Typography>
                {!item.read && <View style={styles.unreadDot} />}
              </View>

              <Typography variant="body2" color="secondary" numberOfLines={2}>
                {item.message}
              </Typography>

              <Typography variant="caption" color="secondary" style={styles.timestamp}>
                {formatDate(item.createdAt)}
              </Typography>
            </View>

            <TouchableOpacity
              onPress={() => handleDeleteNotification(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="notifications-off-outline" size={64} color={colors.neutral[300]} />
      </View>
      <Typography variant="h6" color="secondary" align="center">
        No hay notificaciones
      </Typography>
      <Typography variant="body2" color="secondary" align="center" style={styles.emptyText}>
        {selectedFilter === 'unread'
          ? 'No tienes notificaciones sin leer'
          : 'Cuando recibas notificaciones, aparecerán aquí'
        }
      </Typography>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[900]} />
        </TouchableOpacity>

        <Typography variant="h5">Notificaciones</Typography>

        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerAction}>
              <Ionicons name="checkmark-done" size={24} color={colors.primary[600]} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.headerAction}>
              <Ionicons name="trash-outline" size={24} color={colors.error[600]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'all' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Typography
            variant="subtitle2"
            style={selectedFilter === 'all' ? styles.filterTextActive : styles.filterText}
          >
            Todas ({notifications.length})
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'unread' && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedFilter('unread')}
        >
          <Typography
            variant="subtitle2"
            style={selectedFilter === 'unread' ? styles.filterTextActive : styles.filterText}
          >
            No leídas ({unreadCount})
          </Typography>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          filteredNotifications.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headerAction: {
    padding: spacing[2],
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[2],
    backgroundColor: colors.white,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary[600],
  },
  filterText: {
    color: colors.neutral[600],
  },
  filterTextActive: {
    color: colors.white,
  },
  listContainer: {
    padding: spacing[4],
    gap: spacing[2],
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  notificationCard: {
    overflow: 'hidden',
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[600],
  },
  notificationContent: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTextContainer: {
    flex: 1,
    gap: spacing[1],
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  notificationTitle: {
    flex: 1,
  },
  unreadText: {
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
  },
  timestamp: {
    marginTop: spacing[1],
  },
  deleteButton: {
    padding: spacing[1],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  emptyIconContainer: {
    marginBottom: spacing[4],
  },
  emptyText: {
    marginTop: spacing[2],
    maxWidth: 280,
  },
});

export default NotificationsScreen;
