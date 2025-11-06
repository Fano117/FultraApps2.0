import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { store, persistor } from './src/shared/store';
import { RootNavigator } from './src/navigation';
import { colors } from './src/design-system';

export default function App() {
  // Temporalmente deshabilitado para debugging
  // useEffect(() => {
  //   const setupBackgroundSync = async () => {
  //     try {
  //       console.log('[App] Registrando servicio de sincronización en background');
  //       const registered = await syncService.registerBackgroundSync();
  //
  //       if (registered) {
  //         console.log('[App] Servicio de background registrado exitosamente');
  //         const status = await syncService.getBackgroundSyncStatus();
  //         console.log('[App] Estado del background fetch:', status);
  //       } else {
  //         console.warn('[App] No se pudo registrar el servicio de background');
  //       }
  //     } catch (error) {
  //       console.error('[App] Error configurando background sync:', error);
  //     }
  //   };
  //   setupBackgroundSync();
  // }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#7C3AED" />
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
    backgroundColor: '#FFFFFF',
  },
});
