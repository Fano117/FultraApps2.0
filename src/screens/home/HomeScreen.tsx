import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, Typography, Avatar, colors, spacing, borderRadius, shadows } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { fetchEmbarques } from '@/apps/entregas/store/entregasSlice';

const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const { clientes, entregasSync, loading } = useAppSelector((state) => state.entregas);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    dispatch(fetchEmbarques());
  };

  const totalEntregas = clientes.reduce((sum, cliente) => sum + cliente.entregas.length, 0);
  const pendientesSinc = entregasSync.length;

  const apps = [
    {
      id: 'entregas',
      name: 'Entregas',
      icon: 'cube',
      color: colors.primary[600],
      enabled: true,
      count: totalEntregas,
    },
    {
      id: 'garantias',
      name: 'Garantías',
      icon: 'shield-checkmark',
      color: colors.neutral[400],
      enabled: false,
    },
    {
      id: 'reclamos',
      name: 'Reclamos',
      icon: 'alert-circle',
      color: colors.neutral[400],
      enabled: false,
    },
  ];

  const handleAppPress = (appId: string) => {
    if (appId === 'entregas') {
      navigation.navigate('Entregas' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
      >
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Typography variant="caption" color="inverse" style={styles.greeting}>
                Hola,
              </Typography>
              <Typography variant="h4" color="inverse">
                {user?.name || 'Usuario'}
              </Typography>
            </View>
            <Avatar name={user?.name} size="large" />
          </View>

          <View style={styles.statsContainer}>
            <Card variant="default" padding="medium" style={styles.statCard}>
              <View style={styles.statContent}>
                <Ionicons name="cube-outline" size={24} color={colors.primary[600]} />
                <View style={styles.statText}>
                  <Typography variant="h3">{totalEntregas}</Typography>
                  <Typography variant="caption" color="secondary">
                    Entregas pendientes
                  </Typography>
                </View>
              </View>
            </Card>

            {pendientesSinc > 0 && (
              <Card variant="default" padding="medium" style={styles.statCard}>
                <View style={styles.statContent}>
                  <Ionicons name="sync-outline" size={24} color={colors.warning[600]} />
                  <View style={styles.statText}>
                    <Typography variant="h3">{pendientesSinc}</Typography>
                    <Typography variant="caption" color="secondary">
                      Pendientes de sincronizar
                    </Typography>
                  </View>
                </View>
              </Card>
            )}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Aplicaciones
          </Typography>

          <View style={styles.appsGrid}>
            {apps.map((app) => (
              <TouchableOpacity
                key={app.id}
                onPress={() => app.enabled && handleAppPress(app.id)}
                disabled={!app.enabled}
                activeOpacity={0.7}
              >
                <Card
                  variant="elevated"
                  padding="large"
                  style={[styles.appCard, !app.enabled && styles.appCardDisabled]}
                >
                  <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                    <Ionicons name={app.icon as any} size={32} color={colors.white} />
                  </View>
                  <Typography variant="subtitle1" align="center" style={styles.appName}>
                    {app.name}
                  </Typography>
                  {app.count !== undefined && (
                    <View style={styles.appBadge}>
                      <Typography variant="caption" color="inverse">
                        {app.count}
                      </Typography>
                    </View>
                  )}
                  {!app.enabled && (
                    <View style={styles.disabledOverlay}>
                      <Typography variant="caption" color="secondary">
                        Próximamente
                      </Typography>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
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
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[20],
    borderBottomLeftRadius: borderRadius['3xl'],
    borderBottomRightRadius: borderRadius['3xl'],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  greeting: {
    opacity: 0.8,
    marginBottom: spacing[1],
  },
  statsContainer: {
    gap: spacing[3],
  },
  statCard: {
    ...shadows.md,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  statText: {
    flex: 1,
  },
  content: {
    padding: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[4],
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  appCard: {
    width: 110,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  appCardDisabled: {
    opacity: 0.5,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  appName: {
    fontSize: 13,
  },
  appBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: colors.error[500],
    borderRadius: borderRadius.full,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  disabledOverlay: {
    position: 'absolute',
    bottom: spacing[2],
  },
});

export default HomeScreen;
