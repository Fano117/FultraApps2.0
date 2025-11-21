/**
 * Pantalla de Entregas agrupadas por Ruta
 * Muestra las rutas disponibles con sus clientes y entregas
 */

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
import { loadLocalData } from '../store/entregasSlice';
import { ClienteEntregaDTO, EntregaDTO, EstadoEntrega } from '../models';
import { EntregasStackParamList } from '@/navigation/types';
import { DireccionValidada } from '../types/api-delivery';

type NavigationProp = NativeStackNavigationProp<EntregasStackParamList>;

/**
 * Representa una ruta con sus clientes agrupados
 */
interface RutaAgrupada {
  carga: string;
  clientes: ClienteEntregaDTO[];
  totalEntregas: number;
  totalClientes: number;
}

const EntregasRutasScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { clientes, entregasSync, loading } = useAppSelector((state) => state.entregas);
  const [expandedRutas, setExpandedRutas] = useState<Set<string>>(new Set());
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await dispatch(loadLocalData());
  };

  /**
   * Agrupa los clientes por ruta (carga)
   */
  const getRutasAgrupadas = (): RutaAgrupada[] => {
    // Filtrar entregas que ya están en sincronización
    const foliosEnSync = new Set(
      entregasSync.map(e => `${e.ordenVenta}-${e.folio}`)
    );

    // Filtrar clientes y sus entregas
    const clientesFiltrados = clientes
      .map(cliente => ({
        ...cliente,
        entregas: cliente.entregas.filter(entrega => {
          const key = `${entrega.ordenVenta}-${entrega.folio}`;
          return !foliosEnSync.has(key);
        })
      }))
      .filter(cliente => cliente.entregas.length > 0);

    // Agrupar por carga (ruta)
    const rutasMap = new Map<string, ClienteEntregaDTO[]>();

    clientesFiltrados.forEach(cliente => {
      const carga = cliente.carga || 'SIN_RUTA';
      if (!rutasMap.has(carga)) {
        rutasMap.set(carga, []);
      }
      rutasMap.get(carga)!.push(cliente);
    });

    // Convertir a array de rutas
    return Array.from(rutasMap.entries()).map(([carga, clientesRuta]) => ({
      carga,
      clientes: clientesRuta,
      totalClientes: clientesRuta.length,
      totalEntregas: clientesRuta.reduce((acc, c) => acc + c.entregas.length, 0),
    }));
  };

  const toggleRuta = (carga: string) => {
    const newExpanded = new Set(expandedRutas);
    if (newExpanded.has(carga)) {
      newExpanded.delete(carga);
    } else {
      newExpanded.add(carga);
    }
    setExpandedRutas(newExpanded);
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

  /**
   * Navegar a ruta multi-parada con todos los clientes de la ruta
   */
  const handleVerRutaCompleta = (ruta: RutaAgrupada) => {
    // Convertir clientes a DireccionValidada[]
    const direcciones: DireccionValidada[] = ruta.clientes.map(cliente => ({
      original: {
        direccion: cliente.direccionEntrega,
        cliente: cliente.cliente,
        latitud: cliente.latitud,
        longitud: cliente.longitud,
      },
      coordenadas: {
        latitud: parseFloat(cliente.latitud),
        longitud: parseFloat(cliente.longitud),
        fuente: 'api' as const,
      },
      esValida: true,
    }));

    navigation.navigate('RutaMultiParada', {
      folioEmbarque: ruta.carga,
      idRutaHereMaps: null,
      direcciones,
      paradaActualIndex: 0,
    });
  };

  const handleEntregaPress = (cliente: ClienteEntregaDTO, entrega: EntregaDTO) => {
    const clienteCarga = `${cliente.carga}-${cliente.cuentaCliente}`;
    navigation.navigate('EntregaDetail', { clienteCarga, entrega });
  };

  const handleTrackingPress = (cliente: ClienteEntregaDTO, entrega: EntregaDTO) => {
    if (!cliente.latitud || !cliente.longitud) {
      Alert.alert(
        'Sin Coordenadas',
        'Esta entrega no tiene coordenadas de destino.',
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

    return (
      <Card variant="outline" padding="small" style={styles.entregaCard}>
        <TouchableOpacity
          onPress={() => handleEntregaPress(cliente, entrega)}
          activeOpacity={0.7}
          style={styles.entregaContent}
        >
          <View style={styles.entregaInfo}>
            <Typography variant="body2">{entrega.folio}</Typography>
            <Typography variant="caption" color="secondary">
              {totalArticulos} artículo{totalArticulos !== 1 ? 's' : ''}
            </Typography>
          </View>
          <Badge variant={getEstadoColor(entrega.estado) as any} size="small">
            {entrega.estado}
          </Badge>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.trackingButtonSmall}
          onPress={() => handleTrackingPress(cliente, entrega)}
        >
          <Ionicons name="navigate" size={16} color={colors.white} />
        </TouchableOpacity>
      </Card>
    );
  };

  const renderCliente = (cliente: ClienteEntregaDTO) => {
    const clienteKey = `${cliente.carga}-${cliente.cuentaCliente}`;
    const isExpanded = expandedClients.has(clienteKey);

    return (
      <View style={styles.clienteContainer} key={clienteKey}>
        <TouchableOpacity onPress={() => toggleClient(clienteKey)} activeOpacity={0.8}>
          <Card variant="filled" padding="small" style={styles.clienteCard}>
            <View style={styles.clienteHeader}>
              <View style={styles.clienteInfo}>
                <Typography variant="subtitle2">{cliente.cliente}</Typography>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={12} color={colors.text.secondary} />
                  <Typography variant="caption" color="secondary" numberOfLines={1} style={styles.direccion}>
                    {cliente.direccionEntrega}
                  </Typography>
                </View>
              </View>
              <View style={styles.clienteActions}>
                <Badge variant="info" size="small">
                  {cliente.entregas.length}
                </Badge>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.primary[600]}
                />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.entregasContainer}>
            {cliente.entregas.map((entrega, idx) => (
              <React.Fragment key={`${entrega.folio}-${idx}`}>
                {renderEntrega(entrega, cliente)}
              </React.Fragment>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderRuta = ({ item }: { item: RutaAgrupada }) => {
    const isExpanded = expandedRutas.has(item.carga);

    return (
      <View style={styles.rutaContainer}>
        <TouchableOpacity onPress={() => toggleRuta(item.carga)} activeOpacity={0.8}>
          <Card variant="elevated" padding="medium" style={styles.rutaCard}>
            <View style={styles.rutaHeader}>
              <View style={styles.rutaIcon}>
                <Ionicons name="map" size={28} color={colors.primary[600]} />
              </View>
              <View style={styles.rutaInfo}>
                <Typography variant="h6">{item.carga}</Typography>
                <Typography variant="caption" color="secondary">
                  {item.totalClientes} cliente{item.totalClientes !== 1 ? 's' : ''} | {item.totalEntregas} entrega{item.totalEntregas !== 1 ? 's' : ''}
                </Typography>
              </View>
              <View style={styles.rutaActions}>
                <TouchableOpacity
                  style={styles.verRutaButton}
                  onPress={() => handleVerRutaCompleta(item)}
                >
                  <Ionicons name="navigate-circle" size={32} color={colors.success[600]} />
                </TouchableOpacity>
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
          <View style={styles.clientesContainer}>
            {item.clientes.map(cliente => renderCliente(cliente))}
          </View>
        )}
      </View>
    );
  };

  const rutasAgrupadas = getRutasAgrupadas();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Typography variant="h5" style={styles.headerTitle}>Entregas</Typography>
          <Typography variant="caption" color="secondary">
            {rutasAgrupadas.length} ruta{rutasAgrupadas.length !== 1 ? 's' : ''} disponible{rutasAgrupadas.length !== 1 ? 's' : ''}
          </Typography>
        </View>

        {/* Selector de vista */}
        <View style={styles.viewSelector}>
          <TouchableOpacity style={[styles.viewButton, styles.viewButtonActive]}>
            <Ionicons name="map" size={18} color={colors.white} />
            <Typography variant="body2" style={styles.viewButtonTextActive}>Rutas</Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('ClientesEntregas')}
          >
            <Ionicons name="people" size={18} color={colors.primary[600]} />
            <Typography variant="body2" style={styles.viewButtonText}>Clientes</Typography>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={rutasAgrupadas}
        renderItem={renderRuta}
        keyExtractor={(item) => item.carga}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color={colors.neutral[300]} />
            <Typography variant="h6" color="secondary" align="center" style={styles.emptyText}>
              No hay rutas disponibles
            </Typography>
            <Typography variant="body2" color="secondary" align="center">
              Carga datos de prueba desde Testing
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerTop: {
    marginBottom: spacing[3],
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
    padding: spacing[1],
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  viewButtonActive: {
    backgroundColor: colors.primary[600],
  },
  viewButtonText: {
    color: colors.primary[600],
  },
  viewButtonTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: spacing[4],
  },
  rutaContainer: {
    marginBottom: spacing[4],
  },
  rutaCard: {
    backgroundColor: colors.background.primary,
  },
  rutaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rutaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  rutaInfo: {
    flex: 1,
  },
  rutaActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  verRutaButton: {
    padding: spacing[1],
  },
  clientesContainer: {
    marginTop: spacing[2],
    marginLeft: spacing[4],
    borderLeftWidth: 2,
    borderLeftColor: colors.primary[200],
    paddingLeft: spacing[3],
  },
  clienteContainer: {
    marginBottom: spacing[2],
  },
  clienteCard: {
    backgroundColor: colors.neutral[50],
  },
  clienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clienteInfo: {
    flex: 1,
  },
  clienteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  direccion: {
    marginLeft: spacing[1],
    flex: 1,
  },
  entregasContainer: {
    marginTop: spacing[2],
    marginLeft: spacing[3],
  },
  entregaCard: {
    marginBottom: spacing[1],
    flexDirection: 'row',
    alignItems: 'center',
  },
  entregaContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entregaInfo: {
    flex: 1,
  },
  trackingButtonSmall: {
    backgroundColor: colors.primary[600],
    padding: spacing[2],
    borderRadius: borderRadius.full,
    marginLeft: spacing[2],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyText: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
});

export default EntregasRutasScreen;
