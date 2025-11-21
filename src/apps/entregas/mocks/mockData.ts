/**
 * 📦 Mock Data - Sistema de Entregas
 *
 * Datos de simulación para probar el sistema de entregas con el nuevo formato JSON.
 *
 * FORMATO JSON API:
 * {
 *   "folioEmbarque": string,
 *   "idRutaHereMaps": string | null,
 *   "direcciones": ApiDireccion[]
 * }
 *
 * Escenarios de prueba:
 * 1. Con coordenadas completas (API las proporciona)
 * 2. Sin coordenadas (requiere geocodificación)
 * 3. Mixto (algunas con coordenadas, otras sin)
 * 4. Con idRutaHereMaps existente (ruta ya calculada)
 * 5. Sin idRutaHereMaps (nueva ruta)
 *
 * @version 2.0
 * @updated 2025-01-21
 */

import { ApiDeliveryResponse, ApiDireccion } from '../types/api-delivery';
import { Entrega, EstatusEntrega, Coordenadas } from '../types/delivery';

// ============================================================================
// DATOS DE EJEMPLO SEGÚN NUEVO FORMATO JSON
// ============================================================================

/**
 * Ejemplo 1: Respuesta con coordenadas completas y ruta existente
 * Simula cuando el backend ya tiene las coordenadas y una ruta calculada
 */
export const mockApiResponseConCoordenadasYRuta: ApiDeliveryResponse = {
  folioEmbarque: 'M1234-2345653',
  idRutaHereMaps: 'RUTA-1705849200000-ABC123',
  direcciones: [
    {
      direccion: 'José María Caracas 1310, Guadalupe Victoria, 96520 Coatzacoalcos, Ver.',
      cliente: 'JUAN PGRAL REYES',
      latitud: '18.144719522128238',
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
      latitud: '19.64295650284401',
      longitud: '-99.22825623421272',
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
      latitud: '19.04295650284401',
      longitud: '-98.22825623421272',
      cp: '72440',
      calle: 'C. 7 Sur',
      noExterior: '5943',
      colonia: 'Girasol',
      municipio: 'Heroica Puebla de Zaragoza',
      estado: 'Puebla',
    },
  ],
};

/**
 * Ejemplo 2: Respuesta sin coordenadas (requiere geocodificación)
 * Simula cuando el backend no tiene coordenadas y se deben geocodificar
 */
export const mockApiResponseSinCoordenadas: ApiDeliveryResponse = {
  folioEmbarque: 'SIN-COORD-001',
  idRutaHereMaps: null,
  direcciones: [
    {
      direccion: 'Av. Insurgentes Sur 1602, Col. Crédito Constructor, 03940 CDMX',
      cliente: 'RESTAURANTE EL BUEN SABOR',
      cp: '03940',
      calle: 'Av. Insurgentes Sur',
      noExterior: '1602',
      colonia: 'Crédito Constructor',
      municipio: 'Benito Juárez',
      estado: 'Ciudad de México',
    },
    {
      direccion: 'Av. Revolución 1234, Col. San Ángel, 01000 CDMX',
      cliente: 'SUPERMERCADO LA ESQUINA',
      cp: '01000',
      calle: 'Av. Revolución',
      noExterior: '1234',
      colonia: 'San Ángel',
      municipio: 'Álvaro Obregón',
      estado: 'Ciudad de México',
    },
    {
      direccion: 'Calle Madero 45, Col. Centro, 06000 CDMX',
      cliente: 'FARMACIA SAN JOSÉ',
      cp: '06000',
      calle: 'Calle Madero',
      noExterior: '45',
      colonia: 'Centro',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México',
    },
  ],
};

/**
 * Ejemplo 3: Respuesta mixta (algunas con coordenadas, otras sin)
 * Simula cuando el backend tiene coordenadas parciales
 */
export const mockApiResponseMixta: ApiDeliveryResponse = {
  folioEmbarque: 'MIX-2025-001',
  idRutaHereMaps: null,
  direcciones: [
    {
      direccion: 'José María Caracas 1310, Guadalupe Victoria, 96520 Coatzacoalcos, Ver.',
      cliente: 'JUAN PGRAL REYES',
      latitud: '18.144719522128238',
      longitud: '-94.46089643238795',
      cp: '96520',
      calle: 'José María Caracas',
      noExterior: '1310',
      colonia: 'Guadalupe Victoria',
      municipio: 'Coatzacoalcos',
      estado: 'Veracruz',
    },
    {
      // Sin coordenadas - requiere geocodificación
      direccion: 'Río Lerma 122, Colinas del Lago, 54744 Cuautitlán Izcalli, Méx.',
      cliente: 'TRANSPORTES MARVA',
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
      latitud: '19.04295650284401',
      longitud: '-98.22825623421272',
      cp: '72440',
      calle: 'C. 7 Sur',
      noExterior: '5943',
      colonia: 'Girasol',
      municipio: 'Heroica Puebla de Zaragoza',
      estado: 'Puebla',
    },
  ],
};

