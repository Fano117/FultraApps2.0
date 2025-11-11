import { Entrega, EstatusEntrega, Cliente, Direccion, Producto } from '../types';

export const mockClientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Restaurante El Buen Sabor',
    contacto: 'Carlos Martínez',
    telefono: '+52 55 1234 5678',
  },
  {
    id: '2',
    nombre: 'Supermercado La Esquina',
    contacto: 'María González',
    telefono: '+52 55 2345 6789',
  },
  {
    id: '3',
    nombre: 'Farmacia San José',
    contacto: 'Juan López',
    telefono: '+52 55 3456 7890',
  },
  {
    id: '4',
    nombre: 'Panadería Dulce Aroma',
    contacto: 'Ana Rodríguez',
    telefono: '+52 55 4567 8901',
  },
  {
    id: '5',
    nombre: 'Ferretería El Tornillo',
    contacto: 'Pedro Sánchez',
    telefono: '+52 55 5678 9012',
  },
];

export const mockDirecciones: Direccion[] = [
  {
    calle: 'Av. Insurgentes Sur 1602, Col. Crédito Constructor',
    ciudad: 'Ciudad de México',
    codigoPostal: '03940',
    coordenadas: {
      latitud: 19.3687,
      longitud: -99.1710,
    },
  },
  {
    calle: 'Av. Revolución 1234, Col. San Ángel',
    ciudad: 'Ciudad de México',
    codigoPostal: '01000',
    coordenadas: {
      latitud: 19.3476,
      longitud: -99.1877,
    },
  },
  {
    calle: 'Calle Madero 45, Col. Centro',
    ciudad: 'Ciudad de México',
    codigoPostal: '06000',
    coordenadas: {
      latitud: 19.4326,
      longitud: -99.1332,
    },
  },
  {
    calle: 'Av. Chapultepec 567, Col. Roma Norte',
    ciudad: 'Ciudad de México',
    codigoPostal: '06700',
    coordenadas: {
      latitud: 19.4150,
      longitud: -99.1620,
    },
  },
  {
    calle: 'Calle Amsterdam 89, Col. Condesa',
    ciudad: 'Ciudad de México',
    codigoPostal: '06140',
    coordenadas: {
      latitud: 19.4110,
      longitud: -99.1710,
    },
  },
];

export const mockProductos: Producto[][] = [
  [
    {
      id: 'p1',
      nombre: 'Harina de Trigo 25kg',
      cantidad: 10,
      unidad: 'sacos',
      descripcion: 'Harina premium para panificación',
    },
    {
      id: 'p2',
      nombre: 'Aceite Vegetal 5L',
      cantidad: 5,
      unidad: 'bidones',
      descripcion: 'Aceite de girasol',
    },
  ],
  [
    {
      id: 'p3',
      nombre: 'Arroz Blanco 20kg',
      cantidad: 15,
      unidad: 'sacos',
    },
    {
      id: 'p4',
      nombre: 'Frijol Negro 10kg',
      cantidad: 8,
      unidad: 'sacos',
    },
  ],
  [
    {
      id: 'p5',
      nombre: 'Paracetamol 500mg',
      cantidad: 100,
      unidad: 'cajas',
      descripcion: 'Medicamento analgésico',
    },
  ],
  [
    {
      id: 'p6',
      nombre: 'Pan Blanco',
      cantidad: 50,
      unidad: 'piezas',
    },
    {
      id: 'p7',
      nombre: 'Pan Integral',
      cantidad: 30,
      unidad: 'piezas',
    },
  ],
  [
    {
      id: 'p8',
      nombre: 'Tornillos 1/2"',
      cantidad: 20,
      unidad: 'cajas',
    },
    {
      id: 'p9',
      nombre: 'Pintura Blanca 4L',
      cantidad: 10,
      unidad: 'cubetas',
    },
  ],
];

export const mockEntregas: Entrega[] = [
  {
    id: 'e1',
    numeroOrden: 'ORD-2025-001',
    cliente: mockClientes[0],
    direccion: mockDirecciones[0],
    estatus: EstatusEntrega.PENDIENTE,
    productos: mockProductos[0],
    instrucciones: 'Entregar en la puerta trasera. Tocar el timbre 2 veces.',
    notas: 'Cliente prefiere entregas por la mañana',
    fechaProgramada: new Date(2025, 0, 11, 9, 0).toISOString(),
    secuencia: 1,
    distancia: 1500,
    tiempoEstimado: 300,
  },
  {
    id: 'e2',
    numeroOrden: 'ORD-2025-002',
    cliente: mockClientes[1],
    direccion: mockDirecciones[1],
    estatus: EstatusEntrega.PENDIENTE,
    productos: mockProductos[1],
    instrucciones: 'Solicitar firma del gerente',
    fechaProgramada: new Date(2025, 0, 11, 10, 0).toISOString(),
    secuencia: 2,
    distancia: 3200,
    tiempoEstimado: 600,
  },
  {
    id: 'e3',
    numeroOrden: 'ORD-2025-003',
    cliente: mockClientes[2],
    direccion: mockDirecciones[2],
    estatus: EstatusEntrega.EN_RUTA,
    productos: mockProductos[2],
    instrucciones: 'Manejar con cuidado - medicamentos',
    notas: 'Entrega urgente',
    fechaProgramada: new Date(2025, 0, 11, 11, 0).toISOString(),
    secuencia: 3,
    distancia: 5800,
    tiempoEstimado: 900,
  },
  {
    id: 'e4',
    numeroOrden: 'ORD-2025-004',
    cliente: mockClientes[3],
    direccion: mockDirecciones[3],
    estatus: EstatusEntrega.PENDIENTE,
    productos: mockProductos[3],
    fechaProgramada: new Date(2025, 0, 11, 12, 0).toISOString(),
    secuencia: 4,
    distancia: 7100,
    tiempoEstimado: 1200,
  },
  {
    id: 'e5',
    numeroOrden: 'ORD-2025-005',
    cliente: mockClientes[4],
    direccion: mockDirecciones[4],
    estatus: EstatusEntrega.COMPLETADA,
    productos: mockProductos[4],
    instrucciones: 'Verificar cantidad antes de descargar',
    fechaProgramada: new Date(2025, 0, 11, 8, 0).toISOString(),
    secuencia: 0,
    distancia: 0,
    tiempoEstimado: 0,
  },
];

export const mockCurrentLocation = {
  latitud: 19.3900,
  longitud: -99.1700,
};

export const mockRouteCoordinates = [
  mockCurrentLocation,
  mockDirecciones[0].coordenadas,
  mockDirecciones[1].coordenadas,
  mockDirecciones[2].coordenadas,
  mockDirecciones[3].coordenadas,
  mockDirecciones[4].coordenadas,
];
