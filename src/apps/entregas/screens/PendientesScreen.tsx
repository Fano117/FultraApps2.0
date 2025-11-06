import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, Typography, Badge, Button, colors, spacing, borderRadius } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { loadLocalData } from '../store/entregasSlice';
import { syncService } from '../services/syncService';
import { EntregaSync, EstadoSincronizacion, TipoRegistro } from '../models';

const PendientesScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { entregasSync } = useAppSelector((state) => state.entregas);
  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    await dispatch(loadLocalData());
    setLoading(false);
  };

  const handleSincronizar = async () => {
    if (sincronizando) return;

    setSincronizando(true);
    try {
      const result = await syncService.sincronizarEntregasPendientes();

      if (result.success) {
        Alert.alert('Éxito', result.mensaje || 'Todas las entregas se sincronizaron correctamente');
        await cargarDatos();
      } else {
        Alert.alert('Información', result.mensaje || 'No se pudieron sincronizar las entregas');
      }
    } catch (error) {
      console.error('[Pendientes] Error sincronizando:', error);
      Alert.alert('Error', 'Ocurrió un error al sincronizar');
    } finally {
      setSincronizando(false);
    }
  };

  const getEstadoColor = (estado: EstadoSincronizacion) => {
    switch (estado) {
      case EstadoSincronizacion.COMPLETADO:
        return colors.success[500];
      case EstadoSincronizacion.DATOS_ENVIADOS:
      case EstadoSincronizacion.IMAGENES_PENDIENTES:
        return colors.warning[600];
      case EstadoSincronizacion.ENVIANDO:
        return colors.info[500];
      case EstadoSincronizacion.PENDIENTE_ENVIO:
        return colors.error[500];
      case EstadoSincronizacion.ERROR:
        return colors.error[600];
      default:
        return colors.neutral[400];
    }
  };

  const getEstadoIcono = (estado: EstadoSincronizacion) => {
    switch (estado) {
      case EstadoSincronizacion.COMPLETADO:
        return 'checkmark-circle';
      case EstadoSincronizacion.DATOS_ENVIADOS:
      case EstadoSincronizacion.IMAGENES_PENDIENTES:
        return 'cloud-upload-outline';
      case EstadoSincronizacion.ENVIANDO:
        return 'sync-outline';
      case EstadoSincronizacion.PENDIENTE_ENVIO:
        return 'time-outline';
      case EstadoSincronizacion.ERROR:
        return 'alert-circle-outline';
      default:
        return 'ellipsis-horizontal-circle-outline';
    }
  };

  const getEstadoTexto = (estado: EstadoSincronizacion) => {
    switch (estado) {
      case EstadoSincronizacion.COMPLETADO:
        return 'Completado';
      case EstadoSincronizacion.DATOS_ENVIADOS:
        return 'Datos Enviados';
      case EstadoSincronizacion.IMAGENES_PENDIENTES:
        return 'Imágenes Pendientes';
      case EstadoSincronizacion.ENVIANDO:
        return 'Enviando...';
      case EstadoSincronizacion.PENDIENTE_ENVIO:
        return 'Pendiente de Envío';
      case EstadoSincronizacion.ERROR:
        return 'Error';
      default:
        return 'Desconocido';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case TipoRegistro.COMPLETO:
        return colors.success[500];
      case TipoRegistro.PARCIAL:
        return colors.warning[600];
      case TipoRegistro.NO_ENTREGADO:
        return colors.error[500];
      default:
        return colors.neutral[400];
    }
  };

  const getTipoTexto = (tipo: string) => {
    switch (tipo) {
      case TipoRegistro.COMPLETO:
        return 'Completa';
      case TipoRegistro.PARCIAL:
        return 'Parcial';
      case TipoRegistro.NO_ENTREGADO:
        return 'No Entregado';
      default:
        return tipo;
    }
  };

  const renderEntrega = ({ item }: { item: EntregaSync }) => {
    const estadoColor = getEstadoColor(item.estado);
    const tipoColor = getTipoColor(item.tipoEntrega);
    const totalImagenes =
      item.imagenesEvidencia.length + item.imagenesFacturas.length + item.imagenesIncidencia.length;
    const imagenesEnviadas = [
      ...item.imagenesEvidencia,
      ...item.imagenesFacturas,
      ...item.imagenesIncidencia,
    ].filter((img) => img.enviado).length;

    return (
      <Card variant="elevated" padding="none" style={styles.entregaCard}>
        <View style={[styles.estadoBarra, { backgroundColor: estadoColor }]} />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.headerInfo}>
              <Typography variant="h6">{item.ordenVenta}</Typography>
              <Typography variant="caption" color="secondary">
                Folio: {item.folio}
              </Typography>
            </View>
            <View style={styles.estadoIndicador}>
              <Ionicons name={getEstadoIcono(item.estado) as any} size={24} color={estadoColor} />
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
              <Typography variant="caption" color="secondary">
                Tipo:
              </Typography>
              <Typography variant="body2" style={{ color: tipoColor, fontWeight: '600' }}>
                {getTipoTexto(item.tipoEntrega)}
              </Typography>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="cloud-outline" size={16} color={colors.text.secondary} />
              <Typography variant="caption" color="secondary">
                Estado:
              </Typography>
              <Typography variant="body2" style={{ color: estadoColor, fontWeight: '600' }}>
                {getEstadoTexto(item.estado)}
              </Typography>
            </View>

            {item.estado === EstadoSincronizacion.ERROR && item.ultimoError && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={16} color={colors.error[500]} />
                <Typography variant="caption" style={{ color: colors.error[500], flex: 1 }}>
                  {item.ultimoError}
                </Typography>
              </View>
            )}

            {totalImagenes > 0 && (
              <View style={styles.imagenesInfo}>
                <Ionicons name="images-outline" size={16} color={colors.text.secondary} />
                <Typography variant="caption" color="secondary">
                  Imágenes: {imagenesEnviadas} / {totalImagenes}
                </Typography>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${totalImagenes > 0 ? (imagenesEnviadas / totalImagenes) * 100 : 0}%`,
                        backgroundColor:
                          imagenesEnviadas === totalImagenes
                            ? colors.success[500]
                            : colors.warning[600],
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {item.articulos && item.articulos.length > 0 && (
              <View style={styles.articulosInfo}>
                <Typography variant="caption" color="secondary">
                  {item.articulos.length} artículo(s) -{' '}
                  {item.articulos.reduce((sum, art) => sum + (art.cantidadEntregada || 0), 0)}{' '}
                  unidades
                </Typography>
              </View>
            )}

            <View style={styles.metadataRow}>
              <View style={styles.metadataItem}>
                <Ionicons name="refresh-outline" size={14} color={colors.text.tertiary} />
                <Typography variant="caption" color="secondary">
                  Intentos: {item.intentosEnvio}
                </Typography>
              </View>
              {item.fechaCaptura && (
                <View style={styles.metadataItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
                  <Typography variant="caption" color="secondary">
                    {new Date(item.fechaCaptura).toLocaleDateString()}
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderEstadisticas = () => {
    const completados = entregasSync.filter(
      (e) => e.estado === EstadoSincronizacion.COMPLETADO
    ).length;
    const pendientes = entregasSync.filter(
      (e) =>
        e.estado === EstadoSincronizacion.PENDIENTE_ENVIO ||
        e.estado === EstadoSincronizacion.ERROR
    ).length;
    const enProceso = entregasSync.filter(
      (e) =>
        e.estado === EstadoSincronizacion.DATOS_ENVIADOS ||
        e.estado === EstadoSincronizacion.IMAGENES_PENDIENTES ||
        e.estado === EstadoSincronizacion.ENVIANDO
    ).length;

    return (
      <Card variant="elevated" padding="medium" style={styles.estadisticasCard}>
        <Typography variant="subtitle1" style={{ marginBottom: spacing[3] }}>
          Resumen de Sincronización
        </Typography>
        <View style={styles.estadisticasContainer}>
          <View style={styles.estadisticaItem}>
            <View style={[styles.estadisticaCircle, { backgroundColor: colors.success[50] }]}>
              <Ionicons name="checkmark-circle" size={32} color={colors.success[500]} />
            </View>
            <Typography variant="h4" style={{ color: colors.success[500] }}>
              {completados}
            </Typography>
            <Typography variant="caption" color="secondary" align="center">
              Completados
            </Typography>
          </View>

          <View style={styles.estadisticaItem}>
            <View style={[styles.estadisticaCircle, { backgroundColor: colors.warning[50] }]}>
              <Ionicons name="cloud-upload" size={32} color={colors.warning[600]} />
            </View>
            <Typography variant="h4" style={{ color: colors.warning[600] }}>
              {enProceso}
            </Typography>
            <Typography variant="caption" color="secondary" align="center">
              En Proceso
            </Typography>
          </View>

          <View style={styles.estadisticaItem}>
            <View style={[styles.estadisticaCircle, { backgroundColor: colors.error[50] }]}>
              <Ionicons name="time" size={32} color={colors.error[500]} />
            </View>
            <Typography variant="h4" style={{ color: colors.error[500] }}>
              {pendientes}
            </Typography>
            <Typography variant="caption" color="secondary" align="center">
              Pendientes
            </Typography>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Typography variant="h5">Pendientes de Envío</Typography>
        <TouchableOpacity onPress={handleSincronizar} disabled={sincronizando}>
          <Ionicons
            name="sync-outline"
            size={24}
            color={sincronizando ? colors.neutral[300] : colors.primary[600]}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={entregasSync}
        renderItem={renderEntrega}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={cargarDatos} />}
        ListHeaderComponent={entregasSync.length > 0 ? renderEstadisticas() : null}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.neutral[300]} />
            <Typography variant="h6" color="secondary" align="center" style={styles.emptyText}>
              No hay entregas pendientes
            </Typography>
            <Typography variant="body2" color="secondary" align="center">
              Todas las entregas están sincronizadas
            </Typography>
          </View>
        }
      />

      {entregasSync.length > 0 && (
        <View style={styles.footer}>
          <Button
            variant="gradient"
            size="large"
            fullWidth
            onPress={handleSincronizar}
            loading={sincronizando}
            disabled={sincronizando}
            leftIcon={<Ionicons name="cloud-upload-outline" size={20} color={colors.white} />}
          >
            Sincronizar Todo
          </Button>
        </View>
      )}
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
  estadisticasCard: {
    marginBottom: spacing[4],
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing[2],
  },
  estadisticaItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[2],
  },
  estadisticaCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entregaCard: {
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  estadoBarra: {
    height: 4,
  },
  cardContent: {
    padding: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  headerInfo: {
    flex: 1,
  },
  estadoIndicador: {
    marginLeft: spacing[2],
  },
  cardBody: {
    gap: spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[2],
    backgroundColor: colors.error[50],
    borderRadius: borderRadius.sm,
  },
  imagenesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  articulosInfo: {
    paddingVertical: spacing[1],
  },
  metadataRow: {
    flexDirection: 'row',
    gap: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  footer: {
    padding: spacing[4],
    backgroundColor: colors.white,
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
