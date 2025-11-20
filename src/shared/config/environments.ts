// export const BASE_LOGIN = 'https://identity.fultra.net';
export const BASE_LOGIN = 'https://auth.fultra.net';

export const APP_AUTH_REDIRECT_SCHEME = 'com.fultraapps';

export interface EnvironmentConfig {
  apiUrl: string;
  apiKey: string;
  apiLogin: string;
}

export const environments: Record<string, EnvironmentConfig> = {
  production: {
    apiUrl: 'https://aplicaciones.fultra.net/FultraTrackService/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
  productionNewIntranet: {
    apiUrl: 'https://aplicaciones.fultra.net/FultraTrackServiceNewIntranet/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
  pruebas: {
    apiUrl: 'https://demoaplicaciones.fultra.mx/fultratrack/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
  ngrok: {
    apiUrl: 'https://d0fd8aa3c305.ngrok-free.app/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
} as const;

export const CURRENT_ENV: keyof typeof environments = 'productionNewIntranet';

export const APP_VERSION = 'v1.3';

export const config = environments[CURRENT_ENV];

// Feature Flags
/**
 * Habilitar verificación de actualizaciones con Play Store/App Store
 * - true: Verifica actualizaciones automáticamente (solo funciona con app publicada en producción)
 * - false: Deshabilita completamente la verificación
 *
 * IMPORTANTE: Solo funciona cuando la app está publicada en Play Store (producción)
 * NO funciona con Internal Testing, Closed Testing o Open Testing
 */
export const ENABLE_APP_UPDATE_CHECK = false; // Cambiar a true cuando la app esté en producción
