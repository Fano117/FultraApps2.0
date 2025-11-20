export interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export enum GeofenceEvent {
  ENTER = 'ENTER',
  EXIT = 'EXIT',
}

export interface GeofenceNotification {
  region: GeofenceRegion;
  event: GeofenceEvent;
  timestamp: Date;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

export interface BackgroundLocationTask {
  data: {
    locations: LocationUpdate[];
  };
  error?: Error;
}
