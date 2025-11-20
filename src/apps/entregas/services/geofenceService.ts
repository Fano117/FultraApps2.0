import { GeofenceRegion, GeofenceEvent, LocationUpdate } from '../types';
import { locationService } from './locationService';

type GeofenceCallback = (region: GeofenceRegion, event: GeofenceEvent) => void;

interface MonitoredRegion extends GeofenceRegion {
  inside: boolean;
}

class GeofenceService {
  private monitoredRegions: Map<string, MonitoredRegion> = new Map();
  private callbacks: Map<string, GeofenceCallback> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private currentLocation: LocationUpdate | null = null;

  async startMonitoring(regions: GeofenceRegion[], callback: GeofenceCallback): Promise<void> {
    regions.forEach((region) => {
      this.monitoredRegions.set(region.identifier, {
        ...region,
        inside: false,
      });
      this.callbacks.set(region.identifier, callback);
    });

    if (!this.checkInterval) {
      this.checkInterval = setInterval(() => {
        this.checkGeofences();
      }, 5000);
    }

    console.log(`Started monitoring ${regions.length} geofence regions`);
  }

  stopMonitoring(identifiers?: string[]): void {
    if (identifiers) {
      identifiers.forEach((id) => {
        this.monitoredRegions.delete(id);
        this.callbacks.delete(id);
      });
    } else {
      this.monitoredRegions.clear();
      this.callbacks.clear();

      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }
    }

    console.log('Geofence monitoring stopped');
  }

  updateRegion(region: GeofenceRegion): void {
    const existing = this.monitoredRegions.get(region.identifier);
    if (existing) {
      this.monitoredRegions.set(region.identifier, {
        ...region,
        inside: existing.inside,
      });
    }
  }

  private async checkGeofences(): Promise<void> {
    try {
      const location = await locationService.getCurrentLocation();
      if (!location) return;

      this.currentLocation = location;

      for (const [identifier, region] of this.monitoredRegions.entries()) {
        const distance = await locationService.calculateDistance(
          location.latitude,
          location.longitude,
          region.latitude,
          region.longitude
        );

        const isInside = distance <= region.radius;
        const wasInside = region.inside;

        if (isInside !== wasInside) {
          region.inside = isInside;
          const event = isInside ? GeofenceEvent.ENTER : GeofenceEvent.EXIT;
          
          const callback = this.callbacks.get(identifier);
          if (callback) {
            callback(region, event);
          }

          console.log(
            `Geofence ${identifier} ${event} (distance: ${distance.toFixed(2)}m, radius: ${region.radius}m)`
          );
        }
      }
    } catch (error) {
      console.error('Error checking geofences:', error);
    }
  }

  async isInsideRegion(identifier: string): Promise<boolean> {
    const region = this.monitoredRegions.get(identifier);
    return region?.inside ?? false;
  }

  async getDistanceToRegion(identifier: string): Promise<number | null> {
    const region = this.monitoredRegions.get(identifier);
    if (!region || !this.currentLocation) return null;

    return locationService.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      region.latitude,
      region.longitude
    );
  }

  getMonitoredRegions(): GeofenceRegion[] {
    return Array.from(this.monitoredRegions.values());
  }
}

export const geofenceService = new GeofenceService();
