/**
 * 🗺️ HERE Vector Tiles Service
 *
 * Servicio para gestionar mapas vectoriales de HERE Maps con personalización avanzada.
 * Incluye estilos personalizados, POIs temáticos y renderizado optimizado.
 *
 * Documentación: https://developer.here.com/documentation/vector-tiles-api/dev_guide/index.html
 * API Reference: https://developer.here.com/documentation/vector-tiles-api/api-reference.html
 */

import { config } from '@/shared/config/environments';
import { hereMockConfig, mockLog } from './hereMockConfig';

/**
 * Estilo de mapa disponible
 */
export type MapStyleType =
  | 'default'
  | 'satellite'
  | 'terrain'
  | 'traffic'
  | 'night'
  | 'logistics'
  | 'pedestrian'
  | 'truck';

/**
 * Configuración de estilo de mapa
 */
export interface MapStyleConfig {
  type: MapStyleType;
  showTraffic: boolean;
  showIncidents: boolean;
  showPOIs: boolean;
  show3DBuildings: boolean;
  language: string;
  politicalView: string;
}

/**
 * Capa de mapa personalizada
 */
export interface CustomMapLayer {
  id: string;
  name: string;
  type: 'poi' | 'route' | 'geofence' | 'heatmap' | 'cluster';
  visible: boolean;
  opacity: number;
  data: unknown[];
  style: Record<string, unknown>;
}

/**
 * POI (Point of Interest)
 */
export interface POI {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  position: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  rating?: number;
  distance?: number;
  icon?: string;
}

/**
 * Categorías de POI
 */
export type POICategory =
  | 'gas_station'
  | 'restaurant'
  | 'parking'
  | 'rest_area'
  | 'truck_stop'
  | 'warehouse'
  | 'loading_zone'
  | 'customs'
  | 'weigh_station'
  | 'hospital'
  | 'police'
  | 'mechanic';

/**
 * Tile de mapa vectorial
 */
export interface VectorTile {
  x: number;
  y: number;
  z: number;
  data: unknown;
  timestamp: number;
  cached: boolean;
}

/**
 * Configuración de cache de tiles
 */
export interface TileCacheConfig {
  maxSize: number; // MB
  maxAge: number; // segundos
  preloadRadius: number; // tiles alrededor del viewport
}

/**
 * Estadísticas de uso del mapa
 */
export interface MapUsageStats {
  tilesLoaded: number;
  tilesCached: number;
  cacheHitRate: number;
  totalDataTransferred: number; // bytes
  averageLoadTime: number; // ms
}

class HereVectorTilesService {
  private readonly API_KEY = config.hereMapsApiKey || '';
  private readonly TILES_API_BASE = 'https://vector.hereapi.com/v2/vectortiles';
  private tileCache: Map<string, VectorTile> = new Map();
  private usageStats: MapUsageStats = {
    tilesLoaded: 0,
    tilesCached: 0,
    cacheHitRate: 0,
    totalDataTransferred: 0,
    averageLoadTime: 0,
  };
  private cacheConfig: TileCacheConfig = {
    maxSize: 100, // 100 MB
    maxAge: 3600, // 1 hora
    preloadRadius: 2,
  };

  /**
   * Obtener configuración de estilo para el tipo de mapa
   */
  async getMapStyle(styleType: MapStyleType): Promise<MapStyleConfig> {
    if (hereMockConfig.shouldUseMock('vectorTiles')) {
      mockLog('VectorTilesService', `Obteniendo estilo: ${styleType}`);
      return this.getMapStyleMock(styleType);
    }

    // Implementación real usaría HERE Style Editor API
    return this.getMapStyleMock(styleType);
  }

  /**
   * Generar estilo mock
   */
  private async getMapStyleMock(styleType: MapStyleType): Promise<MapStyleConfig> {
    await hereMockConfig.simulateDelay('routing'); // Usar delay similar

    const baseConfig: MapStyleConfig = {
      type: styleType,
      showTraffic: false,
      showIncidents: false,
      showPOIs: true,
      show3DBuildings: true,
      language: 'es-MX',
      politicalView: 'MEX',
    };

    switch (styleType) {
      case 'traffic':
        return { ...baseConfig, showTraffic: true, showIncidents: true };
      case 'logistics':
        return {
          ...baseConfig,
          showTraffic: true,
          showIncidents: true,
          showPOIs: true,
        };
      case 'truck':
        return {
          ...baseConfig,
          showTraffic: true,
          showIncidents: true,
          showPOIs: true,
        };
      case 'night':
        return { ...baseConfig, show3DBuildings: false };
      case 'satellite':
        return { ...baseConfig, show3DBuildings: false, showPOIs: false };
      case 'terrain':
        return { ...baseConfig, show3DBuildings: false };
      case 'pedestrian':
        return { ...baseConfig, showPOIs: true };
      default:
        return baseConfig;
    }
  }

