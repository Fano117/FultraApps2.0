import { apiService } from '@/shared/services';
import { ClienteEntregaDTO } from '../models';

class TestEntregasApiService {
  /**
   * Obtiene todas las entregas incluyendo las de prueba
   * Este es un endpoint temporal hasta que se arregle el backend principal
   */
  async fetchEmbarquesEntregaConPruebas(): Promise<ClienteEntregaDTO[]> {
    try {
      console.log('[TEST API] 🧪 Llamando a /mobile/test/embarques...');
      
      // Intentar primero con el endpoint de testing
      try {
        const response = await apiService.get<ClienteEntregaDTO[]>('/mobile/test/embarques');
        console.log('[TEST API] ✅ Datos de prueba obtenidos:', {
          totalClientes: response.length,
          data: response
        });
        return response;
      } catch (testError) {
        console.warn('[TEST API] ⚠️ Endpoint de pruebas no disponible, usando endpoint principal...');
        
        // Fallback al endpoint principal
        const response = await apiService.get<ClienteEntregaDTO[]>('/EmbarquesEntrega');
        return response;
      }
    } catch (error) {
      console.error('[TEST API] ❌ Error fetching embarques con pruebas:', error);
      throw error;
    }
  }

  /**
   * Crea datos de prueba mock localmente si el backend no los devuelve
   */
  async getMockEntregasData(): Promise<ClienteEntregaDTO[]> {
    return [
      {
        cliente: "Abarrotes La Guadalupana 1",
        cuentaCliente: "NVEZ830712IW5",
        carga: "CARGA-TEST-001",
        direccionEntrega: "Av. México 9886, Jardines del Bosque, Guadalajara, Jalisco",
        latitud: "20.636213538768768",
        longitud: "-103.21505007719426",
        entregas: [
          {
            id: 5,
            ordenVenta: "OV-202511-00001",
            folio: "F-03693389",
            tipoEntrega: "ENTREGA",
            estado: "PENDIENTE",
            articulos: [
              {
                id: 1,
                nombreCarga: "CARGA-TEST-001",
                nombreOrdenVenta: "OV-202511-00001",
                producto: "Cemento Portland",
                cantidadProgramada: 31,
                cantidadEntregada: 0,
                restante: 31,
                peso: 1550,
                unidadMedida: "bulto",
                descripcion: "Cemento Portland de 50kg"
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Método híbrido que intenta obtener datos reales y si no, devuelve datos mock
   */
  async fetchEntregasConFallback(): Promise<ClienteEntregaDTO[]> {
    try {
      // Intentar obtener datos reales
      const realData = await this.fetchEmbarquesEntregaConPruebas();
      
      if (realData.length > 0) {
        console.log('[TEST API] 🎉 Usando datos reales del backend');
        return realData;
      }
      
      // Si no hay datos reales, usar mock
      console.log('[TEST API] 🔧 Backend devuelve array vacío, usando datos mock...');
      const mockData = await this.getMockEntregasData();
      console.log('[TEST API] 🧪 Datos mock cargados:', mockData);
      
      return mockData;
    } catch (error) {
      console.error('[TEST API] ❌ Error completo, usando solo datos mock:', error);
      return await this.getMockEntregasData();
    }
  }
}

export const testEntregasApiService = new TestEntregasApiService();