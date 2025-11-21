import { BehaviorSubject, interval, map, takeUntil, Subject } from 'rxjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface SimulacionEntrega {
  id: string;
  cliente: string;
  direccion: string;
  latitud: number;
  longitud: number;
  estado: 'PENDIENTE' | 'EN_RUTA' | 'LLEGANDO' | 'EN_ENTREGA' | 'COMPLETADA';
  distanciaRestante: number;
  tiempoEstimado: number;
  ordenVenta: string;
  folio: string;
  articulos: number;
  peso: number;
}

export interface UbicacionChofer {
  latitud: number;
  longitud: number;
  velocidad: number;
  timestamp: Date;
}

export interface RutaOptima {
  puntos: Array<{ lat: number; lng: number }>;
  distanciaTotal: number;
  tiempoEstimado: number;
}

class SimulationService {
  private ubicacionChofer$ = new BehaviorSubject<UbicacionChofer>({
    latitud: 25.686613, // Monterrey centro
    longitud: -100.316113,
    velocidad: 0,
    timestamp: new Date()
  });

  private entregaActiva$ = new BehaviorSubject<SimulacionEntrega | null>(null);
  private simulacionActiva$ = new BehaviorSubject<boolean>(false);
  private stopSimulation$ = new Subject<void>();
  private entregas$ = new BehaviorSubject<SimulacionEntrega[]>([]);
  private rutaActual$ = new BehaviorSubject<RutaOptima | null>(null);

  private readonly STORAGE_KEY = 'simulation_entregas';
  
  // Variables para controlar el movimiento
  private intervalId: NodeJS.Timeout | null = null;
  private puntoActualRuta = 0;
  private interpolacionProgreso = 0;

  constructor() {
    this.cargarEntregasGuardadas();
  }

  /**
   * Cargar entregas guardadas del storage
   */
  private async cargarEntregasGuardadas(): Promise<void> {
    try {
      const entregasGuardadas = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (entregasGuardadas) {
        const entregas = JSON.parse(entregasGuardadas);
        this.entregas$.next(entregas);
      } else {
        // Crear entregas por defecto si no hay ninguna guardada
        await this.generarEntregasPorDefecto();
      }
    } catch (error) {
      console.error('[SIMULATION] Error cargando entregas:', error);
      await this.generarEntregasPorDefecto();
    }
  }

  /**
   * Generar entregas por defecto para la simulación
   */
  private async generarEntregasPorDefecto(): Promise<void> {
    const entregasDefecto: SimulacionEntrega[] = [
      {
        id: 'SIM_001',
        cliente: 'Empresa Demo SA',
        direccion: 'Av. Constitución 2404, Centro, Monterrey',
        latitud: 25.694800,
        longitud: -100.310200,
        estado: 'PENDIENTE',
        distanciaRestante: 0,
        tiempoEstimado: 0,
        ordenVenta: 'OV-2025-001',
        folio: 'EMB-001',
        articulos: 5,
        peso: 125.5
      },
      {
        id: 'SIM_002',
        cliente: 'Corporativo Pruebas',
        direccion: 'Calle Morelos 847, Centro, Monterrey',
        latitud: 25.678900,
        longitud: -100.324500,
        estado: 'PENDIENTE',
        distanciaRestante: 0,
        tiempoEstimado: 0,
        ordenVenta: 'OV-2025-002',
        folio: 'EMB-002',
        articulos: 8,
        peso: 89.3
      },
      {
        id: 'SIM_003',
        cliente: 'Industrias del Norte',
        direccion: 'Blvd. Miguel Alemán 1500, San Nicolás',
        latitud: 25.742000,
        longitud: -100.295000,
        estado: 'PENDIENTE',
        distanciaRestante: 0,
        tiempoEstimado: 0,
        ordenVenta: 'OV-2025-003',
        folio: 'EMB-003',
        articulos: 12,
        peso: 245.8
      }
    ];

    await this.guardarEntregas(entregasDefecto);
  }