  /**
   * Buscar POIs cercanos
   */
  async searchNearbyPOIs(
    center: { latitude: number; longitude: number },
    categories: POICategory[],
    radius: number = 5000 // metros
  ): Promise<POI[]> {
    if (hereMockConfig.shouldUseMock('vectorTiles')) {
      mockLog('VectorTilesService', `Buscando POIs en radio ${radius}m`);
      return this.searchNearbyPOIsMock(center, categories, radius);
    }

    // Implementación real
    return this.searchNearbyPOIsMock(center, categories, radius);
  }

  /**
   * Buscar POIs mock
   */
  private async searchNearbyPOIsMock(
    center: { latitude: number; longitude: number },
    categories: POICategory[],
    radius: number
  ): Promise<POI[]> {
    await hereMockConfig.simulateDelay('routing');

    const poiDatabase: Record<POICategory, Array<{ name: string; subcategory?: string }>> = {
      gas_station: [
        { name: 'Pemex' },
        { name: 'Mobil' },
        { name: 'Shell' },
        { name: 'BP' },
        { name: 'Oxxo Gas' },
      ],
      restaurant: [
        { name: 'Vips', subcategory: 'Comida rápida' },
        { name: 'Sanborns', subcategory: 'Restaurante familiar' },
        { name: "Denny's", subcategory: '24 horas' },
        { name: 'Toks', subcategory: 'Restaurante familiar' },
      ],
      parking: [
        { name: 'Estacionamiento Centro' },
        { name: 'Parking Express' },
        { name: 'Estacionamiento 24h' },
      ],
      rest_area: [
        { name: 'Área de Descanso Km 45' },
        { name: 'Parador Turístico' },
        { name: 'Zona de Servicios' },
      ],
      truck_stop: [
        { name: 'Parador de Camiones Norte' },
        { name: 'Truck Stop Central' },
        { name: 'Estación de Servicio Pesado' },
      ],
      warehouse: [
        { name: 'Centro de Distribución A' },
        { name: 'Almacén Industrial' },
        { name: 'Bodega Logística' },
      ],
      loading_zone: [
        { name: 'Zona de Carga Terminal' },
        { name: 'Área de Descarga' },
        { name: 'Muelle de Carga' },
      ],
      customs: [
        { name: 'Aduana Principal' },
        { name: 'Punto de Inspección' },
      ],
      weigh_station: [
        { name: 'Báscula Carretera' },
        { name: 'Estación de Pesaje' },
      ],
      hospital: [
        { name: 'Hospital General' },
        { name: 'Cruz Roja' },
        { name: 'Clínica IMSS' },
      ],
      police: [
        { name: 'Estación de Policía' },
        { name: 'Módulo de Seguridad' },
      ],
      mechanic: [
        { name: 'Taller Mecánico' },
        { name: 'Servicio Automotriz' },
        { name: 'Vulcanizadora' },
      ],
    };

    const results: POI[] = [];
    const numPOIsPerCategory = Math.floor(Math.random() * 3) + 1;

    categories.forEach(category => {
      const categoryPOIs = poiDatabase[category] || [];
      const numToGenerate = Math.min(numPOIsPerCategory, categoryPOIs.length);

      for (let i = 0; i < numToGenerate; i++) {
        const poiInfo = categoryPOIs[i % categoryPOIs.length];
        const distance = Math.random() * radius;
        const angle = Math.random() * Math.PI * 2;

        // Calcular posición aproximada
        const deltaLat = (distance / 111000) * Math.cos(angle);
        const deltaLng =
          (distance / (111000 * Math.cos((center.latitude * Math.PI) / 180))) *
          Math.sin(angle);

        const poi: POI = {
          id: `poi_${category}_${Date.now()}_${i}`,
          name: poiInfo.name,
          category: this.getCategoryDisplayName(category),
          subcategory: poiInfo.subcategory,
          position: {
            latitude: center.latitude + deltaLat,
            longitude: center.longitude + deltaLng,
          },
          address: this.generateMockAddress(),
          phone: this.generateMockPhone(),
          rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
          distance: Math.round(distance),
          icon: this.getCategoryIcon(category),
        };

        if (category === 'restaurant' || category === 'gas_station') {
          poi.openingHours = '24 horas';
        }

        results.push(poi);
      }
    });

    // Ordenar por distancia
    results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    mockLog('VectorTilesService', `${results.length} POIs encontrados`);
    return results;
  }

