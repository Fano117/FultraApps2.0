import { 
  Entrega, 
  PaginatedResponse, 
  RutaOptimizada, 
  ApiResponse,
  UbicacionChofer,
} from '../types';
import { mockEntregas, mockRouteCoordinates } from './mockData';

const MOCK_DELAY = 500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class MockDeliveryApiService {
  private entregas: Entrega[] = [...mockEntregas];

  async getEntregas(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    date?: string;
  }): Promise<PaginatedResponse<Entrega>> {
    await delay(MOCK_DELAY);
    
    const { page = 1, pageSize = 20, status } = params;
    
    let filtered = this.entregas;
    if (status) {
      filtered = this.entregas.filter(e => e.estatus === status);
    }
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);
    
    return {
      items,
      totalCount: filtered.length,
      pageNumber: page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  }

  async getEntregaById(id: string): Promise<Entrega> {
    await delay(MOCK_DELAY);
    
    const entrega = this.entregas.find(e => e.id === id);
    if (!entrega) {
      throw new Error(`Entrega ${id} no encontrada`);
    }
    
    return entrega;
  }

  async getRutaOptimizada(choferId: string, date?: string): Promise<RutaOptimizada> {
    await delay(MOCK_DELAY);
    
    const entregasPendientes = this.entregas.filter(
      e => e.estatus !== 'COMPLETADA' && e.estatus !== 'CANCELADA'
    );
    
    const distanciaTotal = entregasPendientes.reduce((sum, e) => sum + (e.distancia || 0), 0);
    const tiempoTotal = entregasPendientes.reduce((sum, e) => sum + (e.tiempoEstimado || 0), 0);
    
    return {
      puntos: mockRouteCoordinates,
      distanciaTotal,
      tiempoEstimado: tiempoTotal,
      entregas: entregasPendientes.sort((a, b) => a.secuencia - b.secuencia),
    };
  }

  async confirmarEntrega(
    id: string,
    confirmacion: any,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ entregaId: string }>> {
    await delay(200);
    onProgress?.(25);
    await delay(300);
    onProgress?.(50);
    await delay(300);
    onProgress?.(75);
    await delay(200);
    onProgress?.(100);
    
    const index = this.entregas.findIndex(e => e.id === id);
    if (index !== -1) {
      this.entregas[index] = {
        ...this.entregas[index],
        estatus: 'COMPLETADA' as any,
      };
    }
    
    return {
      success: true,
      message: 'Entrega confirmada exitosamente',
      data: { entregaId: id },
    };
  }

  resetMockData(): void {
    this.entregas = [...mockEntregas];
  }
}

export class MockLocationApiService {
  private ubicaciones: UbicacionChofer[] = [];

  async updateLocation(ubicacion: UbicacionChofer): Promise<ApiResponse<null>> {
    await delay(MOCK_DELAY);
    
    this.ubicaciones.push(ubicacion);
    console.log('[MOCK] Ubicación guardada:', {
      lat: ubicacion.latitud.toFixed(6),
      lng: ubicacion.longitud.toFixed(6),
      timestamp: ubicacion.timestamp.toISOString(),
    });
    
    return {
      success: true,
      data: null,
    };
  }

  async updateLocationBatch(ubicaciones: UbicacionChofer[]): Promise<ApiResponse<null>> {
    await delay(MOCK_DELAY);
    
    this.ubicaciones.push(...ubicaciones);
    console.log(`[MOCK] ${ubicaciones.length} ubicaciones guardadas en batch`);
    
    return {
      success: true,
      data: null,
    };
  }

  getStoredLocations(): UbicacionChofer[] {
    return [...this.ubicaciones];
  }

  clearLocations(): void {
    this.ubicaciones = [];
  }
}

export class MockNotificationApiService {
  private subscriptions: Map<string, any> = new Map();

  async subscribeToNotifications(subscription: {
    choferId: string;
    expoNotificationToken: string;
    deviceId: string;
  }): Promise<ApiResponse<null>> {
    await delay(MOCK_DELAY);
    
    this.subscriptions.set(subscription.deviceId, subscription);
    console.log('[MOCK] Dispositivo registrado para notificaciones:', subscription.deviceId);
    
    return {
      success: true,
      data: null,
    };
  }

  async unsubscribeFromNotifications(deviceId: string): Promise<ApiResponse<null>> {
    await delay(MOCK_DELAY);
    
    this.subscriptions.delete(deviceId);
    console.log('[MOCK] Dispositivo desregistrado:', deviceId);
    
    return {
      success: true,
      data: null,
    };
  }

  getActiveSubscriptions(): any[] {
    return Array.from(this.subscriptions.values());
  }
}

export const mockDeliveryApi = new MockDeliveryApiService();
export const mockLocationApi = new MockLocationApiService();
export const mockNotificationApi = new MockNotificationApiService();
