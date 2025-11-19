import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Typography, Badge, Button, colors, spacing, borderRadius } from '@/design-system';
import { useAppSelector, useAppDispatch } from '@/shared/hooks';
import { fetchEmbarques, fetchEmbarquesWithTestData, loadLocalData, crearDatosPrueba } from '../store/entregasSlice';
import { ClienteEntregaDTO } from '../models';
import { testDataService } from '@/shared/services/testDataService';
import { EntregasStackParamList } from '@/navigation/types';
import { mobileApiService } from '../services';

type NavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'ClientesEntregas'>;

type FiltroEstado = 'Pendientes' | 'Pend. Envío' | 'Entregadas' | 'Enviadas' | 'No Entregadas' | 'Todos';

const ClientesEntregasScreen: React.FC = () => {
  // Eliminar todas las entregas de prueba usando el servicio
  const eliminarEntregasPrueba = async () => {
    try {
      await testDataService.clearTestData();
      await loadData();
    } catch (error) {
      console.error('[CLIENTES SCREEN] ❌ Error eliminando entregas de prueba:', error);
    }
  };
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { clientes, loading, entregasSync } = useAppSelector((state) => state.entregas);
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstado>('Pendientes');
  // Filtrar solo entregas de prueba
  const clientesTestData = clientes ? clientes.filter(c => c.carga?.includes('TEST') || c.cuentaCliente?.includes('TEST')) : [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[CLIENTES SCREEN] 📱 Cargando datos con nuevos endpoints...');
      await dispatch(loadLocalData());
      await dispatch(fetchEmbarques());
    } catch (error) {
      console.error('[CLIENTES SCREEN] ❌ Error cargando datos:', error);
    }
  };

  const loadTestData = async () => {
    try {
      console.log('[CLIENTES SCREEN] 🧪 Cargando datos de prueba...');
      await dispatch(loadLocalData());
      await dispatch(fetchEmbarquesWithTestData());
    } catch (error) {
      console.error('[CLIENTES SCREEN] ❌ Error cargando datos de prueba:', error);
    }
  };

  const crearNuevosDatosPrueba = async () => {
    try {
      console.log('[CLIENTES SCREEN] 🏗️ Creando nuevos datos de prueba...');
      await dispatch(crearDatosPrueba({
        cantidadClientes: 3,
        cantidadEntregas: 5,
        generarRutaGPS: true
      }));
      // Recargar datos después de crear
      await loadData();
    } catch (error) {
      console.error('[CLIENTES SCREEN] ❌ Error creando datos de prueba:', error);
    }
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
    navigation.navigate('OrdenesVenta', { cliente });
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
        <Typography variant="h5">Clientes - Entregas</Typography>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={loadTestData}
            style={[styles.debugButton, { marginRight: spacing[2] }]}
          >
            <Ionicons name="flask-outline" size={20} color={colors.secondary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('TestApiTransformation')}
            style={[styles.debugButton, { marginRight: spacing[2] }]}
          >
            <Ionicons name="code-working-outline" size={18} color={colors.info[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('DebugApi')}
            style={styles.debugButton}
          >
            <Ionicons name="bug-outline" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('SimulacionEntrega')}
            style={[styles.debugButton, { backgroundColor: colors.secondary[50] }]}
          >
            <Ionicons name="car-outline" size={20} color={colors.secondary[600]} />
          </TouchableOpacity>
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
  data={clientesTestData}
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
              El endpoint /Mobile/entregas devuelve array vacío
            </Typography>
            <Typography variant="caption" color="secondary" align="center" style={styles.emptyHint}>
              Cambios del backend:
              {'\n'}• EstatusEmbarqueId = 4 (En ruta)
              {'\n'}• EsTestData = false para datos de prueba
              {'\n'}• Procesamiento uniforme de embarques
              {'\n'}• Usuario: alfredo.gallegos
            </Typography>
            <Button
              variant="primary"
              size="small"
              onPress={() => navigation.navigate('DebugApi')}
              style={styles.debugTestButton}
              leftIcon={<Ionicons name="bug-outline" size={16} color={colors.white} />}
            >
              Probar API
            </Button>
            <Button
              variant="ghost"
              size="small"
              onPress={() => navigation.navigate('SimulacionEntrega')}
              style={styles.debugTestButton}
              leftIcon={<Ionicons name="car-outline" size={16} color={colors.secondary[600]} />}
            >
              🚚 Simulación de Entregas
            </Button>
            <Button
              variant="secondary"
              size="small"
              onPress={crearNuevosDatosPrueba}
              style={styles.debugTestButton}
              leftIcon={<Ionicons name="add-outline" size={16} color={colors.secondary[600]} />}
            >
              Crear Nuevos Datos
            </Button>
            <Button
              variant="ghost"
              size="small"
              onPress={loadTestData}
              style={styles.debugTestButton}
              leftIcon={<Ionicons name="flask-outline" size={16} color={colors.neutral[600]} />}
            >
              Cargar Datos Existentes
            </Button>
            <Button
              variant="secondary"
              size="small"
              onPress={eliminarEntregasPrueba}
              style={styles.debugTestButton}
              leftIcon={<Ionicons name="trash-outline" size={16} color={colors.error[600]} />}
            >
              Eliminar Entregas de Prueba
            </Button>
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
  debugButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyDescription: {
    marginBottom: spacing[2],
  },
  emptyHint: {
    marginBottom: spacing[4],
    lineHeight: 16,
  },
  debugTestButton: {
    marginTop: spacing[2],
  },
});

export default ClientesEntregasScreen;
