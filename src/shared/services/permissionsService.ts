/**
 * Servicio de Permisos - FultraApps
 * Maneja todos los permisos necesarios para la app: ubicación, cámara, almacenamiento
 * Secure by Default - valida permisos antes de cada operación
 */

import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { Camera } from 'expo-camera';
import { Alert, Platform } from 'react-native';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export interface AllPermissionsStatus {
  location: PermissionStatus;
  backgroundLocation: PermissionStatus;
  camera: PermissionStatus;
  mediaLibrary: PermissionStatus;
  allGranted: boolean;
}

class PermissionsService {
  private permissionRequested: Set<string> = new Set();

  /**
   * Solicitar permisos de ubicación (primer plano)
   */
  async requestLocationPermissions(): Promise<PermissionStatus> {
    try {
      console.log('[PERMISSIONS] 📍 Solicitando permisos de ubicación...');
      
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status
      };

      console.log('[PERMISSIONS] 📍 Ubicación:', result);
      return result;
    } catch (error) {
      console.error('[PERMISSIONS] ❌ Error solicitando ubicación:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error'
      };
    }
  }

  /**
   * Solicitar permisos de ubicación en segundo plano (para tracking)
   */
  async requestBackgroundLocationPermissions(): Promise<PermissionStatus> {
    try {
      console.log('[PERMISSIONS] 🔄 Solicitando permisos de ubicación en segundo plano...');
      
      // Primero verificar permisos de primer plano
      const foregroundStatus = await Location.getForegroundPermissionsAsync();
      if (foregroundStatus.status !== 'granted') {
        console.log('[PERMISSIONS] ⚠️ Se requieren permisos de primer plano primero');
        return {
          granted: false,
          canAskAgain: true,
          status: 'foreground_required'
        };
      }

      const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status
      };

      console.log('[PERMISSIONS] 🔄 Ubicación segundo plano:', result);
      return result;
    } catch (error) {
      console.error('[PERMISSIONS] ❌ Error solicitando ubicación segundo plano:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error'
      };
    }
  }

  /**
   * Solicitar permisos de cámara
   */
  async requestCameraPermissions(): Promise<PermissionStatus> {
    try {
      console.log('[PERMISSIONS] 📷 Solicitando permisos de cámara...');
      
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status
      };

      console.log('[PERMISSIONS] 📷 Cámara:', result);
      return result;
    } catch (error) {
      console.error('[PERMISSIONS] ❌ Error solicitando cámara:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error'
      };
    }
  }

  /**
   * Solicitar permisos de almacenamiento/galería
   */
  async requestMediaLibraryPermissions(): Promise<PermissionStatus> {
    try {
      console.log('[PERMISSIONS] 🗂️ Solicitando permisos de almacenamiento...');
      
      const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
      
      const result: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status
      };

      console.log('[PERMISSIONS] 🗂️ Almacenamiento:', result);
      return result;
    } catch (error) {
      console.error('[PERMISSIONS] ❌ Error solicitando almacenamiento:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'error'
      };
    }
  }

  /**
   * Verificar todos los permisos actuales
   */
  async checkAllPermissions(): Promise<AllPermissionsStatus> {
    try {
      console.log('[PERMISSIONS] 🔍 Verificando todos los permisos...');

      const [locationStatus, backgroundLocationStatus, cameraStatus, mediaStatus] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
        Camera.getCameraPermissionsAsync(),
        MediaLibrary.getPermissionsAsync()
      ]);

      const location: PermissionStatus = {
        granted: locationStatus.status === 'granted',
        canAskAgain: locationStatus.canAskAgain,
        status: locationStatus.status
      };

      const backgroundLocation: PermissionStatus = {
        granted: backgroundLocationStatus.status === 'granted',
        canAskAgain: backgroundLocationStatus.canAskAgain,
        status: backgroundLocationStatus.status
      };

      const camera: PermissionStatus = {
        granted: cameraStatus.status === 'granted',
        canAskAgain: cameraStatus.canAskAgain,
        status: cameraStatus.status
      };

      const mediaLibrary: PermissionStatus = {
        granted: mediaStatus.status === 'granted',
        canAskAgain: mediaStatus.canAskAgain,
        status: mediaStatus.status
      };

      const allGranted = location.granted && camera.granted && mediaLibrary.granted;

      const result: AllPermissionsStatus = {
        location,
        backgroundLocation,
        camera,
        mediaLibrary,
        allGranted
      };

      console.log('[PERMISSIONS] 📋 Estado de permisos:', {
        ubicación: location.granted ? '✅' : '❌',
        ubicaciónFondo: backgroundLocation.granted ? '✅' : '❌',
        cámara: camera.granted ? '✅' : '❌',
        almacenamiento: mediaLibrary.granted ? '✅' : '❌',
        todos: allGranted ? '✅' : '❌'
      });

      return result;
    } catch (error) {
      console.error('[PERMISSIONS] ❌ Error verificando permisos:', error);
      return {
        location: { granted: false, canAskAgain: false, status: 'error' },
        backgroundLocation: { granted: false, canAskAgain: false, status: 'error' },
        camera: { granted: false, canAskAgain: false, status: 'error' },
        mediaLibrary: { granted: false, canAskAgain: false, status: 'error' },
        allGranted: false
      };
    }
  }

  /**
   * Solicitar todos los permisos necesarios
   */
  async requestAllPermissions(): Promise<AllPermissionsStatus> {
    console.log('[PERMISSIONS] 🚀 Solicitando todos los permisos necesarios...');

    const location = await this.requestLocationPermissions();
    const camera = await this.requestCameraPermissions();
    const mediaLibrary = await this.requestMediaLibraryPermissions();
    
    // Solo solicitar ubicación en segundo plano si la ubicación básica fue concedida
    const backgroundLocation = location.granted 
      ? await this.requestBackgroundLocationPermissions()
      : { granted: false, canAskAgain: true, status: 'not_requested' };

    const allGranted = location.granted && camera.granted && mediaLibrary.granted;

    const result: AllPermissionsStatus = {
      location,
      backgroundLocation,
      camera,
      mediaLibrary,
      allGranted
    };

    if (allGranted) {
      console.log('[PERMISSIONS] ✅ Todos los permisos concedidos');
    } else {
      console.log('[PERMISSIONS] ⚠️ Algunos permisos no concedidos');
      this.showPermissionAlert(result);
    }

    return result;
  }

  /**
   * Mostrar alerta explicativa sobre permisos faltantes
   */
  private showPermissionAlert(permissions: AllPermissionsStatus): void {
    const missingPermissions: string[] = [];
    
    if (!permissions.location.granted) {
      missingPermissions.push('• Ubicación: Para tracking de entregas');
    }
    if (!permissions.camera.granted) {
      missingPermissions.push('• Cámara: Para capturar evidencias');
    }
    if (!permissions.mediaLibrary.granted) {
      missingPermissions.push('• Almacenamiento: Para guardar fotos');
    }
    
    if (missingPermissions.length > 0) {
      Alert.alert(
        '🔐 Permisos Requeridos',
        `Para el correcto funcionamiento de la app, necesitamos los siguientes permisos:\n\n${missingPermissions.join('\n')}\n\nPuedes otorgarlos desde Configuración > Aplicaciones > FultraApps`,
        [
          { text: 'Más tarde', style: 'cancel' },
          { 
            text: 'Configuración', 
            onPress: () => {
              // TODO: Abrir configuración de la app
              console.log('[PERMISSIONS] Redirigir a configuración de la app');
            }
          }
        ]
      );
    }
  }

  /**
   * Verificar si se pueden usar funciones de ubicación
   */
  async canUseLocation(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    return permissions.location.granted;
  }

  /**
   * Verificar si se puede usar tracking en segundo plano
   */
  async canUseBackgroundLocation(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    return permissions.location.granted && permissions.backgroundLocation.granted;
  }

  /**
   * Verificar si se puede usar la cámara
   */
  async canUseCamera(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    return permissions.camera.granted;
  }

  /**
   * Verificar si se puede usar el almacenamiento
   */
  async canUseMediaLibrary(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    return permissions.mediaLibrary.granted;
  }
}

export const permissionsService = new PermissionsService();