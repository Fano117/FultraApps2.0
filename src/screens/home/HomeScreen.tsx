import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, Typography, Avatar, Badge, colors, spacing, borderRadius, shadows } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { fetchEmbarques } from '@/apps/entregas/store/entregasSlice';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing[6] * 2 - spacing[4]) / 2;

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
      description: 'Gestión de entregas',
      icon: 'cube',
      gradient: [colors.primary[500], colors.primary[700]] as const,
      enabled: true,
      count: totalEntregas,
    },
    {
      id: 'garantias',
      name: 'Garantías',
      description: 'Control de garantías',
      icon: 'shield-checkmark',
      gradient: [colors.info[500], colors.info[700]] as const,
      enabled: false,
    },
    {
      id: 'reclamos',
      name: 'Reclamos',
      description: 'Gestión de reclamos',
      icon: 'alert-circle',
      gradient: [colors.warning[500], colors.warning[700]] as const,
      enabled: false,
    },
    {
      id: 'inventario',
      name: 'Inventario',
      description: 'Control de stock',
      icon: 'layers',
      gradient: [colors.success[500], colors.success[700]] as const,
      enabled: false,
    },
    {
      id: 'ventas',
      name: 'Ventas',
      description: 'Registro de ventas',
      icon: 'cart',
      gradient: [colors.secondary[500], colors.secondary[700]] as const,
      enabled: false,
    },
    {
      id: 'reportes',
      name: 'Reportes',
      description: 'Analytics y reportes',
      icon: 'stats-chart',
      gradient: [colors.card.blue, colors.card.blueDark] as const,
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header con gradiente */}
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

          {/* Estadísticas */}
          {pendientesSinc > 0 && (
            <View style={styles.statsContainer}>
              <Card variant="default" padding="medium" style={styles.statCard}>
                <View style={styles.statContent}>
                  <View style={[styles.statIconContainer, { backgroundColor: colors.warning[50] }]}>
                    <Ionicons name="sync-outline" size={28} color={colors.warning[600]} />
                  </View>
                  <View style={styles.statText}>
                    <Typography variant="h2" style={styles.statNumber}>
                      {pendientesSinc}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      Pendientes de sincronizar
                    </Typography>
                  </View>
                </View>
              </Card>
            </View>
          )}
        </LinearGradient>

        {/* Contenido */}
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Typography variant="h5" style={styles.sectionTitle}>
              Aplicaciones
            </Typography>
            <Typography variant="caption" color="secondary">
              {apps.filter(app => app.enabled).length} de {apps.length} activas
            </Typography>
          </View>

          {/* Grid de aplicaciones mejorado */}
          <View style={styles.appsGrid}>
            {apps.map((app) => (
              <TouchableOpacity
                key={app.id}
                onPress={() => app.enabled && handleAppPress(app.id)}
                disabled={!app.enabled}
                activeOpacity={0.8}
                style={styles.appCardWrapper}
              >
                <Card
                  variant="elevated"
                  padding="none"
                >
                  <LinearGradient
                    colors={app.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.appGradient}
                  >
                    <View style={styles.appIconContainer}>
                      <Ionicons name={app.icon as any} size={40} color={colors.white} />
                    </View>
                  </LinearGradient>

                  <View style={styles.appInfo}>
                    <Typography variant="subtitle1" style={styles.appName} numberOfLines={1}>
                      {app.name}
                    </Typography>
                    <Typography variant="caption" color="secondary" numberOfLines={1}>
                      {app.description}
                    </Typography>
                  </View>

                  {/* Badge de contador */}
                  {app.count !== undefined && app.count > 0 && (
                    <View style={styles.appBadge}>
                      <Badge variant="error" size="small">
                        {app.count}
                      </Badge>
                    </View>
                  )}

                  {/* Overlay para apps deshabilitadas */}
                  {!app.enabled && (
                    <View style={styles.disabledOverlay}>
                      <View style={styles.comingSoonBadge}>
                        <Typography variant="caption" style={styles.comingSoonText}>
                          Próximamente
                        </Typography>
                      </View>
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
    paddingBottom: spacing[24],
    borderBottomLeftRadius: borderRadius['3xl'],
    borderBottomRightRadius: borderRadius['3xl'],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  greeting: {
    opacity: 0.9,
    marginBottom: spacing[1],
  },
  statsContainer: {
    gap: spacing[4],
  },
  statCard: {
    ...shadows.lg,
    borderRadius: borderRadius['2xl'],
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    flex: 1,
  },
  statNumber: {
    marginBottom: spacing[1],
  },
  content: {
    padding: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  sectionTitle: {
    flex: 1,
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
  },
  appCardWrapper: {
    width: CARD_WIDTH,
  },
  appGradient: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  appIconContainer: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  appInfo: {
    padding: spacing[4],
    backgroundColor: colors.white,
    minHeight: 68,
  },
  appName: {
    marginBottom: spacing[1],
    fontWeight: '600',
  },
  appBadge: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonBadge: {
    backgroundColor: colors.neutral[800],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  comingSoonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
});

export default HomeScreen;