  /**
   * Guardar entregas en storage
   */
  private async guardarEntregas(entregas: SimulacionEntrega[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(entregas));
      this.entregas$.next(entregas);
    } catch (error) {
      console.error('[SIMULATION] Error guardando entregas:', error);
    }
  }

  /**
   * Obtener entregas para simulación
   */
  getEntregasSimulacion(): SimulacionEntrega[] {
    return this.entregas$.value;
  }

  /**
   * Crear nueva entrega
   */
  async crearEntrega(entrega: Omit<SimulacionEntrega, 'id' | 'estado' | 'distanciaRestante' | 'tiempoEstimado'>): Promise<void> {
    const entregas = this.entregas$.value;
    const nuevaEntrega: SimulacionEntrega = {
      ...entrega,
      id: `SIM_${Date.now()}`,
      estado: 'PENDIENTE',
      distanciaRestante: 0,
      tiempoEstimado: 0
    };

    const entregasActualizadas = [...entregas, nuevaEntrega];
    await this.guardarEntregas(entregasActualizadas);
  }

  /**
   * Editar entrega existente
   */
  async editarEntrega(entregaId: string, cambios: Partial<SimulacionEntrega>): Promise<void> {
    const entregas = this.entregas$.value;
    const indice = entregas.findIndex(e => e.id === entregaId);
    
    if (indice === -1) {
      throw new Error('Entrega no encontrada');
    }

    // No permitir editar si está activa
    if (this.entregaActiva$.value?.id === entregaId) {
      throw new Error('No se puede editar una entrega en simulación activa');
    }

    entregas[indice] = { ...entregas[indice], ...cambios };
    await this.guardarEntregas(entregas);
  }

  /**
   * Eliminar entrega
   */
  async eliminarEntrega(entregaId: string): Promise<void> {
    const entregas = this.entregas$.value;
    
    // No permitir eliminar si está activa
    if (this.entregaActiva$.value?.id === entregaId) {
      throw new Error('No se puede eliminar una entrega en simulación activa');
    }

    const entregasActualizadas = entregas.filter(e => e.id !== entregaId);
    await this.guardarEntregas(entregasActualizadas);
  }

  /**
   * Calcular ruta óptima hacia el destino usando HERE Maps routingService
   */
  private async calcularRutaOptima(origen: { lat: number; lng: number }, destino: { lat: number; lng: number }): Promise<RutaOptima> {
    // Importar routingService de forma dinámica para evitar dependencias circulares
    const { routingService } = await import('./routingService');

    try {
      // Usar HERE Maps routingService para obtener la ruta real
      const rutaHere = await routingService.obtenerRutaOptima(
        { latitude: origen.lat, longitude: origen.lng },
        { latitude: destino.lat, longitude: destino.lng }
      );

      console.log(`📍 [SIMULATION] Ruta calculada con HERE Maps: ${(rutaHere.distance / 1000).toFixed(2)}km, ${rutaHere.coordinates.length} puntos`);

      // Convertir formato de coordinates a nuestro formato
      const puntos = rutaHere.coordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude
      }));

      return {
        puntos,
        distanciaTotal: rutaHere.distance,
        tiempoEstimado: Math.round(rutaHere.duration / 60) // convertir segundos a minutos
      };
    } catch (error) {
      console.error('[SIMULATION] Error obteniendo ruta de HERE Maps, usando fallback:', error);

      // Fallback: crear ruta básica si falla HERE Maps
      return this.calcularRutaFallback(origen, destino);
    }
  }

  /**
   * Ruta fallback simple (solo en caso de error)
   */
  private calcularRutaFallback(origen: { lat: number; lng: number }, destino: { lat: number; lng: number }): RutaOptima {
    const distancia = this.calcularDistancia(origen.lat, origen.lng, destino.lat, destino.lng);
    const tiempoEstimado = Math.round(distancia / 500); // minutos

    return {
      puntos: [origen, destino],
      distanciaTotal: distancia,
      tiempoEstimado
    };
  }

  /**
   * Iniciar simulación de entrega
   */
  async iniciarSimulacionEntrega(entregaId: string): Promise<void> {
    const entregas = this.entregas$.value;
    const entrega = entregas.find(e => e.id === entregaId);

    if (!entrega) {
      throw new Error(`Entrega ${entregaId} no encontrada`);
    }

    if (entrega.estado === 'COMPLETADA') {
      throw new Error('Esta entrega ya fue completada');
    }

    console.log(`🚚 [SIMULACIÓN] Iniciando simulación para: ${entrega.cliente}`);

    // Parar simulación anterior si existe
    await this.pararSimulacion();

    // Activar modo simulación en locationTrackingService
    const { locationTrackingService } = await import('@/shared/services/locationTrackingService');
    locationTrackingService.enableSimulationMode(true);

    // Calcular ruta óptima usando HERE Maps
    const ubicacionActual = this.ubicacionChofer$.value;
    const ruta = await this.calcularRutaOptima(
      { lat: ubicacionActual.latitud, lng: ubicacionActual.longitud },
      { lat: entrega.latitud, lng: entrega.longitud }
    );

    this.rutaActual$.next(ruta);

    // Actualizar estado de entrega
    entrega.estado = 'EN_RUTA';
    entrega.tiempoEstimado = ruta.tiempoEstimado;
    await this.guardarEntregas(entregas);

    // Establecer entrega activa
    this.entregaActiva$.next(entrega);
    this.simulacionActiva$.next(true);

    // Iniciar movimiento
    this.iniciarMovimientoChofer(ruta.puntos, entrega);
  }

  /**
   * Iniciar movimiento del chofer siguiendo la ruta
   */
  private async iniciarMovimientoChofer(ruta: Array<{ lat: number; lng: number }>, entrega: SimulacionEntrega): Promise<void> {
    this.puntoActualRuta = 0;
    this.interpolacionProgreso = 0;

    // Importar locationTrackingService
    const { locationTrackingService } = await import('@/shared/services/locationTrackingService');

    // Velocidad de movimiento (cada 1 segundo)
    this.intervalId = setInterval(() => {
      if (this.puntoActualRuta >= ruta.length - 1) {
        // Llegó al destino
        this.onLlegarDestino(entrega);
        return;
      }

      const puntoOrigen = ruta[this.puntoActualRuta];
      const puntoDestino = ruta[this.puntoActualRuta + 1];

      // Interpolación suave entre puntos
      this.interpolacionProgreso += 0.1; // Velocidad de interpolación

      if (this.interpolacionProgreso >= 1) {
        // Avanzar al siguiente segmento
        this.puntoActualRuta++;
        this.interpolacionProgreso = 0;

        if (this.puntoActualRuta >= ruta.length - 1) {
          return;
        }
      }

      // Calcular nueva posición interpolada
      const latitud = puntoOrigen.lat + (puntoDestino.lat - puntoOrigen.lat) * this.interpolacionProgreso;
      const longitud = puntoOrigen.lng + (puntoDestino.lng - puntoOrigen.lng) * this.interpolacionProgreso;
      const velocidad = 25 + Math.random() * 10; // 25-35 km/h

      const nuevaUbicacion: UbicacionChofer = {
        latitud,
        longitud,
        velocidad,
        timestamp: new Date()
      };

      // Calcular heading (dirección) basado en el movimiento
      const deltaLat = puntoDestino.lat - puntoOrigen.lat;
      const deltaLng = puntoDestino.lng - puntoOrigen.lng;
      const heading = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);

      // Actualizar locationTrackingService con la ubicación simulada
      locationTrackingService.updateSimulatedLocation(latitud, longitud, velocidad, heading);

      // Calcular distancia al destino
      const distancia = this.calcularDistancia(
        latitud,
        longitud,
        entrega.latitud,
        entrega.longitud
      );

      // Actualizar estado según distancia
      this.actualizarEstadoSegunDistancia(entrega, distancia);

      // Emitir nueva ubicación
      this.ubicacionChofer$.next(nuevaUbicacion);

    }, 1000); // Actualizar cada segundo
  }

  /**
   * Actualizar estado de entrega según distancia
   */
  private async actualizarEstadoSegunDistancia(entrega: SimulacionEntrega, distancia: number): Promise<void> {
    const estadoAnterior = entrega.estado;
    
    if (distancia <= 50) {
      entrega.estado = 'EN_ENTREGA';
    } else if (distancia <= 200) {
      entrega.estado = 'LLEGANDO';
    } else {
      entrega.estado = 'EN_RUTA';
    }

    entrega.distanciaRestante = distancia;
    entrega.tiempoEstimado = Math.round(distancia / 500 * 60); // Estimado en minutos

    if (estadoAnterior !== entrega.estado) {
      console.log(`🔄 [SIMULACIÓN] ${entrega.cliente}: ${estadoAnterior} → ${entrega.estado} (${distancia.toFixed(0)}m)`);
      
      // Guardar cambios en storage
      const entregas = this.entregas$.value;
      const indice = entregas.findIndex(e => e.id === entrega.id);
      if (indice !== -1) {
        entregas[indice] = { ...entrega };
        await this.guardarEntregas(entregas);
      }

      this.entregaActiva$.next({ ...entrega });
    }
  }

  /**
   * Evento cuando chofer llega al destino
   */
  private async onLlegarDestino(entrega: SimulacionEntrega): Promise<void> {
    console.log(`🎯 [SIMULACIÓN] ¡Llegó al destino! - ${entrega.cliente}`);
    
    entrega.estado = 'EN_ENTREGA';
    entrega.distanciaRestante = 0;
    entrega.tiempoEstimado = 0;
    
    // Guardar en storage
    const entregas = this.entregas$.value;
    const indice = entregas.findIndex(e => e.id === entrega.id);
    if (indice !== -1) {
      entregas[indice] = { ...entrega };
      await this.guardarEntregas(entregas);
    }

    this.entregaActiva$.next({ ...entrega });

    // Limpiar intervalo
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Completar entrega manualmente
   */
  async completarEntrega(): Promise<void> {
    const entregaActual = this.entregaActiva$.value;
    if (!entregaActual) return;

    console.log(`✅ [SIMULACIÓN] Entrega completada: ${entregaActual.cliente}`);
    
    entregaActual.estado = 'COMPLETADA';
    
    // Guardar en storage
    const entregas = this.entregas$.value;
    const indice = entregas.findIndex(e => e.id === entregaActual.id);
    if (indice !== -1) {
      entregas[indice] = { ...entregaActual };
      await this.guardarEntregas(entregas);
    }

    this.entregaActiva$.next({ ...entregaActual });
    
    // Parar simulación después de 3 segundos
    setTimeout(() => {
      this.pararSimulacion();
    }, 3000);
  }

  /**
   * Parar simulación
   */
  async pararSimulacion(): Promise<void> {
    console.log('🛑 [SIMULACIÓN] Deteniendo simulación...');

    // Limpiar intervalo
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Desactivar modo simulación en locationTrackingService
    try {
      const { locationTrackingService } = await import('@/shared/services/locationTrackingService');
      locationTrackingService.enableSimulationMode(false);
    } catch (error) {
      console.error('[SIMULACIÓN] Error desactivando modo simulación:', error);
    }

    this.simulacionActiva$.next(false);
    this.entregaActiva$.next(null);
    this.rutaActual$.next(null);
    this.stopSimulation$.next();
    this.puntoActualRuta = 0;
    this.interpolacionProgreso = 0;
  }

  /**
   * Verificar si chofer puede realizar entrega (está en geofence)
   */
  puedeRealizarEntrega(): boolean {
    const entregaActiva = this.entregaActiva$.value;
    return entregaActiva?.estado === 'EN_ENTREGA' && entregaActiva.distanciaRestante <= 50;
  }

  /**
   * Calcular distancia usando Haversine
   */
  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Reiniciar todas las entregas a estado PENDIENTE
   */
  async reiniciarTodasLasEntregas(): Promise<void> {
    const entregas = this.entregas$.value.map(entrega => ({
      ...entrega,
      estado: 'PENDIENTE' as const,
      distanciaRestante: 0,
      tiempoEstimado: 0
    }));

    await this.guardarEntregas(entregas);
    await this.pararSimulacion();
  }

  /**
   * Generar entrega aleatoria para testing
   */
  async generarEntregaAleatoria(): Promise<void> {
    const clientes = [
      'Empresa ABC Corp',
      'Corporativo XYZ Ltd',
      'Industrias 123 SA',
      'Comercial Demo Inc',
      'Distribuidora Test',
      'Grupo Empresarial MTY'
    ];

    const direcciones = [
      'Av. Universidad 1234, San Nicolás',
      'Calle Juárez 567, Guadalupe',
      'Blvd. Díaz Ordaz 890, San Pedro',
      'Av. Gonzalitos 2100, Monterrey',
      'Calle Hidalgo 345, Santa Catarina',
      'Av. Lincoln 1800, Monterrey'
    ];

    const baseLatitude = 25.6866;
    const baseLongitude = -100.3161;
    const radioKm = 0.02; // 2km de radio

    const nuevaEntrega = {
      cliente: clientes[Math.floor(Math.random() * clientes.length)],
      direccion: direcciones[Math.floor(Math.random() * direcciones.length)],
      latitud: baseLatitude + (Math.random() - 0.5) * radioKm,
      longitud: baseLongitude + (Math.random() - 0.5) * radioKm,
      ordenVenta: `OV-${Date.now()}`,
      folio: `EMB-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      articulos: Math.floor(Math.random() * 15) + 1,
      peso: Math.round((Math.random() * 300 + 50) * 10) / 10
    };

    await this.crearEntrega(nuevaEntrega);
  }

  /**
   * Obtener observables para suscripción
   */
  get ubicacionChofer() {
    return this.ubicacionChofer$.asObservable();
  }

  get entregaActiva() {
    return this.entregaActiva$.asObservable();
  }

  get simulacionActiva() {
    return this.simulacionActiva$.asObservable();
  }

  get entregas() {
    return this.entregas$.asObservable();
  }

  get rutaActual() {
    return this.rutaActual$.asObservable();
  }
  /**
   * ⭐ NUEVO: Generar datos de simulación en el nuevo formato JSON de la API
   * 
   * Genera diferentes escenarios de prueba:
   * - 'con-coordenadas': Todas las direcciones tienen coordenadas
   * - 'sin-coordenadas': Ninguna dirección tiene coordenadas (prueba geocodificación)
   * - 'mixto': Algunas direcciones con coordenadas, otras sin (caso más realista)
   * - 'direcciones-invalidas': Incluye direcciones que no podrán ser geocodificadas
   */
  generarEjemploParaNuevoFormato(
    tipo: 'con-coordenadas' | 'sin-coordenadas' | 'mixto' | 'direcciones-invalidas' = 'mixto'
  ): any {
    const ejemplos = {
      'con-coordenadas': {
        folioEmbarque: 'SIM-COORD-2025-001',
        idRutaHereMaps: null, // Ruta nueva
        direcciones: [
          {
            direccion: 'Av. Constitución 2404, Centro, 64000 Monterrey, N.L.',
            cliente: 'Empresa Demo SA',
            latitud: '25.694800',
            longitud: '-100.310200',
            cp: '64000',
            calle: 'Av. Constitución',
            noExterior: '2404',
            colonia: 'Centro',
            municipio: 'Monterrey',
            estado: 'Nuevo León',
          },
          {
            direccion: 'Calle Morelos 847, Centro, 64000 Monterrey, N.L.',
            cliente: 'Corporativo Pruebas',
            latitud: '25.678900',
            longitud: '-100.324500',
            cp: '64000',
            calle: 'Calle Morelos',
            noExterior: '847',
            colonia: 'Centro',
            municipio: 'Monterrey',
            estado: 'Nuevo León',
          },
          {
            direccion: 'Blvd. Miguel Alemán 1500, 66450 San Nicolás de los Garza, N.L.',
            cliente: 'Industrias del Norte',
            latitud: '25.742000',
            longitud: '-100.295000',
            cp: '66450',
            calle: 'Blvd. Miguel Alemán',
            noExterior: '1500',
            colonia: 'Residencial Lincoln',
            municipio: 'San Nicolás de los Garza',
            estado: 'Nuevo León',
          },
        ],
      },
      'sin-coordenadas': {
        folioEmbarque: 'SIM-NOCOORD-2025-002',
        idRutaHereMaps: null,
        direcciones: [
          {
            direccion: 'Av. Constitución 2404, Centro, 64000 Monterrey, N.L.',
            cliente: 'Empresa Demo SA',
            // Sin latitud ni longitud - prueba geocodificación por campos
            cp: '64000',
            calle: 'Av. Constitución',
            noExterior: '2404',
            colonia: 'Centro',
            municipio: 'Monterrey',
            estado: 'Nuevo León',
          },
          {
            direccion: 'Calle Morelos 847, Centro, 64000 Monterrey, N.L.',
            cliente: 'Corporativo Pruebas',
            // Sin coordenadas - prueba geocodificación por dirección completa
            cp: '64000',
            calle: 'Calle Morelos',
            noExterior: '847',
            colonia: 'Centro',
            municipio: 'Monterrey',
            estado: 'Nuevo León',
          },
        ],
      },
      'mixto': {
        folioEmbarque: 'SIM-MIXTO-2025-003',
        idRutaHereMaps: 'RUTA-EXISTENTE-12345', // Simular ruta existente
        direcciones: [
          {
            direccion: 'José María Caracas 1310, Guadalupe Victoria, 96520 Coatzacoalcos, Ver.',
            cliente: 'JUAN PGRAL REYES',
            latitud: '18.144719522128238', // Con coordenadas
            longitud: '-94.46089643238795',
            cp: '96520',
            calle: 'José María Caracas',
            noExterior: '1310',
            colonia: 'Guadalupe Victoria',
            municipio: 'Coatzacoalcos',
            estado: 'Veracruz',
          },
          {
            direccion: 'Río Lerma 122, Colinas del Lago, 54744 Cuautitlán Izcalli, Méx.',
            cliente: 'TRANSPORTES MARVA',
            // Sin coordenadas - debe geocodificar
            cp: '54744',
            calle: 'Río Lerma',
            noExterior: '122',
            colonia: 'Colinas del Lago',
            municipio: 'Cuautitlán Izcalli',
            estado: 'México',
          },
          {
            direccion: 'C. 7 Sur 5943, Girasol, 72440 Heroica Puebla de Zaragoza, Pue.',
            cliente: 'TRANSPORTES FABRES',
            latitud: '19.64295650284401', // Con coordenadas
            longitud: '-99.22825623421272',
            cp: '72440',
            calle: 'C. 7 Sur',
            noExterior: '5943',
            colonia: 'Girasol',
            municipio: 'Heroica Puebla de Zaragoza',
            estado: 'Puebla',
          },
        ],
      },
      'direcciones-invalidas': {
        folioEmbarque: 'SIM-INVALIDAS-2025-004',
        idRutaHereMaps: null,
        direcciones: [
          {
            direccion: 'Av. Constitución 2404, Centro, 64000 Monterrey, N.L.',
            cliente: 'Dirección Válida',
            latitud: '25.694800',
            longitud: '-100.310200',
            cp: '64000',
            calle: 'Av. Constitución',
            noExterior: '2404',
            colonia: 'Centro',
            municipio: 'Monterrey',
            estado: 'Nuevo León',
          },
          {
            direccion: 'Calle Inexistente 9999, Colonia Ficticia',
            cliente: 'Dirección Inválida 1',
            // Coordenadas inválidas
            latitud: '0',
            longitud: '0',
            // Datos insuficientes para geocodificar
            calle: 'Calle Inexistente',
            noExterior: '9999',
          },
          {
            direccion: '',
            cliente: 'Dirección Inválida 2',
            // Sin datos - debe fallar
          },
        ],
      },
    };

    const ejemplo = ejemplos[tipo];
    console.log(`[SIMULATION] 📋 Generando ejemplo '${tipo}':`);
    console.log(`   Folio: ${ejemplo.folioEmbarque}`);
    console.log(`   ID Ruta: ${ejemplo.idRutaHereMaps || 'null (nueva)'}`);
    console.log(`   Direcciones: ${ejemplo.direcciones.length}`);

    return ejemplo;
  }

  /**
   * ⭐ NUEVO: Simular respuesta de API con diferentes escenarios
   * 
   * Útil para testing y desarrollo sin necesidad del backend
   */
  async simularRespuestaAPI(
    tipo: 'con-coordenadas' | 'sin-coordenadas' | 'mixto' | 'direcciones-invalidas' = 'mixto',
    delayMs: number = 1000
  ): Promise<any> {
    console.log(`[SIMULATION] 🌐 Simulando llamada a API (delay: ${delayMs}ms)...`);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    const response = this.generarEjemploParaNuevoFormato(tipo);
    
    console.log('[SIMULATION] ✅ Respuesta simulada lista');
    return response;
  }
}

export const simulationService = new SimulationService();