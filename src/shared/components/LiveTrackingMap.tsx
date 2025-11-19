/**
 * Componente de Mapa con Tracking en Tiempo Real
 *
 * Funcionalidades:
 * - Visualización de ubicación del chofer en tiempo real
 * - Marcador del punto de entrega
 * - Geocerca visual (círculo de 50m)
 * - Indicador de distancia
 * - Habilitación/deshabilitación del botón de completar
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import {
  gpsTrackingService,
  Coordenadas,
  UbicacionChofer,
  ResultadoProximidad,
} from '../services/gpsTrackingService';

interface LiveTrackingMapProps {
  puntoEntrega: Coordenadas;
  nombreEntrega: string;
  onCompletarEntrega?: () => void;
  simulacionActiva?: boolean;
  onToggleSimulacion?: () => void;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  puntoEntrega,
  nombreEntrega,
  onCompletarEntrega,
  simulacionActiva = false,
  onToggleSimulacion,
}) => {
  const mapRef = useRef<MapView>(null);
  const [ubicacionChofer, setUbicacionChofer] = useState<UbicacionChofer | null>(null);
  const [proximidad, setProximidad] = useState<ResultadoProximidad | null>(null);
  const [trackingActivo, setTrackingActivo] = useState(false);
  const [ruta, setRuta] = useState<Coordenadas[]>([]);

  useEffect(() => {
    inicializarTracking();

    return () => {
      gpsTrackingService.stopTracking();
      gpsTrackingService.removeUbicacionListener(handleUbicacionActualizada);
    };
  }, []);

  useEffect(() => {
    if (ubicacionChofer) {
      verificarProximidad();
      agregarPuntoARuta(ubicacionChofer);
    }
  }, [ubicacionChofer]);

  const inicializarTracking = async () => {
    const initialized = await gpsTrackingService.initialize();
    if (initialized) {
      gpsTrackingService.addUbicacionListener(handleUbicacionActualizada);
      setTrackingActivo(true);
    }
  };

  const handleUbicacionActualizada = (ubicacion: UbicacionChofer) => {
    setUbicacionChofer(ubicacion);
  };

  const verificarProximidad = async () => {
    if (!ubicacionChofer) return;

    const resultado = await gpsTrackingService.puedeCompletarEntrega(puntoEntrega);
    setProximidad(resultado);
  };

  const agregarPuntoARuta = (ubicacion: Coordenadas) => {
    setRuta((prevRuta) => [...prevRuta, ubicacion]);
  };

  const centrarMapa = () => {
    if (!mapRef.current || !ubicacionChofer) return;

    mapRef.current.fitToCoordinates(
      [
        { latitude: ubicacionChofer.latitud, longitude: ubicacionChofer.longitud },
        { latitude: puntoEntrega.latitud, longitude: puntoEntrega.longitud },
      ],
      {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true,
      }
    );
  };

  const handleCompletarEntrega = () => {
    if (!proximidad?.puedeCompletar) {
      Alert.alert(
        'Fuera de Rango',
        `Debes estar a menos de 50m del punto de entrega.\n\nDistancia actual: ${proximidad?.distancia.toFixed(0)}m`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Completar Entrega',
      '¿Deseas marcar esta entrega como completada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: () => {
            if (onCompletarEntrega) {
              onCompletarEntrega();
            }
          },
        },
      ]
    );
  };

  const iniciarTracking = async () => {
    await gpsTrackingService.startTracking();
    setTrackingActivo(true);
  };

  const detenerTracking = async () => {
    await gpsTrackingService.stopTracking();
    setTrackingActivo(false);
  };

  const regionInicial = {
    latitude: puntoEntrega.latitud,
    longitude: puntoEntrega.longitud,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const puedeCompletar = proximidad?.puedeCompletar || false;
  const distancia = proximidad?.distancia || 0;

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={regionInicial}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={false}
      >
        {/* Marcador del Punto de Entrega */}
        <Marker
          coordinate={{
            latitude: puntoEntrega.latitud,
            longitude: puntoEntrega.longitud,
          }}
          title={nombreEntrega}
          description="Punto de Entrega"
          pinColor="red"
        >
          <View style={styles.markerEntrega}>
            <Ionicons name="location" size={40} color="#EF4444" />
          </View>
        </Marker>

        {/* Geocerca (50m) */}
        <Circle
          center={{
            latitude: puntoEntrega.latitud,
            longitude: puntoEntrega.longitud,
          }}
          radius={50}
          strokeColor="rgba(59, 130, 246, 0.5)"
          fillColor="rgba(59, 130, 246, 0.1)"
          strokeWidth={2}
        />

        {/* Marcador del Chofer */}
        {ubicacionChofer && (
          <Marker
            coordinate={{
              latitude: ubicacionChofer.latitud,
              longitude: ubicacionChofer.longitud,
            }}
            title="Mi Ubicación"
            description={`Velocidad: ${ubicacionChofer.velocidad.toFixed(0)} km/h`}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerChofer}>
              <Ionicons name="car" size={30} color="#6B46C1" />
            </View>
          </Marker>
        )}

        {/* Ruta recorrida */}
        {ruta.length > 1 && (
          <Polyline
            coordinates={ruta.map((punto) => ({
              latitude: punto.latitud,
              longitude: punto.longitud,
            }))}
            strokeColor="#6B46C1"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* Panel de Información */}
      <View style={styles.infoPanel}>
        <View style={styles.infoRow}>
          <Ionicons
            name={puedeCompletar ? 'checkmark-circle' : 'alert-circle'}
            size={24}
            color={puedeCompletar ? '#22C55E' : '#EF4444'}
          />
          <View style={styles.infoTexto}>
            <Text style={styles.infoLabel}>Distancia al Punto</Text>
            <Text style={[styles.infoValor, puedeCompletar && styles.infoValorExito]}>
              {distancia.toFixed(0)}m
            </Text>
          </View>
        </View>

        {ubicacionChofer && (
          <View style={styles.infoRow}>
            <Ionicons name="speedometer" size={24} color="#6B46C1" />
            <View style={styles.infoTexto}>
              <Text style={styles.infoLabel}>Velocidad</Text>
              <Text style={styles.infoValor}>
                {ubicacionChofer.velocidad.toFixed(0)} km/h
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <Ionicons
            name={trackingActivo ? 'radio-button-on' : 'radio-button-off'}
            size={24}
            color={trackingActivo ? '#22C55E' : '#999'}
          />
          <View style={styles.infoTexto}>
            <Text style={styles.infoLabel}>Tracking GPS</Text>
            <Text style={styles.infoValor}>
              {trackingActivo ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
      </View>

      {/* Controles */}
      <View style={styles.controles}>
        <TouchableOpacity style={styles.botonControl} onPress={centrarMapa}>
          <Ionicons name="locate" size={24} color="#6B46C1" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonControl}
          onPress={trackingActivo ? detenerTracking : iniciarTracking}
        >
          <Ionicons
            name={trackingActivo ? 'pause' : 'play'}
            size={24}
            color="#6B46C1"
          />
        </TouchableOpacity>

        {onToggleSimulacion && (
          <TouchableOpacity style={styles.botonControl} onPress={onToggleSimulacion}>
            <Ionicons
              name={simulacionActiva ? 'stop' : 'navigate'}
              size={24}
              color={simulacionActiva ? '#EF4444' : '#6B46C1'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Botón de Completar Entrega */}
      <View style={styles.botonCompletarContainer}>
        <TouchableOpacity
          style={[
            styles.botonCompletar,
            !puedeCompletar && styles.botonCompletarDeshabilitado,
          ]}
          onPress={handleCompletarEntrega}
          disabled={!puedeCompletar}
        >
          <Ionicons
            name={puedeCompletar ? 'checkmark-circle' : 'lock-closed'}
            size={24}
            color="#fff"
          />
          <Text style={styles.botonCompletarTexto}>
            {puedeCompletar ? 'Completar Entrega' : `Acércate ${distancia.toFixed(0)}m más`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mensaje de Geocerca */}
      {!puedeCompletar && distancia < 100 && (
        <View style={styles.mensajeGeocerca}>
          <Text style={styles.mensajeGeocercaTexto}>
            🎯 Acércate {(50 - distancia > 0 ? 50 - distancia : 0).toFixed(0)}m más para completar
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerEntrega: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerChofer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoPanel: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTexto: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoValorExito: {
    color: '#22C55E',
  },
  controles: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    flexDirection: 'column',
    gap: 12,
  },
  botonControl: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  botonCompletarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  botonCompletar: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  botonCompletarDeshabilitado: {
    backgroundColor: '#999',
  },
  botonCompletarTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mensajeGeocerca: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  mensajeGeocercaTexto: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
});
