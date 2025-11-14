/**
 * Pantalla para probar las funciones del sistema de testing
 * Esta pantalla es temporal solo para verificación
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { testDataGenerator } from '../shared/services/testDataGenerator';
import { testDataService } from '../shared/services/testDataService';
import { TestDataConfig } from '../shared/models/testData.models';

export default function TestFunctionsScreen() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const log = `${emoji} ${message}`;
    console.log(log);
    setLogs(prev => [...prev, log]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // TEST 1: Generar datos sin backend
  const testGeneration = async () => {
    setLoading(true);
    clearLogs();
    addLog('🧪 TEST 1: Generando datos de prueba...');

    try {
      const config: TestDataConfig = {
        numClientes: 3,
        numEntregasPorCliente: 2,
        fechaInicio: new Date(),
        generarRutaGPS: true,
        simularEstados: true,
      };

      const startTime = Date.now();
      const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSet(config);
      const duration = Date.now() - startTime;

      addLog(`Generados: ${clientes.length} clientes`, 'success');
      addLog(`Generados: ${entregas.length} entregas`, 'success');
      addLog(`Generadas: ${rutas?.length || 0} rutas GPS`, 'success');
      addLog(`Tiempo: ${duration}ms`, 'info');

      if (clientes.length > 0) {
        addLog(`\nEjemplo cliente: ${clientes[0].nombre}`, 'info');
        addLog(`RFC: ${clientes[0].rfc}`, 'info');
        addLog(`Tel: ${clientes[0].telefono}`, 'info');
      }

      if (entregas.length > 0) {
        addLog(`\nEjemplo entrega: ${entregas[0].folio}`, 'info');
        addLog(`Estado: ${entregas[0].estado}`, 'info');
        addLog(`Productos: ${entregas[0].productos.length}`, 'info');
      }

      addLog('\n✅ TEST 1 COMPLETADO', 'success');
    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // TEST 2: Verificar datos en storage
  const testStorage = async () => {
    setLoading(true);
    clearLogs();
    addLog('🧪 TEST 2: Verificando storage...');

    try {
      const hasData = await testDataService.hasTestDataLoaded();
      addLog(`Tiene datos: ${hasData}`, hasData ? 'success' : 'info');

      if (hasData) {
        const info = await testDataService.getTestDataInfo();
        addLog(`Fecha: ${new Date(info.timestamp).toLocaleString()}`, 'info');
        addLog(`Clientes: ${info.results?.clientesCreados || 0}`, 'info');
        addLog(`Entregas: ${info.results?.entregasCreadas || 0}`, 'info');
      }

      addLog('\n✅ TEST 2 COMPLETADO', 'success');
    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // TEST 3: Generar múltiples configuraciones
  const testMultipleConfigs = async () => {
    setLoading(true);
    clearLogs();
    addLog('🧪 TEST 3: Probando múltiples configuraciones...');

    const configs = [
      { numClientes: 1, numEntregasPorCliente: 1, generarRutaGPS: false, simularEstados: false },
      { numClientes: 3, numEntregasPorCliente: 2, generarRutaGPS: true, simularEstados: true },
      { numClientes: 5, numEntregasPorCliente: 3, generarRutaGPS: true, simularEstados: true },
    ];

    try {
      let passed = 0;
      let failed = 0;

      for (let i = 0; i < configs.length; i++) {
        const config = { ...configs[i], fechaInicio: new Date() };
        addLog(`\nConfig ${i + 1}: ${config.numClientes}C × ${config.numEntregasPorCliente}E`, 'info');

        const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSet(config);

        const expectedC = config.numClientes;
        const expectedE = config.numClientes * config.numEntregasPorCliente;
        const expectedR = config.generarRutaGPS ? 1 : 0;

        const ok = clientes.length === expectedC &&
                    entregas.length === expectedE &&
                    (rutas?.length || 0) === expectedR;

        if (ok) {
          addLog(`  ✅ PASS - C:${clientes.length} E:${entregas.length} R:${rutas?.length || 0}`, 'success');
          passed++;
        } else {
          addLog(`  ❌ FAIL - Esperado C:${expectedC} E:${expectedE} R:${expectedR}`, 'error');
          addLog(`         Obtenido C:${clientes.length} E:${entregas.length} R:${rutas?.length || 0}`, 'error');
          failed++;
        }
      }

      addLog(`\n📊 Resultados: ${passed}/${configs.length} pasaron`, passed === configs.length ? 'success' : 'error');
      addLog(`✅ TEST 3 COMPLETADO`, 'success');
    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // TEST 4: Cargar al backend (requiere backend)
  const testBackendLoad = async () => {
    setLoading(true);
    clearLogs();
    addLog('🧪 TEST 4: Cargando al backend...');
    addLog('⚠️ Requiere backend funcionando', 'info');

    try {
      const config: TestDataConfig = {
        numClientes: 2,
        numEntregasPorCliente: 2,
        fechaInicio: new Date(),
        generarRutaGPS: true,
        simularEstados: true,
      };

      const result = await testDataService.loadTestData(config);

      if (result.success) {
        addLog('Clientes creados: ' + result.data.clientesCreados, 'success');
        addLog('Entregas creadas: ' + result.data.entregasCreadas, 'success');
        addLog('Rutas generadas: ' + result.data.rutasGeneradas, 'success');
        addLog('Tiempo: ' + result.data.tiempoEjecucion + 'ms', 'info');

        if (result.errores && result.errores.length > 0) {
          addLog('\n⚠️ Errores encontrados:', 'error');
          result.errores.forEach(error => addLog(`  - ${error}`, 'error'));
        }

        addLog('\n✅ TEST 4 COMPLETADO', 'success');
      } else {
        addLog('Falló: ' + result.message, 'error');
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error');
      addLog('Verifica que el backend esté corriendo', 'error');
    } finally {
      setLoading(false);
    }
  };

  // TEST 5: Limpiar datos (requiere backend)
  const testBackendClear = async () => {
    setLoading(true);
    clearLogs();
    addLog('🧪 TEST 5: Limpiando datos del backend...');
    addLog('⚠️ Requiere backend funcionando', 'info');

    try {
      const result = await testDataService.clearTestData();

      if (result.success) {
        addLog('Datos limpiados exitosamente', 'success');
        addLog('Tiempo: ' + result.data.tiempoEjecucion + 'ms', 'info');
        addLog('\n✅ TEST 5 COMPLETADO', 'success');
      } else {
        addLog('Falló: ' + result.message, 'error');
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`, 'error');
      addLog('Verifica que el backend esté corriendo', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Test de Funciones</Text>
        <Text style={styles.subtitle}>Verificación del Sistema de Testing</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Tests sin backend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests Sin Backend</Text>
          <Text style={styles.sectionSubtitle}>Funcionan sin conexión</Text>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={testGeneration}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test 1: Generar Datos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={testStorage}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test 2: Verificar Storage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={testMultipleConfigs}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test 3: Múltiples Configs</Text>
          </TouchableOpacity>
        </View>

        {/* Tests con backend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests Con Backend</Text>
          <Text style={styles.sectionSubtitle}>Requieren backend funcionando</Text>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={testBackendLoad}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Test 4: Cargar al Backend
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={testBackendClear}
            disabled={loading}
          >
            <Text style={[styles.buttonText, styles.buttonTextDanger]}>
              Test 5: Limpiar Backend
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logs */}
        <View style={styles.logsSection}>
          <View style={styles.logsHeader}>
            <Text style={styles.logsTitle}>📋 Logs</Text>
            <TouchableOpacity onPress={clearLogs}>
              <Text style={styles.clearButton}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B46C1" />
              <Text style={styles.loadingText}>Ejecutando test...</Text>
            </View>
          )}

          <View style={styles.logsContent}>
            {logs.length === 0 ? (
              <Text style={styles.emptyLogs}>No hay logs. Ejecuta un test.</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
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
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextSecondary: {
    color: '#6B46C1',
  },
  buttonTextDanger: {
    color: '#EF4444',
  },
  logsSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#6B46C1',
    fontSize: 14,
    fontWeight: '600',
  },
  logsContent: {
    padding: 16,
    minHeight: 200,
    maxHeight: 400,
  },
  emptyLogs: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 60,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
});