/**
 * Ejemplo 4: Respuesta con ruta existente pero punto de inicio diferente
 * Para probar recálculo cuando el chofer está fuera del almacén
 */
export const mockApiResponseRutaExistenteFueraAlmacen: ApiDeliveryResponse = {
  folioEmbarque: 'RUTA-EXIST-001',
  idRutaHereMaps: 'RUTA-1705849200000-XYZ789',
  direcciones: [
    {
      direccion: 'Av. Chapultepec 567, Col. Roma Norte, 06700 CDMX',
      cliente: 'PANADERÍA DULCE AROMA',
      latitud: '19.4150',
      longitud: '-99.1620',
      cp: '06700',
      calle: 'Av. Chapultepec',
      noExterior: '567',
      colonia: 'Roma Norte',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México',
    },
    {
      direccion: 'Calle Amsterdam 89, Col. Condesa, 06140 CDMX',
      cliente: 'FERRETERÍA EL TORNILLO',
      latitud: '19.4110',
      longitud: '-99.1710',
      cp: '06140',
      calle: 'Calle Amsterdam',
      noExterior: '89',
      colonia: 'Condesa',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México',
    },
  ],
};

/**
 * Ejemplo 5: Respuesta con coordenadas inválidas (para probar fallback)
 * Simula cuando las coordenadas son placeholders o inválidas
 */
export const mockApiResponseCoordenadasInvalidas: ApiDeliveryResponse = {
  folioEmbarque: 'INVALID-COORD-001',
  idRutaHereMaps: null,
  direcciones: [
    {
      direccion: 'Av. Insurgentes Sur 1602, Col. Crédito Constructor, 03940 CDMX',
      cliente: 'CLIENTE CON COORDS CERO',
      latitud: '0',
      longitud: '0',
      cp: '03940',
      calle: 'Av. Insurgentes Sur',
      noExterior: '1602',
      colonia: 'Crédito Constructor',
      municipio: 'Benito Juárez',
      estado: 'Ciudad de México',
    },
    {
      direccion: 'Av. Reforma 250, Centro, 06000 CDMX',
      cliente: 'CLIENTE CON COORDS NaN',
      latitud: 'invalid',
      longitud: 'not-a-number',
      cp: '06000',
      calle: 'Av. Reforma',
      noExterior: '250',
      colonia: 'Centro',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México',
    },
  ],
};

/**
 * Ejemplo 6: Respuesta con múltiples paradas (ruta larga)
 * Para probar optimización de rutas multi-parada
 */
export const mockApiResponseMultiplesParadas: ApiDeliveryResponse = {
  folioEmbarque: 'MULTI-STOP-001',
  idRutaHereMaps: null,
  direcciones: [
    {
      direccion: 'Av. Insurgentes Sur 1602, Col. Crédito Constructor, 03940 CDMX',
      cliente: 'CLIENTE 1 - INSURGENTES',
      latitud: '19.3687',
      longitud: '-99.1710',
      cp: '03940',
      calle: 'Av. Insurgentes Sur',
      noExterior: '1602',
      colonia: 'Crédito Constructor',
      municipio: 'Benito Juárez',
      estado: 'Ciudad de México',
    },
    {
      direccion: 'Av. Revolución 1234, Col. San Ángel, 01000 CDMX',
      cliente: 'CLIENTE 2 - SAN ÁNGEL',
      latitud: '19.3476',
      longitud: '-99.1877',
      cp: '01000',
      calle: 'Av. Revolución',
      noExterior: '1234',
      colonia: 'San Ángel',
      municipio: 'Álvaro Obregón',
      estado: 'Ciudad de México',
    },
    {
      direccion: 'Calle Madero 45, Col. Centro, 06000 CDMX',
      cliente: 'CLIENTE 3 - CENTRO',
      latitud: '19.4326',
      longitud: '-99.1332',
      cp: '06000',
      calle: 'Calle Madero',
      noExterior: '45',
      colonia: 'Centro',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México',
    },
    {
      direccion: 'Av. Chapultepec 567, Col. Roma Norte, 06700 CDMX',
      cliente: 'CLIENTE 4 - ROMA',
      latitud: '19.4150',
      longitud: '-99.1620',
      cp: '06700',
      calle: 'Av. Chapultepec',
      noExterior: '567',
      colonia: 'Roma Norte',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México',
    },
    {
      direccion: 'Calle Amsterdam 89, Col. Condesa, 06140 CDMX',
      cliente: 'CLIENTE 5 - CONDESA',
      latitud: '19.4110',
      longitud: '-99.1710',
      cp: '06140',
      calle: 'Calle Amsterdam',
      noExterior: '89',
      colonia: 'Condesa',
      municipio: 'Cuauhtémoc',
      estado: 'Ciudad de México',
    },
  ],
};

