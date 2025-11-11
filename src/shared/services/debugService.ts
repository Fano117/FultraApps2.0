import { apiService } from './apiService';
import { config } from '../config';

interface BackendHealthResponse {
  status: string;
  timestamp: string;
  version?: string;
  environment?: string;
}

class DebugService {
  /**
   * Verifica la conectividad con el backend
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('🔗 Probando conexión con backend:', config.apiUrl);
      console.log('🔧 Configuración actual:', this.getCurrentConfig());
      
      // Intentar llamar a un endpoint básico
      const response = await apiService.get<BackendHealthResponse>('/health');
      
      return {
        success: true,
        message: 'Conexión exitosa con el backend',
        details: {
          baseUrl: config.apiUrl,
          response: response,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('❌ Error conectando con backend:', error);
      
      let message = 'Error de conexión con el backend';
      
      if (error.message?.includes('Network Error') || error.message?.includes('conectar')) {
        message = `No se puede conectar al servidor en ${config.apiUrl}. Verifica que esté corriendo en puerto 5103`;
      } else if (error.message?.includes('timeout')) {
        message = 'Timeout de conexión. El servidor tardó demasiado en responder';
      } else if (error.response?.status === 404) {
        message = 'Endpoint /health no encontrado. Verifica la configuración del backend';
      } else if (error.response?.status === 401) {
        message = 'Error de autorización. Verifica la API Key';
      }
      
      return {
        success: false,
        message,
        details: {
          baseUrl: config.apiUrl,
          error: error.message,
          status: error.response?.status,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Prueba específica del endpoint de entregas
   */
  async testEntregasEndpoint(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      console.log('📦 Probando endpoint de entregas...');
      
      const response = await apiService.get('/EmbarquesEntrega');
      
      return {
        success: true,
        message: 'Endpoint de entregas funcionando correctamente',
        details: {
          endpoint: '/EmbarquesEntrega',
          dataCount: Array.isArray(response) ? response.length : 'No array',
          response: response,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      console.error('❌ Error en endpoint de entregas:', error);
      
      let message = 'Error en endpoint de entregas';
      
      if (error.response?.status === 404) {
        message = 'Endpoint /EmbarquesEntrega no encontrado';
      } else if (error.response?.status === 401) {
        message = 'No autorizado para acceder a entregas';
      } else if (error.response?.status === 500) {
        message = 'Error interno del servidor en entregas';
      }
      
      return {
        success: false,
        message,
        details: {
          endpoint: '/EmbarquesEntrega',
          error: error.message,
          status: error.response?.status,
          responseData: error.response?.data,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Muestra información de configuración actual
   */
  getCurrentConfig() {
    return {
      environment: 'development',
      apiUrl: config.apiUrl,
      hasApiKey: !!config.apiKey,
      apiKeyPreview: config.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'No configurada',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Función para ejecutar todas las pruebas
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Iniciando pruebas de conectividad...');
    console.log('⚙️ Configuración actual:', this.getCurrentConfig());
    
    const connectionTest = await this.testConnection();
    console.log('🔗 Prueba de conexión:', connectionTest);
    
    if (connectionTest.success) {
      const entregasTest = await this.testEntregasEndpoint();
      console.log('📦 Prueba de entregas:', entregasTest);
    }
    
    console.log('✅ Pruebas completadas');
  }
}

export const debugService = new DebugService();