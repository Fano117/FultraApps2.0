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
  OrdenesVenta: { cliente: ClienteEntregaDTO };
  DetalleOrden: { cliente: ClienteEntregaDTO; entrega: EntregaDTO };
  FormularioEntrega: { clienteCarga: string; entrega: EntregaDTO; tipoRegistro: TipoRegistro };
  EntregasList: undefined;
  EntregaDetail: { clienteCarga: string; entrega: EntregaDTO };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
