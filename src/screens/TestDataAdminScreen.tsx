/**
 * Pantalla de Administración de Datos de Prueba
 * Permite cargar, limpiar y simular datos realistas para testing
 */

import React, { useState, useEffect } from 'react';
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
import { testDataService } from '../shared/services/testDataService';
import { TestDataConfig } from '../shared/models/testData.models';

export default function TestDataAdminScreen() {
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [dataInfo, setDataInfo] = useState<any>(null);
  const [simulatingGPS, setSimulatingGPS] = useState(false);

  // Configuración
  const [numClientes, setNumClientes] = useState(5);
  const [numEntregas, setNumEntregas] = useState(3);
  const [generarRuta, setGenerarRuta] = useState(true);
  const [simularEstados, setSimularEstados] = useState(true);
  const [ubicacionZacatecas, setUbicacionZacatecas] = useState(false);

  useEffect(() => {
    checkExistingData();
  }, []);

  const checkExistingData = async () => {
    const exists = await testDataService.hasTestDataLoaded();
    setHasData(exists);

    if (exists) {
      const info = await testDataService.getTestDataInfo();
      setDataInfo(info);
    }
  };

  const handleLoadData = async () => {
    const ubicacion = ubicacionZacatecas ? 'Zacatecas, Zac.' : 'Guadalajara, Jal.';
    
    Alert.alert(
      'Cargar Datos de Prueba',
      `Se generarán:\n• ${numClientes} clientes en ${ubicacion}\n• ${numClientes * numEntregas} entregas\n• ${generarRuta ? 'Rutas GPS' : 'Sin rutas'}\n\n¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cargar',
          onPress: async () => {
            setLoading(true);
            try {
              const config: TestDataConfig = {
                numClientes,
                numEntregasPorCliente: numEntregas,
                fechaInicio: new Date(),
                generarRutaGPS: generarRuta,
                simularEstados,
              };

              // Usar servicio específico según la ubicación seleccionada
              const result = ubicacionZacatecas 
                ? await testDataService.loadTestDataZacatecas(config)
                : await testDataService.loadTestData(config);

              if (result.success) {
                Alert.alert(
                  '✅ Datos Cargados',
                  `Ubicación: ${ubicacion}\nClientes: ${result.data.clientesCreados}\nEntregas: ${result.data.entregasCreadas}\nRutas: ${result.data.rutasGeneradas}\n\nTiempo: ${result.data.tiempoEjecucion}ms`,
                  [{ text: 'OK' }]
                );
                await checkExistingData();
              } else {
                Alert.alert(
                  '❌ Error',
                  result.message,
                  [{ text: 'OK' }]
                );
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      '⚠️ Limpiar Datos',
      'Esto eliminará TODOS los datos de prueba del backend.\n\n¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await testDataService.clearTestData();

              if (result.success) {
                Alert.alert('✅ Datos Eliminados', 'Todos los datos de prueba han sido eliminados');
                await checkExistingData();
              } else {
                Alert.alert('❌ Error', result.message);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
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
              // Si se activa Zacatecas, usar configuración optimizada
              if (value) {
                setNumClientes(5);
                setNumEntregas(1);
                setGenerarRuta(true);
              }
            }}
            disabled={loading}
            trackColor={{ false: '#ccc', true: '#10B981' }}
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

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Total: {numClientes * numEntregas} entregas
          </Text>
          <Text style={styles.summaryLocation}>
            📍 {ubicacionZacatecas ? 'Zacatecas, Zacatecas' : 'Guadalajara, Jalisco'}
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

      {/* Información */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Los datos se guardan en el backend y base de datos{'\n'}
          • Guadalajara: Se generan clientes con direcciones en Jalisco{'\n'}
          • Zacatecas: Se generan clientes con direcciones en Zacatecas{'\n'}
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
});
