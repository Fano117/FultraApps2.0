/**
 * HERE Maps Mock Configuration
 *
 * Sistema centralizado para controlar el modo mock de todos los servicios HERE Maps.
 * Permite habilitar/deshabilitar simulación de forma global o por servicio individual.
 */

export interface ServiceStatus {
  name: string;
  displayName: string;
  implemented: boolean;
  useMock: boolean;
  description: string;
  category: 'core' | 'recommended' | 'advanced';
  priority: number; // 1-10, mayor es más importante
}

export interface HereMockConfiguration {
  // Modo global
  globalMockEnabled: boolean;

  // Configuración por servicio
  services: {
    // Core Services (Imprescindibles)
    routing: boolean;
    traffic: boolean;
    waypointsOptimization: boolean;
    geocoding: boolean;
    truckRouting: boolean;
    fleetTelematics: boolean;
    vectorTiles: boolean;
    navigation: boolean;

    // Servicios Recomendados
    matrixRouting: boolean;
    destinationWeather: boolean;
    geofencing: boolean;
  };

  // Delays de simulación (ms)
  delays: {
    routing: number;
    traffic: number;
    geocoding: number;
    weather: number;
    matrix: number;
    fleet: number;
    geofencing: number;
  };
}

/**
 * Configuración por defecto - ROUTING USA API REAL PARA TRAZADO CORRECTO
 */
const defaultMockConfig: HereMockConfiguration = {
  globalMockEnabled: true,

  services: {
    // Core
    routing: false, // DESACTIVADO: Usar API real de HERE para rutas que siguen calles reales
    traffic: true,
    waypointsOptimization: true,
    geocoding: true,
    truckRouting: true,
    fleetTelematics: true,
    vectorTiles: true,
    navigation: true,

    // Recomendados
    matrixRouting: true,
    destinationWeather: true,
    geofencing: true,
  },

  delays: {
    routing: 800,
    traffic: 500,
    geocoding: 400,
    weather: 600,
    matrix: 1200,
    fleet: 1500,
    geofencing: 300,
  },
};

class HereMockConfigService {
  private config: HereMockConfiguration;
  private statusListeners: Array<() => void> = [];

  constructor() {
    this.config = { ...defaultMockConfig };
  }

  /**
   * Obtener configuración actual
   */
  getConfig(): HereMockConfiguration {
    return { ...this.config };
  }

  /**
   * Verificar si un servicio debe usar mock
   */
  shouldUseMock(serviceName: keyof HereMockConfiguration['services']): boolean {
    return this.config.globalMockEnabled && this.config.services[serviceName];
  }

  /**
   * Obtener delay para un servicio
   */
  getDelay(serviceName: keyof HereMockConfiguration['delays']): number {
    return this.config.delays[serviceName] || 500;
  }

  /**
   * Habilitar/deshabilitar mock global
   */
  setGlobalMock(enabled: boolean): void {
    this.config.globalMockEnabled = enabled;
    this.notifyListeners();
  }

  /**
   * Habilitar/deshabilitar mock para un servicio específico
   */
  setServiceMock(serviceName: keyof HereMockConfiguration['services'], enabled: boolean): void {
    this.config.services[serviceName] = enabled;
    this.notifyListeners();
  }

  /**
   * Establecer delay para un servicio
   */
  setDelay(serviceName: keyof HereMockConfiguration['delays'], delayMs: number): void {
    this.config.delays[serviceName] = delayMs;
  }

