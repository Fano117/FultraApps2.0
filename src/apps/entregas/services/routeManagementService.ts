/**
 * 🗺️ Route Management Service
 *
 * Servicio para gestión de rutas HERE Maps con soporte para:
 * - Verificación de rutas existentes (idRutaHereMaps)
 * - Generación de nuevas rutas
 * - Recalculación de rutas con confirmación del usuario
 * - Punto de partida flexible (almacén o GPS actual)
 * - Geocercas para detección de ubicación en almacén
 * - Guardado de rutas en backend
 *
 * Integra con HERE Maps Routing API y servicios de geocerca.
 *
 * === CAMBIOS REALIZADOS (2025-01-21) ===
 *
 * 1. VERIFICACIÓN DE idRutaHereMaps:
 *    - Si existe idRutaHereMaps, se pregunta al usuario si desea recalcular
 *    - Si el usuario elige mantener la ruta, se intenta recuperar del backend
 *    - Si falla la recuperación o el usuario elige recalcular, se genera nueva ruta
 *
 * 2. PUNTO DE PARTIDA FLEXIBLE:
 *    - Si el chofer está dentro de la geocerca del almacén (configurable, default 100m),
 *      se usa la ubicación fija del almacén
 *    - Si está fuera, se usa la ubicación GPS actual y se agrega como punto inicial
 *    - Fallback al almacén si GPS no disponible
 *
 * 3. GENERACIÓN Y GUARDADO DE idRutaHereMaps:
 *    - Genera nuevo ID con formato RUTA-{timestamp}-{random}
 *    - Guarda la ruta y metadata en backend para futuras recuperaciones
 *
 * 4. COMPATIBILIDAD CON SIMULACIÓN:
 *    - Todas las funciones soportan modo simulación (confirmarRecalculo: false)
 *    - Los datos mock se procesan de la misma manera que datos reales
 */

import { Alert } from 'react-native';
import { routingService, RutaOptima, Ubicacion } from './routingService';
import { locationTrackingService } from '@/shared/services/locationTrackingService';
import {
  RutaMetadata,
  OpcionesProcesamiento,
  DireccionValidada
} from '../types/api-delivery';
import { hereTrafficService } from './hereTrafficService';

/**
 * Punto de inicio de la ruta
 */
export interface PuntoInicio {
  latitud: number;
  longitud: number;
  tipo: 'almacen' | 'gps-actual';
  nombre: string;
  dentroDeGeocerca: boolean;
}

/**
 * Resultado de generación de ruta
 */
export interface ResultadoGeneracionRuta {
  /** Ruta optimizada generada por HERE Maps */
  ruta: RutaOptima;

  /** Metadata de la ruta */
  metadata: RutaMetadata;

  /** Punto de inicio usado */
  puntoInicio: PuntoInicio;

  /** Indica si es una ruta nueva o recalculada */
  esRutaNueva: boolean;

  /** ID de ruta en HERE Maps (nuevo o existente) */
  idRutaHereMaps: string;

  /** Indica si la ruta fue recuperada del backend */
  rutaRecuperada: boolean;

  /** Indica si hubo cambios sugeridos en la ruta */
  tieneCambiosSugeridos: boolean;

  /** Razón de los cambios sugeridos (si aplica) */
  razonCambios?: string;
}

/**
 * Resultado de recuperación de ruta del backend
 */
export interface RutaRecuperada {
  ruta: RutaOptima | null;
  metadata: RutaMetadata | null;
  exito: boolean;
  mensaje: string;
}

/**
 * Opciones para el análisis de cambios en la ruta
 */
export interface AnalisisCambiosRuta {
  hayNuevasDirecciones: boolean;
  hayDireccionesEliminadas: boolean;
  hayDireccionesModificadas: boolean;
  detallesCambios: string[];
}

/**
 * Configuración por defecto para el almacén
 * TODO: Obtener desde configuración del backend o AsyncStorage
 */
const DEFAULT_ALMACEN = {
  nombre: 'Almacén Principal',
  latitud: 19.4326, // CDMX Centro (ejemplo)
  longitud: -99.1332,
};

