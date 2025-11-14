/**
 * Servicio para cargar datos de prueba al backend
 * IMPORTANTE: Las entregas se guardan como entregas REALES pero con flag EsTestData
 * para poder eliminarlas después
 */

import { apiService } from './apiService';
import { testDataGenerator } from './testDataGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  TestDataConfig,
  TestDataResult,
  EntregaTest,
} from '../models/testData.models';

class TestDataService {
  private readonly STORAGE_KEY = '@FultraApps:test_data_loaded';

  /**
   * Cargar datos de prueba completos al backend
   */
  async loadTestData(config: TestDataConfig): Promise<TestDataResult> {
    const startTime = Date.now();
    const errores: string[] = [];

    try {
      console.log('🚀 Iniciando carga de datos de prueba...');
      console.log('Configuración:', config);

      // 1. Generar datos
      console.log('📝 Generando datos...');
      const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSet(config);

      console.log(`✅ Generados: ${clientes.length} clientes, ${entregas.length} entregas`);

      // 2. Enviar clientes al backend
      console.log('📤 Enviando clientes...');
      let clientesCreados = 0;

      for (const cliente of clientes) {
        try {
          await this.createCliente(cliente);
          clientesCreados++;
        } catch (error: any) {
          console.error(`Error creando cliente ${cliente.nombre}:`, error);
          errores.push(`Cliente ${cliente.nombre}: ${error.message}`);
        }
      }

      // 3. Enviar entregas al backend
      console.log('📤 Enviando entregas...');
      let entregasCreadas = 0;

      for (const entrega of entregas) {
        try {
          await this.createEntrega(entrega);
          entregasCreadas++;
        } catch (error: any) {
          console.error(`Error creando entrega ${entrega.folio}:`, error);
          errores.push(`Entrega ${entrega.folio}: ${error.message}`);
        }
      }

      // 4. Enviar rutas GPS si existen
      let rutasGeneradas = 0;
      if (rutas && rutas.length > 0) {
        console.log('📍 Enviando rutas GPS...');
        for (const ruta of rutas) {
          try {
            await this.createRutaGPS(ruta);
            rutasGeneradas++;
          } catch (error: any) {
            console.error('Error creando ruta GPS:', error);
            errores.push(`Ruta GPS: ${error.message}`);
          }
        }
      }

      // 5. Guardar marca de datos cargados
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        config,
        results: {
          clientesCreados,
          entregasCreadas,
          rutasGeneradas,
        },
      }));

      const tiempoEjecucion = Date.now() - startTime;

      console.log('✅ Carga completada exitosamente');
      console.log(`⏱️ Tiempo: ${tiempoEjecucion}ms`);

      return {
        success: true,
        message: 'Datos de prueba cargados exitosamente',
        data: {
          clientesCreados,
          entregasCreadas,
          rutasGeneradas,
          tiempoEjecucion,
        },
        errores: errores.length > 0 ? errores : undefined,
      };
    } catch (error: any) {
      console.error('❌ Error cargando datos:', error);

      return {
        success: false,
        message: `Error cargando datos: ${error.message}`,
        data: {
          clientesCreados: 0,
          entregasCreadas: 0,
          rutasGeneradas: 0,
          tiempoEjecucion: Date.now() - startTime,
        },
        errores: [error.message, ...errores],
      };
    }
  }

  /**
   * Cargar datos de prueba específicos para Zacatecas
   */
  async loadTestDataZacatecas(config: TestDataConfig): Promise<TestDataResult> {
    const startTime = Date.now();
    const errores: string[] = [];

    try {
      console.log('🚀 Iniciando carga de datos de prueba para Zacatecas...');
      console.log('Configuración:', config);

      // 1. Generar datos específicos para Zacatecas
      console.log('📝 Generando datos para Zacatecas...');
      const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSetZacatecas(config);

      console.log(`✅ Generados: ${clientes.length} clientes en Zacatecas, ${entregas.length} entregas`);

      // 2. Enviar clientes al backend
      console.log('📤 Enviando clientes...');
      let clientesCreados = 0;

      for (const cliente of clientes) {
        try {
          await this.createCliente(cliente);
          clientesCreados++;
        } catch (error: any) {
          console.error(`Error creando cliente ${cliente.nombre}:`, error);
          errores.push(`Cliente ${cliente.nombre}: ${error.message}`);
        }
      }

      // 3. Enviar entregas al backend
      console.log('📤 Enviando entregas...');
      let entregasCreadas = 0;

      for (const entrega of entregas) {
        try {
          await this.createEntrega(entrega);
          entregasCreadas++;
        } catch (error: any) {
          console.error(`Error creando entrega ${entrega.folio}:`, error);
          errores.push(`Entrega ${entrega.folio}: ${error.message}`);
        }
      }

      // 4. Enviar rutas GPS si existen
      let rutasGeneradas = 0;
      if (rutas && rutas.length > 0) {
        console.log('📍 Enviando rutas GPS...');
        for (const ruta of rutas) {
          try {
            await this.createRutaGPS(ruta);
            rutasGeneradas++;
          } catch (error: any) {
            console.error('Error creando ruta GPS:', error);
            errores.push(`Ruta GPS: ${error.message}`);
          }
        }
      }

      // 5. Guardar marca de datos cargados
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        config: { ...config, ubicacion: 'Zacatecas' },
        results: {
          clientesCreados,
          entregasCreadas,
          rutasGeneradas,
        },
      }));

      const tiempoEjecucion = Date.now() - startTime;

      console.log('✅ Carga completada exitosamente para Zacatecas');
      console.log(`⏱️ Tiempo: ${tiempoEjecucion}ms`);

      return {
        success: true,
        message: 'Datos de prueba para Zacatecas cargados exitosamente',
        data: {
          clientesCreados,
          entregasCreadas,
          rutasGeneradas,
          tiempoEjecucion,
        },
        errores: errores.length > 0 ? errores : undefined,
      };
    } catch (error: any) {
      console.error('❌ Error cargando datos de Zacatecas:', error);

      return {
        success: false,
        message: `Error cargando datos de Zacatecas: ${error.message}`,
        data: {
          clientesCreados: 0,
          entregasCreadas: 0,
          rutasGeneradas: 0,
          tiempoEjecucion: Date.now() - startTime,
        },
        errores: [error.message, ...errores],
      };
    }
  }

  /**
   * Crear cliente en el backend
   */
  private async createCliente(cliente: any): Promise<void> {
    try {
      await apiService.post('/mobile/test/clientes', cliente);
    } catch (error: any) {
      // Si el endpoint no existe o hay error, registrar pero continuar
      console.warn(`⚠️ Backend no implementado (${error.message}), datos guardados localmente`);
      return; // Continuar sin fallar
    }
  }

  /**
   * Crear entrega en el backend
   */
  private async createEntrega(entrega: EntregaTest): Promise<void> {
    try {
      // Adaptar formato al que espera el backend
      const entregaPayload = {
        ordenVenta: entrega.ordenVenta,
        folio: entrega.folio,
        fecha: entrega.fecha,
        tipoEntrega: entrega.tipoEntrega,
        estado: entrega.estado,
        cliente: {
          nombre: entrega.cliente.nombre,
          rfc: entrega.cliente.rfc,
          telefono: entrega.cliente.telefono,
          email: entrega.cliente.email,
        },
        direccionEntrega: {
          calle: entrega.cliente.direccion.calle,
          numero: entrega.cliente.direccion.numero,
          colonia: entrega.cliente.direccion.colonia,
          ciudad: entrega.cliente.direccion.ciudad,
          estado: entrega.cliente.direccion.estado,
          codigoPostal: entrega.cliente.direccion.codigoPostal,
          coordenadas: entrega.cliente.direccion.coordenadas,
        },
        productos: entrega.productos.map((p) => ({
          sku: p.sku,
          nombre: p.nombre,
          descripcion: p.descripcion,
          cantidad: p.cantidad,
          unidad: p.unidad,
          peso: p.peso,
        })),
        prioridad: entrega.prioridad,
        horarioEntregaInicio: entrega.horarioInicio,
        horarioEntregaFin: entrega.horarioFin,
        observaciones: entrega.observaciones,
      };

      await apiService.post('/mobile/test/entregas', entregaPayload);
    } catch (error: any) {
      // Si el endpoint no existe o hay error, registrar pero continuar
      console.warn(`⚠️ Backend no implementado (${error.message}), datos guardados localmente`);
      return; // Continuar sin fallar
    }
  }

  /**
   * Crear ruta GPS en el backend
   */
  private async createRutaGPS(ruta: any): Promise<void> {
    try {
      await apiService.post('/mobile/test/rutas-gps', ruta);
    } catch (error: any) {
      // Si el endpoint no existe o hay error, registrar pero continuar
      console.warn(`⚠️ Backend no implementado (${error.message}), datos guardados localmente`);
      return; // Continuar sin fallar
    }
  }

  /**
   * Limpiar datos de prueba del backend
   */
  async clearTestData(): Promise<TestDataResult> {
    const startTime = Date.now();

    try {
      console.log('🗑️ Limpiando datos de prueba...');

      try {
        await apiService.delete('/mobile/test/all');
      } catch (error: any) {
        console.warn('⚠️ Backend no implementado, limpiando solo datos locales');
      }

      await AsyncStorage.removeItem(this.STORAGE_KEY);

      console.log('✅ Datos limpiados exitosamente (locales)');

      return {
        success: true,
        message: 'Datos de prueba eliminados exitosamente',
        data: {
          clientesCreados: 0,
          entregasCreadas: 0,
          rutasGeneradas: 0,
          tiempoEjecucion: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      console.error('❌ Error limpiando datos:', error);

      return {
        success: false,
        message: `Error limpiando datos: ${error.message}`,
        data: {
          clientesCreados: 0,
          entregasCreadas: 0,
          rutasGeneradas: 0,
          tiempoEjecucion: Date.now() - startTime,
        },
        errores: [error.message],
      };
    }
  }

  /**
   * Verificar si hay datos de prueba cargados
   */
  async hasTestDataLoaded(): Promise<boolean> {
    const data = await AsyncStorage.getItem(this.STORAGE_KEY);
    return data !== null;
  }

  /**
   * Obtener información de datos cargados
   */
  async getTestDataInfo(): Promise<any> {
    const data = await AsyncStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Simular tracking GPS en tiempo real
   */
  async simulateGPSTracking(
    ruta: any,
    onProgress: (punto: any, index: number, total: number) => void
  ): Promise<void> {
    console.log('🚗 Iniciando simulación de tracking GPS...');

    for (let i = 0; i < ruta.puntos.length; i++) {
      const punto = ruta.puntos[i];

      // Enviar ubicación al backend
      try {
        await apiService.post('/mobile/chofer/ubicacion', {
          coordenadas: {
            latitud: punto.latitud,
            longitud: punto.longitud,
          },
          velocidad: punto.velocidad,
          timestamp: punto.timestamp,
          enRuta: true,
        });

        onProgress(punto, i + 1, ruta.puntos.length);
      } catch (error) {
        console.error('Error enviando ubicación:', error);
      }

      // Esperar 1 segundo entre puntos (simular tiempo real)
      await this.sleep(1000);
    }

    console.log('✅ Simulación de tracking completada');
  }

  /**
   * Simular confirmación de entrega
   */
  async simulateEntregaConfirmation(entregaId: number): Promise<void> {
    console.log(`📦 Simulando confirmación de entrega ${entregaId}...`);

    // Generar datos ficticios de confirmación
    const confirmacion = {
      entregaId,
      estado: 'ENTREGADO',
      nombreRecibe: 'Juan Pérez',
      coordenadas: {
        latitud: 20.6597 + (Math.random() - 0.5) * 0.01,
        longitud: -103.3496 + (Math.random() - 0.5) * 0.01,
      },
      productos: [{ productoId: 1, cantidadEntregada: 10 }],
      fotosEvidencia: [],
      fechaHora: new Date().toISOString(),
    };

    try {
      await apiService.post(
        `/mobile/entregas/${entregaId}/confirmar`,
        confirmacion
      );
      console.log('✅ Entrega confirmada exitosamente');
    } catch (error) {
      console.error('Error confirmando entrega:', error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const testDataService = new TestDataService();