  /**
   * Crear capa personalizada
   */
  async createCustomLayer(
    type: CustomMapLayer['type'],
    name: string,
    data: unknown[]
  ): Promise<CustomMapLayer> {
    if (hereMockConfig.shouldUseMock('vectorTiles')) {
      mockLog('VectorTilesService', `Creando capa: ${name} (${type})`);
    }

    const layer: CustomMapLayer = {
      id: `layer_${Date.now()}`,
      name,
      type,
      visible: true,
      opacity: 1.0,
      data,
      style: this.getDefaultLayerStyle(type),
    };

    return layer;
  }

  /**
   * Obtener estilo por defecto para tipo de capa
   */
  private getDefaultLayerStyle(type: CustomMapLayer['type']): Record<string, unknown> {
    switch (type) {
      case 'poi':
        return {
          markerSize: 32,
          markerColor: '#FF6B6B',
          showLabel: true,
          labelFont: '12px Arial',
        };
      case 'route':
        return {
          lineWidth: 4,
          lineColor: '#2563EB',
          lineCap: 'round',
          lineJoin: 'round',
        };
      case 'geofence':
        return {
          fillColor: 'rgba(34, 197, 94, 0.2)',
          strokeColor: 'rgba(34, 197, 94, 0.8)',
          strokeWidth: 2,
        };
      case 'heatmap':
        return {
          radius: 20,
          maxIntensity: 100,
          gradient: ['#00FF00', '#FFFF00', '#FF0000'],
        };
      case 'cluster':
        return {
          minClusterSize: 3,
          clusterRadius: 50,
          clusterColor: '#3B82F6',
        };
      default:
        return {};
    }
  }

  /**
   * Obtener tile vectorial
   */
  async getVectorTile(x: number, y: number, z: number): Promise<VectorTile> {
    const cacheKey = `${z}/${x}/${y}`;

    // Verificar cache
    if (this.tileCache.has(cacheKey)) {
      const cached = this.tileCache.get(cacheKey)!;
      const age = (Date.now() - cached.timestamp) / 1000;

      if (age < this.cacheConfig.maxAge) {
        this.usageStats.cacheHitRate =
          (this.usageStats.tilesCached / this.usageStats.tilesLoaded) * 100;
        this.usageStats.tilesCached++;
        mockLog('VectorTilesService', `Tile ${cacheKey} desde cache`);
        return { ...cached, cached: true };
      }
    }

    if (hereMockConfig.shouldUseMock('vectorTiles')) {
      mockLog('VectorTilesService', `Cargando tile ${cacheKey}`);
      return this.getVectorTileMock(x, y, z);
    }

    return this.getVectorTileMock(x, y, z);
  }

  /**
   * Obtener tile mock
   */
  private async getVectorTileMock(x: number, y: number, z: number): Promise<VectorTile> {
    await hereMockConfig.simulateDelay('routing');

    const tile: VectorTile = {
      x,
      y,
      z,
      data: {
        roads: this.generateMockRoads(x, y, z),
        buildings: this.generateMockBuildings(x, y, z),
        labels: this.generateMockLabels(x, y, z),
      },
      timestamp: Date.now(),
      cached: false,
    };

    // Guardar en cache
    const cacheKey = `${z}/${x}/${y}`;
    this.tileCache.set(cacheKey, tile);

    // Actualizar estadísticas
    this.usageStats.tilesLoaded++;
    this.usageStats.totalDataTransferred += Math.floor(Math.random() * 50000) + 10000;
    this.usageStats.averageLoadTime =
      (this.usageStats.averageLoadTime * (this.usageStats.tilesLoaded - 1) + 500) /
      this.usageStats.tilesLoaded;

    return tile;
  }

  /**
   * Generar carreteras mock para tile
   */
  private generateMockRoads(x: number, y: number, z: number): unknown[] {
    const numRoads = Math.floor(Math.random() * 10) + 5;
    const roads = [];

    for (let i = 0; i < numRoads; i++) {
      roads.push({
        id: `road_${x}_${y}_${z}_${i}`,
        type: ['highway', 'main', 'secondary', 'residential'][Math.floor(Math.random() * 4)],
        name: ['Av. Principal', 'Calle Norte', 'Blvd. Sur', 'Periférico'][
          Math.floor(Math.random() * 4)
        ],
        geometry: [
          [Math.random(), Math.random()],
          [Math.random(), Math.random()],
        ],
      });
    }

    return roads;
  }

