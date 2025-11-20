/**
 * 🗺️ HERE Maps Provider Service
 *
 * Servicio de abstracción para el proveedor de mapas HERE Maps.
 * Reemplaza la dependencia de Google Maps con funcionalidades nativas de HERE.
 *
 * IMPORTANTE: Para producción, se requiere instalar @here/maps-api-for-javascript
 * o usar el SDK nativo de HERE para React Native.
 *
 * Este servicio proporciona la interfaz y funcionalidades necesarias para
 * migrar completamente a HERE Maps.
 */

import { hereMockConfig, mockLog } from './hereMockConfig';
import { hereVectorTilesService, MapStyleType, POI, POICategory } from './hereVectorTilesService';

/**
 * Configuración del mapa HERE
 */
export interface HereMapConfiguration {
  apiKey: string;
  center: { latitude: number; longitude: number };
  zoom: number;
  styleType: MapStyleType;
  show3D: boolean;
  showTraffic: boolean;
  showIncidents: boolean;
  language: string;
}

/**
 * Evento de interacción con el mapa
 */
export interface MapInteractionEvent {
  type: 'tap' | 'longPress' | 'drag' | 'zoom' | 'rotate';
  coordinates: { latitude: number; longitude: number };
  timestamp: number;
}

/**
 * Marcador en el mapa
 */
export interface HereMapMarker {
  id: string;
  position: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  icon?: string;
  color?: string;
  draggable?: boolean;
  zIndex?: number;
  onPress?: () => void;
}

/**
 * Polilínea en el mapa
 */
export interface HereMapPolyline {
  id: string;
  coordinates: Array<{ latitude: number; longitude: number }>;
  strokeColor: string;
  strokeWidth: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  geodesic?: boolean;
  zIndex?: number;
}

/**
 * Círculo en el mapa
 */
export interface HereMapCircle {
  id: string;
  center: { latitude: number; longitude: number };
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  zIndex?: number;
}

/**
 * Región del mapa
 */
export interface HereMapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Cámara del mapa
 */
export interface HereMapCamera {
  center: { latitude: number; longitude: number };
  zoom: number;
  pitch: number;
  heading: number;
  altitude?: number;
}

/**
 * Estado del servicio de mapas
 */
export interface MapProviderStatus {
  initialized: boolean;
  provider: 'HERE';
  version: string;
  features: {
    vectorTiles: boolean;
    traffic: boolean;
    routing: boolean;
    geocoding: boolean;
    poi: boolean;
    offline: boolean;
  };
}

class HereMapProviderService {
  private initialized: boolean = false;
  private currentConfig: HereMapConfiguration | null = null;
  private markers: Map<string, HereMapMarker> = new Map();
  private polylines: Map<string, HereMapPolyline> = new Map();
  private circles: Map<string, HereMapCircle> = new Map();
  private currentCamera: HereMapCamera | null = null;

  /**
   * Inicializar el proveedor de mapas HERE
   */
  async initialize(apiKey: string): Promise<boolean> {
    if (hereMockConfig.shouldUseMock('vectorTiles')) {
      mockLog('MapProviderService', 'Inicializando HERE Maps Provider (MOCK)');
      await hereMockConfig.simulateDelay('routing');

      this.initialized = true;
      mockLog('MapProviderService', 'HERE Maps Provider inicializado correctamente');
      return true;
    }

    // Implementación real requeriría:
    // import H from '@here/maps-api-for-javascript';
    // const platform = new H.service.Platform({ apikey: apiKey });
    // etc.

    this.initialized = true;
    return true;
  }

  /**
   * Obtener estado del proveedor
   */
  getStatus(): MapProviderStatus {
    return {
      initialized: this.initialized,
      provider: 'HERE',
      version: '3.1.0', // Versión del SDK HERE Maps
      features: {
        vectorTiles: true,
        traffic: true,
        routing: true,
        geocoding: true,
        poi: true,
        offline: hereMockConfig.shouldUseMock('vectorTiles'), // Offline solo en mock
      },
    };
  }

