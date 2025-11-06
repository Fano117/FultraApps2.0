import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, Typography, Avatar, Button, colors, spacing, borderRadius } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { logout } from '@/shared/store/slices/authSlice';
import { authService } from '@/shared/services';
import { entregasStorageService } from '@/apps/entregas/services';
import { APP_VERSION } from '@/shared/config';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { entregasSync } = useAppSelector((state) => state.entregas);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    if (entregasSync.length > 0) {
      Alert.alert(
        'Entregas pendientes',
        `Tienes ${entregasSync.length} entrega(s) pendiente(s) de sincronizar. ¿Deseas cerrar sesión de todos modos?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    } else {
      performLogout();
    }
  };

  const performLogout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      dispatch(logout());
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar caché',
      '¿Estás seguro de que deseas limpiar la caché local? Esto eliminará todas las entregas pendientes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              await entregasStorageService.clearAllData();
              Alert.alert('Éxito', 'Caché limpiada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo limpiar la caché');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Información Personal',
      subtitle: user?.email || 'Sin email',
      onPress: () => {},
    },
    {
      icon: 'notifications-outline',
      title: 'Notificaciones',
      subtitle: unreadCount > 0 ? `${unreadCount} sin leer` : 'Sin notificaciones nuevas',
      onPress: () => navigation.navigate('Notifications' as never),
      badge: unreadCount,
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Seguridad y Privacidad',
      subtitle: 'Gestionar permisos',
      onPress: () => {},
    },
    {
      icon: 'trash-outline',
      title: 'Limpiar Caché',
      subtitle: 'Eliminar datos locales',
      onPress: handleClearCache,
      danger: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Avatar name={user?.name} size="xlarge" />
          <Typography variant="h5" align="center" style={styles.userName}>
            {user?.name || 'Usuario'}
          </Typography>
          <Typography variant="body2" color="secondary" align="center">
            {user?.email || 'Sin email'}
          </Typography>
        </View>


        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} onPress={item.onPress} activeOpacity={0.7}>
              <Card variant="default" padding="none" style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <View style={styles.menuItemLeft}>
                    <View
                      style={[
                        styles.menuItemIcon,
                        item.danger && styles.menuItemIconDanger,
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={item.danger ? colors.error[600] : colors.primary[600]}
                      />
                      {item.badge && item.badge > 0 && (
                        <View style={styles.badge}>
                          <Typography variant="caption" color="inverse" style={styles.badgeText}>
                            {item.badge > 99 ? '99+' : String(item.badge)}
                          </Typography>
                        </View>
                      )}
                    </View>
                    <View style={styles.menuItemText}>
                      <Typography
                        variant="subtitle1"
                        style={item.danger && { color: colors.error[600] }}
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {item.subtitle}
                      </Typography>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            variant="outline"
            size="large"
            fullWidth
            loading={loading}
            onPress={handleLogout}
            leftIcon={<Ionicons name="log-out-outline" size={20} color={colors.error[600]} />}
            style={styles.logoutButton}
            textStyle={{ color: colors.error[600] }}
          >
            Cerrar Sesión
          </Button>

          <View style={styles.versionContainer}>
            <Typography variant="caption" color="secondary" align="center">
              FultraApps {APP_VERSION}
            </Typography>
            <Typography variant="caption" color="secondary" align="center">
              © 2025 Fultra. Todos los derechos reservados.
            </Typography>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.white,
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
  },
  userName: {
    marginTop: spacing[3],
  },
  menuContainer: {
    padding: spacing[4],
    gap: spacing[2],
  },
  menuItem: {
    overflow: 'hidden',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  menuItemIconDanger: {
    backgroundColor: colors.error[50],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error[500],
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  menuItemText: {
    flex: 1,
  },
  footer: {
    padding: spacing[4],
    gap: spacing[6],
  },
  logoutButton: {
    borderColor: colors.error[600],
  },
  versionContainer: {
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[4],
  },
});

export default ProfileScreen;