// ============================================================================
// UBICACIÓN ACTUAL DEL CHOFER (SIMULACIÓN)
// ============================================================================

/**
 * Ubicación del almacén (punto fijo)
 */
export const mockUbicacionAlmacen = {
  latitud: 19.4326,
  longitud: -99.1332,
  nombre: 'Almacén Central CDMX',
};

/**
 * Ubicación actual del chofer dentro del almacén
 */
export const mockUbicacionChoferEnAlmacen = {
  latitud: 19.4328,
  longitud: -99.1330,
  accuracy: 10,
  timestamp: Date.now(),
};

/**
 * Ubicación actual del chofer fuera del almacén (en ruta)
 */
export const mockUbicacionChoferFueraAlmacen = {
  latitud: 19.3900,
  longitud: -99.1700,
  accuracy: 15,
  timestamp: Date.now(),
};

// ============================================================================
// TIPOS DE ESCENARIOS PARA SIMULACIÓN
// ============================================================================

/**
 * Tipos de escenarios disponibles para simulación
 */
export type TipoEscenarioSimulacion =
  | 'con-coordenadas-y-ruta'
  | 'sin-coordenadas'
  | 'mixto'
  | 'ruta-existente-fuera-almacen'
  | 'coordenadas-invalidas'
  | 'multiples-paradas';

/**
 * Mapa de escenarios para fácil acceso
 */
export const escenariosMock: Record<TipoEscenarioSimulacion, ApiDeliveryResponse> = {
  'con-coordenadas-y-ruta': mockApiResponseConCoordenadasYRuta,
  'sin-coordenadas': mockApiResponseSinCoordenadas,
  'mixto': mockApiResponseMixta,
  'ruta-existente-fuera-almacen': mockApiResponseRutaExistenteFueraAlmacen,
  'coordenadas-invalidas': mockApiResponseCoordenadasInvalidas,
  'multiples-paradas': mockApiResponseMultiplesParadas,
};

/**
 * Descripciones de cada escenario para UI
 */
export const descripcionesEscenarios: Record<TipoEscenarioSimulacion, string> = {
  'con-coordenadas-y-ruta': 'Coordenadas completas con ruta existente (ID-RUTA ya calculada)',
  'sin-coordenadas': 'Sin coordenadas (requiere geocodificación completa)',
  'mixto': 'Mixto (algunas direcciones con coords, otras sin)',
  'ruta-existente-fuera-almacen': 'Ruta existente pero chofer fuera del almacén',
  'coordenadas-invalidas': 'Coordenadas inválidas (0,0 o NaN) - prueba fallback',
  'multiples-paradas': 'Múltiples paradas (5 destinos) - prueba optimización',
};

/**
 * Obtener un escenario de simulación por tipo
 */
export function obtenerEscenarioMock(tipo: TipoEscenarioSimulacion): ApiDeliveryResponse {
  return escenariosMock[tipo];
}

/**
 * Obtener todos los escenarios disponibles
 */
export function obtenerTodosLosEscenarios(): Array<{
  tipo: TipoEscenarioSimulacion;
  descripcion: string;
  datos: ApiDeliveryResponse;
}> {
  return Object.entries(escenariosMock).map(([tipo, datos]) => ({
    tipo: tipo as TipoEscenarioSimulacion,
    descripcion: descripcionesEscenarios[tipo as TipoEscenarioSimulacion],
    datos,
  }));
}

// ============================================================================
// HELPER PARA GENERAR DATOS DINÁMICOS
// ============================================================================

/**
 * Generar una respuesta de API con datos personalizados
 */
export function generarApiResponsePersonalizada(
  folioEmbarque: string,
  direcciones: ApiDireccion[],
  idRutaHereMaps: string | null = null
): ApiDeliveryResponse {
  return {
    folioEmbarque,
    idRutaHereMaps,
    direcciones,
  };
}

/**
 * Generar una dirección de prueba
 */