  /**
   * Crear configuración de mapa
   */
  createMapConfiguration(options: Partial<HereMapConfiguration>): HereMapConfiguration {
    const defaultConfig: HereMapConfiguration = {
      apiKey: '',
      center: { latitude: 19.4326, longitude: -99.1332 }, // CDMX
      zoom: 14,
      styleType: 'logistics',
      show3D: false,
      showTraffic: true,
      showIncidents: true,
      language: 'es-MX',
    };

    this.currentConfig = { ...defaultConfig, ...options };
    return this.currentConfig;
  }

  /**
   * Agregar marcador al mapa
   */
  addMarker(marker: HereMapMarker): void {
    this.markers.set(marker.id, marker);
    mockLog('MapProviderService', `Marcador agregado: ${marker.id} en ${marker.position.latitude.toFixed(4)}, ${marker.position.longitude.toFixed(4)}`);
  }

  /**
   * Remover marcador del mapa
   */
  removeMarker(markerId: string): void {
    this.markers.delete(markerId);
    mockLog('MapProviderService', `Marcador removido: ${markerId}`);
  }

  /**
   * Actualizar posición de marcador
   */
  updateMarkerPosition(markerId: string, position: { latitude: number; longitude: number }): void {
    const marker = this.markers.get(markerId);
    if (marker) {
      marker.position = position;
      mockLog('MapProviderService', `Marcador ${markerId} movido a ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`);
    }
  }

  /**
   * Obtener todos los marcadores
   */
  getAllMarkers(): HereMapMarker[] {
    return Array.from(this.markers.values());
  }

  /**
   * Agregar polilínea al mapa
   */
  addPolyline(polyline: HereMapPolyline): void {
    this.polylines.set(polyline.id, polyline);
    mockLog('MapProviderService', `Polilínea agregada: ${polyline.id} con ${polyline.coordinates.length} puntos`);
  }

  /**
   * Remover polilínea del mapa
   */
  removePolyline(polylineId: string): void {
    this.polylines.delete(polylineId);
    mockLog('MapProviderService', `Polilínea removida: ${polylineId}`);
  }

  /**
   * Obtener todas las polilíneas
   */
  getAllPolylines(): HereMapPolyline[] {
    return Array.from(this.polylines.values());
  }

  /**
   * Agregar círculo al mapa
   */
  addCircle(circle: HereMapCircle): void {
    this.circles.set(circle.id, circle);
    mockLog('MapProviderService', `Círculo agregado: ${circle.id} en ${circle.center.latitude.toFixed(4)}, ${circle.center.longitude.toFixed(4)} radio ${circle.radius}m`);
  }

  /**
   * Remover círculo del mapa
   */
  removeCircle(circleId: string): void {
    this.circles.delete(circleId);
    mockLog('MapProviderService', `Círculo removido: ${circleId}`);
  }

  /**
   * Obtener todos los círculos
   */
  getAllCircles(): HereMapCircle[] {
    return Array.from(this.circles.values());
  }

  /**
   * Animar cámara a región
   */
  async animateToRegion(region: HereMapRegion, duration: number = 500): Promise<void> {
    if (hereMockConfig.shouldUseMock('vectorTiles')) {
      mockLog('MapProviderService', `Animando a región: ${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`);
      await new Promise(resolve => setTimeout(resolve, duration));
    }

    this.currentCamera = {
      center: { latitude: region.latitude, longitude: region.longitude },
      zoom: this.calculateZoomFromDelta(region.latitudeDelta),
      pitch: 0,
      heading: 0,
    };
  }

