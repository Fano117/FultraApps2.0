export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  descripcion?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
}

export interface Direccion {
  calle: string;
  ciudad: string;
  codigoPostal?: string;
  coordenadas: Coordenadas;
}

export enum EstatusEntrega {
  PENDIENTE = 'PENDIENTE',
  EN_RUTA = 'EN_RUTA',
  LLEGADA_CERCANA = 'LLEGADA_CERCANA',
  EN_SITIO = 'EN_SITIO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export interface Entrega {
  id: string;
  numeroOrden: string;
  cliente: Cliente;
  direccion: Direccion;
  estatus: EstatusEntrega;
  productos: Producto[];
  instrucciones?: string;
  notas?: string;
  fechaProgramada: string;
  secuencia: number;
  distancia?: number;
  tiempoEstimado?: number;
}

export interface ConfirmacionEntrega {
  entregaId: string;
  fecha: Date;
  nombreReceptor: string;
  observaciones?: string;
  fotoUri: string;
  firmaUri: string;
  latitud: number;
  longitud: number;
}

export interface RutaOptimizada {
  puntos: Coordenadas[];
  distanciaTotal: number;
  tiempoEstimado: number;
  entregas: Entrega[];
}

export interface UbicacionChofer {
  choferId: string;
  latitud: number;
  longitud: number;
  timestamp: Date;
  velocidad?: number;
  precision?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
