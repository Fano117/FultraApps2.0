import { apiService } from '@/shared/services';
import { UbicacionChofer, ApiResponse } from '../types';

class LocationApiService {
  async updateLocation(ubicacion: UbicacionChofer): Promise<ApiResponse<null>> {
    try {
      const payload = {
        choferId: ubicacion.choferId,
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        timestamp: ubicacion.timestamp.toISOString(),
        velocidad: ubicacion.velocidad,
        precision: ubicacion.precision,
      };

      return await apiService.post<ApiResponse<null>>('/mobile/chofer/ubicacion', payload);
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async updateLocationBatch(ubicaciones: UbicacionChofer[]): Promise<ApiResponse<null>> {
    try {
      const payload = ubicaciones.map((ubicacion) => ({
        choferId: ubicacion.choferId,
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        timestamp: ubicacion.timestamp.toISOString(),
        velocidad: ubicacion.velocidad,
        precision: ubicacion.precision,
      }));

      return await apiService.post<ApiResponse<null>>('/mobile/chofer/ubicacion/batch', payload);
    } catch (error) {
      console.error('Error updating location batch:', error);
      throw error;
    }
  }
}

export const locationApiService = new LocationApiService();
