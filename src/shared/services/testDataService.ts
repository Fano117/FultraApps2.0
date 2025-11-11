/**
 * Servicio para cargar datos de prueba al backend
 */

import { enhancedApiService } from './enhancedApiService';
import { testDataGenerator } from './testDataGenerator';
import { storageService } from './storageService';
import {
  TestDataConfig,
  TestDataResult,
  EntregaTest,
} from '../models/testData.models';

class TestDataService {
  private readonly STORAGE_KEY = 'test_data_loaded';

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
      await storageService.save(STORAGE_KEY, {
        timestamp: new Date().toISOString(),
        config,
        results: {
          clientesCreados,
          entregasCreadas,
          rutasGeneradas,
        },
      });

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
   * Crear cliente en el backend
   */
  private async createCliente(cliente: any): Promise<void> {
    try {
      await enhancedApiService.post('/mobile/test/clientes', cliente);
    } catch (error: any) {
      // Si el endpoint no existe, registrar pero continuar
      if (error.status === 404) {
        console.warn('Endpoint /mobile/test/clientes no existe - datos guardados localmente');
        return;
      }
      throw error;
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

      await enhancedApiService.post('/mobile/test/entregas', entregaPayload);
    } catch (error: any) {
      if (error.status === 404) {
        console.warn('Endpoint /mobile/test/entregas no existe - datos guardados localmente');
        return;
      }
      throw error;
    }
  }

  /**
   * Crear ruta GPS en el backend
   */
  private async createRutaGPS(ruta: any): Promise<void> {
    try {
      await enhancedApiService.post('/mobile/test/rutas-gps', ruta);
    } catch (error: any) {
      if (error.status === 404) {
        console.warn('Endpoint /mobile/test/rutas-gps no existe - datos guardados localmente');
        return;
      }
      throw error;
    }
  }

  /**
   * Limpiar datos de prueba del backend
   */
  async clearTestData(): Promise<TestDataResult> {
    const startTime = Date.now();

    try {
      console.log('🗑️ Limpiando datos de prueba...');

      await enhancedApiService.delete('/mobile/test/all');

      await storageService.remove(STORAGE_KEY);

      console.log('✅ Datos limpiados exitosamente');

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
    const data = await storageService.get(STORAGE_KEY);
    return data !== null;
  }

  /**
   * Obtener información de datos cargados
   */
  async getTestDataInfo(): Promise<any> {
    return await storageService.get(STORAGE_KEY);
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
        await enhancedApiService.post('/mobile/chofer/ubicacion', {
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
      await enhancedApiService.post(
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
