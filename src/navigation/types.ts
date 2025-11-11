import { NavigatorScreenParams } from '@react-navigation/native';
import { EntregaDTO, ClienteEntregaDTO, TipoRegistro } from '@/apps/entregas/models';

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type MainTabParamList = {
  Home: undefined;
  Entregas: NavigatorScreenParams<EntregasTabParamList>;
  Profile: undefined;
  Notifications: undefined;
};

export type EntregasTabParamList = {
  EntregasTab: NavigatorScreenParams<EntregasStackParamList>;
  PendientesTab: undefined;
};

export type EntregasStackParamList = {
  ClientesEntregas: undefined;
  OrdenesVenta: { 
    clienteId: string; 
    clienteNombre: string; 
  };
  DetalleOrden: { 
    entregaId: string; 
  };
  FormularioEntrega: { 
    entregaId: string; 
  };
  MockTestingScreen: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
