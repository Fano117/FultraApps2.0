import { apiService } from '@/shared/services';
import { ClienteEntregaDTO, EntregaDTO } from '../models';
import { mockClientesEntrega } from '../mocks/mockData';

// MODO MOCK GLOBAL - Debe estar sincronizado con entregasApiService.ts
const USE_MOCK_DATA = true;

// Función helper para simular delay de red
const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Servicio especializado para endpoints móviles del backend
 * Basado en los nuevos endpoints implementados en el backend
 *
 * MODO MOCK ACTIVADO: Todos los métodos usan datos locales sin conexión al backend
 */
class MobileApiService {
  /**
   * Obtener lista de entregas para el chofer autenticado
   * Endpoint: GET /api/Mobile/entregas
   *
   * Notas del backend:
   * - Filtra por usuario autenticado
   * - Solo devuelve entregas con EstatusEmbarqueId = 4 (En ruta)
   * - EsTestData = false para datos de prueba
   * - Devuelve estructura paginada: {items: [], totalCount, pageNumber, pageSize, totalPages}
   */
  async getEntregas(): Promise<ClienteEntregaDTO[]> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[MOBILE API] 🔧 MODO MOCK: Usando datos locales');
      await simulateNetworkDelay(800);
      console.log('[MOBILE API] ✅ Mock: Retornando', mockClientesEntrega.length, 'clientes con entregas');
      return mockClientesEntrega;
    }

    // MODO BACKEND REAL
    try {
      console.log('[MOBILE API] 📱 Obteniendo entregas móviles...');
      const response = await apiService.get<any>('/Mobile/entregas');

      console.log('[MOBILE API] 🔍 Respuesta raw del backend:', {
        tipo: typeof response,
        esArray: Array.isArray(response),
        keys: response ? Object.keys(response) : [],
        totalCount: response?.totalCount,
        itemsLength: response?.items?.length
      });

      // El backend devuelve estructura paginada
      let entregasRaw: any[] = [];

      if (response && response.items && Array.isArray(response.items)) {
        entregasRaw = response.items;
        console.log('[MOBILE API] 📄 Encontradas', entregasRaw.length, 'entregas de', response.totalCount, 'total');
      } else {
        console.warn('[MOBILE API] ⚠️ Respuesta no contiene items array:', response);
        return [];
      }

      // Transformar las entregas del backend al formato esperado por el frontend
      const clientesMap = new Map<string, ClienteEntregaDTO>();

      entregasRaw.forEach((entregaRaw, index) => {
        try {
          const clienteKey = `${entregaRaw.cliente?.nombre || 'Sin Cliente'}_${entregaRaw.cliente?.id || 0}`;

          // Si el cliente no existe en el mapa, crearlo
          if (!clientesMap.has(clienteKey)) {
            clientesMap.set(clienteKey, {
              cliente: entregaRaw.cliente?.nombre || 'Sin Cliente',
              cuentaCliente: entregaRaw.cliente?.id?.toString() || '0',
              carga: `CARGA_${entregaRaw.cliente?.id || 0}`,
              direccionEntrega: entregaRaw.direccion?.calle || 'Sin dirección',
              latitud: entregaRaw.direccion?.coordenadas?.latitud?.toString() || '0',
              longitud: entregaRaw.direccion?.coordenadas?.longitud?.toString() || '0',
              entregas: []
            });
          }

          // Agregar la entrega al cliente
          const clienteDTO = clientesMap.get(clienteKey)!;
          clienteDTO.entregas.push({
            id: entregaRaw.id,
            ordenVenta: entregaRaw.numeroOrden || '',
            folio: `FOL_${entregaRaw.id}`,
            tipoEntrega: 'ENTREGA',
            estado: entregaRaw.estatus || 'PENDIENTE',
            articulos: entregaRaw.productos || [],
            cargaCuentaCliente: `${clienteDTO.carga}_${clienteDTO.cuentaCliente}`
          });

        } catch (error) {
          console.error('[MOBILE API] ❌ Error procesando entrega', index, ':', error);
        }
      });

      const entregasArray = Array.from(clientesMap.values());

      console.log('[MOBILE API] ✅ Entregas procesadas:', {
        totalClientes: entregasArray.length,
        totalEntregas: entregasArray.reduce((sum, cliente) => sum + cliente.entregas.length, 0),
        ejemploCliente: entregasArray[0]?.cliente || 'N/A'
      });

      return entregasArray;
    } catch (error) {
      console.error('[MOBILE API] ❌ Error obteniendo entregas:', error);

      // Fallback a mock data en caso de error
      if (__DEV__) {
        console.warn('[MOBILE API] ⚠️ Error en backend, usando datos mock como fallback');
        return mockClientesEntrega;
      }

      throw error;
    }
  }

  /**
   * Obtener una entrega específica por ID
   * Endpoint: GET /api/mobile/entrega/{id}
   */
  async getEntregaById(id: string | number): Promise<EntregaDTO> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[MOBILE API] 🔧 MODO MOCK: Buscando entrega ID:', id);
      await simulateNetworkDelay(300);

      // Buscar en mock data
      for (const cliente of mockClientesEntrega) {
        const entrega = cliente.entregas.find(e =>
          e.ordenVenta === id || e.folio === id || e.id?.toString() === id.toString()
        );
        if (entrega) {
          console.log('[MOBILE API] ✅ Mock: Entrega encontrada:', entrega.ordenVenta);
          return entrega;
        }
      }

      throw new Error(`Entrega ${id} no encontrada en mock data`);
    }

    // MODO BACKEND REAL
    try {
      console.log(`[MOBILE API] 🔍 Obteniendo entrega ID: ${id}`);
      const response = await apiService.get<EntregaDTO>(`/mobile/entrega/${id}`);
      console.log('[MOBILE API] ✅ Entrega específica obtenida:', response);
      return response;
    } catch (error) {
      console.error(`[MOBILE API] ❌ Error obteniendo entrega ${id}:`, error);

      // Fallback a mock data
      if (__DEV__) {
        console.warn('[MOBILE API] ⚠️ Error en backend, buscando en mock data');
        for (const cliente of mockClientesEntrega) {
          const entrega = cliente.entregas.find(e =>
            e.ordenVenta === id || e.folio === id || e.id?.toString() === id.toString()
          );
          if (entrega) return entrega;
        }
      }

      throw error;
    }
  }

  /**
   * Actualizar estado de una entrega
   * Endpoint: PUT /api/mobile/entregas/{id}/estado
   *
   * Estados posibles:
   * - PENDIENTE
   * - EN_RUTA
   * - COMPLETADO
   * - CANCELADO
   */
  async actualizarEstado(id: string | number, estado: string): Promise<void> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[MOBILE API] 🔧 MODO MOCK: Actualizando entrega', id, 'a estado:', estado);
      await simulateNetworkDelay(500);
      console.log('[MOBILE API] ✅ Mock: Estado actualizado (simulado)');
      return;
    }

    // MODO BACKEND REAL
    try {
      console.log(`[MOBILE API] 🔄 Actualizando entrega ${id} a estado: ${estado}`);
      await apiService.put(`/mobile/entregas/${id}/estado`, { estado });
      console.log('[MOBILE API] ✅ Estado actualizado exitosamente');
    } catch (error) {
      console.error(`[MOBILE API] ❌ Error actualizando estado:`, error);

      // Fallback a mock (simular éxito)
      if (__DEV__) {
        console.warn('[MOBILE API] ⚠️ Error en backend, simulando actualización exitosa');
        return;
      }

      throw error;
    }
  }

  /**
   * Confirmar entrega con validación GPS
   * Endpoint: POST /api/Mobile/confirmar-entrega
   *
   * Incluye validación de proximidad GPS del backend
   */
  async confirmarEntrega(datos: {
    entregaId: string | number;
    latitud: number;
    longitud: number;
    fechaEntrega: string;
    nombreReceptor?: string;
    observaciones?: string;
    estado: string;
    evidencias?: {
      fotoUri?: string;
      firmaUri?: string;
    };
  }): Promise<{ success: boolean; message?: string }> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[MOBILE API] 🔧 MODO MOCK: Confirmando entrega', datos.entregaId);
      await simulateNetworkDelay(1000);
      console.log('[MOBILE API] ✅ Mock: Entrega confirmada exitosamente', {
        entrega: datos.entregaId,
        receptor: datos.nombreReceptor,
        estado: datos.estado,
        ubicacion: `${datos.latitud}, ${datos.longitud}`
      });
      return { success: true, message: 'Entrega confirmada exitosamente (mock)' };
    }

    // MODO BACKEND REAL
    try {
      console.log(`[MOBILE API] ✅ Confirmando entrega ${datos.entregaId}`);
      console.log(`[MOBILE API] 📍 Coordenadas: ${datos.latitud}, ${datos.longitud}`);

      // Preparar datos para envío
      const confirmacion = {
        entregaId: datos.entregaId,
        latitud: datos.latitud,
        longitud: datos.longitud,
        fechaEntrega: datos.fechaEntrega,
        nombreReceptor: datos.nombreReceptor || '',
        observaciones: datos.observaciones || '',
        estado: datos.estado
      };

      const response = await apiService.post<{ success: boolean; message?: string }>(
        '/Mobile/confirmar-entrega',
        confirmacion
      );

      console.log('[MOBILE API] ✅ Entrega confirmada:', response);
      return response;
    } catch (error) {
      console.error('[MOBILE API] ❌ Error confirmando entrega:', error);

      // Fallback a mock
      if (__DEV__) {
        console.warn('[MOBILE API] ⚠️ Error en backend, simulando confirmación exitosa');
        return { success: true, message: 'Entrega confirmada (fallback a mock)' };
      }

      throw error;
    }
  }

  /**
   * Obtener ruta optimizada del chofer
   * Endpoint: GET /api/Mobile/ruta
   */
  async getRuta(): Promise<any> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[MOBILE API] 🔧 MODO MOCK: Generando ruta optimizada');
      await simulateNetworkDelay(600);

      const ruta = {
        distanciaTotal: 15.5,
        tiempoEstimado: 45,
        rutaOptimizada: mockClientesEntrega.map(c => ({
          latitud: parseFloat(c.latitud),
          longitud: parseFloat(c.longitud),
          cliente: c.cliente
        })),
        entregas: mockClientesEntrega.flatMap(c => c.entregas)
      };

      console.log('[MOBILE API] ✅ Mock: Ruta generada con', ruta.rutaOptimizada.length, 'puntos');
      return ruta;
    }

    // MODO BACKEND REAL
    try {
      console.log('[MOBILE API] 🗺️ Obteniendo ruta optimizada...');
      const response = await apiService.get<any>('/Mobile/ruta');
      console.log('[MOBILE API] ✅ Ruta obtenida:', {
        totalPuntos: response?.rutaOptimizada?.length || 0,
        distancia: response?.distanciaTotal,
        tiempo: response?.tiempoEstimado
      });
      return response;
    } catch (error) {
      console.error('[MOBILE API] ❌ Error obteniendo ruta:', error);

      // Fallback a mock
      if (__DEV__) {
        console.warn('[MOBILE API] ⚠️ Error en backend, usando ruta mock');
        return {
          distanciaTotal: 15.5,
          tiempoEstimado: 45,
          rutaOptimizada: mockClientesEntrega.map(c => ({
            latitud: parseFloat(c.latitud),
            longitud: parseFloat(c.longitud),
            cliente: c.cliente
          })),
          entregas: mockClientesEntrega.flatMap(c => c.entregas)
        };
      }

      throw error;
    }
  }

  /**
   * Crear datos de prueba
   * Endpoint: POST /api/TestData/crear-datos-completos
   *
   * Nota: Solo para testing y desarrollo
   */
  async crearDatosPrueba(config?: {
    cantidadClientes?: number;
    cantidadEntregas?: number;
    generarRutaGPS?: boolean;
  }): Promise<any> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[MOBILE API] 🔧 MODO MOCK: Datos de prueba ya disponibles localmente');
      await simulateNetworkDelay(500);
      return {
        success: true,
        message: 'Usando datos mock locales',
        clientes: mockClientesEntrega.length,
        entregas: mockClientesEntrega.reduce((sum, c) => sum + c.entregas.length, 0)
      };
    }

    // MODO BACKEND REAL
    try {
      console.log('[MOBILE API] 🧪 Creando datos de prueba...');
      const response = await apiService.post<any>('/TestData/crear-datos-completos', config || {
        cantidadClientes: 3,
        cantidadEntregas: 5,
        generarRutaGPS: true
      });
      console.log('[MOBILE API] ✅ Datos de prueba creados:', response);
      return response;
    } catch (error) {
      console.error('[MOBILE API] ❌ Error creando datos de prueba:', error);

      // Fallback a mock
      if (__DEV__) {
        console.warn('[MOBILE API] ⚠️ Error en backend, usando datos mock locales');
        return {
          success: true,
          message: 'Usando datos mock locales (fallback)',
          clientes: mockClientesEntrega.length,
          entregas: mockClientesEntrega.reduce((sum, c) => sum + c.entregas.length, 0)
        };
      }

      throw error;
    }
  }

  /**
   * Verificar conectividad con el backend
   */
  async ping(): Promise<{ status: string; timestamp: string }> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[MOBILE API] 🔧 MODO MOCK: Ping simulado');
      return {
        status: 'ok (mock)',
        timestamp: new Date().toISOString()
      };
    }

    // MODO BACKEND REAL
    try {
      const response = await apiService.get<{ status: string; timestamp: string }>('/health');
      return response;
    } catch (error) {
      console.error('[MOBILE API] ❌ Error en ping:', error);
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }
}

export const mobileApiService = new MobileApiService();
