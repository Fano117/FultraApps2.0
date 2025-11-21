/**
 * Interfaces para el nuevo formato JSON de la API de entregas
 * 
 * Este archivo define las estructuras de datos para el nuevo formato JSON que incluye:
 * - folioEmbarque: Identificador único del embarque
 * - idRutaHereMaps: ID de ruta en HERE Maps (opcional, puede ser null si es ruta nueva)
 * - direcciones: Array de direcciones con coordenadas opcionales y campos desglosados
 * 
 * Flujo de validación de direcciones:
 * 1. Si existen coordenadas (latitud y longitud), usarlas directamente
 * 2. Si no existen coordenadas, geocodificar usando campos desglosados
 * 3. Si falla, geocodificar usando dirección completa
 * 4. Si todo falla, marcar la parada como inválida y notificar
 */

/**
 * Dirección con campos desglosados según el nuevo formato de la API
 * Las coordenadas son opcionales y pueden venir como strings o numbers
 */
export interface ApiDireccion {
  /** Dirección completa formateada como string */
  direccion: string;
  
  /** Nombre del cliente destinatario */
  cliente: string;
  
  /** Latitud - Opcional, puede ser string, number o undefined */
  latitud?: string | number;
  
  /** Longitud - Opcional, puede ser string, number o undefined */
  longitud?: string | number;
  
  /** Código postal - Campo desglosado para geocodificación */
  cp?: string;
  
  /** Nombre de la calle - Campo desglosado para geocodificación */
  calle?: string;
  
  /** Número exterior - Campo desglosado para geocodificación */
  noExterior?: string;
  
  /** Nombre de la colonia - Campo desglosado para geocodificación */
  colonia?: string;
  
  /** Nombre del municipio - Campo desglosado para geocodificación */
  municipio?: string;
  
  /** Nombre del estado - Campo desglosado para geocodificación */
  estado?: string;
}

/**
 * Respuesta completa de la API con el nuevo formato JSON
 */
export interface ApiDeliveryResponse {
  /** Folio único del embarque */
  folioEmbarque: string;
  
  /** 
   * ID de ruta en HERE Maps (opcional)
   * - Si existe, indica que ya hay una ruta calculada previamente
   * - Si es null/undefined, se debe calcular una nueva ruta
   */
  idRutaHereMaps?: string | null;
  
  /** Array de direcciones de entrega */
  direcciones: ApiDireccion[];
}

/**
 * Coordenadas validadas y normalizadas
 */
export interface CoordenadasValidadas {
  latitud: number;
  longitud: number;
  /** Fuente de las coordenadas para tracking */
  fuente: 'api' | 'geocoding-fields' | 'geocoding-full' | 'fallback';
}

/**
 * Dirección procesada con resultado de validación
 */
export interface DireccionValidada {
  /** Datos originales de la dirección */
  original: ApiDireccion;
  
  /** Coordenadas validadas (null si la validación falló) */
  coordenadas: CoordenadasValidadas | null;
  
  /** Estado de validación */
  esValida: boolean;
  
  /** Mensaje de error si la validación falló */
  mensajeError?: string;
  
  /** Nivel de confianza de la geocodificación (0-1) */
  confianza?: number;
  
  /** Dirección formateada resultante de la geocodificación */
  direccionGeocoded?: string;
}

/**
 * Resultado completo del procesamiento de entregas
 */
export interface EntregasProcesadas {
  /** Folio del embarque */
  folioEmbarque: string;
  
  /** ID de ruta HERE Maps (puede ser existente o recién creado) */
  idRutaHereMaps: string | null;
  
  /** Indica si la ruta es nueva o recalculada */
  rutaNueva: boolean;
  
  /** Direcciones validadas */
  direcciones: DireccionValidada[];
  
  /** Número de direcciones válidas */
  direccionesValidas: number;
  
  /** Número de direcciones inválidas */
  direccionesInvalidas: number;
  
  /** Timestamp del procesamiento */
  timestampProcesamiento: Date;
}

/**
 * Opciones para el procesamiento de direcciones
 */
export interface OpcionesProcesamiento {
  /** Usar ubicación GPS actual como punto de inicio si está fuera de geocerca */
  usarUbicacionActual?: boolean;
  
  /** Radio de geocerca del almacén en metros (default: 100) */
  radioGeocerca?: number;
  
  /** Ubicación fija del almacén */
  ubicacionAlmacen?: {
    latitud: number;
    longitud: number;
    nombre: string;
  };
  
  /** Forzar recálculo de ruta aunque exista idRutaHereMaps */
  forzarRecalculo?: boolean;
  
  /** Mostrar diálogo de confirmación para recalcular */
  confirmarRecalculo?: boolean;
}

/**
 * Metadata de la ruta generada o recuperada
 */
export interface RutaMetadata {
  /** ID de la ruta en HERE Maps */
  idRutaHereMaps: string;
  
  /** Timestamp de creación/actualización */
  timestamp: Date;
  
  /** Distancia total en metros */
  distanciaTotal: number;
  
  /** Duración estimada en segundos */
  duracionEstimada: number;
  
  /** Número de paradas */
  numeroParadas: number;
  
  /** Punto de inicio de la ruta */
  puntoInicio: {
    latitud: number;
    longitud: number;
    tipo: 'almacen' | 'gps-actual';
    nombre?: string;
  };
  
  /** Indica si se consideraron incidentes de tráfico */
  consideraTrafico: boolean;
  
  /** Indica si la ruta está optimizada para múltiples paradas */
  optimizada: boolean;
}
