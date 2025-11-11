import { LocationUpdate } from '../types';
import { mockCurrentLocation, mockDirecciones } from './mockData';

export class MockLocationSimulator {
  private currentPosition: { latitud: number; longitud: number };
  private targetIndex: number = 0;
  private isSimulating: boolean = false;
  private simulationInterval: NodeJS.Timeout | null = null;
  private listeners: ((location: LocationUpdate) => void)[] = [];

  constructor() {
    this.currentPosition = { ...mockCurrentLocation };
  }

  getCurrentLocation(): LocationUpdate {
    return {
      latitude: this.currentPosition.latitud,
      longitude: this.currentPosition.longitud,
      accuracy: 10,
      altitude: 2240,
      speed: this.isSimulating ? 8.33 : 0,
      heading: 0,
      timestamp: Date.now(),
    };
  }

  startSimulation(updateIntervalMs: number = 2000): void {
    if (this.isSimulating) {
      console.warn('[MockLocationSimulator] Ya está en ejecución');
      return;
    }

    this.isSimulating = true;
    this.targetIndex = 0;
    console.log('[MockLocationSimulator] Iniciando simulación de movimiento');

    this.simulationInterval = setInterval(() => {
      this.updatePosition();
    }, updateIntervalMs);
  }

  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating = false;
    console.log('[MockLocationSimulator] Simulación detenida');
  }

  private updatePosition(): void {
    if (this.targetIndex >= mockDirecciones.length) {
      console.log('[MockLocationSimulator] Ruta completada');
      this.stopSimulation();
      return;
    }

    const target = mockDirecciones[this.targetIndex].coordenadas;
    const distance = this.calculateDistance(
      this.currentPosition.latitud,
      this.currentPosition.longitud,
      target.latitud,
      target.longitud
    );

    if (distance < 50) {
      console.log(`[MockLocationSimulator] Llegó a destino ${this.targetIndex + 1}`);
      this.targetIndex++;
      if (this.targetIndex < mockDirecciones.length) {
        this.moveTowards(mockDirecciones[this.targetIndex].coordenadas);
      }
    } else {
      this.moveTowards(target);
    }

    const location = this.getCurrentLocation();
    this.notifyListeners(location);
  }

  private moveTowards(target: { latitud: number; longitud: number }): void {
    const step = 0.0005;

    const latDiff = target.latitud - this.currentPosition.latitud;
    const lngDiff = target.longitud - this.currentPosition.longitud;

    const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

    if (distance > 0) {
      this.currentPosition.latitud += (latDiff / distance) * step;
      this.currentPosition.longitud += (lngDiff / distance) * step;
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  addListener(callback: (location: LocationUpdate) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (location: LocationUpdate) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners(location: LocationUpdate): void {
    this.listeners.forEach(listener => listener(location));
  }

  reset(): void {
    this.stopSimulation();
    this.currentPosition = { ...mockCurrentLocation };
    this.targetIndex = 0;
    console.log('[MockLocationSimulator] Reset a posición inicial');
  }

  setPosition(latitud: number, longitud: number): void {
    this.currentPosition = { latitud, longitud };
    const location = this.getCurrentLocation();
    this.notifyListeners(location);
    console.log(`[MockLocationSimulator] Posición manual: ${latitud.toFixed(6)}, ${longitud.toFixed(6)}`);
  }

  jumpToDestination(index: number): void {
    if (index >= 0 && index < mockDirecciones.length) {
      const destination = mockDirecciones[index].coordenadas;
      this.currentPosition = { ...destination };
      this.targetIndex = index;
      const location = this.getCurrentLocation();
      this.notifyListeners(location);
      console.log(`[MockLocationSimulator] Saltó a destino ${index + 1}`);
    }
  }
}

export const mockLocationSimulator = new MockLocationSimulator();
