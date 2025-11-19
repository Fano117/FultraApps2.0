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
  /**
   * Cargar datos de prueba específicos para Monterrey
   */
  async loadTestDataMonterrey(config: TestDataConfig): Promise<TestDataResult> {
    const startTime = Date.now();
    const errores: string[] = [];

    try {
      console.log('🚀 Iniciando carga de datos de prueba para Monterrey...');
      console.log('Configuración:', config);

      // 1. Generar datos específicos para Monterrey
      if (!testDataGenerator.generateTestDataSet) {
        throw new Error('Función generateTestDataSet no implementada');
      }
      // Añadir 'ubicacion' sin romper el tipo TestDataConfig
      const monterreyConfig = { ...(config as any), ubicacion: 'Monterrey' } as TestDataConfig;
      const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSet(monterreyConfig);

      console.log(`✅ Generados: ${clientes.length} clientes en Monterrey, ${entregas.length} entregas`);

      // 2. Convertir datos generados al formato ClienteEntregaDTO
      const clientesDTO = await this.convertToClienteEntregaDTO(clientes, entregas);
      
      // 3. Guardar datos localmente usando AsyncStorage
      console.log('💾 Guardando datos en almacenamiento local...');
      await AsyncStorage.setItem('@FultraApps:clientesEntrega', JSON.stringify(clientesDTO));
      
      const clientesCreados = clientes.length;
      const entregasCreadas = entregas.length;
      const rutasGeneradas = rutas?.length || 0;

      // 5. Guardar marca de datos cargados
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        config: { ...config, ubicacion: 'Monterrey' },
        results: {
          clientesCreados,
          entregasCreadas,
          rutasGeneradas,
        },
      }));

      const tiempoEjecucion = Date.now() - startTime;

      console.log('✅ Carga completada exitosamente para Monterrey');
      console.log(`⏱️ Tiempo: ${tiempoEjecucion}ms`);

      return {
        success: true,
        message: 'Datos de prueba para Monterrey cargados exitosamente',
        data: {
          clientesCreados,
          entregasCreadas,
          rutasGeneradas,
          tiempoEjecucion,
        },
        errores: errores.length > 0 ? errores : undefined,
      };
    } catch (error: any) {
      console.error('❌ Error cargando datos de Monterrey:', error);

      return {
        success: false,
        message: `Error cargando datos de Monterrey: ${error.message}`,
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
  private readonly STORAGE_KEY = '@FultraApps:test_data_loaded';

  /**
   * Cargar datos de prueba completos (SOLO LOCALMENTE - SIN BACKEND)
   */
  async loadTestData(config: TestDataConfig): Promise<TestDataResult> {
    const startTime = Date.now();
    const errores: string[] = [];

    try {
      console.log('🚀 Iniciando carga de datos de prueba MOCK (solo local)...');
      console.log('Configuración:', config);

      // 1. Generar datos mock localmente
      console.log('📝 Generando datos mock...');
      const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSet(config);

      console.log(`✅ Generados: ${clientes.length} clientes, ${entregas.length} entregas`);

      // 2. Convertir datos generados al formato ClienteEntregaDTO
      const clientesDTO = await this.convertToClienteEntregaDTO(clientes, entregas);
      
      // 3. Guardar datos localmente usando AsyncStorage
      console.log('💾 Guardando datos en almacenamiento local...');
      await AsyncStorage.setItem('@FultraApps:clientesEntrega', JSON.stringify(clientesDTO));
      
      const clientesCreados = clientes.length;
      const entregasCreadas = entregas.length;
      const rutasGeneradas = rutas?.length || 0;

      // 4. Guardar marca de datos cargados
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

      console.log('✅ Carga completada exitosamente (datos guardados localmente)');
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

      // 2. Convertir datos generados al formato ClienteEntregaDTO
      const clientesDTO = await this.convertToClienteEntregaDTO(clientes, entregas);
      
      // 3. Guardar datos localmente usando AsyncStorage
      console.log('💾 Guardando datos en almacenamiento local...');
      await AsyncStorage.setItem('@FultraApps:clientesEntrega', JSON.stringify(clientesDTO));
      
      const clientesCreados = clientes.length;
      const entregasCreadas = entregas.length;
      const rutasGeneradas = rutas?.length || 0;

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
   * Convertir datos generados al formato ClienteEntregaDTO que usa la app
   */
  private async convertToClienteEntregaDTO(clientes: any[], entregas: any[]): Promise<any[]> {
    // Agrupar entregas por cliente
    const clientesMap = new Map();
    
    entregas.forEach(entrega => {
      const clienteKey = entrega.cliente.rfc;
      
      if (!clientesMap.has(clienteKey)) {
        clientesMap.set(clienteKey, {
          cliente: entrega.cliente.nombre,
          cuentaCliente: entrega.cliente.rfc,
          carga: `CARGA-${entrega.folio.substring(0, 8)}`,
          direccionEntrega: `${entrega.cliente.direccion.calle} ${entrega.cliente.direccion.numero}, ${entrega.cliente.direccion.colonia}, ${entrega.cliente.direccion.ciudad}, ${entrega.cliente.direccion.estado}`,
          latitud: entrega.cliente.direccion.coordenadas?.latitud?.toString() || "0",
          longitud: entrega.cliente.direccion.coordenadas?.longitud?.toString() || "0",
          entregas: []
        });
      }
      
      const clienteDTO = clientesMap.get(clienteKey);
      clienteDTO.entregas.push({
        id: Math.floor(Math.random() * 100000),
        ordenVenta: entrega.ordenVenta,
        folio: entrega.folio,
        tipoEntrega: entrega.tipoEntrega || "ENTREGA",
        estado: entrega.estado || "PENDIENTE",
        articulos: entrega.productos.map((p: any, idx: number) => ({
          id: idx + 1,
          nombreCarga: clienteDTO.carga,
          nombreOrdenVenta: entrega.ordenVenta,
          producto: p.nombre,
          cantidadProgramada: p.cantidad,
          cantidadEntregada: 0,
          restante: p.cantidad,
          peso: p.peso || 0,
          unidadMedida: p.unidad || "pza",
          descripcion: p.descripcion || p.nombre
        }))
      });
    });
    
    return Array.from(clientesMap.values());
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
   * Limpiar datos de prueba (SOLO LOCALES - SIN BACKEND)
   */
  async clearTestData(): Promise<TestDataResult> {
    const startTime = Date.now();

    try {
      console.log('🗑️ Limpiando datos de prueba mock (solo locales)...');

      // Limpiar todos los datos locales relacionados
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await AsyncStorage.removeItem('@FultraApps:clientesEntrega');
      await AsyncStorage.removeItem('@FultraApps:entregasSync');

      console.log('✅ Datos mock limpiados exitosamente (solo locales)');

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
