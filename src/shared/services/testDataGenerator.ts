/**
 * Generador de datos de prueba realistas para FultraTrack
 */

import {
  ClienteTest,
  ProductoTest,
  EntregaTest,
  RutaGPSTest,
  TestDataConfig,
} from '../models/testData.models';

// Datos realistas para México (Guadalajara y alrededores)
const NOMBRES_EMPRESAS = [
  'Abarrotes La Guadalupana',
  'Ferretería El Martillo',
  'Farmacia San Rafael',
  'Supermercado Mi Tienda',
  'Papelería Escolar',
  'Carnicería Don José',
  'Tortillería La Esperanza',
  'Tlapalería Los Compadres',
  'Miscelánea La Esquina',
  'Refaccionaria Auto Parts',
  'Electrónica Digital',
  'Zapatería El Tacón',
  'Mueblería Confort',
  'Restaurante El Fogón',
  'Panadería La Espiga',
  'Verdulería Fresco',
  'Pescadería Del Mar',
  'Pollería Granjero',
  'Licorería La Bodega',
  'Lavandería Express',
];

const CALLES_GDL = [
  'Av. Chapultepec',
  'Av. Américas',
  'Av. Vallarta',
  'Av. López Mateos',
  'Av. Patria',
  'Av. Federalismo',
  'Calz. Independencia',
  'Av. Alcalde',
  'Av. Mariano Otero',
  'Av. Lázaro Cárdenas',
  'Av. Niños Héroes',
  'Av. Inglaterra',
  'Av. México',
  'Av. Colón',
  'Av. Circunvalación',
];

const COLONIAS_GDL = [
  'Americana',
  'Chapalita',
  'Providencia',
  'Jardines del Bosque',
  'Vallarta San Jorge',
  'Colonia Del Valle',
  'Santa Teresita',
  'Lafayette',
  'Jardines de Guadalupe',
  'Oblatos',
  'Tetlán',
  'Analco',
  'Santa Elena',
  'Mezquitán',
  'San Juan de Dios',
];

const PRODUCTOS_COMUNES = [
  { nombre: 'Cemento Portland', unidad: 'bulto', pesoPromedio: 50 },
  { nombre: 'Varilla 3/8"', unidad: 'pieza', pesoPromedio: 5.3 },
  { nombre: 'Block 15x20x40', unidad: 'pieza', pesoPromedio: 12 },
  { nombre: 'Arena de río', unidad: 'm³', pesoPromedio: 1500 },
  { nombre: 'Grava 3/4"', unidad: 'm³', pesoPromedio: 1400 },
  { nombre: 'Ladrillo rojo', unidad: 'millar', pesoPromedio: 3000 },
  { nombre: 'Cal hidratada', unidad: 'bulto', pesoPromedio: 20 },
  { nombre: 'Tabique refractario', unidad: 'pieza', pesoPromedio: 3.5 },
  { nombre: 'Malla electrosoldada', unidad: 'rollo', pesoPromedio: 85 },
  { nombre: 'Alambrón', unidad: 'kg', pesoPromedio: 1 },
];