  /**
   * Obtener estado detallado de todos los servicios
   */
  getAllServicesStatus(): ServiceStatus[] {
    return [
      // CORE SERVICES (Imprescindibles)
      {
        name: 'routing',
        displayName: 'Routing API v8',
        implemented: true,
        useMock: this.shouldUseMock('routing'),
        description: 'Cálculo de rutas óptimas, navegación giro a giro, recálculo automático',
        category: 'core',
        priority: 10,
      },
      {
        name: 'traffic',
        displayName: 'Traffic API / Tráfico Premium',
        implemented: true,
        useMock: this.shouldUseMock('traffic'),
        description: 'Tráfico en tiempo real, incidentes, rutas dinámicas',
        category: 'core',
        priority: 9,
      },
      {
        name: 'waypointsOptimization',
        displayName: 'Waypoints Sequence / Optimización',
        implemented: true,
        useMock: this.shouldUseMock('waypointsOptimization'),
        description: 'Optimización de rutas multi-stop, ordenar entregas',
        category: 'core',
        priority: 9,
      },
      {
        name: 'geocoding',
        displayName: 'Geocoding API',
        implemented: true,
        useMock: this.shouldUseMock('geocoding'),
        description: 'Búsqueda y conversión de direcciones, autocompletar',
        category: 'core',
        priority: 10,
      },
      {
        name: 'truckRouting',
        displayName: 'Truck Routing',
        implemented: true,
        useMock: this.shouldUseMock('truckRouting'),
        description: 'Rutas para camiones, restricciones de peso, altura, peajes',
        category: 'core',
        priority: 8,
      },
      {
        name: 'fleetTelematics',
        displayName: 'Fleet Telematics / Tour Planning',
        implemented: true,
        useMock: this.shouldUseMock('fleetTelematics'),
        description: 'Gestión avanzada de flotas, optimización multi-vehículo',
        category: 'core',
        priority: 8,
      },
      {
        name: 'vectorTiles',
        displayName: 'Vector Tiles / Map Tiles API',
        implemented: true,
        useMock: this.shouldUseMock('vectorTiles'),
        description: 'Mapas 3D, visualización avanzada, POIs, estilos personalizados',
        category: 'core',
        priority: 7,
      },

      // SERVICIOS RECOMENDADOS
      {
        name: 'matrixRouting',
        displayName: 'Matrix Routing API',
        implemented: true,
        useMock: this.shouldUseMock('matrixRouting'),
        description: 'Cálculo masivo de matrices de tiempos/distancias',
        category: 'recommended',
        priority: 7,
      },
      {
        name: 'destinationWeather',
        displayName: 'Destination Weather API',
        implemented: true,
        useMock: this.shouldUseMock('destinationWeather'),
        description: 'Pronóstico y alertas meteorológicas para destinos',
        category: 'recommended',
        priority: 6,
      },
      {
        name: 'geofencing',
        displayName: 'Geofencing API (Avanzado)',
        implemented: true,
        useMock: this.shouldUseMock('geofencing'),
        description: 'Gestión avanzada de zonas de entrega y alertas automáticas',
        category: 'recommended',
        priority: 7,
      },
    ];
  }

  /**
   * Obtener resumen de estado
   */
  getStatusSummary(): {
    total: number;
    implemented: number;
    notImplemented: number;
    usingMock: number;
    usingReal: number;
  } {
    const allServices = this.getAllServicesStatus();
    const implemented = allServices.filter(s => s.implemented);
    const usingMock = implemented.filter(s => s.useMock);

    return {
      total: allServices.length,
      implemented: implemented.length,
      notImplemented: allServices.length - implemented.length,
      usingMock: usingMock.length,
      usingReal: implemented.length - usingMock.length,
    };
  }

  /**
   * Registrar listener para cambios de configuración
   */
  addStatusListener(listener: () => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.statusListeners.forEach(listener => listener());
  }

  /**
   * Simular delay de red
   */
  async simulateDelay(serviceName: keyof HereMockConfiguration['delays']): Promise<void> {
    const delay = this.getDelay(serviceName);
    const jitter = delay * 0.2 * (Math.random() - 0.5); // +/- 10% variación
    await new Promise(resolve => setTimeout(resolve, delay + jitter));
  }

  /**
   * Resetear a configuración por defecto
   */
  resetToDefaults(): void {
    this.config = { ...defaultMockConfig };
    this.notifyListeners();
  }
}

// Singleton
export const hereMockConfig = new HereMockConfigService();

// Exportar helper para logs
export const mockLog = (serviceName: string, message: string) => {
  console.log(`[${serviceName}] 🎭 MOCK: ${message}`);
};
