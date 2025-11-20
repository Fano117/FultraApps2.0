import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationUpdate, UbicacionChofer } from '../types';
import { locationApiService } from '../api';
import { mockConfig, mockLocationSimulator } from '../mocks';

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_QUEUE_KEY = '@location_queue';
const UPDATE_INTERVAL = 30000;

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private choferId: string | null = null;

  async requestPermissions(): Promise<boolean> {
    if (mockConfig.isMockLocationEnabled()) {
      console.log('[LocationService] Mock location enabled, skipping real permissions');
      return true;
    }

    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('Foreground location permission not granted');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted');
      }

      return foregroundStatus === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async hasPermissions(): Promise<boolean> {
    if (mockConfig.isMockLocationEnabled()) {
      return true;
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationUpdate | null> {
    if (mockConfig.isMockLocationEnabled()) {
      console.log('[LocationService] Using mock location');
      return mockLocationSimulator.getCurrentLocation();
    }

    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        altitude: location.coords.altitude || undefined,
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startForegroundTracking(choferId: string): Promise<boolean> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      this.choferId = choferId;

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: UPDATE_INTERVAL,
        },
        async (location) => {
          await this.handleLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude || undefined,
            speed: location.coords.speed || undefined,
            heading: location.coords.heading || undefined,
            timestamp: location.timestamp,
          });
        }
      );

      console.log('Foreground location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting foreground tracking:', error);
      return false;
    }
  }

  stopForegroundTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    console.log('Foreground location tracking stopped');
  }

  async startBackgroundTracking(choferId: string): Promise<boolean> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      this.choferId = choferId;

      const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
      if (!isTaskDefined) {
        this.defineBackgroundTask();
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50,
        timeInterval: UPDATE_INTERVAL,
        foregroundService: {
          notificationTitle: 'FultraApps',
          notificationBody: 'Rastreando ubicación para entregas',
        },
        pausesUpdatesAutomatically: false,
      });

      console.log('Background location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting background tracking:', error);
      return false;
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('Background location tracking stopped');
      }
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  }

  private defineBackgroundTask(): void {
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error('Background location task error:', error);
        return;
      }

      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        
        for (const location of locations) {
          await this.handleLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            altitude: location.coords.altitude || undefined,
            speed: location.coords.speed || undefined,
            heading: location.coords.heading || undefined,
            timestamp: location.timestamp,
          });
        }
      }
    });
  }

  private async handleLocationUpdate(location: LocationUpdate): Promise<void> {
    if (!this.choferId) {
      console.warn('No choferId set, skipping location update');
      return;
    }

    const ubicacion: UbicacionChofer = {
      choferId: this.choferId,
      latitud: location.latitude,
      longitud: location.longitude,
      timestamp: new Date(location.timestamp),
      velocidad: location.speed,
      precision: location.accuracy,
    };

    try {
      await locationApiService.updateLocation(ubicacion);
      console.log('Location updated successfully');
    } catch (error) {
      console.error('Error updating location, adding to queue:', error);
      await this.addToQueue(ubicacion);
    }
  }

  private async addToQueue(ubicacion: UbicacionChofer): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
      const queue: UbicacionChofer[] = queueStr ? JSON.parse(queueStr) : [];
      
      queue.push(ubicacion);
      
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }
      
      await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding location to queue:', error);
    }
  }

  async syncQueuedLocations(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
      if (!queueStr) return;

      const queue: UbicacionChofer[] = JSON.parse(queueStr);
      if (queue.length === 0) return;

      console.log(`Syncing ${queue.length} queued locations`);

      const ubicaciones = queue.map(u => ({
        ...u,
        timestamp: new Date(u.timestamp),
      }));

      await locationApiService.updateLocationBatch(ubicaciones);
      await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
      
      console.log('Queued locations synced successfully');
    } catch (error) {
      console.error('Error syncing queued locations:', error);
    }
  }

  async calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): Promise<number> {
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
}

export const locationService = new LocationService();
