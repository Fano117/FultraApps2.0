import { apiService } from '@/shared/services';
import { 
  Entrega, 
  PaginatedResponse, 
  RutaOptimizada, 
  ConfirmacionEntrega, 
  ApiResponse 
} from '../types';
import { mockConfig, mockDeliveryApi } from '../mocks';

class DeliveryApiService {
  async getEntregas(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    date?: string;
  }): Promise<PaginatedResponse<Entrega>> {
    if (mockConfig.isMockEnabled()) {
      console.log('[DeliveryApi] Using MOCK data for getEntregas');
      return mockDeliveryApi.getEntregas(params);
    }

    try {
      const queryParams = new URLSearchParams({
        page: (params.page || 1).toString(),
        pageSize: (params.pageSize || 20).toString(),
        ...(params.status && { status: params.status }),
        ...(params.date && { date: params.date }),
      });

      return await apiService.get<PaginatedResponse<Entrega>>(
        `/mobile/entregas?${queryParams.toString()}`
      );
    } catch (error) {
      console.error('Error fetching entregas:', error);
      throw error;
    }
  }

  async getEntregaById(id: string): Promise<Entrega> {
    if (mockConfig.isMockEnabled()) {
      console.log('[DeliveryApi] Using MOCK data for getEntregaById');
      return mockDeliveryApi.getEntregaById(id);
    }

    try {
      return await apiService.get<Entrega>(`/mobile/entregas/${id}`);
    } catch (error) {
      console.error('Error fetching entrega:', error);
      throw error;
    }
  }

  async getRutaOptimizada(choferId: string, date?: string): Promise<RutaOptimizada> {
    if (mockConfig.isMockEnabled()) {
      console.log('[DeliveryApi] Using MOCK data for getRutaOptimizada');
      return mockDeliveryApi.getRutaOptimizada(choferId, date);
    }

    try {
      const params = date ? `?date=${date}` : '';
      return await apiService.get<RutaOptimizada>(
        `/mobile/entregas/ruta?choferId=${choferId}${params}`
      );
    } catch (error) {
      console.error('Error fetching ruta optimizada:', error);
      throw error;
    }
  }

  async confirmarEntrega(
    id: string,
    confirmacion: ConfirmacionEntrega,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ entregaId: string }>> {
    if (mockConfig.isMockEnabled()) {
      console.log('[DeliveryApi] Using MOCK data for confirmarEntrega');
      return mockDeliveryApi.confirmarEntrega(id, confirmacion, onProgress);
    }

    try {
      const formData = new FormData();
      
      formData.append('fechaEntrega', confirmacion.fecha.toISOString());
      formData.append('nombreReceptor', confirmacion.nombreReceptor);
      formData.append('latitud', confirmacion.latitud.toString());
      formData.append('longitud', confirmacion.longitud.toString());
      
      if (confirmacion.observaciones) {
        formData.append('observaciones', confirmacion.observaciones);
      }

      if (confirmacion.fotoUri) {
        const fotoFilename = `entrega_${id}_${Date.now()}.jpg`;
        formData.append('foto', {
          uri: confirmacion.fotoUri,
          type: 'image/jpeg',
          name: fotoFilename,
        } as any);
      }

      if (confirmacion.firmaUri) {
        const firmaFilename = `firma_${id}_${Date.now()}.jpg`;
        formData.append('firma', {
          uri: confirmacion.firmaUri,
          type: 'image/jpeg',
          name: firmaFilename,
        } as any);
      }

      const response = await apiService.uploadFile<ApiResponse<{ entregaId: string }>>(
        `/mobile/entregas/${id}/confirmar`,
        formData,
        onProgress
      );

      return response;
    } catch (error) {
      console.error('Error confirmando entrega:', error);
      throw error;
    }
  }
}

export const deliveryApiService = new DeliveryApiService();
