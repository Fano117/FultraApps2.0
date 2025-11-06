import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EntregasStackParamList } from './types';
import ClientesEntregasScreen from '@/apps/entregas/screens/ClientesEntregasScreen';
import OrdenesVentaScreen from '@/apps/entregas/screens/OrdenesVentaScreen';
import DetalleOrdenScreen from '@/apps/entregas/screens/DetalleOrdenScreen';
import FormularioEntregaScreen from '@/apps/entregas/screens/FormularioEntregaScreen';

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
    </Stack.Navigator>
  );
};

export default EntregasNavigator;
