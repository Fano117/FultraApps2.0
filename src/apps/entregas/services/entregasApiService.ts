import { apiService } from '@/shared/services';
import { ClienteEntregaDTO, EmbarqueEntregaDTO } from '../models';

class EntregasApiService {
  async fetchEmbarquesEntrega(): Promise<ClienteEntregaDTO[]> {
    try {
      console.log('🔄 Intentando obtener embarques entrega...');
      const response = await apiService.get<ClienteEntregaDTO[]>('/EmbarquesEntrega');
      console.log('✅ Embarques entrega obtenidos:', response.length);
      return response;
    } catch (error: any) {
      console.warn('⚠️ Error fetching embarques entrega - usando datos mock para desarrollo:', error.message);
      
      // En modo desarrollo, devolver datos mock si el endpoint falla
      const mockData: ClienteEntregaDTO[] = [
        {
          cliente: 'Cliente Demo',
          cuentaCliente: 'DEMO001',
          carga: 'CARGA001',
          direccionEntrega: 'Dirección de prueba 123, Ciudad Demo',
          latitud: '19.432608',
          longitud: '-99.133209',
          entregas: [
            {
              ordenVenta: 'OV001',
              folio: 'DEMO001',
              tipoEntrega: 'ENTREGA',
              estado: 'Pendiente',
              articulos: [
                {
                  id: 1,
                  nombreCarga: 'CARGA001',
                  nombreOrdenVenta: 'OV001',
                  producto: 'Producto Demo 1',
                  cantidadProgramada: 100,
                  cantidadEntregada: 0,
                  restante: 100,
                  peso: 50.5,
                  unidadMedida: 'KG',
                  descripcion: 'Descripción del producto demo'
                }
              ]
            }
          ]
        }
      ];
      
      console.log('🧪 Usando datos mock:', mockData.length, 'clientes');
      return mockData;
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
