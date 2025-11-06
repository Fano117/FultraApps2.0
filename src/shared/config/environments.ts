export const BASE_LOGIN = 'https://identity.fultra.net';

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
  pruebas: {
    apiUrl: 'https://demoaplicaciones.fultra.mx/fultratrack/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
  ngrok: {
    apiUrl: 'https://b753922e568f.ngrok-free.app/api',
    apiKey: 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=',
    apiLogin: BASE_LOGIN,
  },
} as const;

export const CURRENT_ENV: keyof typeof environments = 'production';

export const APP_VERSION = 'v1.3';

export const config = environments[CURRENT_ENV];
