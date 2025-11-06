export enum TipoEntrega {
  ENTREGA = 'ENTREGA',
  RECOLECCION = 'RECOLECCION',
  TRASPASO = 'TRASPASO',
}

export enum TipoRegistro {
  COMPLETO = 'COMPLETO',
  PARCIAL = 'PARCIAL',
  NO_ENTREGADO = 'NO_ENTREGADO',
}

export enum MotivoParcialidad {
  MATERIAL_INCORRECTO = 'Material incorrecto',
  EMPAQUE_DANADO = 'Empaque dañado',
  MATERIAL_DANADO = 'Material dañado',
  FALTA_DE_EQUIPO = 'Falta de equipo',
}

export enum EstadoSincronizacion {
  PENDIENTE_ENVIO = 'PENDIENTE_ENVIO',
  ENVIANDO = 'ENVIANDO',
  DATOS_ENVIADOS = 'DATOS_ENVIADOS',
  IMAGENES_PENDIENTES = 'IMAGENES_PENDIENTES',
  COMPLETADO = 'COMPLETADO',
  ERROR = 'ERROR',
}

export interface ArticuloEntregaDTO {
  id: number;
  nombreCarga?: string;
  nombreOrdenVenta: string;
  producto: string;
  cantidadProgramada: number;
  cantidadEntregada: number;
  restante: number;
  peso: number;
  unidadMedida: string;
  descripcion: string;
}

export interface EntregaDTO {
  ordenVenta: string;
  folio: string;
  tipoEntrega: string;
  estado: string;
  articulos: ArticuloEntregaDTO[];
  cargaCuentaCliente?: string;
}

export interface ClienteEntregaDTO {
  cliente: string;
  cuentaCliente: string;
  carga: string;
  direccionEntrega: string;
  latitud: string;
  longitud: string;
  entregas: EntregaDTO[];
}

export interface ImagenDTO {
  nombre: string;
  enviado: boolean;
}

export interface EmbarqueEntregaDTO {
  ordenVenta: string;
  folio: string;
  tipoEntrega: string;
  razonIncidencia?: string;
  imagenesIncidencia: ImagenDTO[];
  imagenesFacturas: ImagenDTO[];
  imagenesEvidencia: ImagenDTO[];
  comentarios?: string;
  nombreQuienEntrega?: string;
  latitud?: string;
  longitud?: string;
  fechaCaptura?: Date;
  fechaEnvioServer?: Date;
  enviadoServer?: boolean;
  articulos: ArticuloEntregaDTO[];
}

export interface EntregaSync extends EmbarqueEntregaDTO {
  id: string;
  estado: EstadoSincronizacion;
  intentosEnvio: number;
  ultimoError?: string;
  pendienteCobro?: boolean;
  imagenesPago?: ImagenDTO[];
}
