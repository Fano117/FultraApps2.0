/**
 * Pantalla de Administración de Datos de Prueba
 * Permite cargar, limpiar y simular datos realistas para testing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import { deliveryProcessingService, entregasStorageService } from '../apps/entregas/services';
import { loadLocalData } from '../apps/entregas/store/entregasSlice';
import { ClienteEntregaDTO, EntregaDTO, EstadoEntrega } from '../apps/entregas/models';
import { DireccionValidada } from '../apps/entregas/types/api-delivery';
import {
  TipoEscenarioSimulacion,
  descripcionesEscenarios
} from '../apps/entregas/mocks/mockData';
import { EntregasStackParamList } from '../navigation/types';
import { AppDispatch } from '../shared/store';

type NavigationProp = NativeStackNavigationProp<EntregasStackParamList>;

/**
 * Convierte DireccionValidada[] a ClienteEntregaDTO[]
 * Agrupa las direcciones por cliente y crea la estructura esperada por el sistema
 */
function convertirDireccionesAClientes(
  direcciones: DireccionValidada[],
  folioEmbarque: string
): ClienteEntregaDTO[] {
  // Agrupar por cliente
  const clientesMap = new Map<string, ClienteEntregaDTO>();

  direcciones.forEach((direccion, index) => {
    if (!direccion.esValida || !direccion.coordenadas) return;

    const clienteNombre = direccion.original.cliente;
    const clienteKey = clienteNombre.toUpperCase().replace(/\s+/g, '_');

    // Crear entrega para esta dirección
    const entrega: EntregaDTO = {
      id: index + 1,
      ordenVenta: `OV-${folioEmbarque}-${index + 1}`,
      folio: `${folioEmbarque}-${String(index + 1).padStart(3, '0')}`,
      tipoEntrega: 'ENTREGA',
      estado: EstadoEntrega.PENDIENTE,
      articulos: [
        {
          id: index + 1,
          nombreOrdenVenta: `OV-${folioEmbarque}-${index + 1}`,
          producto: `Producto ${index + 1}`,
          cantidadProgramada: 10,
          cantidadEntregada: 0,
          restante: 10,
          peso: 5.0,
          unidadMedida: 'KG',
          descripcion: `Artículo de prueba para ${clienteNombre}`,
        },
      ],
      cargaCuentaCliente: `CARGA-${clienteKey}`,
    };

    if (clientesMap.has(clienteKey)) {
      // Agregar entrega al cliente existente
      clientesMap.get(clienteKey)!.entregas.push(entrega);
    } else {
      // Crear nuevo cliente
      const nuevoCliente: ClienteEntregaDTO = {
        cliente: clienteNombre,
        cuentaCliente: `CTA-${clienteKey}`,
        carga: `CARGA-${folioEmbarque}`,
        direccionEntrega: direccion.original.direccion,
        latitud: String(direccion.coordenadas.latitud),
        longitud: String(direccion.coordenadas.longitud),
        entregas: [entrega],
      };
      clientesMap.set(clienteKey, nuevoCliente);
    }
  });

  return Array.from(clientesMap.values());
}

