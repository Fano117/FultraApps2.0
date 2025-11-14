import { apiService } from '@/shared/services';
import { ClienteEntregaDTO, EntregaDTO } from '../models';

/**
 * Servicio especializado para endpoints móviles del backend
 * Basado en los nuevos endpoints implementados en el backend
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
      throw error;
    }
  }

  /**
   * Obtener una entrega específica por ID
   * Endpoint: GET /api/mobile/entrega/{id}
   */
  async getEntregaById(id: string | number): Promise<EntregaDTO> {
    try {
      console.log(`[MOBILE API] 🔍 Obteniendo entrega ID: ${id}`);
      const response = await apiService.get<EntregaDTO>(`/mobile/entrega/${id}`);
      console.log('[MOBILE API] ✅ Entrega específica obtenida:', response);
      return response;
    } catch (error) {
      console.error(`[MOBILE API] ❌ Error obteniendo entrega ${id}:`, error);
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
    try {
      console.log(`[MOBILE API] 🔄 Actualizando entrega ${id} a estado: ${estado}`);
      await apiService.put(`/mobile/entregas/${id}/estado`, { estado });
      console.log('[MOBILE API] ✅ Estado actualizado exitosamente');
    } catch (error) {
      console.error(`[MOBILE API] ❌ Error actualizando estado:`, error);
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
      throw error;
    }
  }

  /**
   * Obtener ruta optimizada del chofer
   * Endpoint: GET /api/Mobile/ruta
   */
  async getRuta(): Promise<any> {
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
      throw error;
    }
  }

  /**
   * Verificar conectividad con el backend
   */
  async ping(): Promise<{ status: string; timestamp: string }> {
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