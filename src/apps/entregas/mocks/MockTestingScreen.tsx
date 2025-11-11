import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Dimensions, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '@/shared/hooks';
import { 
  Card, 
  Typography, 
  Button,
  colors, 
  spacing, 
  borderRadius 
} from '@/design-system';
import { mockLocationSimulator } from './mockLocationSimulator';
import { MockDeliveryApiService } from './mockApiServices';
import { mockConfig } from './mockConfig';
import { mockClientes, mockEntregas, mockDirecciones } from './mockData';
import { loadLocalData } from '../store/entregasSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Instance of mock API service
const mockApiService = new MockDeliveryApiService();

const MockTestingScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState('stopped');
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    checkSimulatorStatus();
  }, []);

  const checkSimulatorStatus = () => {
    // Check if simulator is running
    const isActive = mockLocationSimulator['isSimulating'] || false;
    setSimulatorStatus(isActive ? 'running' : 'stopped');
  };

  const handleLoadMockData = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Iniciando carga de datos mock...');
      
      // Claves correctas que usa el storage service
      const CLIENTES_KEY = '@FultraApps:clientesEntrega';
      const ENTREGAS_SYNC_KEY = '@FultraApps:entregasSync';
      
      // Limpiar datos existentes
      await AsyncStorage.multiRemove([
        CLIENTES_KEY,
        ENTREGAS_SYNC_KEY
      ]);

      // Crear estructura de datos correcta según el modelo ClienteEntregaDTO
      const clientesMock = mockClientes.map((cliente, index) => ({
        cliente: cliente.nombre,
        cuentaCliente: cliente.id,
        carga: `CARGA-${index + 1}`,
        direccionEntrega: mockDirecciones[index] ? 
          `${mockDirecciones[index].calle}, ${mockDirecciones[index].ciudad}` : 
          'Dirección no disponible',
        latitud: mockDirecciones[index]?.coordenadas.latitud.toString() || '19.4326',
        longitud: mockDirecciones[index]?.coordenadas.longitud.toString() || '-99.1915',
        entregas: mockEntregas
          .filter((_, entregaIndex) => entregaIndex % mockClientes.length === index)
          .map(entrega => ({
            ...entrega,
            cargaCuentaCliente: `CARGA-${index + 1}-${cliente.id}`
          }))
      }));

      // Guardar datos con las claves correctas
      await AsyncStorage.setItem(CLIENTES_KEY, JSON.stringify(clientesMock));
      
      console.log('✅ Datos mock guardados:', {
        clientesKey: CLIENTES_KEY,
        clientesCount: clientesMock.length,
        entregasTotal: clientesMock.reduce((sum, c) => sum + c.entregas.length, 0)
      });

      Alert.alert(
        'Éxito',
        `Datos mock cargados correctamente:\n• ${clientesMock.length} clientes\n• ${clientesMock.reduce((sum, c) => sum + c.entregas.length, 0)} entregas`,
        [
          {
            text: 'Ver Entregas',
            onPress: async () => {
              // Forzar recarga de datos desde el store
              await dispatch(loadLocalData());
              navigation.goBack();
              // Navegar a entregas
              setTimeout(() => {
                (navigation.navigate as any)('ClientesEntregas');
              }, 100);
            }
          },
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos mock');
      console.error('❌ Error loading mock data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLocationSimulator = () => {
    try {
      mockLocationSimulator.addListener((location) => {
        setCurrentLocation(location);
        console.log('📍 Ubicación simulada:', location);
      });
      mockLocationSimulator.startSimulation();
      setSimulatorStatus('running');
      Alert.alert('Simulador iniciado', 'El simulador de ubicación está funcionando');
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el simulador de ubicación');
    }
  };

  const handleStopLocationSimulator = () => {
    mockLocationSimulator.stopSimulation();
    setSimulatorStatus('stopped');
    setCurrentLocation(null);
    Alert.alert('Simulador detenido', 'El simulador de ubicación se ha detenido');
  };

  const handleTestApiConnection = async () => {
    setIsLoading(true);
    try {
      // Simple test to get entregas
      const response = await mockApiService.getEntregas({ page: 1, pageSize: 1 });
      Alert.alert('Conexión exitosa', `API mock respondió con ${response.totalCount} entregas`);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con la API mock');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar todos los datos locales?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Claves correctas del storage service
              await AsyncStorage.multiRemove([
                '@FultraApps:clientesEntrega',
                '@FultraApps:entregasSync',
                '@FultraApps:imagenes'
              ]);
              // Forzar recarga
              await dispatch(loadLocalData());
              Alert.alert('Datos eliminados', 'Todos los datos locales han sido eliminados');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar los datos');
            }
          }
        }
      ]
    );
  };

  const mockSections = [
    {
      title: 'Datos de Prueba',
      items: [
        {
          title: 'Cargar Entregas Mock',
          description: 'Carga datos de prueba (3 clientes con entregas)',
          action: handleLoadMockData,
          disabled: false,
          color: colors.primary[600]
        },
        {
          title: 'Limpiar Datos',
          description: 'Elimina todos los datos almacenados localmente',
          action: handleClearAllData,
          disabled: false,
          color: colors.error[600]
        }
      ]
    },
    {
      title: 'Simulador de Ubicación',
      items: [
        {
          title: simulatorStatus === 'running' ? 'Detener Simulador' : 'Iniciar Simulador',
          description: simulatorStatus === 'running' ? 
            `Ubicación actual: ${currentLocation?.latitude?.toFixed(4)}, ${currentLocation?.longitude?.toFixed(4)}` :
            'Simula movimiento GPS para pruebas de geolocalización',
          action: simulatorStatus === 'running' ? handleStopLocationSimulator : handleStartLocationSimulator,
          disabled: false,
          color: simulatorStatus === 'running' ? colors.warning[600] : colors.success[600]
        }
      ]
    },
    {
      title: 'Conectividad',
      items: [
        {
          title: 'Probar Conexión API',
          description: 'Verifica la conectividad con los servicios backend',
          action: handleTestApiConnection,
          disabled: false,
          color: colors.info[600]
        }
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Button
          variant="ghost"
          size="small"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          ← Regresar
        </Button>
        <Typography variant="h4" style={styles.title}>
          🧪 Simulador de Pruebas
        </Typography>
        <Typography variant="body2" color="secondary" style={styles.subtitle}>
          Herramientas para desarrollo y testing
        </Typography>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Sección 1: Datos de Prueba */}
        <View style={styles.section}>
          <Typography variant="h6" style={styles.sectionTitle}>
            📊 Datos de Prueba
          </Typography>
          
          {/* Cargar Datos Mock */}
          <Card style={styles.actionCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Typography variant="subtitle1" style={styles.cardTitle}>
                  Cargar Entregas Mock
                </Typography>
                <Typography variant="body2" color="secondary">
                  Carga datos de prueba: clientes, entregas y productos
                </Typography>
              </View>
              <Button
                variant="primary"
                size="medium"
                onPress={handleLoadMockData}
                disabled={isLoading}
                style={styles.actionButton}
              >
                {isLoading ? 'Cargando...' : 'Cargar Datos'}
              </Button>
            </View>
          </Card>

          {/* Limpiar Datos */}
          <Card style={styles.actionCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Typography variant="subtitle1" style={styles.cardTitle}>
                  Limpiar Datos
                </Typography>
                <Typography variant="body2" color="secondary">
                  Elimina todos los datos almacenados localmente
                </Typography>
              </View>
              <Button
                variant="secondary"
                size="medium"
                onPress={handleClearAllData}
                disabled={isLoading}
                style={styles.actionButton}
              >
                Limpiar
              </Button>
            </View>
          </Card>
        </View>

        {/* Sección 2: Simulador GPS */}
        <View style={styles.section}>
          <Typography variant="h6" style={styles.sectionTitle}>
            📍 Simulador de Ubicación GPS
          </Typography>
          
          <Card style={styles.actionCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Typography variant="subtitle1" style={styles.cardTitle}>
                  {simulatorStatus === 'running' ? 'Detener Simulador' : 'Iniciar Simulador'}
                </Typography>
                <Typography variant="body2" color="secondary">
                  {simulatorStatus === 'running' ? 
                    `📍 Lat: ${currentLocation?.latitude?.toFixed(4) || 'N/A'}, Lng: ${currentLocation?.longitude?.toFixed(4) || 'N/A'}` :
                    'Simula movimiento GPS por rutas en CDMX'
                  }
                </Typography>
              </View>
              <Button
                variant="primary"
                size="medium"
                onPress={simulatorStatus === 'running' ? handleStopLocationSimulator : handleStartLocationSimulator}
                style={styles.actionButton}
              >
                {simulatorStatus === 'running' ? '⏹ Detener' : '▶ Iniciar'}
              </Button>
            </View>
          </Card>
        </View>

        {/* Sección 3: API Mock */}
        <View style={styles.section}>
          <Typography variant="h6" style={styles.sectionTitle}>
            🔌 Conectividad API
          </Typography>
          
          <Card style={styles.actionCard}>
            <View style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Typography variant="subtitle1" style={styles.cardTitle}>
                  Probar API Mock
                </Typography>
                <Typography variant="body2" color="secondary">
                  Verifica respuestas de servicios simulados
                </Typography>
              </View>
              <Button
                variant="secondary"
                size="medium"
                onPress={handleTestApiConnection}
                disabled={isLoading}
                style={styles.actionButton}
              >
                {isLoading ? 'Probando...' : 'Probar API'}
              </Button>
            </View>
          </Card>
        </View>

        {/* Información del entorno */}
        <Card style={styles.environmentCard}>
          <Typography variant="subtitle1" style={styles.environmentTitle}>
            Información del Entorno
          </Typography>
          <View style={styles.environmentInfo}>
            <Typography variant="caption" color="secondary">
              Platform: {Platform.OS} {Platform.Version}
            </Typography>
            <Typography variant="caption" color="secondary">
              Mode: {__DEV__ ? 'Development' : 'Production'}
            </Typography>
            <Typography variant="caption" color="secondary">
              Screen: {width.toFixed(0)}px width
            </Typography>
            <Typography variant="caption" color="secondary">
              Mock Config: {mockConfig.isMockEnabled() ? 'Enabled' : 'Disabled'}
            </Typography>
          </View>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing[6],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing[4],
  },
  title: {
    marginBottom: spacing[2],
  },
  subtitle: {
    marginBottom: spacing[4],
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[4],
    paddingLeft: spacing[2],
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionCard: {
    marginBottom: spacing[4],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  cardTitle: {
    marginBottom: spacing[2],
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionButton: {
    minWidth: 100,
    paddingHorizontal: spacing[4],
  },
  environmentCard: {
    backgroundColor: colors.background.secondary,
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  environmentTitle: {
    marginBottom: spacing[3],
    fontWeight: '600',
  },
  environmentInfo: {
    gap: spacing[1],
  },
  bottomSpacing: {
    height: spacing[8],
  },
});

export default MockTestingScreen;