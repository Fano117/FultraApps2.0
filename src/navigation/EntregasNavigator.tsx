import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EntregasStackParamList } from './types';
import ClientesEntregasScreen from '@/apps/entregas/screens/ClientesEntregasScreen';
import OrdenesVentaScreen from '@/apps/entregas/screens/OrdenesVentaScreen';
import DetalleOrdenScreen from '@/apps/entregas/screens/DetalleOrdenScreen';
import FormularioEntregaScreen from '@/apps/entregas/screens/FormularioEntregaScreen';
import EntregasListScreen from '@/apps/entregas/screens/EntregasListScreen';
import EntregaDetailScreen from '@/apps/entregas/screens/EntregaDetailScreen';
import EntregaTrackingScreen from '@/screens/EntregaTrackingScreen';
import { DeliveryMapScreen } from '@/apps/entregas/screens/DeliveryMapScreen';
import { GestionEntregasScreen } from '@/apps/entregas/screens/GestionEntregasScreen';
import { EstadoEntregaScreen } from '@/apps/entregas/screens/EstadoEntregaScreen';
import RutaEntregaScreen from '@/apps/entregas/screens/RutaEntregaScreen';

const Stack = createNativeStackNavigator<EntregasStackParamList>();

const EntregasNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ClientesEntregas"
        component={ClientesEntregasScreen}
        options={{ title: 'Clientes - Entregas' }}
      />
      <Stack.Screen
        name="OrdenesVenta"
        component={OrdenesVentaScreen}
        options={{ title: 'Órdenes de Venta' }}
      />
      <Stack.Screen
        name="DetalleOrden"
        component={DetalleOrdenScreen}
        options={{ title: 'Detalle de Orden' }}
      />
      <Stack.Screen
        name="FormularioEntrega"
        component={FormularioEntregaScreen}
        options={{ title: 'Registro de Entrega' }}
      />
      <Stack.Screen
        name="EntregasList"
        component={EntregasListScreen}
        options={{ title: 'Entregas', headerShown: true }}
      />
      <Stack.Screen
        name="EntregaDetail"
        component={EntregaDetailScreen}
        options={{ title: 'Detalle de Entrega', headerShown: true }}
      />
      <Stack.Screen
        name="GestionEntregas"
        component={GestionEntregasScreen}
        options={{ title: 'Gestión de Entregas', headerShown: false }}
      />
      <Stack.Screen
        name="EstadoEntrega"
        component={EstadoEntregaScreen}
        options={{ title: 'Estado de Entrega', headerShown: false }}
      />
      <Stack.Screen
        name="RutaEntrega"
        component={RutaEntregaScreen}
        options={{ title: 'Ruta de Entrega', headerShown: false }}
      />
      <Stack.Screen
        name="EntregaTracking"
        component={DeliveryMapScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default EntregasNavigator;
