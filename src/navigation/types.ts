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
  TestData: undefined;
};

export type EntregasTabParamList = {
  EntregasTab: NavigatorScreenParams<EntregasStackParamList>;
  PendientesTab: undefined;
};

export type EntregasStackParamList = {
  ClientesEntregas: undefined;
  OrdenesVenta: { cliente: ClienteEntregaDTO };
  DetalleOrden: { cliente: ClienteEntregaDTO; entrega: EntregaDTO };
  FormularioEntrega: { clienteCarga: string; entrega: EntregaDTO; tipoRegistro: TipoRegistro; geofenceId?: string | null };
  EntregasList: undefined;
  EntregaDetail: { clienteCarga: string; entrega: EntregaDTO };
  EntregaTracking: {
    entregaId: number;
    folio: string;
    puntoEntrega: { latitud: number; longitud: number };
    nombreCliente: string;
  };
  RutaEntrega: {
    destino: { latitude: number; longitude: number };
    cliente: string;
    direccion: string;
    ordenVenta: string;
    geofenceId?: string;
  };
  GestionEntregas: undefined;
  EstadoEntrega: { geofenceId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