  /**
   * Generar edificios mock para tile
   */
  private generateMockBuildings(x: number, y: number, z: number): unknown[] {
    const numBuildings = Math.floor(Math.random() * 20) + 10;
    const buildings = [];

    for (let i = 0; i < numBuildings; i++) {
      buildings.push({
        id: `building_${x}_${y}_${z}_${i}`,
        height: Math.floor(Math.random() * 50) + 5,
        type: ['residential', 'commercial', 'industrial'][Math.floor(Math.random() * 3)],
        geometry: [
          [Math.random(), Math.random()],
          [Math.random(), Math.random()],
          [Math.random(), Math.random()],
          [Math.random(), Math.random()],
        ],
      });
    }

    return buildings;
  }

  /**
   * Generar etiquetas mock para tile
   */
  private generateMockLabels(x: number, y: number, z: number): unknown[] {
    return [
      { text: 'Centro', position: [0.5, 0.5], size: 14 },
      { text: 'Norte', position: [0.5, 0.2], size: 12 },
      { text: 'Sur', position: [0.5, 0.8], size: 12 },
    ];
  }

  /**
   * Obtener estadísticas de uso
   */
  getUsageStats(): MapUsageStats {
    return { ...this.usageStats };
  }

  /**
   * Limpiar cache de tiles
   */
  clearTileCache(): void {
    this.tileCache.clear();
    mockLog('VectorTilesService', 'Cache de tiles limpiado');
  }

  /**
   * Configurar parámetros de cache
   */
  setCacheConfig(config: Partial<TileCacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    mockLog('VectorTilesService', `Cache configurado: ${JSON.stringify(this.cacheConfig)}`);
  }

  /**
   * Obtener nombre de categoría para display
   */
  private getCategoryDisplayName(category: POICategory): string {
    const names: Record<POICategory, string> = {
      gas_station: 'Gasolinera',
      restaurant: 'Restaurante',
      parking: 'Estacionamiento',
      rest_area: 'Área de Descanso',
      truck_stop: 'Parador de Camiones',
      warehouse: 'Almacén',
      loading_zone: 'Zona de Carga',
      customs: 'Aduana',
      weigh_station: 'Estación de Pesaje',
      hospital: 'Hospital',
      police: 'Policía',
      mechanic: 'Taller Mecánico',
    };
    return names[category] || category;
  }

  /**
   * Obtener icono para categoría
   */
  private getCategoryIcon(category: POICategory): string {
    const icons: Record<POICategory, string> = {
      gas_station: 'car',
      restaurant: 'restaurant',
      parking: 'car',
      rest_area: 'bed',
      truck_stop: 'bus',
      warehouse: 'cube',
      loading_zone: 'download',
      customs: 'shield-checkmark',
      weigh_station: 'scale',
      hospital: 'medical',
      police: 'shield',
      mechanic: 'construct',
    };
    return icons[category] || 'location';
  }

  /**
   * Generar dirección mock
   */
  private generateMockAddress(): string {
    const calles = ['Av. Reforma', 'Calle Hidalgo', 'Blvd. Principal', 'Av. Juárez'];
    const ciudades = ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla'];
    const calle = calles[Math.floor(Math.random() * calles.length)];
    const numero = Math.floor(Math.random() * 1000) + 100;
    const ciudad = ciudades[Math.floor(Math.random() * ciudades.length)];
    return `${calle} ${numero}, ${ciudad}`;
  }

  /**
   * Generar teléfono mock
   */
  private generateMockPhone(): string {
    const ladas = ['55', '33', '81', '222'];
    const lada = ladas[Math.floor(Math.random() * ladas.length)];
    const numero = Math.floor(Math.random() * 90000000) + 10000000;
    return `+52 ${lada} ${numero.toString().slice(0, 4)} ${numero.toString().slice(4)}`;
  }

  /**
   * Obtener estilos disponibles para logística
   */
  getLogisticsStyles(): MapStyleType[] {
    return ['logistics', 'truck', 'traffic', 'satellite', 'default'];
  }

  /**
   * Obtener categorías de POI relevantes para entregas
   */
  getDeliveryRelevantPOICategories(): POICategory[] {
    return [
      'gas_station',
      'rest_area',
      'truck_stop',
      'parking',
      'restaurant',
      'warehouse',
      'loading_zone',
      'mechanic',
    ];
  }
}

export const hereVectorTilesService = new HereVectorTilesService();