  /**
   * Animar cámara con parámetros específicos
   */
  async animateCamera(camera: Partial<HereMapCamera>, duration: number = 500): Promise<void> {
    if (hereMockConfig.shouldUseMock('vectorTiles')) {
      mockLog('MapProviderService', `Animando cámara: zoom=${camera.zoom}, pitch=${camera.pitch}, heading=${camera.heading}`);
      await new Promise(resolve => setTimeout(resolve, duration));
    }

    if (this.currentCamera) {
      this.currentCamera = { ...this.currentCamera, ...camera };
    } else {
      this.currentCamera = {
        center: camera.center || { latitude: 19.4326, longitude: -99.1332 },
        zoom: camera.zoom || 14,
        pitch: camera.pitch || 0,
        heading: camera.heading || 0,
      };
    }
  }

  /**
   * Obtener cámara actual
   */
  getCurrentCamera(): HereMapCamera | null {
    return this.currentCamera;
  }

  /**
   * Ajustar mapa para mostrar todos los puntos
   */
  async fitToBounds(
    coordinates: Array<{ latitude: number; longitude: number }>,
    padding: number = 50
  ): Promise<void> {
    if (coordinates.length === 0) return;

    const lats = coordinates.map(c => c.latitude);
    const lngs = coordinates.map(c => c.longitude);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const latDelta = (maxLat - minLat) * 1.2; // 20% padding
    const lngDelta = (maxLng - minLng) * 1.2;

    await this.animateToRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    });

    mockLog('MapProviderService', `Mapa ajustado para mostrar ${coordinates.length} puntos`);
  }

  /**
   * Buscar POIs cercanos usando Vector Tiles Service
   */
  async searchNearbyPOIs(
    center: { latitude: number; longitude: number },
    categories: POICategory[],
    radius: number = 5000
  ): Promise<POI[]> {
    return hereVectorTilesService.searchNearbyPOIs(center, categories, radius);
  }

  /**
   * Cambiar estilo del mapa
   */
  async setMapStyle(styleType: MapStyleType): Promise<void> {
    if (this.currentConfig) {
      this.currentConfig.styleType = styleType;
    }

    const styleConfig = await hereVectorTilesService.getMapStyle(styleType);
    mockLog('MapProviderService', `Estilo de mapa cambiado a: ${styleType}`);

    // Aplicar configuración del estilo
    if (this.currentConfig) {
      this.currentConfig.showTraffic = styleConfig.showTraffic;
      this.currentConfig.showIncidents = styleConfig.showIncidents;
      this.currentConfig.show3D = styleConfig.show3DBuildings;
    }
  }

  /**
   * Activar/desactivar vista de tráfico
   */
  setTrafficVisible(visible: boolean): void {
    if (this.currentConfig) {
      this.currentConfig.showTraffic = visible;
    }
    mockLog('MapProviderService', `Tráfico ${visible ? 'activado' : 'desactivado'}`);
  }

  /**
   * Activar/desactivar vista 3D
   */
  set3DMode(enabled: boolean): void {
    if (this.currentConfig) {
      this.currentConfig.show3D = enabled;
    }
    mockLog('MapProviderService', `Modo 3D ${enabled ? 'activado' : 'desactivado'}`);
  }

  /**
   * Calcular zoom desde delta de latitud
   */
  private calculateZoomFromDelta(latDelta: number): number {
    // Aproximación: zoom = log2(360 / latDelta)
    return Math.round(Math.log2(360 / latDelta));
  }

  /**
   * Limpiar todos los elementos del mapa
   */
  clearAll(): void {
    this.markers.clear();
    this.polylines.clear();
    this.circles.clear();
    mockLog('MapProviderService', 'Todos los elementos del mapa limpiados');
  }

  /**
   * Obtener configuración actual
   */
  getCurrentConfiguration(): HereMapConfiguration | null {
    return this.currentConfig;
  }

  /**
   * Verificar si está inicializado
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Destruir instancia del mapa
   */
  destroy(): void {
    this.clearAll();
    this.initialized = false;
    this.currentConfig = null;
    this.currentCamera = null;
    mockLog('MapProviderService', 'Instancia del mapa destruida');
  }
}

export const hereMapProviderService = new HereMapProviderService();