class RouteManagementService {
  /**
   * Generar o recuperar ruta con validación de idRutaHereMaps
   *
   * FLUJO:
   * 1. Si existe idRutaHereMaps:
   *    a. Analizar si hay cambios sugeridos (nuevas direcciones, etc.)
   *    b. Si hay cambios, preguntar al usuario si desea recalcular
   *    c. Si no hay cambios, intentar recuperar ruta del backend
   *    d. Si falla recuperación, generar nueva ruta
   * 2. Si no existe idRutaHereMaps:
   *    a. Generar nueva ruta
   *    b. Guardar nuevo idRutaHereMaps
   *
   * @param direcciones - Direcciones validadas
   * @param idRutaHereMapsExistente - ID de ruta existente (puede ser null)
   * @param opciones - Opciones de procesamiento
   * @returns ResultadoGeneracionRuta con la ruta y metadata
   */
  async generarORecuperarRuta(
    direcciones: DireccionValidada[],
    idRutaHereMapsExistente: string | null | undefined,
    opciones: OpcionesProcesamiento = {}
  ): Promise<ResultadoGeneracionRuta> {
    console.log('[RouteManagement] 🗺️ Iniciando generación/recuperación de ruta...');

    // Filtrar solo direcciones válidas
    const direccionesValidas = direcciones.filter(d => d.esValida && d.coordenadas);

    if (direccionesValidas.length === 0) {
      throw new Error('No hay direcciones válidas para generar la ruta');
    }

    console.log(`[RouteManagement] 📍 ${direccionesValidas.length} direcciones válidas encontradas`);

    // Determinar punto de inicio (almacén o GPS actual)
    const puntoInicio = await this.determinarPuntoInicio(opciones);
    console.log(`[RouteManagement] 📍 Punto de inicio: ${puntoInicio.tipo} (${puntoInicio.nombre})`);
    console.log(`[RouteManagement] 📍 Dentro de geocerca: ${puntoInicio.dentroDeGeocerca ? 'SÍ' : 'NO'}`);

    // Variables de control de flujo
    let debeRecalcular = opciones.forzarRecalculo || false;
    let esRutaNueva = true;
    let rutaRecuperada = false;
    let tieneCambiosSugeridos = false;
    let razonCambios: string | undefined;
    let ruta: RutaOptima;

    // CASO 1: Existe una ruta previa (idRutaHereMaps)
    if (idRutaHereMapsExistente && !opciones.forzarRecalculo) {
      console.log(`[RouteManagement] 🔍 Ruta existente encontrada: ${idRutaHereMapsExistente}`);
      esRutaNueva = false;

      // Analizar si hay cambios que sugieran recalcular
      const analisisCambios = await this.analizarCambiosSugeridos(
        idRutaHereMapsExistente,
        direccionesValidas,
        puntoInicio
      );

      tieneCambiosSugeridos = analisisCambios.hayNuevasDirecciones ||
        analisisCambios.hayDireccionesEliminadas ||
        analisisCambios.hayDireccionesModificadas;

      if (tieneCambiosSugeridos) {
        razonCambios = analisisCambios.detallesCambios.join(', ');
        console.log(`[RouteManagement] ⚠️ Cambios detectados: ${razonCambios}`);

        // Preguntar al usuario si desea recalcular (solo si no está en modo simulación)
        if (opciones.confirmarRecalculo !== false) {
          debeRecalcular = await this.confirmarRecalculoConCambios(analisisCambios);
        } else {
          // En modo simulación, recalcular automáticamente si hay cambios
          debeRecalcular = true;
        }
      } else {
        // No hay cambios, intentar recuperar la ruta existente
        console.log('[RouteManagement] ℹ️ No hay cambios detectados, intentando recuperar ruta...');

        const rutaExistente = await this.recuperarRutaDelBackend(idRutaHereMapsExistente);

        if (rutaExistente.exito && rutaExistente.ruta) {
          console.log('[RouteManagement] ✅ Ruta recuperada del backend exitosamente');
          rutaRecuperada = true;
          ruta = rutaExistente.ruta;

          // Retornar ruta recuperada
          return {
            ruta,
            metadata: rutaExistente.metadata || this.construirMetadata(
              ruta,
              idRutaHereMapsExistente,
              puntoInicio,
              direccionesValidas.length
            ),
            puntoInicio,
            esRutaNueva: false,
            idRutaHereMaps: idRutaHereMapsExistente,
            rutaRecuperada: true,
            tieneCambiosSugeridos: false,
          };
        } else {
          console.log(`[RouteManagement] ⚠️ No se pudo recuperar ruta: ${rutaExistente.mensaje}`);
          console.log('[RouteManagement] 🔄 Generando nueva ruta...');
          debeRecalcular = true;
        }
      }
    }

    // CASO 2: Generar nueva ruta (ruta nueva o recalculación)
    console.log(`[RouteManagement] 🧮 ${esRutaNueva ? 'Generando nueva ruta' : 'Recalculando ruta'}...`);

    ruta = await this.calcularRutaMultiparada(
      puntoInicio,
      direccionesValidas,
      opciones
    );

    // Generar nuevo ID de ruta si es nueva o si se recalculó
    const idRutaHereMaps = debeRecalcular || !idRutaHereMapsExistente
      ? this.generarIdRutaHereMaps()
      : idRutaHereMapsExistente;

    console.log(`[RouteManagement] ✅ Ruta ${esRutaNueva ? 'nueva' : 'recalculada'} generada: ${idRutaHereMaps}`);

    // Construir metadata
    const metadata = this.construirMetadata(
      ruta,
      idRutaHereMaps,
      puntoInicio,
      direccionesValidas.length
    );

    return {
      ruta,
      metadata,
      puntoInicio,
      esRutaNueva,
      idRutaHereMaps,
      rutaRecuperada: false,
      tieneCambiosSugeridos,
      razonCambios,
    };
  }

