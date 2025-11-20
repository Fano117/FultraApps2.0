/**
 * Servicio de Tracking GPS en Tiempo Real
 *
 * Funcionalidades:
 * - Tracking de ubicación del chofer en tiempo real
 * - Sistema de geocercas (50m por defecto)
 * - Validación de proximidad para completar entregas
 * - Simulación de movimiento para testing
 */

import * as Location from 'expo-location';
import { apiService } from './apiService';

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface UbicacionChofer extends Coordenadas {
  velocidad: number;
  precision: number;
  timestamp: string;
  enRuta: boolean;
}

export interface GeocercaConfig {
  centro: Coordenadas;
  radio: number; // en metros
}

export interface ResultadoProximidad {
  dentroDeGeocerca: boolean;
  distancia: number; // en metros
  puedeCompletar: boolean;
}

class GPSTrackingService {
  private watchId: Location.LocationSubscription | null = null;
  private ubicacionActual: UbicacionChofer | null = null;
  private listeners: Array<(ubicacion: UbicacionChofer) => void> = [];
  private simulacionActiva: boolean = false;
  private intervalSimulacion: NodeJS.Timeout | null = null;
  
  // Modo de desarrollo sin permisos para Expo Go
  private readonly MODO_DESARROLLO = __DEV__ && true; // Cambiar a false para usar permisos reales
  private readonly UBICACION_MOCK_GUADALAJARA: Coordenadas = {
    latitud: 20.659698,
    longitud: -103.325000
  };

