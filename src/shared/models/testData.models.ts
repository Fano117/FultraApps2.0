/**
 * Modelos para generación de datos de prueba
 */

export interface TestDataConfig {
  numClientes: number;
  numEntregasPorCliente: number;
  fechaInicio: Date;
  generarRutaGPS: boolean;
  simularEstados: boolean;
}

export interface ClienteTest {
  nombre: string;
  rfc: string;
  telefono: string;
  email: string;
  direccion: DireccionTest;
}

export interface DireccionTest {
  calle: string;
  numero: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  coordenadas: {
    latitud: number;
    longitud: number;
  };
}

export interface ProductoTest {
  sku: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  peso: number;
}

export interface EntregaTest {
  ordenVenta: string;
  folio: string;
  fecha: string;
  tipoEntrega: 'ENTREGA' | 'RECOLECCION';
  estado: 'PENDIENTE' | 'EN_RUTA' | 'ENTREGADO' | 'PARCIAL' | 'NO_ENTREGADO';
  cliente: ClienteTest;
  productos: ProductoTest[];
  prioridad: number;
  horarioInicio: string;
  horarioFin: string;
  observaciones?: string;
}

export interface RutaGPSTest {
  puntos: Array<{
    latitud: number;
    longitud: number;
    timestamp: string;
    velocidad: number;
  }>;
  distanciaTotal: number;
  duracionEstimada: number;
}

export interface TestDataResult {
  success: boolean;
  message: string;
  data: {
    clientesCreados: number;
    entregasCreadas: number;
    rutasGeneradas: number;
    tiempoEjecucion: number;
  };
  errores?: string[];
}