export default function TestDataAdminScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [simulatingGPS, setSimulatingGPS] = useState(false);

  // Estado para simulación de API JSON
  const [simulandoAPI, setSimulandoAPI] = useState(false);
  const [escenarioSeleccionado, setEscenarioSeleccionado] = useState<TipoEscenarioSimulacion>('con-coordenadas-y-ruta');
  const [resultadoSimulacion, setResultadoSimulacion] = useState<any>(null);

  // Configuración
  const [numClientes, setNumClientes] = useState(5);
  const [numEntregas, setNumEntregas] = useState(3);
  const [generarRuta, setGenerarRuta] = useState(true);
  const [simularEstados, setSimularEstados] = useState(true);
  const [ubicacionZacatecas, setUbicacionZacatecas] = useState(false);
  const [ubicacionMonterrey, setUbicacionMonterrey] = useState(false);

  /**
   * Cargar datos de prueba usando el escenario de simulación seleccionado
   * Utiliza el nuevo formato JSON de la API
   */
  const handleLoadData = async () => {
    const escenarioInfo = descripcionesEscenarios[escenarioSeleccionado];

    Alert.alert(
      'Cargar Datos de Prueba',
      `Se cargarán los datos del escenario:\n\n"${escenarioInfo}"\n\n¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cargar',
          onPress: async () => {
            setLoading(true);
            setResultadoSimulacion(null);

            try {
              console.log('='.repeat(80));
              console.log(`📥 Cargando datos: ${escenarioSeleccionado}`);
              console.log(`📝 Descripción: ${escenarioInfo}`);
              console.log('='.repeat(80));

              const resultado = await deliveryProcessingService.procesarEscenarioSimulacion(
                escenarioSeleccionado,
                {
                  confirmarRecalculo: false,
                  radioGeocerca: 100,
                }
              );

              // Convertir direcciones validadas a formato ClienteEntregaDTO
              const clientesDTO = convertirDireccionesAClientes(
                resultado.entregas.direcciones,
                resultado.entregas.folioEmbarque
              );

              console.log(`📦 Convertidos ${clientesDTO.length} clientes para persistencia`);

              // Guardar en AsyncStorage para persistencia
              await entregasStorageService.saveClientesEntrega(clientesDTO);
              console.log('💾 Clientes guardados en AsyncStorage');

              // Actualizar Redux store para que otras pantallas vean los datos
              await dispatch(loadLocalData());
              console.log('🔄 Redux store actualizado');

              setResultadoSimulacion(resultado);
              setHasData(true);
              setDataInfo({
                results: {
                  clientesCreados: clientesDTO.length,
                  entregasCreadas: clientesDTO.reduce((acc, c) => acc + c.entregas.length, 0),
                  rutasGeneradas: 1,
                },
                timestamp: new Date().toISOString(),
              });

              if (resultado.exito) {
                Alert.alert(
                  '✅ Datos Cargados',
                  `Folio: ${resultado.entregas.folioEmbarque}\n` +
                  `Clientes: ${clientesDTO.length}\n` +
                  `Entregas: ${clientesDTO.reduce((acc, c) => acc + c.entregas.length, 0)}\n` +
                  `Distancia: ${(resultado.ruta.metadata.distanciaTotal / 1000).toFixed(2)} km\n` +
                  `Duración: ${Math.round(resultado.ruta.metadata.duracionEstimada / 60)} min\n\n` +
                  `Los datos se guardaron y estarán disponibles en "Entregas Pendientes"`,
                  [
                    { text: 'Cerrar', style: 'cancel' },
                    {
                      text: 'Ver en Mapa',
                      onPress: () => {
                        navigation.navigate('RutaMultiParada', {
                          folioEmbarque: resultado.entregas.folioEmbarque,
                          idRutaHereMaps: resultado.entregas.idRutaHereMaps,
                          direcciones: resultado.entregas.direcciones,
                          paradaActualIndex: 0,
                        });
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  '⚠️ Datos Cargados con Advertencias',
                  resultado.mensaje,
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              console.error('❌ Error cargando datos:', error);
              Alert.alert('Error', error.message || 'Error desconocido');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Limpiar datos de prueba cargados localmente
   */
  const handleClearData = () => {
    Alert.alert(
      '⚠️ Limpiar Datos',
      'Esto eliminará los datos de prueba cargados.\n\n¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Limpiar AsyncStorage
              await entregasStorageService.clearAllData();
              console.log('🗑️ AsyncStorage limpiado');

              // Actualizar Redux store
              await dispatch(loadLocalData());
              console.log('🔄 Redux store actualizado');

              setResultadoSimulacion(null);
              setHasData(false);
              setDataInfo(null);
              Alert.alert('✅ Datos Eliminados', 'Los datos de prueba han sido eliminados de todas las pantallas');
            } catch (error: any) {
              console.error('❌ Error limpiando datos:', error);
              Alert.alert('Error', 'No se pudieron eliminar los datos');
            }
          },
        },
      ]
    );
  };

  const handleSimulateGPS = async () => {
    if (!dataInfo?.results?.rutasGeneradas) {
      Alert.alert('Sin Rutas', 'No hay rutas GPS cargadas. Carga datos con la opción "Generar Rutas GPS" activada.');
      return;
    }

    setSimulatingGPS(true);
    Alert.alert(
      '🚗 Simulación GPS',
      'Se simularán puntos GPS en tiempo real.\nEsto puede tardar varios minutos.',
      [{ text: 'OK' }]
    );

    // TODO: Implementar simulación con los datos reales
    setTimeout(() => {
      setSimulatingGPS(false);
      Alert.alert('✅ Completado', 'Simulación GPS finalizada');
    }, 5000);
  };

  /**
   * Ejecutar simulación de procesamiento de entregas con el nuevo formato JSON
   */
  const handleSimularAPIJSON = async () => {
    setSimulandoAPI(true);
    setResultadoSimulacion(null);

    try {
      console.log('='.repeat(80));
      console.log(`🧪 Iniciando simulación: ${escenarioSeleccionado}`);
      console.log(`📝 Descripción: ${descripcionesEscenarios[escenarioSeleccionado]}`);
      console.log('='.repeat(80));

      const resultado = await deliveryProcessingService.procesarEscenarioSimulacion(
        escenarioSeleccionado,
        {
          confirmarRecalculo: false, // No mostrar diálogos en simulación
          radioGeocerca: 100,
        }
      );

      setResultadoSimulacion(resultado);

      if (resultado.exito) {
        Alert.alert(
          '✅ Simulación Exitosa',
          `Folio: ${resultado.entregas.folioEmbarque}\n` +
          `ID Ruta: ${resultado.ruta.idRutaHereMaps}\n` +
          `Direcciones válidas: ${resultado.entregas.direccionesValidas}/${resultado.entregas.direcciones.length}\n` +
          `Distancia: ${(resultado.ruta.metadata.distanciaTotal / 1000).toFixed(2)} km\n` +
          `Duración: ${Math.round(resultado.ruta.metadata.duracionEstimada / 60)} min`,
          [
            { text: 'Cerrar', style: 'cancel' },
            {
              text: 'Ver en Mapa',
              onPress: () => {
                // Navegar a la pantalla de ruta multi-parada
                navigation.navigate('RutaMultiParada', {
                  folioEmbarque: resultado.entregas.folioEmbarque,
                  idRutaHereMaps: resultado.entregas.idRutaHereMaps,
                  direcciones: resultado.entregas.direcciones,
                  paradaActualIndex: 0,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          '⚠️ Simulación con Advertencias',
          resultado.mensaje,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error en simulación:', error);
      Alert.alert(
        '❌ Error en Simulación',
        error.message || 'Error desconocido durante la simulación',
        [{ text: 'OK' }]
      );
    } finally {
      setSimulandoAPI(false);
    }
  };

  // Lista de escenarios disponibles
  const escenariosDisponibles: TipoEscenarioSimulacion[] = [
    'con-coordenadas-y-ruta',
    'sin-coordenadas',
    'mixto',
    'ruta-existente-fuera-almacen',
    'coordenadas-invalidas',
    'multiples-paradas',
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Datos de Prueba</Text>
        <Text style={styles.subtitle}>Administración y Simulación</Text>
      </View>

      {/* Estado Actual */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado Actual</Text>
        {hasData ? (
          <View>
            <InfoRow label="Clientes" value={String(dataInfo?.results?.clientesCreados || 0)} />
            <InfoRow label="Entregas" value={String(dataInfo?.results?.entregasCreadas || 0)} />
            <InfoRow label="Rutas GPS" value={String(dataInfo?.results?.rutasGeneradas || 0)} />
            <InfoRow
              label="Fecha Carga"
              value={dataInfo?.timestamp ? new Date(dataInfo.timestamp).toLocaleString() : 'N/A'}
            />
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>✅ Datos Cargados</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay datos de prueba cargados</Text>
          </View>
        )}
      </View>

      {/* Configuración */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configuración de Datos</Text>

        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Número de Clientes</Text>
          <View style={styles.numberSelector}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => setNumClientes(Math.max(1, numClientes - 1))}
              disabled={loading}
            >
              <Text style={styles.numberButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.numberValue}>{numClientes}</Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => setNumClientes(Math.min(20, numClientes + 1))}
              disabled={loading}
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Entregas por Cliente</Text>
          <View style={styles.numberSelector}>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => setNumEntregas(Math.max(1, numEntregas - 1))}
              disabled={loading}
            >
              <Text style={styles.numberButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.numberValue}>{numEntregas}</Text>
            <TouchableOpacity
              style={styles.numberButton}
              onPress={() => setNumEntregas(Math.min(10, numEntregas + 1))}
              disabled={loading}
            >
              <Text style={styles.numberButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.configLabel}>Generar Rutas GPS</Text>
          <Switch
            value={generarRuta}
            onValueChange={setGenerarRuta}
            disabled={loading}
            trackColor={{ false: '#ccc', true: '#6B46C1' }}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.configLabel}>Simular Estados</Text>
          <Switch
            value={simularEstados}
            onValueChange={setSimularEstados}
            disabled={loading}
            trackColor={{ false: '#ccc', true: '#6B46C1' }}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.configLabel}>📍 Ubicar en Zacatecas</Text>
          <Switch
            value={ubicacionZacatecas}
            onValueChange={(value) => {
              setUbicacionZacatecas(value);
              if (value) {
                setNumClientes(5);
                setNumEntregas(1);
                setGenerarRuta(true);
                setUbicacionMonterrey(false);
              }
            }}
            disabled={loading}
            trackColor={{ false: '#ccc', true: '#10B981' }}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.configLabel}>📍 Ubicar en Monterrey</Text>
          <Switch
            value={ubicacionMonterrey}
            onValueChange={(value) => {
              setUbicacionMonterrey(value);
              if (value) {
                setNumClientes(5);
                setNumEntregas(1);
                setGenerarRuta(true);
                setUbicacionZacatecas(false);
              }
            }}
            disabled={loading}
            trackColor={{ false: '#ccc', true: '#3B82F6' }}
          />
        </View>

        {ubicacionZacatecas && (
          <View style={styles.zacatecasInfo}>
            <Text style={styles.zacatecasInfoTitle}>🏛️ Ubicaciones de Zacatecas</Text>
            <Text style={styles.zacatecasInfoText}>
              Se generarán entregas en lugares emblemáticos:{'\n'}
              • Plaza de Armas (Catedral){'\n'}
              • Cerro de la Bufa{'\n'}
              • Mercado González Ortega{'\n'}
              • Campus Universitario{'\n'}
              • Boulevard López Portillo
            </Text>
          </View>
        )}
        {ubicacionMonterrey && (
          <View style={styles.zacatecasInfo}>
            <Text style={[styles.zacatecasInfoTitle, { color: '#3B82F6' }]}>🌆 Ubicaciones de Monterrey</Text>
            <Text style={styles.zacatecasInfoText}>
              Se generarán entregas en lugares emblemáticos:{'\n'}
              • Macroplaza{'\n'}
              • Parque Fundidora{'\n'}
              • Cerro de la Silla{'\n'}
              • Estadio BBVA{'\n'}
              • Paseo Santa Lucía
            </Text>
          </View>
        )}

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total: {numClientes * numEntregas} entregas
          </Text>
          <Text style={styles.summaryLocation}>
            📍 {
              ubicacionZacatecas
                ? 'Zacatecas, Zacatecas'
                : ubicacionMonterrey
                  ? 'Monterrey, Nuevo León'
                  : 'Guadalajara, Jalisco'
            }
          </Text>
        </View>
      </View>

      {/* Acciones Principales */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Acciones</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
          onPress={handleLoadData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>📥</Text>
              <Text style={styles.buttonText}>Cargar Datos</Text>
            </>
          )}
        </TouchableOpacity>

        {hasData && (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSecondary,
                (loading || simulatingGPS) && styles.buttonDisabled,
              ]}
              onPress={handleSimulateGPS}
              disabled={loading || simulatingGPS}
            >
              {simulatingGPS ? (
                <ActivityIndicator color="#6B46C1" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonIcon}>🚗</Text>
                  <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                    Simular GPS
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonDanger, loading && styles.buttonDisabled]}
              onPress={handleClearData}
              disabled={loading}
            >
              <Text style={styles.buttonIcon}>🗑️</Text>
              <Text style={[styles.buttonText, styles.buttonTextDanger]}>Limpiar Datos</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Simulación API JSON */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧪 Simulación API JSON</Text>
        <Text style={styles.infoText}>
          Probar el procesamiento de entregas con el nuevo formato JSON de la API.
          Selecciona un escenario y ejecuta la simulación.
        </Text>

        <View style={styles.escenarioContainer}>
          <Text style={styles.configLabel}>Escenario de Prueba:</Text>
          <View style={styles.escenarioList}>
            {escenariosDisponibles.map((escenario) => (
              <TouchableOpacity
                key={escenario}
                style={[
                  styles.escenarioItem,
                  escenarioSeleccionado === escenario && styles.escenarioItemSelected,
                ]}
                onPress={() => setEscenarioSeleccionado(escenario)}
                disabled={simulandoAPI}
              >
                <Text
                  style={[
                    styles.escenarioText,
                    escenarioSeleccionado === escenario && styles.escenarioTextSelected,
                  ]}
                >
                  {descripcionesEscenarios[escenario]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSimulacion,
            simulandoAPI && styles.buttonDisabled,
          ]}
          onPress={handleSimularAPIJSON}
          disabled={simulandoAPI}
        >
          {simulandoAPI ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>🚀</Text>
              <Text style={styles.buttonText}>Ejecutar Simulación</Text>
            </>
          )}
        </TouchableOpacity>

        {resultadoSimulacion && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.resultadoTitle}>
              {resultadoSimulacion.exito ? '✅ Último Resultado' : '⚠️ Último Resultado'}
            </Text>
            <Text style={styles.resultadoText}>
              Folio: {resultadoSimulacion.entregas.folioEmbarque}{'\n'}
              Ruta ID: {resultadoSimulacion.ruta.idRutaHereMaps}{'\n'}
              Válidas: {resultadoSimulacion.entregas.direccionesValidas}/{resultadoSimulacion.entregas.direcciones.length}{'\n'}
              Distancia: {(resultadoSimulacion.ruta.metadata.distanciaTotal / 1000).toFixed(2)} km
            </Text>
          </View>
        )}
      </View>

      {/* Información */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Guadalajara: Se generan clientes con direcciones en Jalisco{'\n'}
          • Zacatecas: Se generan clientes con direcciones en Zacatecas{'\n'}
          • Monterrey: Se generan clientes con direcciones en Nuevo León{'\n'}
          • Las entregas incluyen productos realistas{'\n'}
          • Las rutas GPS simulan movimiento real{'\n'}
          • Puedes limpiar los datos en cualquier momento
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6B46C1',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    marginTop: 12,
    backgroundColor: '#DCFCE7',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    color: '#166534',
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  numberSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  numberButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  numberValue: {
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summary: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
    textAlign: 'center',
  },
  summaryLocation: {
    fontSize: 12,
    color: '#10B981',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: '#6B46C1',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6B46C1',
  },
  buttonDanger: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextSecondary: {
    color: '#6B46C1',
  },
  buttonTextDanger: {
    color: '#EF4444',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  zacatecasInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  zacatecasInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  zacatecasInfoText: {
    fontSize: 12,
    color: '#059669',
    lineHeight: 16,
  },
  // Estilos para simulación API JSON
  escenarioContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  escenarioList: {
    marginTop: 8,
  },
  escenarioItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  escenarioItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6B46C1',
  },
  escenarioText: {
    fontSize: 13,
    color: '#666',
  },
  escenarioTextSelected: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  buttonSimulacion: {
    backgroundColor: '#10B981',
  },
  resultadoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  resultadoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  resultadoText: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 18,
  },
});
