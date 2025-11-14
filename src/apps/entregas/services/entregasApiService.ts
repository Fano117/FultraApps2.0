import { apiService } from '@/shared/services';
import { ClienteEntregaDTO, EmbarqueEntregaDTO, EntregaDTO } from '../models';

class EntregasApiService {
  /**
   * Obtener entregas desde el nuevo endpoint móvil
   * Endpoint actualizado: GET /api/Mobile/entregas
   */
  async fetchEntregasMoviles(): Promise<ClienteEntregaDTO[]> {
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
      
      if (entregasArray.length === 0) {
        console.warn('[ENTREGAS API] ⚠️ PROBLEMA: No se encontraron entregas después de transformación');
        console.warn('[ENTREGAS API] 📋 Verificar:');
        console.warn('  - Backend devuelve items en response.items');
        console.warn('  - Items contienen estructura cliente/direccion/productos');
        console.warn('  - EstatusEmbarqueId = 4 (En ruta)');
        console.warn('  - Usuario: alfredo.gallegos');
      } else {
        entregasArray.forEach((cliente, index) => {
          console.log(`[ENTREGAS API] 📦 Cliente ${index + 1}:`, {
            cliente: cliente.cliente,
            cuentaCliente: cliente.cuentaCliente,
            carga: cliente.carga,
            totalEntregas: cliente.entregas.length,
            direccion: cliente.direccionEntrega.substring(0, 50) + '...',
            latitud: cliente.latitud,
            longitud: cliente.longitud,
          });
        });
      }
      
      return entregasArray;
    } catch (error) {
      console.error('[ENTREGAS API] ❌ Error fetching entregas móviles:', error);
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
    try {
      console.log(`[ENTREGAS API] 🔍 Obteniendo entrega con ID: ${id}`);
      const response = await apiService.get<EntregaDTO>(`/mobile/entrega/${id}`);
      console.log('[ENTREGAS API] ✅ Entrega obtenida:', response);
      return response;
    } catch (error) {
      console.error(`[ENTREGAS API] ❌ Error obteniendo entrega ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar estado de una entrega
   * Endpoint: PUT /api/mobile/entregas/{id}/estado
   */
  async actualizarEstadoEntrega(id: string | number, nuevoEstado: string): Promise<void> {
    try {
      console.log(`[ENTREGAS API] 🔄 Actualizando estado de entrega ${id} a: ${nuevoEstado}`);
      await apiService.put(`/mobile/entregas/${id}/estado`, { 
        estado: nuevoEstado 
      });
      console.log('[ENTREGAS API] ✅ Estado actualizado correctamente');
    } catch (error) {
      console.error(`[ENTREGAS API] ❌ Error actualizando estado entrega ${id}:`, error);
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
    try {
      console.log(`[ENTREGAS API] ✅ Confirmando entrega ${confirmacion.entregaId}`);
      await apiService.post('/Mobile/confirmar-entrega', confirmacion);
      console.log('[ENTREGAS API] ✅ Entrega confirmada correctamente');
    } catch (error) {
      console.error(`[ENTREGAS API] ❌ Error confirmando entrega:`, error);
      throw error;
    }
  }

  /**
   * Obtener ruta del chofer
   * Endpoint: GET /api/Mobile/ruta
   */
  async getRutaChofer(): Promise<any> {
    try {
      console.log('[ENTREGAS API] 🗺️ Obteniendo ruta del chofer...');
      const response = await apiService.get('/Mobile/ruta');
      console.log('[ENTREGAS API] ✅ Ruta obtenida:', response);
      return response;
    } catch (error) {
      console.error('[ENTREGAS API] ❌ Error obteniendo ruta:', error);
      throw error;
    }
  }

  /**
   * Enviar embarque entrega (método legacy)
   * @deprecated Usar confirmarEntrega() en su lugar
   */
  async enviarEmbarqueEntrega(embarque: EmbarqueEntregaDTO): Promise<void> {
    try {
      console.warn('[ENTREGAS API] ⚠️ enviarEmbarqueEntrega está deprecated');
      await apiService.post('/EmbarquesEntrega', embarque);
    } catch (error) {
      console.error('Error enviando embarque entrega:', error);
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
    try {
      const formData = new FormData();

      const uri = archivo.uri.startsWith('file://') ? archivo.uri : `file://${archivo.uri}`;

      formData.append('Imagen', {
        uri,
        type: archivo.type || 'image/jpeg',
        name: archivo.name,
      } as any);

      formData.append('Nombre', nombre);

      await apiService.uploadFile('/EmbarquesEntrega/subir-imagen-evidencia', formData, onProgress);
      return true;
    } catch (error) {
      console.error('Error subiendo imagen evidencia:', error);
      return false;
    }
  }
}

export const entregasApiService = new EntregasApiService();
