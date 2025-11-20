import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Typography, Badge, Button, colors, spacing, borderRadius } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { fetchEmbarques, loadLocalData } from '../store/entregasSlice';
import { ClienteEntregaDTO } from '../models';
import { EntregasStackParamList } from '@/navigation/types';
import { HereNotificationsMockService } from '@/shared/services/hereNotificationsMockService';
import { syncService } from '../services/syncService';

type NavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'ClientesEntregas'>;

type FiltroEstado = 'Pendientes' | 'Pend. Envío' | 'Entregadas' | 'Enviadas' | 'No Entregadas' | 'Todos';

const ClientesEntregasScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { clientes, loading, entregasSync } = useAppSelector((state) => state.entregas);
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstado>('Pendientes');
  const [location, setLocation] = useState<{ latitud: number; longitud: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    getLocation();
    loadData();
  }, []);

  // Recarga automática cuando cambian los datos en el store
  useEffect(() => {
    // Si los datos cambian, actualiza la pantalla
    // Esto fuerza el re-render si el store cambia
  }, [clientes, entregasSync]);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permiso de ubicación denegado');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitud: loc.coords.latitude, longitud: loc.coords.longitude });
    } catch (error) {
      setLocationError('Error obteniendo ubicación');
    }
  };

  const loadData = async () => {
    try {
      console.log('[CLIENTES SCREEN] 📱 Cargando datos con nuevos endpoints...');
      await dispatch(loadLocalData());
      await dispatch(fetchEmbarques());
      // Notificación: fin de entrega (mock, se dispara al refrescar datos)
      if (clientes.length > 0) {
        for (const cliente of clientes) {
          await HereNotificationsMockService.simulateEntregaEvent('fin', cliente.cliente);
        }
      }
    } catch (error) {
      console.error('[CLIENTES SCREEN] ❌ Error cargando datos:', error);
    loadData(false); // No mostrar alerta en carga inicial

    // Activar listener de conectividad para sincronización automática
    syncService.startConnectivityListener(() => {
      // Callback cuando se completa una sincronización automática
      dispatch(loadLocalData());
    });

    return () => {
      // Limpiar listener al salir del módulo
      syncService.stopConnectivityListener();
    };
  }, []);

  const loadData = async (showAlert: boolean = true) => {
    await dispatch(loadLocalData());

    try {
      const result = await dispatch(fetchEmbarques()).unwrap();

      if (showAlert) {
        const totalOrdenes = result.reduce((sum, c) => sum + c.entregas.length, 0);
        Alert.alert(
          'Lista Actualizada',
          `Se cargaron ${result.length} cliente(s) con ${totalOrdenes} orden(es) de venta.`
        );
      }
    } catch (error: any) {
      if (showAlert) {
        Alert.alert(
          'Error al Actualizar',
          error || 'No se pudo conectar con el servidor. Se muestran los datos locales.'
        );
      }
    }
  };

  const filtros: { label: FiltroEstado; count: number; color: string }[] = [
    {
      label: 'Pendientes',
      count: clientes.reduce((sum, c) =>
        sum + c.entregas.filter(e => e.estado === 'PENDIENTE').length, 0
      ),
      color: colors.warning[500]
    },
    { label: 'Pend. Envío', count: entregasSync.length, color: colors.error[500] },
    {
      label: 'Entregadas',
      count: clientes.reduce((sum, c) =>
        sum + c.entregas.filter(e =>
          e.estado === 'ENTREGADO_COMPLETO' || e.estado === 'ENTREGADO_PARCIAL'
        ).length, 0
      ),
      color: colors.success[500]
    },
    {
      label: 'Enviadas',
      count: clientes.reduce((sum, c) =>
        sum + c.entregas.filter(e => e.estado === 'ENVIADO').length, 0
      ),
      color: colors.neutral[400]
    },
    {
      label: 'No Entregadas',
      count: clientes.reduce((sum, c) =>
        sum + c.entregas.filter(e => e.estado === 'NO_ENTREGADO').length, 0
      ),
      color: colors.secondary[500]
    },
    { label: 'Todos', count: clientes.reduce((sum, c) => sum + c.entregas.length, 0), color: colors.primary[500] },
  ];

  const handleClientePress = async (cliente: ClienteEntregaDTO) => {
    await HereNotificationsMockService.simulateEntregaEvent('inicio', cliente.cliente);
    navigation.navigate('OrdenesVenta', { cliente });
  };

  const getClientesFiltrados = (): ClienteEntregaDTO[] => {
    if (filtroActivo === 'Todos') {
      return clientes;
    }

    return clientes
      .map(cliente => ({
        ...cliente,
        entregas: cliente.entregas.filter(entrega => {
          switch (filtroActivo) {
            case 'Pendientes':
              return entrega.estado === 'PENDIENTE';
            case 'Pend. Envío':
              return entrega.estado === 'PENDIENTE_ENVIO';
            case 'Entregadas':
              return entrega.estado === 'ENTREGADO_COMPLETO' || entrega.estado === 'ENTREGADO_PARCIAL';
            case 'Enviadas':
              return entrega.estado === 'ENVIADO';
            case 'No Entregadas':
              return entrega.estado === 'NO_ENTREGADO';
            default:
              return true;
          }
        })
      }))
      .filter(cliente => cliente.entregas.length > 0);
  };

  const renderEstadistica = (titulo: string, valor: number, color: string) => (
    <View style={styles.estadisticaCard}>
      <Typography variant="h3" style={{ color }}>
        {valor}
      </Typography>
      <Typography variant="caption" color="secondary">
        {titulo}
      </Typography>
    </View>
  );

  const renderFiltro = (filtro: { label: FiltroEstado; count: number; color: string }) => (
    <TouchableOpacity
      key={filtro.label}
      onPress={() => setFiltroActivo(filtro.label)}
      style={[
        styles.filtroButton,
        filtroActivo === filtro.label && {
          backgroundColor: filtro.color,
        },
      ]}
    >
      <Typography
        variant="body2"
        style={{
          color: filtroActivo === filtro.label ? colors.white : colors.text.secondary,
          fontWeight: filtroActivo === filtro.label ? '600' : '400',
        }}
      >
        {filtro.label}
      </Typography>
      <Typography
        variant="caption"
        style={{
          color: filtroActivo === filtro.label ? colors.white : colors.text.tertiary,
        }}
      >
        {filtro.count}
      </Typography>
    </TouchableOpacity>
  );

  const renderCliente = ({ item }: { item: ClienteEntregaDTO }) => {
    const totalEntregas = item.entregas.length;

    return (
      <TouchableOpacity onPress={() => handleClientePress(item)} activeOpacity={0.7}>
        <Card variant="elevated" padding="medium" style={styles.clienteCard}>
          <View style={styles.clienteHeader}>
            <View style={styles.clienteInfo}>
              <Typography variant="h6">{item.cliente}</Typography>
              <Typography variant="caption" color="secondary">
                {item.cuentaCliente} • {item.carga}
              </Typography>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.primary[600]} />
          </View>

          <View style={styles.direccionContainer}>
            <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
            <Typography variant="caption" color="secondary" style={styles.direccion}>
              {item.direccionEntrega}
            </Typography>
          </View>

          <View style={styles.tiposContainer}>
            <Badge variant="info" size="small">
              ENTREGA
            </Badge>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
  <View style={styles.container}>
      {locationError && (
        <View style={{ padding: 16 }}>
          <Typography variant="caption" color="secondary">
            {locationError}
          </Typography>
        </View>
      )}
      {location && (
        <View style={{ padding: 16 }}>
          <Typography variant="caption" color="secondary">
            Ubicación actual: {location.latitud.toFixed(5)}, {location.longitud.toFixed(5)}
          </Typography>
        </View>
      )}
      <View style={styles.header}>
        <Typography variant="h5">Clientes - Entregas</Typography>
      </View>

      <View style={styles.estadisticasContainer}>
        {renderEstadistica('Total OV', clientes.reduce((sum, c) => sum + c.entregas.length, 0), colors.primary[600])}
        {renderEstadistica('Pendientes', clientes.reduce((sum, c) => sum + c.entregas.filter(e => e.estado === 'PENDIENTE').length, 0), colors.warning[600])}
        {renderEstadistica('Entregados', clientes.reduce((sum, c) => sum + c.entregas.filter(e => e.estado === 'ENTREGADO_COMPLETO' || e.estado === 'ENTREGADO_PARCIAL').length, 0), colors.success[600])}
        {renderEstadistica('Pendientes Envío', entregasSync.length, colors.error[600])}
      </View>

      <View style={styles.filtrosSection}>
        <Typography variant="subtitle2" style={styles.filtroTitle}>
          Filtrar por estado:
        </Typography>
        <View style={styles.filtrosContainer}>
          {filtros.map(renderFiltro)}
        </View>
      </View>

      <FlatList
  data={clientes}
        data={getClientesFiltrados()}
        renderItem={renderCliente}
        keyExtractor={(item, index) => `${item.carga}-${item.cuentaCliente}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.neutral[300]} />
            <Typography variant="h6" color="secondary" align="center" style={styles.emptyText}>
              No hay clientes con entregas
            </Typography>
            <Typography variant="body2" color="secondary" align="center" style={styles.emptyDescription}>
              Usa la pantalla "Testing" para generar datos mock
            </Typography>
          </View>
        }
      />
    </View>
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
  estadisticasContainer: {
    flexDirection: 'row',
    padding: spacing[4],
    gap: spacing[3],
    backgroundColor: colors.white,
  },
  estadisticaCard: {
    flex: 1,
    alignItems: 'center',
  },
  filtrosSection: {
    padding: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    backgroundColor: colors.white,
    marginBottom: spacing[2],
  },
  filtroTitle: {
    marginBottom: spacing[2],
  },
  filtrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  filtroButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[100],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  listContent: {
    padding: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[10],
  },
  clienteCard: {
    marginBottom: spacing[4],
  },
  clienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  clienteInfo: {
    flex: 1,
  },
  direccionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  direccion: {
    flex: 1,
  },
  tiposContainer: {
    flexDirection: 'row',
    gap: spacing[2],
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
  emptyDescription: {
    marginBottom: spacing[2],
  },
});

export default ClientesEntregasScreen;