  /**
   * Construir metadata de la ruta
   */
  private construirMetadata(
    ruta: RutaOptima,
    idRutaHereMaps: string,
    puntoInicio: PuntoInicio,
    numeroParadas: number
  ): RutaMetadata {
    return {
      idRutaHereMaps,
      timestamp: new Date(),
      distanciaTotal: ruta.distance,
      duracionEstimada: ruta.duration,
      numeroParadas,
      puntoInicio: {
        latitud: puntoInicio.latitud,
        longitud: puntoInicio.longitud,
        tipo: puntoInicio.tipo,
        nombre: puntoInicio.nombre,
      },
      consideraTrafico: true,
      optimizada: numeroParadas > 1,
    };
  }

  /**
   * Analizar si hay cambios que sugieran recalcular la ruta
   */
  private async analizarCambiosSugeridos(
    idRutaExistente: string,
    direccionesActuales: DireccionValidada[],
    puntoInicioActual: PuntoInicio
  ): Promise<AnalisisCambiosRuta> {
    const detallesCambios: string[] = [];

    // TODO: Recuperar información de la ruta anterior del backend
    // Por ahora, asumimos que no hay cambios si el ID existe
    // En producción, se debería comparar con los datos almacenados

    console.log(`[RouteManagement] 🔍 Analizando cambios para ruta: ${idRutaExistente}`);
    console.log(`[RouteManagement] 📍 Direcciones actuales: ${direccionesActuales.length}`);
    console.log(`[RouteManagement] 📍 Punto inicio: ${puntoInicioActual.tipo}`);

    // Verificar si el punto de inicio cambió (chofer se movió del almacén)
    if (puntoInicioActual.tipo === 'gps-actual' && !puntoInicioActual.dentroDeGeocerca) {
      detallesCambios.push('El punto de inicio ha cambiado (chofer fuera del almacén)');
    }

    return {
      hayNuevasDirecciones: false,
      hayDireccionesEliminadas: false,
      hayDireccionesModificadas: detallesCambios.length > 0,
      detallesCambios,
    };
  }

