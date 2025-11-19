export const BASE_LOGIN = 'https://identity.fultra.net';

export const APP_AUTH_REDIRECT_SCHEME = 'com.fultraapps';

export interface EnvironmentConfig {
  apiUrl: string;
  apiKey: string;
  apiLogin: string;
  identityUrl: string;
  hereMapsApiKey: string; // HERE Maps API Key (required)
  oauth: {
    clientId: string;
    clientSecret: string;
    scope: string;
    audience: string;
  };
  devCredentials?: {
    username: string;
    password: string;
    authDisabled: boolean;
  };
}

export const environments: Record<string, EnvironmentConfig> = {
  production: {
    apiUrl: 'https://aplicaciones.fultra.net/FultraTrackService/api', // ✅ URL real del backend
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
    identityUrl: 'https://identity.fultra.net',
    hereMapsApiKey: 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw', // HERE Maps API Key
    oauth: {
      clientId: 'fultraTrackReactNative', // ✅ Client ID correcto
      clientSecret: 'Fu1traTr9ck2025#$',
      scope: 'openid profile email api_FultraTrack', // ✅ Scope correcto
      audience: 'api_FultraTrack', // ✅ Audience correcto
    },
  },
  development: {
    apiUrl: 'http://192.168.100.99:5104/api', // ✅ Nuevo puerto 5104 - IP local para simuladores/emuladores
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
    identityUrl: 'https://identity.fultra.net',
    hereMapsApiKey: 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw', // HERE Maps API Key
    oauth: {
      clientId: 'fultraTrackReactNative', // ✅ Client ID correcto - igual que production
      clientSecret: 'Fu1traTr9ck2025#$',
      scope: 'openid profile email api_FultraTrack', // ✅ Scope correcto
      audience: 'api_FultraTrack', // ✅ Audience correcto
    },
    devCredentials: {
      username: 'alfredo.gallegos',
      password: 'Fultra.2026#$',
      authDisabled: true, // ✅ Autenticación desactivada para desarrollo
    },
  },
  local: {
    apiUrl: 'http://localhost:5104/api', // ✅ Para web browser o pruebas directas - Nuevo puerto 5104
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
    identityUrl: 'https://identity.fultra.net',
    hereMapsApiKey: 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw', // HERE Maps API Key
    oauth: {
      clientId: 'fultraTrackReactNative',
      clientSecret: 'Fu1traTr9ck2025#$',
      scope: 'openid profile email api_FultraTrack',
      audience: 'api_FultraTrack',
    },
    devCredentials: {
      username: 'alfredo.gallegos',
      password: 'Fultra.2026#$',
      authDisabled: true,
    },
  },
  pruebas: {
    apiUrl: 'https://demoaplicaciones.fultra.mx/fultratrack/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
    identityUrl: 'https://identity.fultra.net',
    hereMapsApiKey: 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw', // HERE Maps API Key
    oauth: {
      clientId: 'fultraTrackReactNative', // ✅ Usar el mismo client ID que production
      clientSecret: 'Fu1traTr9ck2025#$',
      scope: 'openid profile email api_FultraTrack', // ✅ Usar el mismo scope
      audience: 'api_FultraTrack', // ✅ Usar el mismo audience
    },
  },
  ngrok: {
    apiUrl: 'https://b753922e568f.ngrok-free.app/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
    identityUrl: 'https://identity.fultra.net',
    hereMapsApiKey: 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw', // HERE Maps API Key
    oauth: {
      clientId: 'fultraapps_mobile',
      clientSecret: 'Fu1traTr9ck2025#$',
      scope: 'openid profile email offline_access fultratrack_api',
      audience: 'resource_fultratrack_4',
    },
  },
} as const;

export const CURRENT_ENV: keyof typeof environments = 'development';

export const APP_VERSION = 'v1.3';

export const config = environments[CURRENT_ENV];

// Configuración de la aplicación
export const APP_CONFIG = {
  // Tracking GPS
  LOCATION_UPDATE_INTERVAL: 30000, // 30 segundos
  LOCATION_BATCH_SIZE: 10, // Acumular 10 ubicaciones antes de enviar
  LOCATION_LOW_BATTERY_THRESHOLD: 20, // Reducir frecuencia si batería < 20%
  LOCATION_LOW_BATTERY_INTERVAL: 60000, // 1 minuto en modo bajo consumo

  // Caché y almacenamiento
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  MAX_OFFLINE_OPERATIONS: 100,

  // Imágenes
  MAX_IMAGE_SIZE_PHOTO: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE_SIGNATURE: 2 * 1024 * 1024, // 2MB
  IMAGE_MAX_WIDTH: 1920,
  IMAGE_MAX_HEIGHT: 1080,
  IMAGE_QUALITY: 0.8,

  // Paginación
  DEFAULT_PAGE_SIZE: 20,

  // Reintentos
  MAX_RETRY_ATTEMPTS: 5,
  RETRY_BACKOFF_BASE: 1000, // 1 segundo

  // Timeouts
  DEFAULT_TIMEOUT: 15000, // 15 segundos
  UPLOAD_TIMEOUT: 30000, // 30 segundos

  // Token refresh
  TOKEN_REFRESH_BEFORE_EXPIRY: 5 * 60 * 1000, // 5 minutos antes de expirar
} as const;
