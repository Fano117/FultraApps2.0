import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Typography, Button, colors, spacing, borderRadius } from '@/design-system';
import { entregasApiService, mobileApiService } from '../services';
import { apiService } from '@/shared/services';
import { config } from '@/shared/config';

interface DebugResult {
  timestamp: string;
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'loading';
  data?: any;
  error?: string;
  duration?: number;
}

const DebugApiScreen: React.FC = () => {
  const [results, setResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (result: Omit<DebugResult, 'timestamp'>) => {
    setResults(prev => [
      {
        ...result,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9), // Mantener solo los últimos 10 resultados
    ]);
  };

  const testHealth = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await apiService.get('/health');
      const duration = Date.now() - startTime;
      
      addResult({
        endpoint: '/health',
        method: 'GET',
        status: 'success',
        data: response,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      addResult({
        endpoint: '/health',
        method: 'GET',
        status: 'error',
        error: error.message,
        duration,
      });
    } finally {
      setLoading(false);
    }
  };

  const testEmbarquesEntrega = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('[DEBUG API] 📱 Probando nuevo endpoint móvil...');
      const response = await mobileApiService.getEntregas();
      const duration = Date.now() - startTime;
      
      addResult({
        endpoint: '/Mobile/entregas (NUEVO)',
        method: 'GET',
        status: 'success',
        data: {
          totalClientes: response.length,
          clientes: response.map(c => ({
            cliente: c.cliente,
            cuentaCliente: c.cuentaCliente,
            carga: c.carga,
            totalEntregas: c.entregas.length,
            latitud: c.latitud,
            longitud: c.longitud,
          }))
        },
        duration,
      });
      
      if (response.length === 0) {
        Alert.alert(
          '⚠️ Array Vacío',
          'El nuevo endpoint móvil devuelve un array vacío.\n\n' +
          'Cambios del backend:\n' +
          '• EstatusEmbarqueId = 4 (En ruta)\n' +
          '• EsTestData = false\n' +
          '• Procesamiento uniforme de embarques\n\n' +
          'Ver logs en consola para más detalles.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.warn('[DEBUG API] ❌ Error con endpoint móvil, probando fallback...');
      try {
        const fallbackResponse = await entregasApiService.fetchEntregasMoviles();
        const fallbackDuration = Date.now() - startTime;
        
        addResult({
          endpoint: '/Mobile/entregas (FALLBACK)',
          method: 'GET',
          status: 'success',
          data: {
            totalClientes: fallbackResponse.length,
            fallback: true,
            originalError: error.message,
          },
          duration: fallbackDuration,
        });
      } catch (fallbackError: any) {
        addResult({
          endpoint: '/Mobile/entregas',
          method: 'GET',
          status: 'error',
          error: `Original: ${error.message} | Fallback: ${fallbackError.message}`,
          duration,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const testCrearDatosPrueba = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('[DEBUG API] 🧪 Creando datos de prueba...');
      const response = await mobileApiService.crearDatosPrueba({
        cantidadClientes: 3,
        cantidadEntregas: 5,
        generarRutaGPS: true
      });
      const duration = Date.now() - startTime;
      
      addResult({
        endpoint: '/TestData/crear-datos-completos',
        method: 'POST',
        status: 'success',
        data: response,
        duration,
      });

      Alert.alert(
        '✅ Datos Creados',
        'Datos de prueba creados exitosamente.\n\nAhora puedes probar el endpoint de entregas para ver los nuevos datos.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      addResult({
        endpoint: '/TestData/crear-datos-completos',
        method: 'POST',
        status: 'error',
        error: error.message,
        duration,
      });
    } finally {
      setLoading(false);
    }
  };

  const testRawEmbarquesEntrega = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('[DEBUG API] 🧪 Probando endpoint raw...');
      console.log('[DEBUG API] 📡 URL:', config.apiUrl + '/EmbarquesEntrega');
      console.log('[DEBUG API] 🔑 Headers:', {
        'X-API-Key': config.apiKey,
        'X-Dev-User': config.devCredentials?.username,
        'X-Dev-Mode': 'true',
      });
      
      const response = await apiService.get('/EmbarquesEntrega');
      const duration = Date.now() - startTime;
      
      console.log('[DEBUG API] ✅ Respuesta raw:', response);
      
      addResult({
        endpoint: '/EmbarquesEntrega (RAW)',
        method: 'GET',
        status: 'success',
        data: response,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      console.log('[DEBUG API] ❌ Error raw:', error);
      
      addResult({
        endpoint: '/EmbarquesEntrega (RAW)',
        method: 'GET',
        status: 'error',
        error: error.message,
        duration,
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const renderResult = (result: DebugResult, index: number) => {
    const isSuccess = result.status === 'success';
    const isError = result.status === 'error';
    
    return (
      <Card key={index} variant="elevated" padding="medium" style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <View style={styles.resultInfo}>
            <Typography variant="subtitle2">
              {result.method} {result.endpoint}
            </Typography>
            <Typography variant="caption" color="secondary">
              {result.timestamp} • {result.duration}ms
            </Typography>
          </View>
          <Ionicons
            name={isSuccess ? 'checkmark-circle' : isError ? 'close-circle' : 'time'}
            size={24}
            color={isSuccess ? colors.success[500] : isError ? colors.error[500] : colors.warning[500]}
          />
        </View>

        {isSuccess && result.data && (
          <View style={styles.dataContainer}>
            <Typography variant="body2" style={styles.dataText}>
              {JSON.stringify(result.data, null, 2)}
            </Typography>
          </View>
        )}

        {isError && result.error && (
          <View style={[styles.dataContainer, { backgroundColor: colors.error[50] }]}>
            <Typography variant="body2" style={{ color: colors.error[700] }}>
              ❌ {result.error}
            </Typography>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h5">🧪 API Debug</Typography>
        <Typography variant="caption" color="secondary">
          Probar endpoints del backend
        </Typography>
      </View>

      <View style={styles.configSection}>
        <Card variant="elevated" padding="medium">
          <Typography variant="subtitle1" style={styles.sectionTitle}>
            Configuración Actual
          </Typography>
          <View style={styles.configRow}>
            <Typography variant="caption" color="secondary">Base URL:</Typography>
            <Typography variant="body2" style={styles.configValue}>
              {config.apiUrl}
            </Typography>
          </View>
          <View style={styles.configRow}>
            <Typography variant="caption" color="secondary">Usuario Dev:</Typography>
            <Typography variant="body2" style={styles.configValue}>
              {config.devCredentials?.username || 'No configurado'}
            </Typography>
          </View>
          <View style={styles.configRow}>
            <Typography variant="caption" color="secondary">Auth Disabled:</Typography>
            <Typography variant="body2" style={styles.configValue}>
              {config.devCredentials?.authDisabled ? 'Sí' : 'No'}
            </Typography>
          </View>
        </Card>
      </View>

      <View style={styles.buttonsSection}>
        <Button
          variant="outline"
          fullWidth
          onPress={testHealth}
          loading={loading}
          leftIcon={<Ionicons name="pulse-outline" size={20} color={colors.primary[600]} />}
        >
          Test Health
        </Button>
        
        <Button
          variant="primary"
          fullWidth
          onPress={testEmbarquesEntrega}
          loading={loading}
          leftIcon={<Ionicons name="cube-outline" size={20} color={colors.white} />}
        >
          Test Mobile/entregas (NUEVO)
        </Button>
        
        <Button
          variant="secondary"
          fullWidth
          onPress={testCrearDatosPrueba}
          loading={loading}
          leftIcon={<Ionicons name="flask-outline" size={20} color={colors.secondary[600]} />}
        >
          Crear Datos de Prueba
        </Button>
        
        <Button
          variant="ghost"
          fullWidth
          onPress={testRawEmbarquesEntrega}
          loading={loading}
          leftIcon={<Ionicons name="code-outline" size={20} color={colors.neutral[600]} />}
        >
          Test RAW API Call
        </Button>

        {results.length > 0 && (
          <Button
            variant="ghost"
            fullWidth
            onPress={clearResults}
            leftIcon={<Ionicons name="trash-outline" size={20} color={colors.error[500]} />}
          >
            Limpiar Resultados
          </Button>
        )}
      </View>

      <ScrollView style={styles.resultsContainer}>
        {results.length === 0 ? (
          <Card variant="elevated" padding="large" style={styles.emptyCard}>
            <Ionicons name="flask-outline" size={48} color={colors.neutral[300]} />
            <Typography variant="body1" color="secondary" align="center" style={styles.emptyText}>
              No hay resultados de pruebas
            </Typography>
            <Typography variant="caption" color="secondary" align="center">
              Presiona un botón para probar un endpoint
            </Typography>
          </Card>
        ) : (
          results.map(renderResult)
        )}
      </ScrollView>
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
  configSection: {
    padding: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  configValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
  },
  buttonsSection: {
    padding: spacing[4],
    gap: spacing[3],
    backgroundColor: colors.white,
    marginBottom: spacing[2],
  },
  resultsContainer: {
    flex: 1,
    padding: spacing[4],
  },
  resultCard: {
    marginBottom: spacing[3],
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  resultInfo: {
    flex: 1,
  },
  dataContainer: {
    padding: spacing[3],
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.sm,
    marginTop: spacing[2],
  },
  dataText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.text.secondary,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: spacing[8],
  },
  emptyText: {
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
});

export default DebugApiScreen;