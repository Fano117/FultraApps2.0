import { authorize, refresh, logout, AuthConfiguration } from 'react-native-app-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import { BASE_LOGIN, APP_AUTH_REDIRECT_SCHEME } from '../config';

const TOKEN_KEY = 'token';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const __DEV__ = process.env.NODE_ENV === 'development';

const config: AuthConfiguration = {
  issuer: BASE_LOGIN,
  clientId: 'fultraTrackReactNative',
  clientSecret: 'Fu1traTr9ck2025#$',
  redirectUrl: `${APP_AUTH_REDIRECT_SCHEME}:/oauth2redirect`,
  scopes: ['openid', 'profile', 'email', 'api_FultraTrack'],
  serviceConfiguration: {
    authorizationEndpoint: `${BASE_LOGIN}/connect/authorize`,
    tokenEndpoint: `${BASE_LOGIN}/connect/token`,
    endSessionEndpoint: `${BASE_LOGIN}/connect/signout`,
    revocationEndpoint: `${BASE_LOGIN}/connect/revocation`,
  },
  additionalParameters: {
    prompt: 'login',
  },
  ...Platform.select({
    ios: {
      preferEphemeralSession: true,
    },
    android: {
      customTabs: false,
      useNonce: false,
      usePKCE: true,
      warmAndPrefetchChrome: false,
      skipCodeExchange: false,
      dangerouslyAllowInsecureHttpRequests: __DEV__,
    },
  }),
};

export interface UserData {
  sub: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

class AuthService {
  async signIn(): Promise<boolean> {
    try {
      const authState = await authorize(config);
      await AsyncStorage.setItem(TOKEN_KEY, authState.idToken);
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, authState.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, authState.refreshToken ?? '');
      return true;
    } catch (error) {
      console.error('Error signing in:', error);
      return false;
    }
  }

  async refreshAuthToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken || refreshToken.trim() === '') {
        console.warn('No refresh token available');
        await this.clearTokens();
        return null;
      }

      const newAuthState = await refresh(config, { refreshToken });

      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAuthState.accessToken);
      await AsyncStorage.setItem(TOKEN_KEY, newAuthState.idToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newAuthState.refreshToken ?? '');

      return newAuthState.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.clearTokens();
      return null;
    }
  }

  async signOut(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (token) {
        try {
          await logout(config, {
            idToken: token,
            postLogoutRedirectUrl: `${APP_AUTH_REDIRECT_SCHEME}:/oauth2redirect`,
          });
        } catch (logoutError) {
          console.warn('Error logging out from server, continuing with local cleanup:', logoutError);
        }
      }

      await this.clearTokens();
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      await this.clearTokens();
      return false;
    }
  }

  async getUserData(): Promise<UserData | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      const decoded = jwtDecode<UserData>(token);
      return decoded;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return false;

      const decoded = jwtDecode<{ exp: number }>(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        const newToken = await this.refreshAuthToken();
        return newToken !== null;
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  private async clearTokens(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }
}

export const authService = new AuthService();
