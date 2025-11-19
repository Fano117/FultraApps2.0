/**
 * Pantalla de Tracking de Entrega en Tiempo Real
 *
 * Funcionalidades:
 * - Visualización de mapa con tracking en tiempo real
 * - Ruta optimizada con HERE Maps (líneas azules mejoradas)
 * - Opciones de navegación avanzadas (zoom, tipo de mapa, tráfico)
 * - Simulación de movimiento para testing
 * - Validación de geocerca (50m)
 * - Opciones de navegación externa
 * - Completar entrega solo cuando esté cerca
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { gpsTrackingService, Coordenadas } from '../shared/services/gpsTrackingService';
import { routingService, RutaOptima } from '../apps/entregas/services/routingService';

interface EntregaTrackingScreenProps {
  route: {
    params: {
      entregaId: number;
      folio: string;
      puntoEntrega: Coordenadas;
      nombreCliente: string;
    };
  };
  navigation: any;
}

interface UbicacionActual {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const EntregaTrackingScreen: React.FC<EntregaTrackingScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<any, any>>();
  
  const { entregaId, folio, puntoEntrega, nombreCliente } = route.params;

  // Estados principales
  const [ubicacionActual, setUbicacionActual] = useState<UbicacionActual | null>(null);
  const [rutaOptima, setRutaOptima] = useState<RutaOptima | null>(null);
  const [cargandoRuta, setCargandoRuta] = useState(false);
  const [completando, setCompletando] = useState(false);
  const [dentroGeofence, setDentroGeofence] = useState(false);
  const [distanciaDestino, setDistanciaDestino] = useState<number | null>(null);
  const [trackingActivo, setTrackingActivo] = useState(false);
  const [mostrarRutaCompleta, setMostrarRutaCompleta] = useState(true);

  // Estados adicionales para control del mapa
  const [tipoMapa, setTipoMapa] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [mostrarTrafico, setMostrarTrafico] = useState(true);
  const [panelNavegacionVisible, setPanelNavegacionVisible] = useState(false);
  const [nivelZoom, setNivelZoom] = useState(1); // Para ajustar grosor de líneas

  // Estados para sistema de debugging
  const [mostrarLogs, setMostrarLogs] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: 'info' | 'warning' | 'error'; message: string }>>([]);

  // Región del mapa
  const [mapRegion, setMapRegion] = useState({
    latitude: puntoEntrega.latitud,
    longitude: puntoEntrega.longitud,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Función para agregar logs de debugging
  const addLog = useCallback((level: 'info' | 'warning' | 'error', message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${level.toUpperCase()}] ${timestamp}: ${message}`);
    
    setLogs(prevLogs => [
      { timestamp, level, message },
      ...prevLogs.slice(0, 19) // Mantener solo los últimos 20 logs
    ]);
  }, []);

  // Función para limpiar logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog('info', 'Logs limpiados por usuario');
  }, [addLog]);

  // Log inicial al montar el componente
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs([{
      timestamp,
      level: 'info',
      message: `Pantalla de tracking iniciada - Entrega: ${folio}, Cliente: ${nombreCliente}, Destino: [${puntoEntrega.latitud.toFixed(6)}, ${puntoEntrega.longitud.toFixed(6)}]`
    }]);
    
    // Configurar el logger en el servicio de routing
    routingService.setLogger({ addLog });
    
    return () => {
      // Limpiar el logger al desmontar
      routingService.setLogger(null);
    };
  }, [folio, nombreCliente, puntoEntrega, addLog]);

  // Función para calcular distancia usando fórmula Haversine
  const calcularDistancia = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  // Funciones para control de mapa
  const hacerZoomIn = useCallback(() => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: Math.max(prev.latitudeDelta / 2, 0.001),
      longitudeDelta: Math.max(prev.longitudeDelta / 2, 0.001),
    }));
  }, []);

  const hacerZoomOut = useCallback(() => {
    setMapRegion(prev => ({
      ...prev,
      latitudeDelta: Math.min(prev.latitudeDelta * 2, 0.5),
      longitudeDelta: Math.min(prev.longitudeDelta * 2, 0.5),
    }));
  }, []);

  const centrarEnRuta = useCallback(() => {
    if (rutaOptima && rutaOptima.coordinates.length > 0) {
      addLog('info', `Centrando en ruta con ${rutaOptima.coordinates.length} coordenadas`);
      
      // Usar todas las coordenadas de la ruta para un encuadre más preciso
      const todasCoordenadas = [...rutaOptima.coordinates];
      
      if (ubicacionActual) {
        todasCoordenadas.push(ubicacionActual);
        addLog('info', 'Incluyendo ubicación actual en el encuadre');
      }
      
      const minLat = Math.min(...todasCoordenadas.map(c => c.latitude));
      const maxLat = Math.max(...todasCoordenadas.map(c => c.latitude));
      const minLng = Math.min(...todasCoordenadas.map(c => c.longitude));
      const maxLng = Math.max(...todasCoordenadas.map(c => c.longitude));
      
      // Calcular padding dinámico basado en la distancia
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const padding = Math.max(latDiff * 0.1, lngDiff * 0.1, 0.005); // Mínimo 0.005 para rutas cortas
      
      const nuevaRegion = {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDiff + padding, 0.01),
        longitudeDelta: Math.max(lngDiff + padding, 0.01),
      };
      
      addLog('info', `Nueva región del mapa: lat=${nuevaRegion.latitude.toFixed(6)}, lng=${nuevaRegion.longitude.toFixed(6)}, latΔ=${nuevaRegion.latitudeDelta.toFixed(6)}, lngΔ=${nuevaRegion.longitudeDelta.toFixed(6)}`);
      
      setMapRegion(nuevaRegion);
      
      // Calcular nivel de zoom para ajustar grosor de líneas
      const zoomLevel = 1 / Math.max(nuevaRegion.latitudeDelta, nuevaRegion.longitudeDelta);
      setNivelZoom(zoomLevel);
      
      addLog('info', `Nivel de zoom actualizado: ${zoomLevel.toFixed(2)}`);
    } else {
      addLog('warning', 'No se puede centrar en ruta: ruta no disponible o sin coordenadas');
    }
  }, [rutaOptima, ubicacionActual, addLog]);

  const cambiarTipoMapa = useCallback(() => {
    const tipos: Array<'standard' | 'satellite' | 'hybrid'> = ['standard', 'satellite', 'hybrid'];
    const indiceActual = tipos.indexOf(tipoMapa);
    const siguienteIndice = (indiceActual + 1) % tipos.length;
    const nuevoTipo = tipos[siguienteIndice];
    
    addLog('info', `Tipo de mapa cambiado de ${tipoMapa} a ${nuevoTipo}`);
    setTipoMapa(nuevoTipo);
  }, [tipoMapa, addLog]);

  // Función para calcular grosor de líneas basado en zoom
  const calcularGrosorLinea = useCallback((grosorBase: number) => {
    const factor = Math.min(Math.max(nivelZoom * 100, 0.5), 3); // Factor entre 0.5x y 3x
    const grosorCalculado = Math.max(grosorBase * factor, 2); // Mínimo 2px
    
    // Solo logear cuando el grosor cambie significativamente
    if (Math.abs(grosorCalculado - grosorBase) > 1) {
      addLog('info', `Grosor de línea ajustado: ${grosorBase}px -> ${grosorCalculado.toFixed(1)}px (zoom: ${nivelZoom.toFixed(2)})`);
    }
    
    return grosorCalculado;
  }, [nivelZoom, addLog]);

  const centrarEnUbicacionActual = useCallback(() => {
    if (ubicacionActual) {
      setMapRegion({
        latitude: ubicacionActual.latitude,
        longitude: ubicacionActual.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  }, [ubicacionActual]);

  // Función para generar ubicación cercana (para simulación)
  const generarUbicacionCercana = useCallback(() => {
    const offsetLat = (Math.random() - 0.5) * 0.002; // ~100m variación
    const offsetLng = (Math.random() - 0.5) * 0.002;
    return {
      latitude: puntoEntrega.latitud + offsetLat,
      longitude: puntoEntrega.longitud + offsetLng,
      accuracy: Math.random() * 10 + 5,
      timestamp: Date.now(),
    };
  }, [puntoEntrega]);

  // Calcular ruta optimizada
  const calcularRuta = useCallback(async () => {
    addLog('info', 'FUNCIÓN calcularRuta EJECUTADA');
    
    if (!ubicacionActual) {
      addLog('error', 'No hay ubicación actual para calcular ruta');
      return;
    }

    setCargandoRuta(true);
    addLog('info', `CALCULANDO RUTA - Origen: [${ubicacionActual.latitude.toFixed(6)}, ${ubicacionActual.longitude.toFixed(6)}] Destino: [${puntoEntrega.latitud.toFixed(6)}, ${puntoEntrega.longitud.toFixed(6)}]`);
    
    try {
      const ruta = await routingService.obtenerRutaOptima(
        { latitude: ubicacionActual.latitude, longitude: ubicacionActual.longitude },
        { latitude: puntoEntrega.latitud, longitude: puntoEntrega.longitud }
      );
      
      addLog('info', `RUTA CALCULADA EXITOSAMENTE - Distancia: ${(ruta.distance/1000).toFixed(2)}km, Duración: ${ruta.duration.toFixed(0)}min, Coordenadas: ${ruta.coordinates.length}`);
      addLog('info', `Primera coordenada: [${ruta.coordinates[0]?.latitude.toFixed(6)}, ${ruta.coordinates[0]?.longitude.toFixed(6)}]`);
      addLog('info', `Última coordenada: [${ruta.coordinates[ruta.coordinates.length-1]?.latitude.toFixed(6)}, ${ruta.coordinates[ruta.coordinates.length-1]?.longitude.toFixed(6)}]`);
      
      setRutaOptima(ruta);
      
      // Auto-centrar en la ruta después de calcularla
      setTimeout(() => {
        addLog('info', 'Auto-centrando mapa en la ruta calculada');
        centrarEnRuta();
      }, 500);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      addLog('error', `Error calculando ruta: ${errorMsg}`);
      Alert.alert('Error', 'No se pudo calcular la ruta. Verifique su conexión.');
    } finally {
      setCargandoRuta(false);
    }
  }, [ubicacionActual, puntoEntrega, centrarEnRuta, addLog]);

  // Función para abrir navegación externa
  const abrirNavegacionExterna = async () => {
    try {
      addLog('info', 'Abriendo navegación externa...');
      await routingService.abrirNavegacionExterna(
        { latitude: ubicacionActual?.latitude || 20.6597, longitude: ubicacionActual?.longitude || -103.3496 },
        { latitude: puntoEntrega.latitud, longitude: puntoEntrega.longitud }
      );
      addLog('info', 'Navegación externa abierta exitosamente');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      addLog('error', `Error abriendo navegación: ${errorMsg}`);
      Alert.alert('Error', 'No se pudo abrir la aplicación de navegación');
    }
  };

  // Función para completar entrega
  const completarEntrega = async () => {
    setCompletando(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        '¡Entrega Completada!',
        'La entrega ha sido marcada como completada exitosamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error al completar entrega:', error);
      Alert.alert('Error', 'No se pudo completar la entrega. Inténtelo nuevamente.');
    } finally {
      setCompletando(false);
    }
  };

  // Iniciar tracking GPS
  useEffect(() => {
    const iniciarTracking = async () => {
      try {
        addLog('info', 'Iniciando sistema de tracking GPS');
        setTrackingActivo(true);
        // Generar ubicación inicial para pruebas
        const ubicacionInicial = generarUbicacionCercana();
        setUbicacionActual(ubicacionInicial);
        
        addLog('info', `GPS iniciado - Ubicación inicial: [${ubicacionInicial.latitude.toFixed(6)}, ${ubicacionInicial.longitude.toFixed(6)}], Precisión: ${ubicacionInicial.accuracy.toFixed(0)}m`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        addLog('error', `Error iniciando tracking: ${errorMsg}`);
        Alert.alert('Error', 'No se pudo iniciar el tracking GPS');
      }
    };

    iniciarTracking();
  }, [generarUbicacionCercana, addLog]);

  // Calcular ruta automáticamente cuando cambie la ubicación
  useEffect(() => {
    const condiciones = {
      ubicacionActual: !!ubicacionActual,
      rutaOptima: !!rutaOptima,
      cargandoRuta,
      mostrarRutaCompleta,
      deberiaCalcular: ubicacionActual && !rutaOptima && !cargandoRuta && mostrarRutaCompleta
    };
    
    addLog('info', `VERIFICANDO CONDICIONES PARA CALCULAR RUTA: ${JSON.stringify(condiciones)}`);

    if (ubicacionActual && !rutaOptima && !cargandoRuta && mostrarRutaCompleta) {
      addLog('info', 'CONDICIONES CUMPLIDAS - Iniciando cálculo automático de ruta');
      calcularRuta();
    } else {
      addLog('warning', 'CONDICIONES NO CUMPLIDAS - No se calculará la ruta automáticamente');
    }
  }, [ubicacionActual, puntoEntrega, rutaOptima, cargandoRuta, mostrarRutaCompleta, calcularRuta, addLog]);

  // Monitorear distancia y geofence
  useEffect(() => {
    if (ubicacionActual) {
      const distancia = calcularDistancia(
        ubicacionActual.latitude,
        ubicacionActual.longitude,
        puntoEntrega.latitud,
        puntoEntrega.longitud
      );
      setDistanciaDestino(distancia);
      
      const prevDentroGeofence = dentroGeofence;
      const nuevoDentroGeofence = distancia <= 50;
      setDentroGeofence(nuevoDentroGeofence);

      if (prevDentroGeofence !== nuevoDentroGeofence) {
        addLog('info', `Estado geofence cambió: ${nuevoDentroGeofence ? 'DENTRO' : 'FUERA'} del área (${Math.round(distancia)}m)`);
      }
    }
  }, [ubicacionActual, puntoEntrega, calcularDistancia, dentroGeofence, addLog]);

  if (completando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Completando entrega...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Unificado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tracking de Entrega</Text>
          <Text style={styles.headerSubtitle}>{nombreCliente}</Text>
          <Text style={styles.headerFolio}>Folio: {folio}</Text>
        </View>
        <TouchableOpacity onPress={centrarEnUbicacionActual} style={styles.locationButton}>
          <Ionicons name="locate" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Mapa Principal */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={(region) => {
            setMapRegion(region);
            // Actualizar nivel de zoom para ajustar grosor de líneas
            const zoomLevel = 1 / Math.max(region.latitudeDelta, region.longitudeDelta);
            setNivelZoom(zoomLevel);
            
            // Log solo cuando el zoom cambie significativamente
            const zoomDiff = Math.abs(zoomLevel - nivelZoom);
            if (zoomDiff > 0.5) {
              addLog('info', `Región del mapa cambiada - Nuevo zoom: ${zoomLevel.toFixed(2)}, Delta: lat=${region.latitudeDelta.toFixed(6)}, lng=${region.longitudeDelta.toFixed(6)}`);
              
              // Advertir si las líneas podrían no ser visibles
              if (region.latitudeDelta > 0.1 || region.longitudeDelta > 0.1) {
                addLog('warning', 'Zoom muy alejado - Las líneas de ruta podrían no ser visibles');
              }
            }
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsTraffic={mostrarTrafico}
          loadingEnabled={true}
          mapType={tipoMapa}
          showsScale={true}
          showsCompass={true}
          rotateEnabled={true}
          pitchEnabled={true}
        >
          {/* Ubicación actual */}
          {ubicacionActual && (
            <Marker
              coordinate={ubicacionActual}
              title="Mi ubicación"
              description="Ubicación actual del chofer"
            >
              <View style={styles.currentLocationMarker}>
                <Ionicons name="navigate" size={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Ubicación de entrega */}
          <Marker
            coordinate={{ 
              latitude: puntoEntrega.latitud, 
              longitude: puntoEntrega.longitud 
            }}
            title={nombreCliente}
            description={`Folio: ${folio}`}
            pinColor="#E53E3E"
          />

          {/* Geofence circle */}
          <Circle
            center={{ 
              latitude: puntoEntrega.latitud, 
              longitude: puntoEntrega.longitud 
            }}
            radius={50}
            strokeColor={dentroGeofence ? "#10B981" : "#EF4444"}
            fillColor={dentroGeofence ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"}
            strokeWidth={2}
          />

          {/* Ruta optimizada - MEJORADA con grosor dinámico para distancias grandes */}
          {(() => {
            const debeRenderizarRuta = rutaOptima && rutaOptima.coordinates.length > 0 && mostrarRutaCompleta;
            const logMessage = `RENDERIZANDO RUTA: rutaOptima=${!!rutaOptima}, coordenadas=${rutaOptima?.coordinates.length || 0}, mostrarRutaCompleta=${mostrarRutaCompleta}, debeRenderizar=${debeRenderizarRuta}`;
            
            if (debeRenderizarRuta) {
              addLog('info', `${logMessage} - RUTA VISIBLE`);
            } else {
              addLog('warning', `${logMessage} - RUTA NO VISIBLE`);
            }
            
            return debeRenderizarRuta;
          })() && (
            <>
              {/* Línea de fondo más gruesa para el efecto de borde */}
              <Polyline
                coordinates={rutaOptima.coordinates}
                strokeColor="#1E3A8A"
                strokeWidth={calcularGrosorLinea(8)}
                lineJoin="round"
                lineCap="round"
              />
              {/* Línea principal azul brillante */}
              <Polyline
                coordinates={rutaOptima.coordinates}
                strokeColor="#3B82F6"
                strokeWidth={calcularGrosorLinea(6)}
                lineJoin="round"
                lineCap="round"
              />
              {/* Línea central más clara para efecto 3D */}
              <Polyline
                coordinates={rutaOptima.coordinates}
                strokeColor="#60A5FA"
                strokeWidth={calcularGrosorLinea(3)}
                lineJoin="round"
                lineCap="round"
              />
            </>
          )}
        </MapView>

        {/* Indicador de carga de ruta */}
        {cargandoRuta && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Calculando ruta óptima...</Text>
          </View>
        )}

        {/* Alerta cuando la ruta puede no ser visible */}
        {rutaOptima && rutaOptima.coordinates.length > 0 && mostrarRutaCompleta && 
         (mapRegion.latitudeDelta > 0.1 || mapRegion.longitudeDelta > 0.1) && (
          <View style={styles.routeVisibilityAlert}>
            <View style={styles.alertContent}>
              <Ionicons name="eye-off" size={20} color="#F59E0B" />
              <Text style={styles.alertText}>Ruta muy alejada</Text>
              <TouchableOpacity onPress={centrarEnRuta} style={styles.alertButton}>
                <Text style={styles.alertButtonText}>Centrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Panel de controles de mapa - NUEVO */}
        <View style={styles.mapControls}>
          {/* Zoom controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={hacerZoomIn}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={hacerZoomOut}>
              <Ionicons name="remove" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Map type toggle */}
            <TouchableOpacity style={styles.mapTypeButton} onPress={cambiarTipoMapa}>
              <Ionicons 
                name={tipoMapa === 'satellite' ? 'map' : tipoMapa === 'hybrid' ? 'layers' : 'earth'} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.mapTypeText}>
                {tipoMapa === 'standard' ? 'Estándar' : tipoMapa === 'satellite' ? 'Satélite' : 'Híbrido'}
              </Text>
            </TouchableOpacity>

          {/* Debug: Botón para forzar cálculo de ruta */}
          <TouchableOpacity 
            style={[styles.mapTypeButton, { backgroundColor: '#EF4444' }]} 
            onPress={() => {
              addLog('info', 'FORZANDO CÁLCULO DE RUTA - DEBUG por usuario');
              calcularRuta();
            }}
          >
            <Ionicons name="trail-sign" size={20} color="#FFFFFF" />
            <Text style={styles.mapTypeText}>Debug Ruta</Text>
          </TouchableOpacity>

          {/* Botón de logs de debugging */}
          <TouchableOpacity 
            style={[styles.mapTypeButton, { backgroundColor: mostrarLogs ? '#8B5CF6' : '#4B5563' }]} 
            onPress={() => {
              setMostrarLogs(!mostrarLogs);
              addLog('info', `Panel de logs ${!mostrarLogs ? 'ABIERTO' : 'CERRADO'} por usuario`);
            }}
          >
            <Ionicons name={mostrarLogs ? "bug" : "bug-outline"} size={20} color="#FFFFFF" />
            <Text style={styles.mapTypeText}>Logs</Text>
          </TouchableOpacity>

          {/* Botón para simular problemas de ruta */}
          <TouchableOpacity 
            style={[styles.mapTypeButton, { backgroundColor: '#F59E0B' }]} 
            onPress={() => {
              if (rutaOptima) {
                setRutaOptima(null);
                addLog('warning', 'SIMULACIÓN: Ruta eliminada para testing');
              } else {
                addLog('info', 'SIMULACIÓN: Intentando regenerar ruta...');
                calcularRuta();
              }
            }}
          >
            <Ionicons name={rutaOptima ? "close-circle" : "refresh-circle"} size={20} color="#FFFFFF" />
            <Text style={styles.mapTypeText}>{rutaOptima ? 'Quitar Ruta' : 'Test Ruta'}</Text>
          </TouchableOpacity>

          {/* Botón para info del sistema */}
          <TouchableOpacity 
            style={[styles.mapTypeButton, { backgroundColor: '#06B6D4' }]} 
            onPress={() => {
              addLog('info', '🔧 INFO DEL SISTEMA:');
              addLog('info', `- Ubicación actual: ${ubicacionActual ? `[${ubicacionActual.latitude.toFixed(6)}, ${ubicacionActual.longitude.toFixed(6)}]` : 'NO DISPONIBLE'}`);
              addLog('info', `- Punto de entrega: [${puntoEntrega.latitud.toFixed(6)}, ${puntoEntrega.longitud.toFixed(6)}]`);
              addLog('info', `- Ruta calculada: ${rutaOptima ? `SÍ (${rutaOptima.coordinates.length} coordenadas)` : 'NO'}`);
              addLog('info', `- Región del mapa: lat=${mapRegion.latitude.toFixed(6)}, lng=${mapRegion.longitude.toFixed(6)}`);
              addLog('info', `- Delta región: latΔ=${mapRegion.latitudeDelta.toFixed(6)}, lngΔ=${mapRegion.longitudeDelta.toFixed(6)}`);
              addLog('info', `- Zoom nivel: ${nivelZoom.toFixed(2)}`);
              addLog('info', `- Mostrar ruta: ${mostrarRutaCompleta ? 'SÍ' : 'NO'}`);
              addLog('info', `- Tipo de mapa: ${tipoMapa}`);
              addLog('info', `- Mostrar tráfico: ${mostrarTrafico ? 'SÍ' : 'NO'}`);
              addLog('info', `- Distancia al destino: ${distanciaDestino !== null ? `${Math.round(distanciaDestino)}m` : 'NO CALCULADA'}`);
              addLog('info', `- Dentro de geofence: ${dentroGeofence ? 'SÍ' : 'NO'}`);
            }}
          >
            <Ionicons name="information-circle" size={20} color="#FFFFFF" />
            <Text style={styles.mapTypeText}>Info</Text>
          </TouchableOpacity>          {/* Traffic toggle */}
          <TouchableOpacity 
            style={[styles.trafficButton, { backgroundColor: mostrarTrafico ? '#10B981' : '#6B7280' }]}
            onPress={() => setMostrarTrafico(!mostrarTrafico)}
          >
            <Ionicons name="car" size={20} color="#FFFFFF" />
            <Text style={styles.trafficText}>Tráfico</Text>
          </TouchableOpacity>

          {/* Route toggle */}
          <TouchableOpacity
            style={[styles.routeButton, { backgroundColor: mostrarRutaCompleta ? '#3B82F6' : '#6B7280' }]}
            onPress={() => setMostrarRutaCompleta(!mostrarRutaCompleta)}
          >
            <Ionicons 
              name={mostrarRutaCompleta ? "map" : "map-outline"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.routeText}>Ruta</Text>
          </TouchableOpacity>

          {/* Center on route button */}
          <TouchableOpacity 
            style={[
              styles.centerButton, 
              (mapRegion.latitudeDelta > 0.1 || mapRegion.longitudeDelta > 0.1) && rutaOptima && 
              { backgroundColor: '#F59E0B', borderWidth: 2, borderColor: '#D97706' }
            ]} 
            onPress={centrarEnRuta}
          >
            <Ionicons 
              name={(mapRegion.latitudeDelta > 0.1 || mapRegion.longitudeDelta > 0.1) && rutaOptima ? "warning" : "scan"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.centerText}>
              {(mapRegion.latitudeDelta > 0.1 || mapRegion.longitudeDelta > 0.1) && rutaOptima ? 'Ver Ruta' : 'Centrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Panel de logs de debugging */}
      {mostrarLogs && (
        <View style={styles.debugPanel}>
          <View style={styles.debugHeader}>
            <Text style={styles.debugTitle}>🐛 Debug Logs</Text>
            <View style={styles.debugActions}>
              <TouchableOpacity onPress={clearLogs} style={styles.clearLogsButton}>
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                <Text style={styles.clearLogsText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setMostrarLogs(false)} 
                style={styles.closeLogsButton}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.logsContainer}>
            {logs.length === 0 ? (
              <Text style={styles.noLogsText}>No hay logs disponibles</Text>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={[styles.logEntry, styles[`log${log.level.charAt(0).toUpperCase() + log.level.slice(1)}`]]}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                    <View style={[styles.logLevelBadge, styles[`badge${log.level.charAt(0).toUpperCase() + log.level.slice(1)}`]]}>
                      <Text style={styles.logLevelText}>
                        {log.level === 'info' ? 'ℹ️' : log.level === 'warning' ? '⚠️' : '❌'} {log.level.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.logMessage}>{log.message}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Panel de información y controles mejorado */}
      <ScrollView style={styles.infoPanel}>
        {/* Estado del tracking */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>📡 Estado GPS</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: trackingActivo ? '#10B981' : '#EF4444' }]} />
            <Text style={styles.statusText}>
              {trackingActivo ? 'GPS Activo' : 'GPS Inactivo'}
            </Text>
          </View>
          {ubicacionActual && (
            <Text style={styles.precisionText}>
              Precisión: {ubicacionActual.accuracy?.toFixed(0) || 'N/A'}m
            </Text>
          )}
        </View>

        {/* Información de distancia */}
        <View style={styles.infoSection}>
          <View style={styles.infoSectionHeader}>
            <Text style={styles.sectionTitle}>📍 Información de Entrega</Text>
            <TouchableOpacity 
              onPress={() => {
                setMostrarLogs(!mostrarLogs);
                addLog('info', `Panel de logs ${!mostrarLogs ? 'ABIERTO' : 'CERRADO'} desde panel de info`);
              }}
              style={styles.debugToggleButton}
            >
              <Ionicons 
                name={mostrarLogs ? "bug" : "bug-outline"} 
                size={16} 
                color={mostrarLogs ? "#8B5CF6" : "#6B7280"} 
              />
              <Text style={[styles.debugToggleText, { color: mostrarLogs ? "#8B5CF6" : "#6B7280" }]}>
                Debug
              </Text>
            </TouchableOpacity>
          </View>
          {distanciaDestino !== null && (
            <View style={styles.distanceInfo}>
              <Text style={[styles.distanceText, { color: dentroGeofence ? '#10B981' : '#EF4444' }]}>
                Distancia: {Math.round(distanciaDestino)}m
              </Text>
              <View style={[styles.geofenceIndicator, { backgroundColor: dentroGeofence ? '#10B981' : '#EF4444' }]}>
                <Text style={styles.geofenceText}>
                  {dentroGeofence ? '✓ Dentro del área' : '• Fuera del área'}
                </Text>
              </View>
            </View>
          )}
          
          {rutaOptima && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoText}>
                📏 Distancia total: {(rutaOptima.distance / 1000).toFixed(1)} km
              </Text>
              <Text style={styles.routeInfoText}>
                ⏱️ Tiempo estimado: {Math.round(rutaOptima.duration)} min
              </Text>
              <Text style={styles.routeInfoText}>
                🔍 Zoom: {nivelZoom > 10 ? 'Cerca' : nivelZoom > 1 ? 'Medio' : 'Alejado'} 
                {(mapRegion.latitudeDelta > 0.1 || mapRegion.longitudeDelta > 0.1) && ' - Líneas pueden no ser visibles'}
              </Text>
            </View>
          )}
        </View>

        {/* Controles de navegación mejorados */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>🧭 Navegación</Text>
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={abrirNavegacionExterna}
            >
              <Ionicons name="navigate" size={24} color="#FFFFFF" />
              <Text style={styles.navButtonText}>Navegar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={calcularRuta}
              disabled={cargandoRuta}
            >
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
              <Text style={styles.navButtonText}>
                {cargandoRuta ? 'Calculando...' : 'Recalcular'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de completar entrega - solo visible si está en área */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            !dentroGeofence && styles.completeButtonDisabled
          ]}
          disabled={!dentroGeofence}
          onPress={() => {
            Alert.alert(
              'Completar Entrega',
              '¿Está seguro que desea marcar esta entrega como completada?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Completar', onPress: completarEntrega }
              ]
            );
          }}
        >
          <Ionicons 
            name="checkmark-circle" 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={styles.completeButtonText}>
            {dentroGeofence ? 'Completar Entrega' : 'Acérquese para entregar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerFolio: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  locationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationMarker: {
    backgroundColor: '#3B82F6',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    elevation: 4,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    alignItems: 'flex-end',
  },
  zoomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
  },
  zoomButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  mapTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  mapTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  trafficButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  trafficText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  routeText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  centerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  routeVisibilityAlert: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.95)',
    borderRadius: 12,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertText: {
    flex: 1,
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  alertButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  centerText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  infoPanel: {
    maxHeight: 300,
    backgroundColor: '#FFFFFF',
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  precisionText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 20,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '700',
  },
  geofenceIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  geofenceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  routeInfo: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  routeInfoText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  completeButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Estilos para el panel de debugging
  debugPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  debugTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  debugActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearLogsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  clearLogsText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  closeLogsButton: {
    backgroundColor: '#6B7280',
    padding: 6,
    borderRadius: 4,
  },
  logsContainer: {
    maxHeight: 200,
    paddingHorizontal: 16,
  },
  noLogsText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  logEntry: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  logInfo: {
    backgroundColor: '#1E3A8A',
    borderLeftColor: '#3B82F6',
  },
  logWarning: {
    backgroundColor: '#92400E',
    borderLeftColor: '#F59E0B',
  },
  logError: {
    backgroundColor: '#7F1D1D',
    borderLeftColor: '#EF4444',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logTimestamp: {
    color: '#D1D5DB',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeInfo: {
    backgroundColor: '#3B82F6',
  },
  badgeWarning: {
    backgroundColor: '#F59E0B',
  },
  badgeError: {
    backgroundColor: '#EF4444',
  },
  logLevelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  logMessage: {
    color: '#F9FAFB',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Estilos adicionales para el botón de debug en el panel
  infoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debugToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugToggleText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default EntregaTrackingScreen;