export function generarDireccionPrueba(
  cliente: string,
  direccionCompleta: string,
  conCoordenadas: boolean = true,
  coordenadas?: { latitud: string; longitud: string }
): ApiDireccion {
  const direccion: ApiDireccion = {
    direccion: direccionCompleta,
    cliente,
  };

  if (conCoordenadas && coordenadas) {
    direccion.latitud = coordenadas.latitud;
    direccion.longitud = coordenadas.longitud;
  }

  return direccion;
}

// ============================================================================
// EXPORT DEFAULT - ESCENARIO MÁS COMÚN
// ============================================================================

/**
 * Escenario por defecto para pruebas rápidas
 */
export default mockApiResponseConCoordenadasYRuta;

// ============================================================================
// DATOS LEGACY PARA mockApiServices.ts (compatibilidad hacia atrás)
// ============================================================================

/**
 * Coordenadas de ruta de ejemplo (puntos de navegación)
 * Usadas por MockDeliveryApiService para simular rutas
 */
export const mockRouteCoordinates: Coordenadas[] = [
  { latitud: 19.4326, longitud: -99.1332 }, // Centro CDMX
  { latitud: 19.4200, longitud: -99.1500 },
  { latitud: 19.4100, longitud: -99.1620 },
  { latitud: 19.4000, longitud: -99.1700 },
  { latitud: 19.3900, longitud: -99.1750 },
  { latitud: 19.3800, longitud: -99.1800 },
  { latitud: 19.3700, longitud: -99.1850 },
  { latitud: 19.3600, longitud: -99.1900 },
];

/**
 * Entregas de ejemplo para MockDeliveryApiService
 * Mantiene compatibilidad con el sistema legacy de entregas
 */
export const mockEntregas: Entrega[] = [
  {
    id: 'ENT-001',
    numeroOrden: 'ORD-2025-001',
    cliente: {
      id: 'CLI-001',
      nombre: 'JUAN PGRAL REYES',
      contacto: 'Juan Reyes',
      telefono: '555-1234',
    },
    direccion: {
      calle: 'José María Caracas 1310, Guadalupe Victoria',
      ciudad: 'Coatzacoalcos, Ver.',
      codigoPostal: '96520',
      coordenadas: { latitud: 18.1447, longitud: -94.4609 },
    },
    estatus: EstatusEntrega.PENDIENTE,
    productos: [
      { id: 'PROD-001', nombre: 'Producto A', cantidad: 10, unidad: 'piezas' },
      { id: 'PROD-002', nombre: 'Producto B', cantidad: 5, unidad: 'cajas' },
    ],
    instrucciones: 'Entregar en recepción',
    fechaProgramada: new Date().toISOString(),
    secuencia: 1,
    distancia: 5200,
    tiempoEstimado: 25,
  },
  {
    id: 'ENT-002',
    numeroOrden: 'ORD-2025-002',
    cliente: {
      id: 'CLI-002',
      nombre: 'TRANSPORTES MARVA',
      contacto: 'María Vargas',
      telefono: '555-5678',
    },
    direccion: {
      calle: 'Río Lerma 122, Colinas del Lago',
      ciudad: 'Cuautitlán Izcalli, Méx.',
      codigoPostal: '54744',
      coordenadas: { latitud: 19.6430, longitud: -99.2283 },
    },
    estatus: EstatusEntrega.PENDIENTE,
    productos: [
      { id: 'PROD-003', nombre: 'Producto C', cantidad: 20, unidad: 'piezas' },
    ],
    instrucciones: 'Llamar antes de llegar',
    fechaProgramada: new Date().toISOString(),
    secuencia: 2,
    distancia: 8500,
    tiempoEstimado: 35,
  },
  {
    id: 'ENT-003',
    numeroOrden: 'ORD-2025-003',
    cliente: {
      id: 'CLI-003',
      nombre: 'TRANSPORTES FABRES',
      contacto: 'Fernando Bres',
      telefono: '555-9012',
    },
    direccion: {
      calle: 'C. 7 Sur 5943, Girasol',
      ciudad: 'Heroica Puebla de Zaragoza, Pue.',
      codigoPostal: '72440',
      coordenadas: { latitud: 19.0430, longitud: -98.2283 },
    },
    estatus: EstatusEntrega.EN_RUTA,
    productos: [
      { id: 'PROD-004', nombre: 'Producto D', cantidad: 15, unidad: 'bultos' },
      { id: 'PROD-005', nombre: 'Producto E', cantidad: 8, unidad: 'cajas' },
    ],
    notas: 'Cliente frecuente',
    fechaProgramada: new Date().toISOString(),
    secuencia: 3,
    distancia: 12000,
    tiempoEstimado: 45,
  },
];
