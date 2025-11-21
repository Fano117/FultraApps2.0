import { NavigatorScreenParams } from '@react-navigation/native';
import { EntregaDTO, ClienteEntregaDTO, TipoRegistro } from '@/apps/entregas/models';
import { DireccionValidada } from '@/apps/entregas/types/api-delivery';

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

/**
 * Parámetros para navegación con el nuevo formato JSON multi-parada
 */
export interface MultiStopDeliveryParams {
  /** Folio del embarque */
  folioEmbarque: string;
  /** ID de ruta HERE Maps (si existe) */
  idRutaHereMaps?: string | null;
  /** Direcciones validadas con coordenadas */
  direcciones: DireccionValidada[];
  /** Índice de la parada actual (0 = primera) */
  paradaActualIndex?: number;
}

export type EntregasStackParamList = {
  EntregasRutas: undefined;
  ClientesEntregas: undefined;
  OrdenesVenta: { cliente: ClienteEntregaDTO };
  DetalleOrden: { cliente: ClienteEntregaDTO; entrega: EntregaDTO };
  FormularioEntrega: { clienteCarga: string; entrega: EntregaDTO; tipoRegistro: TipoRegistro; geofenceId?: string | null };
  EntregasList: undefined;
  EntregaDetail: { clienteCarga: string; entrega: EntregaDTO };
  /** Tracking de entrega individual (formato original) */
  EntregaTracking: {
    entregaId: number;
    folio: string;
    puntoEntrega: { latitud: number; longitud: number };
    nombreCliente: string;
  };
  /** Navegación con ruta multi-parada (nuevo formato JSON) */
  RutaMultiParada: MultiStopDeliveryParams;
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
