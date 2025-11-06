import { apiService } from '@/shared/services';
import { ClienteEntregaDTO, EmbarqueEntregaDTO } from '../models';

class EntregasApiService {
  async fetchEmbarquesEntrega(): Promise<ClienteEntregaDTO[]> {
    try {
      const response = await apiService.get<ClienteEntregaDTO[]>('/EmbarquesEntrega');
      return response;
    } catch (error) {
      console.error('Error fetching embarques entrega:', error);
      throw error;
    }
  }

  async enviarEmbarqueEntrega(embarque: EmbarqueEntregaDTO): Promise<void> {
    try {
      await apiService.post('/EmbarquesEntrega', embarque);
    } catch (error) {
      console.error('Error enviando embarque entrega:', error);
      throw error;
    }
  }

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
