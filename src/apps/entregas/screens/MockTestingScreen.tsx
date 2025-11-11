import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { colors, spacing } from '@/design-system';
import { mockConfig } from '../mocks/mockConfig';
import { mockDeliveryApi, mockLocationApi, mockNotificationApi } from '../mocks/mockApiServices';
import { mockLocationSimulator } from '../mocks/mockLocationSimulator';
import { mockEntregas, mockDirecciones } from '../mocks/mockData';
import { geofenceService } from '../services';

export const MockTestingScreen: React.FC = () => {
  const [mockMode, setMockMode] = useState(false);
  const [mockLocation, setMockLocation] = useState(false);
  const [mockGeofence, setMockGeofence] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentDestination, setCurrentDestination] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    await mockConfig.initialize();
    setMockMode(mockConfig.isMockEnabled());
    setMockLocation(mockConfig.isMockLocationEnabled());
    setMockGeofence(mockConfig.isMockGeofenceEnabled());
  };

  const toggleMockMode = async (value: boolean) => {
    await mockConfig.setMockMode(value);
    setMockMode(value);
    Alert.alert(
      'Modo Mock',
      value
        ? 'APIs mock activadas. Los datos de prueba serán usados.'
        : 'APIs reales activadas. Se conectará al backend.'
    );
  };

  const toggleMockLocation = async (value: boolean) => {
    await mockConfig.setMockLocation(value);
    setMockLocation(value);
  };

  const toggleMockGeofence = async (value: boolean) => {
    await mockConfig.setMockGeofence(value);
    setMockGeofence(value);
  };

  const startLocationSimulation = () => {
    mockLocationSimulator.startSimulation(2000);
    setIsSimulating(true);
    Alert.alert('Simulación iniciada', 'El vehículo comenzará a moverse por la ruta programada');
  };

  const stopLocationSimulation = () => {
    mockLocationSimulator.stopSimulation();
    setIsSimulating(false);
    Alert.alert('Simulación detenida', 'El movimiento del vehículo se ha pausado');
  };

  const resetSimulation = () => {
    mockLocationSimulator.reset();
    setIsSimulating(false);
    setCurrentDestination(0);
    Alert.alert('Reset completo', 'Posición volvió al inicio y datos restaurados');
  };

  const jumpToDestination = (index: number) => {
    mockLocationSimulator.jumpToDestination(index);
    setCurrentDestination(index);
    Alert.alert('Salto de ubicación', `Posición actualizada a destino ${index + 1}`);
  };

  const testGeofencing = () => {
    const regions = mockDirecciones.map((dir, index) => ({
      identifier: `dest-${index}`,
      latitude: dir.coordenadas.latitud,
      longitude: dir.coordenadas.longitud,
      radius: 200,
    }));

    geofenceService.startMonitoring(regions, (region, event) => {
      Alert.alert(
        'Evento Geofence',
        `${event === 'ENTER' ? 'Entrada a' : 'Salida de'} ${region.identifier}`,
        [{ text: 'OK' }]
      );
    });

    Alert.alert('Geofencing activado', 'Se monitorearán 5 zonas de 200m de radio');
  };

  const viewStoredData = () => {
    const locations = mockLocationApi.getStoredLocations();
    const subscriptions = mockNotificationApi.getActiveSubscriptions();
    
    Alert.alert(
      'Datos Almacenados',
      `Ubicaciones guardadas: ${locations.length}\nSuscripciones: ${subscriptions.length}`,
      [
        { text: 'Limpiar ubicaciones', onPress: () => mockLocationApi.clearLocations() },
        { text: 'Cerrar' },
      ]
    );
  };

  const testNotification = async () => {
    try {
      const { notificationService } = await import('../services');
      await notificationService.notifyDeliveryApproaching('Restaurante El Buen Sabor', 150);
      Alert.alert('Notificación enviada', 'Revisa la bandeja de notificaciones');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la notificación');
    }
  };

  const resetMockData = () => {
    mockDeliveryApi.resetMockData();
    mockLocationApi.clearLocations();
    Alert.alert('Datos restaurados', 'Todas las entregas volvieron a su estado inicial');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>🧪 Panel de Pruebas Mock</Text>
          <Text style={styles.subtitle}>Controla las simulaciones y datos de prueba</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Configuración General</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Modo Mock APIs</Text>
              <Text style={styles.settingDescription}>
                Usar datos simulados en lugar del backend real
              </Text>
            </View>
            <Switch
              value={mockMode}
              onValueChange={toggleMockMode}
              trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
              thumbColor={mockMode ? colors.primary[500] : colors.neutral[400]}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Ubicación Simulada</Text>
              <Text style={styles.settingDescription}>
                Usar simulador de GPS en lugar de ubicación real
              </Text>
            </View>
            <Switch
              value={mockLocation}
              onValueChange={toggleMockLocation}
              trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
              thumbColor={mockLocation ? colors.primary[500] : colors.neutral[400]}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Geofencing Mock</Text>
              <Text style={styles.settingDescription}>
                Simular eventos de entrada/salida de zonas
              </Text>
            </View>
            <Switch
              value={mockGeofence}
              onValueChange={toggleMockGeofence}
              trackColor={{ false: colors.neutral[300], true: colors.primary[300] }}
              thumbColor={mockGeofence ? colors.primary[500] : colors.neutral[400]}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Simulador de Ubicación</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isSimulating && styles.buttonDisabled]}
              onPress={startLocationSimulation}
              disabled={isSimulating}
            >
              <Text style={styles.buttonText}>▶️ Iniciar Movimiento</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, !isSimulating && styles.buttonDisabled]}
              onPress={stopLocationSimulation}
              disabled={!isSimulating}
            >
              <Text style={styles.buttonText}>⏸️ Pausar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={resetSimulation}>
            <Text style={styles.buttonText}>🔄 Reset a Inicio</Text>
          </TouchableOpacity>

          <Text style={styles.subsectionTitle}>Saltar a Destino:</Text>
          <View style={styles.destinationGrid}>
            {mockDirecciones.map((dir, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.destinationButton,
                  currentDestination === index && styles.destinationButtonActive,
                ]}
                onPress={() => jumpToDestination(index)}
              >
                <Text style={styles.destinationButtonText}>{index + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Geofencing</Text>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={testGeofencing}>
            <Text style={styles.buttonText}>Activar Monitoreo (5 zonas)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notificaciones</Text>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={testNotification}>
            <Text style={styles.buttonText}>Probar Notificación</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Datos de Prueba</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>📦 Entregas disponibles: {mockEntregas.length}</Text>
            <Text style={styles.infoText}>📍 Destinos en ruta: {mockDirecciones.length}</Text>
            <Text style={styles.infoText}>
              ✅ Completadas: {mockEntregas.filter(e => e.estatus === 'COMPLETADA').length}
            </Text>
            <Text style={styles.infoText}>
              ⏳ Pendientes: {mockEntregas.filter(e => e.estatus === 'PENDIENTE').length}
            </Text>
          </View>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={viewStoredData}>
            <Text style={styles.buttonText}>Ver Datos Almacenados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={resetMockData}>
            <Text style={styles.buttonText}>🗑️ Restaurar Datos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Tip: Activa "Modo Mock APIs" para probar sin conexión al backend
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary[500],
    padding: spacing[6],
    paddingTop: spacing[8],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary[100],
  },
  section: {
    backgroundColor: 'white',
    marginTop: spacing[4],
    padding: spacing[4],
    marginHorizontal: spacing[4],
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: spacing[4],
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing[1],
  },
  settingDescription: {
    fontSize: 13,
    color: colors.neutral[600],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  button: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
  },
  secondaryButton: {
    backgroundColor: colors.neutral[600],
  },
  warningButton: {
    backgroundColor: colors.warning[500],
    marginBottom: spacing[3],
  },
  dangerButton: {
    backgroundColor: colors.error[500],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  destinationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  destinationButton: {
    width: 60,
    height: 60,
    backgroundColor: colors.neutral[200],
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationButtonActive: {
    backgroundColor: colors.success[500],
  },
  destinationButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  infoCard: {
    backgroundColor: colors.neutral[50],
    padding: spacing[4],
    borderRadius: 8,
    marginBottom: spacing[3],
  },
  infoText: {
    fontSize: 14,
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  footer: {
    padding: spacing[6],
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
