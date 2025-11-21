import { apiService } from '@/shared/services';
import { ClienteEntregaDTO, EmbarqueEntregaDTO, EntregaDTO } from '../models';
import { mockClientesEntrega } from '../mocks/mockData';
import { ApiDeliveryResponse, EntregasProcesadas } from '../types/api-delivery';
import { deliveryProcessingService } from './deliveryProcessingService';

// MODO MOCK GLOBAL - Cambiar a false para usar backend real
const USE_MOCK_DATA = true;

// Función helper para simular delay de red
const simulateNetworkDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

class EntregasApiService {
  /**
   * Obtener entregas desde el nuevo endpoint móvil
   * Endpoint actualizado: GET /api/Mobile/entregas
   */
  async fetchEntregasMoviles(): Promise<ClienteEntregaDTO[]> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[ENTREGAS API] 🔧 MODO MOCK: Usando datos locales');
      await simulateNetworkDelay(800);
      console.log('[ENTREGAS API] ✅ Mock: Retornando', mockClientesEntrega.length, 'clientes con entregas');
      return mockClientesEntrega;
    }

    // MODO BACKEND REAL
    try {
      console.log('[ENTREGAS API] 🚀 Llamando al nuevo endpoint /Mobile/entregas...');
      const response = await apiService.get<any>('/Mobile/entregas');

      console.log('[ENTREGAS API] 🔍 Respuesta del backend:', {
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
        console.log('[ENTREGAS API] 📄 Encontradas', entregasRaw.length, 'entregas de', response.totalCount, 'total');
      } else {
        console.warn('[ENTREGAS API] ⚠️ Respuesta no contiene items array:', response);
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
          console.error('[ENTREGAS API] ❌ Error procesando entrega', index, ':', error);
        }
      });

      const entregasArray = Array.from(clientesMap.values());

      console.log('[ENTREGAS API] ✅ Respuesta procesada:', {
        totalClientes: entregasArray.length,
        data: entregasArray.length > 0 ? 'Datos transformados correctamente' : 'Array vacío []'
      });

      return entregasArray;
    } catch (error) {
      console.error('[ENTREGAS API] ❌ Error fetching entregas móviles:', error);

      // Fallback a mock data en caso de error
      if (__DEV__) {
        console.warn('[ENTREGAS API] ⚠️ Error en backend, usando datos mock como fallback');
        return mockClientesEntrega;
      }

      throw error;
    }
  }

  /**
   * Método legacy para compatibilidad hacia atrás
   * @deprecated Usar fetchEntregasMoviles() en su lugar
   */
  async fetchEmbarquesEntrega(): Promise<ClienteEntregaDTO[]> {
    console.warn('[ENTREGAS API] ⚠️ fetchEmbarquesEntrega está deprecated, usar fetchEntregasMoviles()');
    return this.fetchEntregasMoviles();
  }

  /**
   * Obtener una entrega específica por ID
   * Endpoint: GET /api/mobile/entrega/{id}
   */
  async getEntregaById(id: string | number): Promise<EntregaDTO> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[ENTREGAS API] 🔧 MODO MOCK: Buscando entrega ID:', id);
      await simulateNetworkDelay(300);

      // Buscar en mock data
      for (const cliente of mockClientesEntrega) {
        const entrega = cliente.entregas.find(e =>
          e.ordenVenta === id || e.folio === id || e.id?.toString() === id.toString()
        );
        if (entrega) {
          console.log('[ENTREGAS API] ✅ Mock: Entrega encontrada:', entrega.ordenVenta);
          return entrega;
        }
      }

      throw new Error(`Entrega ${id} no encontrada en mock data`);
    }

    // MODO BACKEND REAL
    try {
      console.log(`[ENTREGAS API] 🔍 Obteniendo entrega con ID: ${id}`);
      const response = await apiService.get<EntregaDTO>(`/mobile/entrega/${id}`);
      console.log('[ENTREGAS API] ✅ Entrega obtenida:', response);
      return response;
    } catch (error) {
      console.error(`[ENTREGAS API] ❌ Error obteniendo entrega ${id}:`, error);

      // Fallback a mock data
      if (__DEV__) {
        console.warn('[ENTREGAS API] ⚠️ Error en backend, buscando en mock data');
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
   */
  async actualizarEstadoEntrega(id: string | number, nuevoEstado: string): Promise<void> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[ENTREGAS API] 🔧 MODO MOCK: Actualizando estado de entrega', id, 'a:', nuevoEstado);
      await simulateNetworkDelay(500);
      console.log('[ENTREGAS API] ✅ Mock: Estado actualizado (simulado)');
      return;
    }

    // MODO BACKEND REAL
    try {
      console.log(`[ENTREGAS API] 🔄 Actualizando estado de entrega ${id} a: ${nuevoEstado}`);
      await apiService.put(`/mobile/entregas/${id}/estado`, {
        estado: nuevoEstado
      });
      console.log('[ENTREGAS API] ✅ Estado actualizado correctamente');
    } catch (error) {
      console.error(`[ENTREGAS API] ❌ Error actualizando estado entrega ${id}:`, error);

      // Fallback a mock (simular éxito)
      if (__DEV__) {
        console.warn('[ENTREGAS API] ⚠️ Error en backend, simulando actualización exitosa');
        return;
      }

      throw error;
    }
  }

  /**
   * Confirmar entrega con validación GPS
   * Endpoint: POST /api/Mobile/confirmar-entrega
   */
  async confirmarEntrega(confirmacion: {
    entregaId: string | number;
    latitud: number;
    longitud: number;
    fechaEntrega: string;
    nombreReceptor?: string;
    observaciones?: string;
    estado: string;
  }): Promise<void> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[ENTREGAS API] 🔧 MODO MOCK: Confirmando entrega', confirmacion.entregaId);
      await simulateNetworkDelay(1000);
      console.log('[ENTREGAS API] ✅ Mock: Entrega confirmada exitosamente', {
        entrega: confirmacion.entregaId,
        receptor: confirmacion.nombreReceptor,
        estado: confirmacion.estado,
        ubicacion: `${confirmacion.latitud}, ${confirmacion.longitud}`
      });
      return;
    }

    // MODO BACKEND REAL
    try {
      console.log(`[ENTREGAS API] ✅ Confirmando entrega ${confirmacion.entregaId}`);
      await apiService.post('/Mobile/confirmar-entrega', confirmacion);
      console.log('[ENTREGAS API] ✅ Entrega confirmada correctamente');
    } catch (error) {
      console.error(`[ENTREGAS API] ❌ Error confirmando entrega:`, error);

      // Fallback a mock
      if (__DEV__) {
        console.warn('[ENTREGAS API] ⚠️ Error en backend, simulando confirmación exitosa');
        return;
      }

      throw error;
    }
  }

  /**
   * Obtener ruta del chofer
   * Endpoint: GET /api/Mobile/ruta
   */
  async getRutaChofer(): Promise<any> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[ENTREGAS API] 🔧 MODO MOCK: Generando ruta del chofer');
      await simulateNetworkDelay(600);

      const ruta = {
        distanciaTotal: 15.5,
        tiempoEstimado: 45,
        entregas: mockClientesEntrega.flatMap(c => c.entregas),
        puntos: mockClientesEntrega.map(c => ({
          latitud: parseFloat(c.latitud),
          longitud: parseFloat(c.longitud),
          cliente: c.cliente
        }))
      };

      console.log('[ENTREGAS API] ✅ Mock: Ruta generada con', ruta.puntos.length, 'puntos');
      return ruta;
    }

    // MODO BACKEND REAL
    try {
      console.log('[ENTREGAS API] 🗺️ Obteniendo ruta del chofer...');
      const response = await apiService.get('/Mobile/ruta');
      console.log('[ENTREGAS API] ✅ Ruta obtenida:', response);
      return response;
    } catch (error) {
      console.error('[ENTREGAS API] ❌ Error obteniendo ruta:', error);

      // Fallback a mock
      if (__DEV__) {
        console.warn('[ENTREGAS API] ⚠️ Error en backend, usando ruta mock');
        return {
          distanciaTotal: 15.5,
          tiempoEstimado: 45,
          entregas: mockClientesEntrega.flatMap(c => c.entregas),
          puntos: mockClientesEntrega.map(c => ({
            latitud: parseFloat(c.latitud),
            longitud: parseFloat(c.longitud),
            cliente: c.cliente
          }))
        };
      }

      throw error;
    }
  }

  /**
   * Enviar embarque entrega (método legacy)
   * @deprecated Usar confirmarEntrega() en su lugar
   */
  async enviarEmbarqueEntrega(embarque: EmbarqueEntregaDTO): Promise<void> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[ENTREGAS API] 🔧 MODO MOCK: Enviando embarque', embarque.ordenVenta);
      await simulateNetworkDelay(1000);
      console.log('[ENTREGAS API] ✅ Mock: Embarque enviado exitosamente');
      return;
    }

    // MODO BACKEND REAL
    try {
      console.warn('[ENTREGAS API] ⚠️ enviarEmbarqueEntrega está deprecated');
      await apiService.post('/EmbarquesEntrega', embarque);
      const url = '/EmbarquesEntrega';
      console.log('========== API CALL - ENVIAR EMBARQUE ==========');
      console.log('URL completa:', url);
      console.log('Método: POST');
      console.log('Body:', JSON.stringify(embarque, null, 2));
      console.log('===============================================');

      await apiService.post(url, embarque);
    } catch (error) {
      console.error('Error enviando embarque entrega:', error);

      // Fallback a mock
      if (__DEV__) {
        console.warn('[ENTREGAS API] ⚠️ Error en backend, simulando envío exitoso');
        return;
      }

      throw error;
    }
  }

  /**
   * Subir imagen de evidencia
   * Endpoint: POST /EmbarquesEntrega/subir-imagen-evidencia
   */
  async subirImagenEvidencia(
    archivo: { uri: string; type: string; name: string },
    nombre: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[ENTREGAS API] 🔧 MODO MOCK: Subiendo imagen', nombre);

      // Simular progreso de subida
      if (onProgress) {
        await simulateNetworkDelay(200);
        onProgress(25);
        await simulateNetworkDelay(200);
        onProgress(50);
        await simulateNetworkDelay(200);
        onProgress(75);
        await simulateNetworkDelay(200);
        onProgress(100);
      } else {
        await simulateNetworkDelay(800);
      }

      console.log('[ENTREGAS API] ✅ Mock: Imagen subida exitosamente');
      return true;
    }

    // MODO BACKEND REAL
    try {
      const formData = new FormData();

      const uri = archivo.uri.startsWith('file://') ? archivo.uri : `file://${archivo.uri}`;

      formData.append('Imagen', {
        uri,
        type: archivo.type || 'image/jpeg',
        name: archivo.name,
      } as any);

      formData.append('Nombre', nombre);

      const url = '/EmbarquesEntrega/subir-imagen-evidencia';
      console.log('========== API CALL - SUBIR IMAGEN ==========');
      console.log('URL completa:', url);
      console.log('Método: POST (multipart/form-data)');
      console.log('Archivo:', {
        uri: uri,
        type: archivo.type || 'image/jpeg',
        name: archivo.name,
      });
      console.log('Nombre:', nombre);
      console.log('============================================');

      await apiService.uploadFile(url, formData, onProgress);
      return true;
    } catch (error) {
      console.error('Error subiendo imagen evidencia:', error);

      // Fallback a mock
      if (__DEV__) {
        console.warn('[ENTREGAS API] ⚠️ Error en backend, simulando subida exitosa');
        return true;
      }

      return false;
    }
  }

  /**
   * ⭐ NUEVO: Obtener entregas con el nuevo formato JSON de la API
   * Endpoint: GET /api/Mobile/entregas-v2 (o el endpoint que defina el backend)
   * 
   * Este método obtiene las entregas en el nuevo formato que incluye:
   * - folioEmbarque
   * - idRutaHereMaps (opcional)
   * - direcciones[] con coordenadas opcionales y campos desglosados
   */
  async fetchEntregasConNuevoFormato(): Promise<ApiDeliveryResponse> {
    // MODO MOCK
    if (__DEV__ && USE_MOCK_DATA) {
      console.log('[ENTREGAS API] 🔧 MODO MOCK: Generando datos en nuevo formato JSON');
      await simulateNetworkDelay(800);
      
      // Generar datos de ejemplo en el nuevo formato
      const mockResponse: ApiDeliveryResponse = deliveryProcessingService.generarEjemploJSON('mixto');
      
      console.log('[ENTREGAS API] ✅ Mock: Retornando embarque', mockResponse.folioEmbarque);
      console.log(`   ID Ruta: ${mockResponse.idRutaHereMaps || 'null (nueva ruta)'}`);
      console.log(`   Direcciones: ${mockResponse.direcciones.length}`);
      
      return mockResponse;
    }

    // MODO BACKEND REAL
    try {
      console.log('[ENTREGAS API] 🚀 Obteniendo entregas con nuevo formato JSON...');
      
      // TODO: Actualizar endpoint cuando el backend esté listo
      const response = await apiService.get<ApiDeliveryResponse>('/Mobile/entregas-v2');
      
      console.log('[ENTREGAS API] ✅ Respuesta recibida:', {
        folio: response.folioEmbarque,
        idRuta: response.idRutaHereMaps || 'null',
        direcciones: response.direcciones.length
      });
      
      return response;
    } catch (error) {
      console.error('[ENTREGAS API] ❌ Error obteniendo entregas con nuevo formato:', error);
      
      // Fallback a datos mock en caso de error
      if (__DEV__) {
        console.warn('[ENTREGAS API] ⚠️ Error en backend, usando datos mock como fallback');
        return deliveryProcessingService.generarEjemploJSON('mixto');
      }
      
      throw error;
    }
  }

  /**
   * ⭐ NUEVO: Procesar entregas completas con validación y generación de rutas
   * 
   * Este método orquesta todo el flujo:
   * 1. Obtener entregas desde la API
   * 2. Validar y geocodificar direcciones
   * 3. Generar o recuperar ruta HERE Maps
   * 4. Guardar ruta en backend
   */
  async procesarEntregasCompletas(): Promise<EntregasProcesadas> {
    console.log('[ENTREGAS API] 📦 Procesando entregas completas...');
    
    try {
      // Obtener datos desde API
      const apiResponse = await this.fetchEntregasConNuevoFormato();
      
      // Procesar con el servicio de procesamiento
      const resultado = await deliveryProcessingService.procesarEntregasDesdeAPI(apiResponse);
      
      console.log('[ENTREGAS API] ✅ Procesamiento completado:', resultado.mensaje);
      
      return resultado.entregas;
    } catch (error) {
      console.error('[ENTREGAS API] ❌ Error procesando entregas:', error);
      throw error;
    }
  }
}

export const entregasApiService = new EntregasApiService();
