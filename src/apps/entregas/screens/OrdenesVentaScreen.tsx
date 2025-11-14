import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Typography, Badge, Button, colors, spacing, borderRadius } from '@/design-system';
import { EntregaDTO, EstadoEntrega } from '../models';
import { EntregasStackParamList } from '@/navigation/types';

type RouteParams = RouteProp<EntregasStackParamList, 'OrdenesVenta'>;
type NavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'OrdenesVenta'>;

const OrdenesVentaScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { cliente } = route.params;

  const handleOrdenPress = (entrega: EntregaDTO) => {
    navigation.navigate('DetalleOrden', { cliente, entrega });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case EstadoEntrega.PENDIENTE:
      case EstadoEntrega.PENDIENTE_ENVIO:
        return 'warning';
      case EstadoEntrega.ENTREGADO_COMPLETO:
        return 'success';
      case EstadoEntrega.ENTREGADO_PARCIAL:
        return 'info';
      case EstadoEntrega.NO_ENTREGADO:
        return 'error';
      default:
        return 'neutral';
    }
  };

  const renderOrden = ({ item }: { item: EntregaDTO }) => {
    const totalArticulos = item.articulos.length;
    const totalCantidad = item.articulos.reduce((sum, art) => sum + art.cantidadProgramada, 0);
    const pesoTotal = item.articulos.reduce((sum, art) => sum + art.peso, 0);

    // Verificar si la entrega ya fue procesada
    const yaEntregado = [
      EstadoEntrega.ENTREGADO_COMPLETO,
      EstadoEntrega.ENTREGADO_PARCIAL,
      EstadoEntrega.NO_ENTREGADO,
      EstadoEntrega.PENDIENTE_ENVIO,
    ].includes(item.estado as EstadoEntrega);

    return (
      <Card variant="elevated" padding="none" style={styles.ordenCard}>
        <View style={styles.ordenHeader}>
          <View style={styles.ordenInfo}>
            <View style={styles.ordenTitleRow}>
              <Typography variant="h6">{item.ordenVenta}</Typography>
              <Badge variant={getEstadoColor(item.estado) as any} size="small">
                {item.estado}
              </Badge>
            </View>
            <Typography variant="caption" color="secondary">
              Folio: {item.folio}
            </Typography>
          </View>
        </View>

        <View style={styles.ordenStats}>
          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={20} color={colors.text.secondary} />
            <Typography variant="body2" color="secondary">
              {totalArticulos} artículos
            </Typography>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="albums-outline" size={20} color={colors.text.secondary} />
            <Typography variant="body2" color="secondary">
              {totalCantidad} cantidad
            </Typography>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="scale-outline" size={20} color={colors.text.secondary} />
            <Typography variant="body2" color="secondary">
              {pesoTotal.toFixed(2)} kg
            </Typography>
          </View>
        </View>

        <View style={styles.articulosPreview}>
          {item.articulos.slice(0, 2).map((articulo, index) => (
            <View key={articulo.id} style={styles.articuloItem}>
              <Typography variant="caption" color="secondary">
                {articulo.producto}
              </Typography>
              <Typography variant="caption" style={styles.articuloCantidad}>
                {articulo.cantidadProgramada} {articulo.unidadMedida}
              </Typography>
            </View>
          ))}
          {item.articulos.length > 2 && (
            <Typography variant="caption" color="secondary">
              +{item.articulos.length - 2} más...
            </Typography>
          )}
        </View>

        {!yaEntregado && (
          <View style={styles.ordenActions}>
            <Button
              variant="gradient"
              size="medium"
              fullWidth
              onPress={() => handleOrdenPress(item)}
              leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />}
            >
              Realizar Entrega
            </Button>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Typography variant="h6">Órdenes de Venta</Typography>
          <Typography variant="caption" color="secondary">
            {cliente.cliente}
          </Typography>
        </View>
      </View>

      <Card variant="outline" padding="medium" style={styles.clienteInfo}>
        <View style={styles.clienteRow}>
          <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
          <Typography variant="body2">{cliente.cliente}</Typography>
        </View>
        <View style={styles.clienteRow}>
          <Ionicons name="card-outline" size={20} color={colors.text.secondary} />
          <Typography variant="body2">
            {cliente.cuentaCliente}
          </Typography>
        </View>
        <View style={styles.clienteRow}>
          <Ionicons name="location-outline" size={20} color={colors.text.secondary} />
          <Typography variant="body2" style={styles.direccionText}>
            {cliente.direccionEntrega}
          </Typography>
        </View>
      </Card>

      <FlatList
        data={cliente.entregas}
        renderItem={renderOrden}
        keyExtractor={(item) => `${item.ordenVenta}-${item.folio}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color={colors.neutral[300]} />
            <Typography variant="h6" color="secondary" align="center" style={styles.emptyText}>
              No hay órdenes de venta
            </Typography>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing[3],
  },
  backButton: {
    padding: spacing[1],
  },
  headerContent: {
    flex: 1,
  },
  clienteInfo: {
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  clienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  direccionText: {
    flex: 1,
  },
  listContent: {
    padding: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[10],
  },
  ordenCard: {
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  ordenHeader: {
    padding: spacing[4],
    backgroundColor: colors.background.secondary,
  },
  ordenInfo: {
    gap: spacing[1],
  },
  ordenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ordenStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  articulosPreview: {
    padding: spacing[4],
    gap: spacing[2],
    backgroundColor: colors.background.tertiary,
  },
  articuloItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articuloCantidad: {
    fontWeight: '600',
  },
  ordenActions: {
    padding: spacing[4],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[20],
  },
  emptyText: {
    marginTop: spacing[4],
  },
});

export default OrdenesVentaScreen;
