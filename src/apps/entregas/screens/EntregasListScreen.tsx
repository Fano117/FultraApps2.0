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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Typography, Badge, colors, spacing, borderRadius } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { fetchEmbarques, loadLocalData } from '../store/entregasSlice';
import { ClienteEntregaDTO, EntregaDTO, EstadoEntrega } from '../models';
import { EntregasStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'EntregasList'>;

const EntregasListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { clientes, entregasSync, loading, error } = useAppSelector((state) => state.entregas);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await dispatch(loadLocalData());
    await dispatch(fetchEmbarques());
  };

  const toggleClient = (clienteKey: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clienteKey)) {
      newExpanded.delete(clienteKey);
    } else {
      newExpanded.add(clienteKey);
    }
    setExpandedClients(newExpanded);
  };

  // Filtrar entregas que ya están en sincronización
  const getClientesFiltrados = (): ClienteEntregaDTO[] => {
    // Crear un Set de folios que ya están en sincronización
    const foliosEnSync = new Set(
      entregasSync.map(e => `${e.ordenVenta}-${e.folio}`)
    );

    // Filtrar clientes y sus entregas
    return clientes
      .map(cliente => ({
        ...cliente,
        entregas: cliente.entregas.filter(entrega => {
          const key = `${entrega.ordenVenta}-${entrega.folio}`;
          return !foliosEnSync.has(key);
        })
      }))
      .filter(cliente => cliente.entregas.length > 0); // Solo mostrar clientes con entregas pendientes
  };

  const handleEntregaPress = (cliente: ClienteEntregaDTO, entrega: EntregaDTO) => {
    const clienteCarga = `${cliente.carga}-${cliente.cuentaCliente}`;
    navigation.navigate('EntregaDetail', { clienteCarga, entrega });
  };

  const handleTrackingPress = (cliente: ClienteEntregaDTO, entrega: EntregaDTO) => {
    // Verificar que tenemos las coordenadas necesarias
    if (!cliente.latitud || !cliente.longitud) {
      Alert.alert(
        'Sin Coordenadas',
        'Esta entrega no tiene coordenadas de destino. No se puede iniciar el tracking.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('EntregaTracking', {
      entregaId: entrega.id || 0,
      folio: entrega.folio,
      puntoEntrega: {
        latitud: parseFloat(cliente.latitud),
        longitud: parseFloat(cliente.longitud),
      },
      nombreCliente: cliente.cliente,
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case EstadoEntrega.PENDIENTE:
      case EstadoEntrega.PENDIENTE_ENVIO:
        return 'warning';
      case EstadoEntrega.ENTREGADO_COMPLETO:
        return 'success';
      case EstadoEntrega.ENTREGADO_PARCIAL:
        return 'info';
      case EstadoEntrega.NO_ENTREGADO:
        return 'error';
      default:
        return 'neutral';
    }
  };

  const renderEntrega = (entrega: EntregaDTO, cliente: ClienteEntregaDTO) => {
    const totalArticulos = entrega.articulos.length;
    const totalCantidad = entrega.articulos.reduce(
      (sum, art) => sum + art.cantidadProgramada,
      0
    );

    return (
      <Card variant="outline" padding="medium" style={styles.entregaCard}>
        <TouchableOpacity
          onPress={() => handleEntregaPress(cliente, entrega)}
          activeOpacity={0.7}
          style={styles.entregaMainContent}
        >
          <View style={styles.entregaHeader}>
            <View style={styles.entregaInfo}>
              <Typography variant="subtitle1">{entrega.folio}</Typography>
              <Typography variant="caption" color="secondary">
                OV: {entrega.ordenVenta}
              </Typography>
            </View>
            <Badge variant={getEstadoColor(entrega.estado) as any} size="small">
              {entrega.estado}
            </Badge>
          </View>

          <View style={styles.entregaDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="cube-outline" size={16} color={colors.text.secondary} />
              <Typography variant="body2" color="secondary">
                {totalArticulos} artículo{totalArticulos !== 1 ? 's' : ''}
              </Typography>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="albums-outline" size={16} color={colors.text.secondary} />
              <Typography variant="body2" color="secondary">
                Cantidad: {totalCantidad}
              </Typography>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="swap-horizontal-outline" size={16} color={colors.text.secondary} />
              <Typography variant="body2" color="secondary">
                {entrega.tipoEntrega}
              </Typography>
            </View>
          </View>

          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary[600]} />
          </View>
        </TouchableOpacity>

        {/* Botón de Tracking */}
        <TouchableOpacity
          style={styles.trackingButton}
          onPress={() => handleTrackingPress(cliente, entrega)}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate" size={20} color={colors.white} />
          <Typography variant="body2" style={styles.trackingButtonText}>
            Ver Tracking
          </Typography>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderCliente = ({ item }: { item: ClienteEntregaDTO }) => {
    const clienteKey = `${item.carga}-${item.cuentaCliente}`;
    const isExpanded = expandedClients.has(clienteKey);
    const totalEntregas = item.entregas.length;

    return (
      <View style={styles.clienteContainer}>
        <TouchableOpacity onPress={() => toggleClient(clienteKey)} activeOpacity={0.8}>
          <Card variant="elevated" padding="medium" style={styles.clienteCard}>
            <View style={styles.clienteHeader}>
              <View style={styles.clienteInfo}>
                <Typography variant="h6">{item.cliente}</Typography>
                <Typography variant="caption" color="secondary">
                  Cuenta: {item.cuentaCliente} | Carga: {item.carga}
                </Typography>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
                  <Typography variant="caption" color="secondary" style={styles.direccion}>
                    {item.direccionEntrega}
                  </Typography>
                </View>
              </View>
              <View style={styles.clienteActions}>
                <Badge variant="info" size="medium">
                  {totalEntregas}
                </Badge>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={colors.primary[600]}
                />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.entregasContainer}>
            {item.entregas.map((entrega, entregaIndex) => (
              <React.Fragment key={`${entrega.ordenVenta}-${entrega.folio}-${entregaIndex}`}>
                {renderEntrega(entrega, item)}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    );
  };

  const clientesFiltrados = getClientesFiltrados();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlatList
        data={clientesFiltrados}
        renderItem={renderCliente}
        keyExtractor={(item, index) => `${item.carga}-${item.cuentaCliente}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.neutral[300]} />
            <Typography variant="h6" color="secondary" align="center" style={styles.emptyText}>
              No hay entregas pendientes
            </Typography>
            <Typography variant="body2" color="secondary" align="center">
              Desliza hacia abajo para actualizar
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
  listContent: {
    padding: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[10],
  },
  clienteContainer: {
    marginBottom: spacing[4],
  },
  clienteCard: {
    marginBottom: spacing[2],
  },
  clienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clienteInfo: {
    flex: 1,
    gap: spacing[1],
  },
  clienteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  direccion: {
    flex: 1,
  },
  entregasContainer: {
    gap: spacing[2],
    paddingLeft: spacing[4],
  },
  entregaCard: {
    position: 'relative',
    overflow: 'visible',
  },
  entregaMainContent: {
    width: '100%',
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
    marginBottom: spacing[12],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  chevronContainer: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[16],
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.primary[600],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    marginTop: spacing[3],
  },
  trackingButtonText: {
    color: colors.white,
    fontWeight: '600',
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

export default EntregasListScreen;
