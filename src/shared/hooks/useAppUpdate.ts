import { useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus, Linking } from 'react-native';
import VersionCheck from 'react-native-version-check-expo';

/**
 * Hook personalizado para verificar y forzar actualizaciones de la app
 * consultando directamente con Play Store (Android) y App Store (iOS).
 *
 * Funcionalidad:
 * - Verifica actualizaciones al montar el componente
 * - Verifica cuando la app vuelve al foreground
 * - Fuerza al usuario a actualizar si hay una nueva versión disponible
 * - Abre la tienda correspondiente (Play Store o App Store)
 * - Compatible con Android e iOS
 */
export const useAppUpdate = () => {
  const appState = useRef(AppState.currentState);
  const isCheckingUpdate = useRef(false);

  useEffect(() => {
    // Verificar actualización al montar el componente
    checkForUpdate();

    // Listener para cuando la app vuelve al foreground
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Si la app viene de background a foreground, verificar actualizaciones
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('[AppUpdate] App volvió al foreground, verificando actualizaciones...');
      checkForUpdate();
    }
    appState.current = nextAppState;
  };

  const checkForUpdate = async () => {
    // Evitar múltiples verificaciones simultáneas
    if (isCheckingUpdate.current) {
      console.log('[AppUpdate] Ya hay una verificación en progreso');
      return;
    }

    try {
      isCheckingUpdate.current = true;

      console.log('[AppUpdate] Verificando actualizaciones en tiendas...');

      // Obtener versión actual de la app
      const currentVersion = VersionCheck.getCurrentVersion();
      console.log('[AppUpdate] Versión actual:', currentVersion);

      // Obtener versión más reciente de la tienda (Play Store o App Store)
      const latestVersion = await VersionCheck.getLatestVersion();
      console.log('[AppUpdate] Versión en tienda:', latestVersion);

      // Verificar si necesita actualización
      const needsUpdate = await VersionCheck.needUpdate();

      console.log('[AppUpdate] Resultado:', {
        currentVersion,
        latestVersion,
        isNeeded: needsUpdate.isNeeded,
      });

      if (needsUpdate.isNeeded) {
        console.log('[AppUpdate] ¡Actualización disponible! Mostrando alerta...');
        showUpdateAlert(latestVersion);
      } else {
        console.log('[AppUpdate] App está actualizada');
      }
    } catch (error: any) {
      console.error('[AppUpdate] Error verificando actualización:', error);

      // Solo mostrar error si es crítico (opcional)
      // No queremos interrumpir la experiencia del usuario por un error de verificación
    } finally {
      isCheckingUpdate.current = false;
    }
  };

  const showUpdateAlert = (latestVersion: string) => {
    const storeUrl = VersionCheck.getStoreUrl();

    Alert.alert(
      'Actualización requerida',
      `Hay una nueva versión disponible (${latestVersion}). Debes actualizar para continuar usando la aplicación.`,
      [
        {
          text: 'Actualizar ahora',
          onPress: () => {
            console.log('[AppUpdate] Abriendo tienda:', storeUrl);
            Linking.openURL(storeUrl);
          },
        },
      ],
      {
        cancelable: false, // NO permite cerrar el alert - FUERZA la actualización
      }
    );
  };

  // No retorna nada, funciona automáticamente
  return null;
};