  /**
   * Inicializar el servicio de tracking
   */
  async initialize(): Promise<boolean> {
    try {
      // En modo desarrollo, usar ubicación mock
      if (this.MODO_DESARROLLO) {
        console.log('[GPS] 🧪 Modo desarrollo activado - usando ubicación mock de Guadalajara');
        this.ubicacionActual = {
          ...this.UBICACION_MOCK_GUADALAJARA,
          velocidad: 0,
          precision: 5,
          timestamp: new Date().toISOString(),
          enRuta: true
        };
        return true;
      }

      // Solicitar permisos de ubicación (solo en production/development build)
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.error('Permisos de ubicación denegados');
        return false;
      }

      console.log('✅ Servicio de GPS inicializado');
      return true;
    } catch (error) {
      console.error('Error inicializando GPS:', error);
      return false;
    }
  }

  /**
   * Iniciar tracking en tiempo real
   */
  async startTracking(): Promise<void> {
    if (this.watchId) {
      console.warn('Tracking ya está activo');
      return;
    }

    try {
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Actualizar cada 5 segundos
          distanceInterval: 10, // O cuando se mueva 10 metros
        },
        (location) => {
          const ubicacion: UbicacionChofer = {
            latitud: location.coords.latitude,
            longitud: location.coords.longitude,
            velocidad: location.coords.speed || 0,
            precision: location.coords.accuracy || 0,
            timestamp: new Date(location.timestamp).toISOString(),
            enRuta: true,
          };

          this.ubicacionActual = ubicacion;
          this.notifyListeners(ubicacion);
          this.enviarUbicacionAlBackend(ubicacion);
        }
      );

      console.log('✅ Tracking GPS iniciado');
    } catch (error) {
      console.error('Error iniciando tracking:', error);
      throw error;
    }
  }

  /**
   * Detener tracking
   */
  async stopTracking(): Promise<void> {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
      console.log('✅ Tracking GPS detenido');
    }
  }

  /**
   * Obtener ubicación actual
   */
  async getUbicacionActual(): Promise<UbicacionChofer> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const ubicacion: UbicacionChofer = {
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
        velocidad: location.coords.speed || 0,
        precision: location.coords.accuracy || 0,
        timestamp: new Date(location.timestamp).toISOString(),
        enRuta: true,
      };

      this.ubicacionActual = ubicacion;
      return ubicacion;
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      throw error;
    }
  }

  /**
   * Calcular distancia entre dos puntos (fórmula de Haversine)
   * Retorna la distancia en metros
   */
  calcularDistancia(punto1: Coordenadas, punto2: Coordenadas): number {
    const R = 6371000; // Radio de la Tierra en metros
    const lat1 = this.toRadians(punto1.latitud);
    const lat2 = this.toRadians(punto2.latitud);
    const deltaLat = this.toRadians(punto2.latitud - punto1.latitud);
    const deltaLon = this.toRadians(punto2.longitud - punto1.longitud);

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return distancia;
  }

  /**
   * Verificar si el chofer está dentro de una geocerca
   */
  verificarGeocerca(
    ubicacionChofer: Coordenadas,
    geocerca: GeocercaConfig
  ): ResultadoProximidad {
    const distancia = this.calcularDistancia(ubicacionChofer, geocerca.centro);
    const dentroDeGeocerca = distancia <= geocerca.radio;

    return {
      dentroDeGeocerca,
      distancia,
      puedeCompletar: dentroDeGeocerca,
    };
  }

  /**
   * Verificar si puede completar una entrega (geocerca de 50m)
   */
  async puedeCompletarEntrega(puntoEntrega: Coordenadas): Promise<ResultadoProximidad> {
    const ubicacionActual = this.ubicacionActual || (await this.getUbicacionActual());

    const geocerca: GeocercaConfig = {
      centro: puntoEntrega,
      radio: 50, // 50 metros por defecto
    };

    const resultado = this.verificarGeocerca(ubicacionActual, geocerca);

    console.log(`📍 Distancia a punto de entrega: ${resultado.distancia.toFixed(1)}m`);
    console.log(`${resultado.puedeCompletar ? '✅' : '❌'} Puede completar: ${resultado.puedeCompletar}`);

    return resultado;
  }

  /**
   * Enviar ubicación al backend
   */
  private async enviarUbicacionAlBackend(ubicacion: UbicacionChofer): Promise<void> {
    try {
      await apiService.post('/mobile/chofer/ubicacion', {
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        velocidad: ubicacion.velocidad,
        precision: ubicacion.precision,
        timestamp: ubicacion.timestamp,
        enRuta: ubicacion.enRuta,
      });
    } catch (error) {
      console.error('Error enviando ubicación al backend:', error);
      // No fallar, solo registrar el error
    }
  }

  /**
   * Agregar listener para cambios de ubicación
   */
  addUbicacionListener(callback: (ubicacion: UbicacionChofer) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remover listener
   */
  removeUbicacionListener(callback: (ubicacion: UbicacionChofer) => void): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  /**
   * Notificar a todos los listeners
   */
  private notifyListeners(ubicacion: UbicacionChofer): void {
    this.listeners.forEach((listener) => {
      try {
        listener(ubicacion);
      } catch (error) {
        console.error('Error en listener de ubicación:', error);
      }
    });
  }

  /**
   * Simular movimiento desde un punto A hasta un punto B
   * Útil para testing
   */
  async simularMovimiento(
    origen: Coordenadas,
    destino: Coordenadas,
    opciones?: {
      velocidad?: number; // km/h (por defecto 40)
      intervalo?: number; // ms entre actualizaciones (por defecto 1000)
      onProgress?: (ubicacion: UbicacionChofer, progreso: number) => void;
    }
  ): Promise<void> {
    const velocidad = opciones?.velocidad || 40; // km/h
    const intervalo = opciones?.intervalo || 1000; // 1 segundo

    this.simulacionActiva = true;
    console.log('🚗 Iniciando simulación de movimiento...');
    console.log(`📍 Origen: ${origen.latitud}, ${origen.longitud}`);
    console.log(`📍 Destino: ${destino.latitud}, ${destino.longitud}`);

    // Calcular distancia total
    const distanciaTotal = this.calcularDistancia(origen, destino);
    console.log(`📏 Distancia total: ${(distanciaTotal / 1000).toFixed(2)} km`);

    // Calcular número de pasos basado en velocidad e intervalo
    const velocidadMetrosPorSegundo = (velocidad * 1000) / 3600;
    const metrosPorIntervalo = (velocidadMetrosPorSegundo * intervalo) / 1000;
    const numeroPasos = Math.ceil(distanciaTotal / metrosPorIntervalo);

    let pasoActual = 0;

    return new Promise((resolve) => {
      this.intervalSimulacion = setInterval(() => {
        if (!this.simulacionActiva || pasoActual >= numeroPasos) {
          if (this.intervalSimulacion) {
            clearInterval(this.intervalSimulacion);
            this.intervalSimulacion = null;
          }
          console.log('✅ Simulación completada');
          resolve();
          return;
        }

        // Calcular posición actual (interpolación lineal)
        const progreso = pasoActual / numeroPasos;
        const latitudActual =
          origen.latitud + (destino.latitud - origen.latitud) * progreso;
        const longitudActual =
          origen.longitud + (destino.longitud - origen.longitud) * progreso;

        const ubicacion: UbicacionChofer = {
          latitud: latitudActual,
          longitud: longitudActual,
          velocidad: velocidadMetrosPorSegundo * 3.6, // Convertir a km/h
          precision: 5,
          timestamp: new Date().toISOString(),
          enRuta: true,
        };

        this.ubicacionActual = ubicacion;
        this.notifyListeners(ubicacion);
        this.enviarUbicacionAlBackend(ubicacion);

        if (opciones?.onProgress) {
          opciones.onProgress(ubicacion, progreso);
        }

        pasoActual++;
      }, intervalo);
    });
  }

  /**
   * Detener simulación
   */
  detenerSimulacion(): void {
    this.simulacionActiva = false;
    if (this.intervalSimulacion) {
      clearInterval(this.intervalSimulacion);
      this.intervalSimulacion = null;
    }
    console.log('✅ Simulación detenida');
  }

  /**
   * Simular ruta completa con múltiples puntos
   */
  async simularRutaCompleta(
    puntos: Coordenadas[],
    opciones?: {
      velocidad?: number;
      intervalo?: number;
      onProgress?: (ubicacion: UbicacionChofer, indice: number, total: number) => void;
    }
  ): Promise<void> {
    console.log(`🗺️ Simulando ruta con ${puntos.length} puntos...`);

    for (let i = 0; i < puntos.length - 1; i++) {
      if (!this.simulacionActiva) {
        break;
      }

      const origen = puntos[i];
      const destino = puntos[i + 1];

      await this.simularMovimiento(origen, destino, {
        ...opciones,
        onProgress: (ubicacion, progreso) => {
          if (opciones?.onProgress) {
            opciones.onProgress(ubicacion, i, puntos.length);
          }
        },
      });
    }

    console.log('✅ Ruta completa simulada');
  }

  /**
   * Obtener ubicación actual sin tracking
   */
  getUbicacionActualCacheada(): UbicacionChofer | null {
    return this.ubicacionActual;
  }

  /**
   * Convertir grados a radianes
   */
  private toRadians(grados: number): number {
    return (grados * Math.PI) / 180;
  }

  /**
   * Limpiar servicio
   */
  async cleanup(): Promise<void> {
    await this.stopTracking();
    this.detenerSimulacion();
    this.listeners = [];
    this.ubicacionActual = null;
    console.log('✅ Servicio de GPS limpiado');
  }
}

export const gpsTrackingService = new GPSTrackingService();
