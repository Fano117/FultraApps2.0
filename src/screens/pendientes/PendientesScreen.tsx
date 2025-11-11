import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Typography, Badge, Button, colors, spacing, borderRadius } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { loadLocalData, updateEntregaSync, removeEntregaSync } from '@/apps/entregas/store/entregasSlice';
import { syncService } from '@/apps/entregas/services';
import { EstadoSincronizacion, EntregaSync } from '@/apps/entregas/models';

const PendientesScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { entregasSync } = useAppSelector((state) => state.entregas);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    await dispatch(loadLocalData());
    setRefreshing(false);
  };

  const sincronizarEntrega = async (entrega: EntregaSync) => {
    setSyncing(entrega.id);

    try {
      const success = await syncService.sincronizarEntrega(entrega);

      if (success) {
        dispatch(removeEntregaSync(entrega.id));
        await loadData();
        Alert.alert('Éxito', 'Entrega sincronizada correctamente');
      } else {
        await loadData();
        Alert.alert('Error', 'No se pudo sincronizar la entrega');
      }
    } catch (error: any) {
      console.error('Error sincronizando entrega:', error);
      Alert.alert('Error', 'No se pudo sincronizar la entrega');
    } finally {
      setSyncing(null);
    }
  };

  const sincronizarTodas = async () => {
    Alert.alert(
      'Sincronizar todas',
      '¿Desea sincronizar todas las entregas pendientes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            setRefreshing(true);
            try {
              const result = await syncService.sincronizarEntregasPendientes();

              if (result.success) {
                await loadData();
                Alert.alert(
                  'Sincronización Completada',
                  `${result.entregasSincronizadas} entrega(s) sincronizada(s)\n${result.entregasConError} con error`
                );
              } else {
                Alert.alert('Información', result.mensaje || 'No se pudieron sincronizar las entregas');
              }
            } catch (error) {
              console.error('Error en sincronización masiva:', error);
              Alert.alert('Error', 'No se pudo completar la sincronización');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]
    );
  };

  const getEstadoBadge = (estado: EstadoSincronizacion) => {
    switch (estado) {
      case EstadoSincronizacion.PENDIENTE_ENVIO:
        return <Badge variant="warning">Pendiente</Badge>;
      case EstadoSincronizacion.ENVIANDO:
        return <Badge variant="info">Enviando...</Badge>;
      case EstadoSincronizacion.DATOS_ENVIADOS:
        return <Badge variant="info">Datos Enviados</Badge>;
      case EstadoSincronizacion.IMAGENES_PENDIENTES:
        return <Badge variant="info">Enviando Imágenes</Badge>;
      case EstadoSincronizacion.COMPLETADO:
        return <Badge variant="success">Completado</Badge>;
      case EstadoSincronizacion.ERROR:
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="neutral">{estado}</Badge>;
    }
  };

  const renderEntrega = ({ item }: { item: EntregaSync }) => {
    const totalImagenes =
      item.imagenesEvidencia.length +
      item.imagenesFacturas.length +
      item.imagenesIncidencia.length;

    const puedeReintentar =
      item.estado === EstadoSincronizacion.PENDIENTE_ENVIO ||
      item.estado === EstadoSincronizacion.ERROR;

    return (
      <Card variant="elevated" padding="medium" style={styles.entregaCard}>
        <View style={styles.entregaHeader}>
          <View style={styles.entregaInfo}>
            <Typography variant="subtitle1">{item.folio}</Typography>
            <Typography variant="caption" color="secondary">
              OV: {item.ordenVenta}
            </Typography>
          </View>
          {getEstadoBadge(item.estado)}
        </View>

        <View style={styles.entregaDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color={colors.text.secondary} />
            <Typography variant="body2" color="secondary">
              {item.nombreQuienEntrega}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="image-outline" size={16} color={colors.text.secondary} />
            <Typography variant="body2" color="secondary">
              {totalImagenes} imagen{totalImagenes !== 1 ? 'es' : ''}
            </Typography>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.text.secondary} />
            <Typography variant="body2" color="secondary">
              {item.fechaCaptura
                ? new Date(item.fechaCaptura).toLocaleDateString()
                : 'Sin fecha'}
            </Typography>
          </View>

          {item.intentosEnvio > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="refresh-outline" size={16} color={colors.warning[600]} />
              <Typography variant="body2" style={{ color: colors.warning[600] }}>
                {item.intentosEnvio} intento{item.intentosEnvio !== 1 ? 's' : ''}
              </Typography>
            </View>
          )}

          {item.ultimoError && (
            <View style={styles.errorContainer}>
              <Typography variant="caption" style={styles.errorText}>
                {item.ultimoError}
              </Typography>
            </View>
          )}
        </View>

        {item.articulos && item.articulos.length > 0 && (
          <View style={styles.articulosSection}>
            <View style={styles.articulosHeader}>
              <Ionicons name="cube-outline" size={18} color={colors.primary[600]} />
              <Typography variant="subtitle2" style={styles.articulosTitle}>
                Artículos ({item.articulos.length})
              </Typography>
            </View>
            {item.articulos.map((articulo, index) => (
              <View key={`${articulo.id}-${index}`} style={styles.articuloItem}>
                <View style={styles.articuloRow}>
                  <Typography variant="body2" style={styles.articuloProducto}>
                    {articulo.producto}
                  </Typography>
                  <View style={styles.articuloCantidades}>
                    <Typography variant="body2" style={styles.cantidadEntregada}>
                      {articulo.cantidadEntregada}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      /{articulo.cantidadProgramada}
                    </Typography>
                  </View>
                </View>
                <Typography variant="caption" color="secondary" numberOfLines={2}>
                  {articulo.descripcion}
                </Typography>
                <View style={styles.articuloFooter}>
                  <Typography variant="caption" color="secondary">
                    Peso: {articulo.peso} {articulo.unidadMedida}
                  </Typography>
                  {articulo.restante > 0 && (
                    <View style={styles.restanteBadge}>
                      <Typography variant="caption" style={styles.restanteText}>
                        Restante: {articulo.restante}
                      </Typography>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {puedeReintentar && (
          <View style={styles.actions}>
            <Button
              variant="primary"
              size="small"
              fullWidth
              loading={syncing === item.id}
              onPress={() => sincronizarEntrega(item)}
              leftIcon={
                <Ionicons
                  name="cloud-upload-outline"
                  size={18}
                  color={colors.white}
                />
              }
            >
              Sincronizar
            </Button>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h5">Pendientes de Sincronizar</Typography>
        {entregasSync.length > 0 && (
          <Button variant="outline" size="small" onPress={sincronizarTodas}>
            Sincronizar Todas
          </Button>
        )}
      </View>

      <FlatList
        data={entregasSync}
        renderItem={renderEntrega}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.success[300]} />
            <Typography variant="h6" color="secondary" align="center" style={styles.emptyText}>
              No hay entregas pendientes
            </Typography>
            <Typography variant="body2" color="secondary" align="center">
              Todas las entregas están sincronizadas
            </Typography>
          </View>
        }
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  entregaCard: {
    marginBottom: spacing[4],
  },
  entregaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  entregaInfo: {
    flex: 1,
  },
  entregaDetails: {
    gap: spacing[2],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  errorContainer: {
    marginTop: spacing[2],
    padding: spacing[2],
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.md,
  },
  errorText: {
    color: colors.error[700],
  },
  articulosSection: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  articulosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  articulosTitle: {
    color: colors.primary[600],
  },
  articuloItem: {
    padding: spacing[3],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  articuloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  articuloProducto: {
    flex: 1,
    fontWeight: '600',
    color: colors.text.primary,
  },
  articuloCantidades: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: spacing[2],
  },
  cantidadEntregada: {
    fontWeight: '700',
    color: colors.success[600],
    fontSize: 16,
  },
  articuloFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  restanteBadge: {
    backgroundColor: colors.warning[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  restanteText: {
    color: colors.warning[700],
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[20],
  },
  emptyText: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
});

export default PendientesScreen;
