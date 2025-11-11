import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Typography, Badge, colors, spacing, borderRadius } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { fetchEmbarques, loadLocalData } from '../store/entregasSlice';
import { ClienteEntregaDTO } from '../models';
import { EntregasStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'ClientesEntregas'>;

type FiltroEstado = 'Pendientes' | 'Pend. Envío' | 'Entregadas' | 'Enviadas' | 'No Entregadas' | 'Todos';

const ClientesEntregasScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { clientes, loading, entregasSync } = useAppSelector((state) => state.entregas);
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstado>('Pendientes');

  useEffect(() => {
    loadData();
  }, []);

  // Recargar datos cuando la pantalla recibe foco (después de mock testing)
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    await dispatch(loadLocalData());
    await dispatch(fetchEmbarques());
  };

  const filtros: { label: FiltroEstado; count: number; color: string }[] = [
    { label: 'Pendientes', count: clientes.reduce((sum, c) => sum + c.entregas.length, 0), color: colors.warning[500] },
    { label: 'Pend. Envío', count: entregasSync.length, color: colors.error[500] },
    { label: 'Entregadas', count: 0, color: colors.success[500] },
    { label: 'Enviadas', count: 0, color: colors.neutral[400] },
    { label: 'No Entregadas', count: 0, color: colors.secondary[500] },
    { label: 'Todos', count: clientes.reduce((sum, c) => sum + c.entregas.length, 0), color: colors.primary[500] },
  ];

  const handleClientePress = (cliente: ClienteEntregaDTO) => {
    navigation.navigate('OrdenesVenta', { 
      clienteId: cliente.cuentaCliente,
      clienteNombre: cliente.cliente
    });
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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Typography variant="h5">Clientes - Entregas</Typography>
          {__DEV__ && (
            <TouchableOpacity 
              onPress={() => navigation.navigate('MockTestingScreen')}
              style={styles.mockButton}
            >
              <Ionicons name="flask" size={24} color={colors.primary[600]} />
              <Typography variant="caption" color="primary">Mock</Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.estadisticasContainer}>
        {renderEstadistica('Total OV', clientes.reduce((sum, c) => sum + c.entregas.length, 0), colors.primary[600])}
        {renderEstadistica('Pendientes', clientes.reduce((sum, c) => sum + c.entregas.length, 0), colors.warning[600])}
        {renderEstadistica('Entregados', 0, colors.success[600])}
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
        renderItem={renderCliente}
        keyExtractor={(item) => `${item.carga}-${item.cuentaCliente}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color={colors.neutral[300]} />
            <Typography variant="h6" color="secondary" align="center" style={styles.emptyText}>
              No hay clientes con entregas
            </Typography>
            <Typography variant="body2" color="secondary" align="center">
              Desliza hacia abajo para actualizar
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
    padding: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mockButton: {
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
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
});

export default ClientesEntregasScreen;