class TestDataGenerator {
  /**
   * Generar RFC aleatorio válido
   */
  private generateRFC(): string {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';

    let rfc = '';
    // 4 letras
    for (let i = 0; i < 4; i++) {
      rfc += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    // 6 números (YYMMDD)
    const year = Math.floor(Math.random() * 30) + 70; // 70-99
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    rfc += year + month + day;
    // 3 caracteres alfanuméricos
    for (let i = 0; i < 3; i++) {
      const chars = letras + numeros;
      rfc += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return rfc;
  }

  /**
   * Generar teléfono aleatorio (formato mexicano)
   */
  private generatePhone(): string {
    const area = '33'; // Guadalajara
    const number = Math.floor(Math.random() * 90000000) + 10000000;
    return `${area}${number}`;
  }

  /**
   * Generar coordenadas aleatorias en Guadalajara
   */
  private generateCoordinates(): { latitud: number; longitud: number } {
    // Centro de Guadalajara: 20.6597, -103.3496
    const baseLat = 20.6597;
    const baseLon = -103.3496;

    // Rango de ~30km alrededor
    const latOffset = (Math.random() - 0.5) * 0.3;
    const lonOffset = (Math.random() - 0.5) * 0.3;

    return {
      latitud: baseLat + latOffset,
      longitud: baseLon + lonOffset,
    };
  }

  /**
   * Generar cliente de prueba
   */
  generateCliente(index: number): ClienteTest {
    const nombreEmpresa = NOMBRES_EMPRESAS[index % NOMBRES_EMPRESAS.length];
    const calle = CALLES_GDL[Math.floor(Math.random() * CALLES_GDL.length)];
    const colonia = COLONIAS_GDL[Math.floor(Math.random() * COLONIAS_GDL.length)];
    const coords = this.generateCoordinates();

    return {
      nombre: `${nombreEmpresa} ${index + 1}`,
      rfc: this.generateRFC(),
      telefono: this.generatePhone(),
      email: `contacto${index + 1}@${nombreEmpresa.toLowerCase().replace(/\s/g, '')}.com`,
      direccion: {
        calle,
        numero: String(Math.floor(Math.random() * 9000) + 1000),
        colonia,
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
        codigoPostal: String(44000 + Math.floor(Math.random() * 900)),
        coordenadas: coords,
      },
    };
  }

  /**
   * Generar producto de prueba
   */
  generateProducto(index: number): ProductoTest {
    const producto = PRODUCTOS_COMUNES[index % PRODUCTOS_COMUNES.length];
    const cantidad = Math.floor(Math.random() * 50) + 1;

    return {
      sku: `PROD-${String(index + 1).padStart(6, '0')}`,
      nombre: producto.nombre,
      descripcion: `${producto.nombre} de alta calidad`,
      cantidad,
      unidad: producto.unidad,
      peso: producto.pesoPromedio * cantidad,
    };
  }

  /**
   * Generar entrega de prueba
   */
  generateEntrega(
    cliente: ClienteTest,
    fecha: Date,
    index: number
  ): EntregaTest {
    const numProductos = Math.floor(Math.random() * 3) + 1;
    const productos: ProductoTest[] = [];

    for (let i = 0; i < numProductos; i++) {
      productos.push(this.generateProducto(i));
    }

    // Horario de entrega (8 AM - 6 PM)
    const horaInicio = Math.floor(Math.random() * 8) + 8;
    const horaFin = horaInicio + 2;

    const estados: Array<'PENDIENTE' | 'EN_RUTA' | 'ENTREGADO' | 'PARCIAL' | 'NO_ENTREGADO'> = [
      'PENDIENTE',
      'PENDIENTE',
      'PENDIENTE',
      'EN_RUTA',
      'ENTREGADO',
    ];

    const tiposEntrega: Array<'ENTREGA' | 'RECOLECCION'> = [
      'ENTREGA',
      'ENTREGA',
      'ENTREGA',
      'RECOLECCION',
    ];

    return {
      ordenVenta: `OV-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(index + 1).padStart(5, '0')}`,
      folio: `F-${String(Date.now() + index).slice(-8)}`,
      fecha: fecha.toISOString().split('T')[0],
      tipoEntrega: tiposEntrega[Math.floor(Math.random() * tiposEntrega.length)],
      estado: estados[Math.floor(Math.random() * estados.length)],
      cliente,
      productos,
      prioridad: Math.floor(Math.random() * 3) + 1, // 1-3
      horarioInicio: `${String(horaInicio).padStart(2, '0')}:00`,
      horarioFin: `${String(horaFin).padStart(2, '0')}:00`,
      observaciones: Math.random() > 0.7 ? 'Entregar en recepción de almacén' : undefined,
    };
  }

  /**
   * Generar ruta GPS realista
   */
  generateRutaGPS(
    origen: { latitud: number; longitud: number },
    destinos: Array<{ latitud: number; longitud: number }>
  ): RutaGPSTest {
    const puntos: RutaGPSTest['puntos'] = [];
    let distanciaTotal = 0;
    const velocidadPromedio = 40; // km/h

    // Punto de inicio
    let currentLat = origen.latitud;
    let currentLon = origen.longitud;
    let timestamp = new Date();

    puntos.push({
      latitud: currentLat,
      longitud: currentLon,
      timestamp: timestamp.toISOString(),
      velocidad: 0,
    });

    // Generar puntos entre origen y cada destino
    destinos.forEach((destino) => {
      const numPuntos = Math.floor(Math.random() * 20) + 10; // 10-30 puntos
      const latStep = (destino.latitud - currentLat) / numPuntos;
      const lonStep = (destino.longitud - currentLon) / numPuntos;

      for (let i = 1; i <= numPuntos; i++) {
        currentLat += latStep;
        currentLon += lonStep;

        // Agregar variación aleatoria para simular movimiento real
        const variacion = 0.0001;
        currentLat += (Math.random() - 0.5) * variacion;
        currentLon += (Math.random() - 0.5) * variacion;

        // Calcular distancia desde punto anterior
        const distancia = this.calculateDistance(
          puntos[puntos.length - 1].latitud,
          puntos[puntos.length - 1].longitud,
          currentLat,
          currentLon
        );

        distanciaTotal += distancia;

        // Incrementar timestamp (cada 30 segundos)
        timestamp = new Date(timestamp.getTime() + 30000);

        // Velocidad aleatoria entre 20 y 60 km/h
        const velocidad = Math.floor(Math.random() * 40) + 20;

        puntos.push({
          latitud: currentLat,
          longitud: currentLon,
          timestamp: timestamp.toISOString(),
          velocidad,
        });
      }

      // Pausa en destino (5 minutos)
      timestamp = new Date(timestamp.getTime() + 300000);
    });

    const duracionEstimada = (distanciaTotal / velocidadPromedio) * 60; // minutos

    return {
      puntos,
      distanciaTotal: Math.round(distanciaTotal * 100) / 100,
      duracionEstimada: Math.round(duracionEstimada),
    };
  }

  /**
   * Calcular distancia entre dos coordenadas (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Generar conjunto completo de datos de prueba
   */
  generateTestDataSet(config: TestDataConfig): {
    clientes: ClienteTest[];
    entregas: EntregaTest[];
    rutas?: RutaGPSTest[];
  } {
    const clientes: ClienteTest[] = [];
    const entregas: EntregaTest[] = [];
    const rutas: RutaGPSTest[] = [];

    // Generar clientes
    for (let i = 0; i < config.numClientes; i++) {
      const cliente = this.generateCliente(i);
      clientes.push(cliente);

      // Generar entregas para este cliente
      for (let j = 0; j < config.numEntregasPorCliente; j++) {
        const fecha = new Date(config.fechaInicio);
        fecha.setDate(fecha.getDate() + Math.floor(Math.random() * 7)); // Siguiente semana

        const entrega = this.generateEntrega(
          cliente,
          fecha,
          i * config.numEntregasPorCliente + j
        );
        entregas.push(entrega);
      }
    }

    // Generar ruta GPS si se solicita
    if (config.generarRutaGPS) {
      const almacen = { latitud: 20.6597, longitud: -103.3496 }; // Centro GDL
      const destinos = entregas
        .slice(0, Math.min(10, entregas.length))
        .map((e) => e.cliente.direccion.coordenadas);

      const ruta = this.generateRutaGPS(almacen, destinos);
      rutas.push(ruta);
    }

    return { clientes, entregas, rutas: rutas.length > 0 ? rutas : undefined };
  }
}

export const testDataGenerator = new TestDataGenerator();
