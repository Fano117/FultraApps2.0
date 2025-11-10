import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Entrega, EstatusEntrega } from '../types';
import { colors, spacing } from '@/design-system';

interface EntregaCardProps {
  entrega: Entrega;
  onPress?: () => void;
  showDistance?: boolean;
}

export const EntregaCard: React.FC<EntregaCardProps> = ({ entrega, onPress, showDistance = false }) => {
  const getStatusColor = (status: EstatusEntrega): string => {
    switch (status) {
      case EstatusEntrega.COMPLETADA:
        return colors.success.main;
      case EstatusEntrega.EN_RUTA:
        return colors.primary[500];
      case EstatusEntrega.EN_SITIO:
        return colors.warning[500];
      case EstatusEntrega.LLEGADA_CERCANA:
        return colors.info.main;
      default:
        return colors.neutral[400];
    }
  };

  const getStatusText = (status: EstatusEntrega): string => {
    switch (status) {
      case EstatusEntrega.COMPLETADA:
        return 'Completada';
      case EstatusEntrega.EN_RUTA:
        return 'En ruta';
      case EstatusEntrega.EN_SITIO:
        return 'En sitio';
      case EstatusEntrega.LLEGADA_CERCANA:
        return 'Llegada cercana';
      case EstatusEntrega.PENDIENTE:
        return 'Pendiente';
      case EstatusEntrega.CANCELADA:
        return 'Cancelada';
      default:
        return status;
    }
  };

  const formatDistance = (meters?: number): string => {
    if (!meters) return '';
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.secuencia}>
          <Text style={styles.secuenciaText}>{entrega.secuencia}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.numeroOrden}>#{entrega.numeroOrden}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(entrega.estatus) }]}>
            <Text style={styles.statusText}>{getStatusText(entrega.estatus)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.clientName}>{entrega.cliente.nombre}</Text>
        <Text style={styles.address} numberOfLines={2}>
          📍 {entrega.direccion.calle}, {entrega.direccion.ciudad}
        </Text>
        
        {entrega.productos && entrega.productos.length > 0 && (
          <Text style={styles.productInfo}>
            📦 {entrega.productos.length} producto{entrega.productos.length > 1 ? 's' : ''}
          </Text>
        )}

        {showDistance && entrega.distancia !== undefined && (
          <Text style={styles.distance}>
            🚗 {formatDistance(entrega.distancia)}
            {entrega.tiempoEstimado && ` • ${Math.round(entrega.tiempoEstimado / 60)} min`}
          </Text>
        )}

        {entrega.instrucciones && (
          <Text style={styles.instructions} numberOfLines={2}>
            ℹ️ {entrega.instrucciones}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: spacing[4],
    marginVertical: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  secuencia: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[4],
  },
  secuenciaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  numeroOrden: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: spacing[4],
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  address: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  productInfo: {
    fontSize: 14,
    color: colors.neutral[700],
    marginTop: spacing[2],
  },
  distance: {
    fontSize: 14,
    color: colors.primary[500],
    fontWeight: '600',
    marginTop: spacing[2],
  },
  instructions: {
    fontSize: 13,
    color: colors.info.main,
    marginTop: spacing[3],
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
