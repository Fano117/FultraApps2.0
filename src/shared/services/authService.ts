import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { BASE_LOGIN, APP_AUTH_REDIRECT_SCHEME } from '../config';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'token';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const discovery = {
  authorizationEndpoint: `${BASE_LOGIN}/connect/authorize`,
  tokenEndpoint: `${BASE_LOGIN}/connect/token`,
  endSessionEndpoint: `${BASE_LOGIN}/connect/signout`,
  revocationEndpoint: `${BASE_LOGIN}/connect/revocation`,
};

const clientId = 'fultraTrackReactNative';
const clientSecret = 'Fu1traTr9ck2025#$';

const redirectUri = AuthSession.makeRedirectUri({
  scheme: APP_AUTH_REDIRECT_SCHEME,
  path: 'oauth2redirect',
});

const scopes = ['openid', 'profile', 'email', 'api_FultraTrack'];

export interface UserData {
  sub: string;
  name: string;
  email: string;
  [key: string]: unknown;
}

class AuthService {
  async signIn(): Promise<boolean> {
    try {
      console.log('Iniciando proceso de autenticación...');
      console.log('Redirect URI:', redirectUri);

      // Build authorization request - Expo maneja automáticamente PKCE
      const authRequest = new AuthSession.AuthRequest({
        responseType: AuthSession.ResponseType.Code,
        clientId,
        redirectUri,
        scopes,
        prompt: AuthSession.Prompt.Login,
        usePKCE: true,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
      });

      // Prompt user for authentication
      const result = await authRequest.promptAsync(discovery);

      if (result.type !== 'success') {
        if (result.type === 'cancel') {
          throw new Error('Inicio de sesión cancelado');
        }
        throw new Error(`Error de autenticación: ${result.type}`);
      }

      // Exchange authorization code for tokens
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          clientSecret,
          code: result.params.code,
          redirectUri,
          extraParams: {
            code_verifier: authRequest.codeVerifier || '',
          },
        },
        discovery
      );

      if (!tokenResult.accessToken) {
        throw new Error('No se recibió un token de acceso válido');
      }

      // Store tokens
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokenResult.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokenResult.refreshToken ?? '');

      if (tokenResult.idToken) {
        await AsyncStorage.setItem(TOKEN_KEY, tokenResult.idToken);
      }

      console.log('Autenticación exitosa');
      return true;
    } catch (error: any) {
      console.error('Error signing in:', error);

      // Re-lanzar el error para que pueda ser manejado en el componente
      if (error?.message?.includes('authorize') || error?.message?.includes('cancelled') || error?.message?.includes('configuración')) {
        throw error;
      }

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

      const tokenResult = await AuthSession.refreshAsync(
        {
          clientId,
          clientSecret,
          refreshToken,
        },
        discovery
      );

      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokenResult.accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokenResult.refreshToken ?? '');

      if (tokenResult.idToken) {
        await AsyncStorage.setItem(TOKEN_KEY, tokenResult.idToken);
      }

      return tokenResult.accessToken;
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
          // Revoke the token with the identity server
          const revokeUrl = discovery.revocationEndpoint;
          if (revokeUrl) {
            await AuthSession.revokeAsync(
              {
                clientId,
                clientSecret,
                token,
              },
              discovery
            );
          }
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