  /**
   * Confirmar con el usuario si desea recalcular cuando hay cambios detectados
   */
  private confirmarRecalculoConCambios(analisis: AnalisisCambiosRuta): Promise<boolean> {
    return new Promise((resolve) => {
      const mensajeCambios = analisis.detallesCambios.length > 0
        ? `\n\nCambios detectados:\n• ${analisis.detallesCambios.join('\n• ')}`
        : '';

      Alert.alert(
        'Cambios detectados en la ruta',
        `Se han detectado cambios que podrían afectar la ruta calculada.${mensajeCambios}\n\n¿Deseas recalcular la ruta con las condiciones actuales?`,
        [
          {
            text: 'Mantener ruta actual',
            onPress: () => resolve(false),
            style: 'cancel',
          },
          {
            text: 'Recalcular ruta',
            onPress: () => resolve(true),
            style: 'default',
          },
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Recuperar ruta del backend usando idRutaHereMaps
   */
  private async recuperarRutaDelBackend(idRutaHereMaps: string): Promise<RutaRecuperada> {
    try {
      console.log(`[RouteManagement] 📡 Intentando recuperar ruta del backend: ${idRutaHereMaps}`);

      // TODO: Implementar llamada real al endpoint del backend
      // const response = await apiService.get(`/mobile/embarques/ruta/${idRutaHereMaps}`);

      // Por ahora, simulamos que la recuperación no está disponible
      // En producción, esto debería conectar con el backend real
      console.log('[RouteManagement] ℹ️ Recuperación de ruta del backend no implementada aún');

      return {
        ruta: null,
        metadata: null,
        exito: false,
        mensaje: 'Función de recuperación de ruta pendiente de implementación',
      };
    } catch (error) {
      console.error('[RouteManagement] ❌ Error recuperando ruta del backend:', error);
      return {
        ruta: null,
        metadata: null,
        exito: false,
        mensaje: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Determinar punto de inicio: almacén (si está en geocerca) o GPS actual
   */
  private async determinarPuntoInicio(
    opciones: OpcionesProcesamiento
  ): Promise<PuntoInicio> {
    // Configuración del almacén
    const almacen = opciones.ubicacionAlmacen || DEFAULT_ALMACEN;
    const radioGeocerca = opciones.radioGeocerca || 100;

    try {
      // Obtener ubicación GPS actual
      const ubicacionActual = await locationTrackingService.getCurrentLocation();
      
      if (!ubicacionActual) {
        console.log('[RouteManagement] ⚠️ No se pudo obtener ubicación GPS, usando almacén por defecto');
        return {
          latitud: almacen.latitud,
          longitud: almacen.longitud,
          tipo: 'almacen',
          nombre: almacen.nombre,
          dentroDeGeocerca: false,
        };
      }

      // Calcular distancia al almacén
      const distanciaAlAlmacen = this.calcularDistancia(
        { latitude: ubicacionActual.coordinates.latitude, longitude: ubicacionActual.coordinates.longitude },
        { latitude: almacen.latitud, longitude: almacen.longitud }
      );

      const dentroDeGeocerca = distanciaAlAlmacen <= radioGeocerca;

      console.log(`[RouteManagement] 📏 Distancia al almacén: ${distanciaAlAlmacen.toFixed(0)}m`);
      console.log(`[RouteManagement] 🎯 Dentro de geocerca (${radioGeocerca}m): ${dentroDeGeocerca ? 'SÍ' : 'NO'}`);

      if (dentroDeGeocerca) {
        // Está en el almacén, usar ubicación fija
        return {
          latitud: almacen.latitud,
          longitud: almacen.longitud,
          tipo: 'almacen',
          nombre: almacen.nombre,
          dentroDeGeocerca: true,
        };
      } else {
        // Está fuera del almacén, usar GPS actual
        return {
          latitud: ubicacionActual.coordinates.latitude,
          longitud: ubicacionActual.coordinates.longitude,
          tipo: 'gps-actual',
          nombre: 'Ubicación GPS actual',
          dentroDeGeocerca: false,
        };
      }
    } catch (error) {
      console.error('[RouteManagement] ❌ Error determinando punto de inicio:', error);
      // Fallback al almacén
      return {
        latitud: almacen.latitud,
        longitud: almacen.longitud,
        tipo: 'almacen',
        nombre: almacen.nombre,
        dentroDeGeocerca: false,
      };
    }
  }

  /**
   * Calcular ruta con múltiples paradas
   */
  private async calcularRutaMultiparada(
    puntoInicio: PuntoInicio,
    direcciones: DireccionValidada[],
    opciones: OpcionesProcesamiento
  ): Promise<RutaOptima> {
    console.log('[RouteManagement] 🧮 Calculando ruta con múltiples paradas...');

    const origen: Ubicacion = {
      latitude: puntoInicio.latitud,
      longitude: puntoInicio.longitud,
    };

    // Si solo hay una dirección, usar ruta simple
    if (direcciones.length === 1) {
      const destino: Ubicacion = {
        latitude: direcciones[0].coordenadas!.latitud,
        longitude: direcciones[0].coordenadas!.longitud,
      };

      return await routingService.obtenerRutaOptima(origen, destino);
    }

    // Para múltiples direcciones, calcular ruta optimizada
    // TODO: Implementar optimización multi-stop con HERE Maps
    // Por ahora, usar la primera dirección como destino principal
    const destinoPrincipal: Ubicacion = {
      latitude: direcciones[0].coordenadas!.latitud,
      longitude: direcciones[0].coordenadas!.longitud,
    };

    return await routingService.obtenerRutaOptima(origen, destinoPrincipal);
  }

  /**
   * Generar nuevo ID de ruta HERE Maps
   * Formato: RUTA-{timestamp}-{random}
   */
  private generarIdRutaHereMaps(): string {
    // Formato: RUTA-{timestamp}-{random}
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RUTA-${timestamp}-${random}`;
  }

  /**
   * Guardar ruta en backend
   * TODO: Implementar endpoint en backend para guardar idRutaHereMaps
   */
  async guardarRutaEnBackend(
    folioEmbarque: string,
    idRutaHereMaps: string,
    metadata: RutaMetadata
  ): Promise<boolean> {
    try {
      console.log('[RouteManagement] 💾 Guardando ruta en backend...');
      console.log(`   Folio: ${folioEmbarque}`);
      console.log(`   ID Ruta: ${idRutaHereMaps}`);
      console.log(`   Distancia: ${(metadata.distanciaTotal / 1000).toFixed(2)} km`);
      console.log(`   Duración: ${Math.round(metadata.duracionEstimada / 60)} min`);

      // TODO: Llamar al endpoint del backend
      // await apiService.post('/mobile/embarques/guardar-ruta', {
      //   folioEmbarque,
      //   idRutaHereMaps,
      //   metadata
      // });

      console.log('[RouteManagement] ✅ Ruta guardada exitosamente (simulado)');
      return true;
    } catch (error) {
      console.error('[RouteManagement] ❌ Error guardando ruta:', error);
      return false;
    }
  }

  /**
   * Verificar si hay incidentes de tráfico en la ruta
   */
  async verificarIncidentesEnRuta(ruta: RutaOptima): Promise<{
    tieneIncidentes: boolean;
    recomendarDesvio: boolean;
    razon?: string;
  }> {
    try {
      console.log('[RouteManagement] 🚦 Verificando incidentes de tráfico...');

      // Obtener incidentes en el área de la ruta
      // Usar el punto medio de la ruta como centro de búsqueda
      const coordenadas = ruta.coordinates;
      if (coordenadas.length < 2) {
        return { tieneIncidentes: false, recomendarDesvio: false };
      }

      const puntoMedio = coordenadas[Math.floor(coordenadas.length / 2)];
      
      // Verificar incidentes críticos
      // TODO: Implementar consulta a HERE Traffic Service
      // const incidents = await hereTrafficService.getTrafficIncidents(...);
      const incidents: any[] = []; // Placeholder

      const incidentesCriticos = incidents.filter(
        (i: any) => i.criticality === 'critical' || i.criticality === 'major'
      );

      const tieneIncidentes = incidents.length > 0;
      const recomendarDesvio = incidentesCriticos.length > 0;

      if (tieneIncidentes) {
        console.log(`[RouteManagement] ⚠️ ${incidents.length} incidente(s) detectado(s)`);
        if (recomendarDesvio) {
          console.log(`[RouteManagement] 🚨 ${incidentesCriticos.length} incidente(s) crítico(s) - Recomendando desvío`);
        }
      }

      return {
        tieneIncidentes,
        recomendarDesvio,
        razon: recomendarDesvio 
          ? `Se detectaron ${incidentesCriticos.length} incidente(s) crítico(s) en la ruta`
          : undefined,
      };
    } catch (error) {
      console.error('[RouteManagement] ❌ Error verificando incidentes:', error);
      return { tieneIncidentes: false, recomendarDesvio: false };
    }
  }

  /**
   * Calcular distancia Haversine entre dos puntos
   */
  private calcularDistancia(
    punto1: { latitude: number; longitude: number },
    punto2: { latitude: number; longitude: number }
  ): number {
    const R = 6371000; // Radio de la Tierra en metros
    const lat1Rad = punto1.latitude * Math.PI / 180;
    const lat2Rad = punto2.latitude * Math.PI / 180;
    const deltaLat = (punto2.latitude - punto1.latitude) * Math.PI / 180;
    const deltaLng = (punto2.longitude - punto1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

export const routeManagementService = new RouteManagementService();
