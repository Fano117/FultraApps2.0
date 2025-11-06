import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { store, persistor } from './src/shared/store';
import { RootNavigator } from './src/navigation';
import { colors } from './src/design-system';
import { syncService } from './src/apps/entregas/services';

export default function App() {
  useEffect(() => {
    // Registrar el servicio de sincronización en background
    const setupBackgroundSync = async () => {
      try {
        console.log('[App] Registrando servicio de sincronización en background');
        const registered = await syncService.registerBackgroundSync();

        if (registered) {
          console.log('[App] Servicio de background registrado exitosamente');

          // Verificar el estado
          const status = await syncService.getBackgroundSyncStatus();
          console.log('[App] Estado del background fetch:', status);
        } else {
          console.warn('[App] No se pudo registrar el servicio de background');
        }
      } catch (error) {
        console.error('[App] Error configurando background sync:', error);
      }
    };

    setupBackgroundSync();

    // Cleanup al desmontar
    return () => {
      // No desregistramos aquí para que el servicio siga funcionando
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
            </View>
          }
          persistor={persistor}
        >
          <SafeAreaProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});
