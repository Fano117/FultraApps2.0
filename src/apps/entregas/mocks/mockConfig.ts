import AsyncStorage from '@react-native-async-storage/async-storage';

const MOCK_MODE_KEY = '@mock_mode_enabled';
const USE_MOCK_LOCATION_KEY = '@use_mock_location';
const USE_MOCK_GEOFENCE_KEY = '@use_mock_geofence';

export class MockConfig {
  private static instance: MockConfig;
  private mockEnabled: boolean = false;
  private mockLocationEnabled: boolean = false;
  private mockGeofenceEnabled: boolean = false;

  private constructor() {}

  static getInstance(): MockConfig {
    if (!MockConfig.instance) {
      MockConfig.instance = new MockConfig();
    }
    return MockConfig.instance;
  }

  async initialize(): Promise<void> {
    try {
      const mockMode = await AsyncStorage.getItem(MOCK_MODE_KEY);
      const mockLocation = await AsyncStorage.getItem(USE_MOCK_LOCATION_KEY);
      const mockGeofence = await AsyncStorage.getItem(USE_MOCK_GEOFENCE_KEY);

      this.mockEnabled = mockMode === 'true';
      this.mockLocationEnabled = mockLocation === 'true';
      this.mockGeofenceEnabled = mockGeofence === 'true';

      console.log('[MockConfig] Initialized:', {
        mockEnabled: this.mockEnabled,
        mockLocationEnabled: this.mockLocationEnabled,
        mockGeofenceEnabled: this.mockGeofenceEnabled,
      });
    } catch (error) {
      console.error('[MockConfig] Error initializing:', error);
    }
  }

  async setMockMode(enabled: boolean): Promise<void> {
    this.mockEnabled = enabled;
    await AsyncStorage.setItem(MOCK_MODE_KEY, enabled ? 'true' : 'false');
    console.log('[MockConfig] Mock mode:', enabled ? 'ENABLED' : 'DISABLED');
  }

  async setMockLocation(enabled: boolean): Promise<void> {
    this.mockLocationEnabled = enabled;
    await AsyncStorage.setItem(USE_MOCK_LOCATION_KEY, enabled ? 'true' : 'false');
    console.log('[MockConfig] Mock location:', enabled ? 'ENABLED' : 'DISABLED');
  }

  async setMockGeofence(enabled: boolean): Promise<void> {
    this.mockGeofenceEnabled = enabled;
    await AsyncStorage.setItem(USE_MOCK_GEOFENCE_KEY, enabled ? 'true' : 'false');
    console.log('[MockConfig] Mock geofence:', enabled ? 'ENABLED' : 'DISABLED');
  }

  isMockEnabled(): boolean {
    return this.mockEnabled;
  }

  isMockLocationEnabled(): boolean {
    return this.mockLocationEnabled;
  }

  isMockGeofenceEnabled(): boolean {
    return this.mockGeofenceEnabled;
  }

  async reset(): Promise<void> {
    await AsyncStorage.multiRemove([
      MOCK_MODE_KEY,
      USE_MOCK_LOCATION_KEY,
      USE_MOCK_GEOFENCE_KEY,
    ]);
    this.mockEnabled = false;
    this.mockLocationEnabled = false;
    this.mockGeofenceEnabled = false;
    console.log('[MockConfig] Reset to defaults');
  }
}

export const mockConfig = MockConfig.getInstance();
