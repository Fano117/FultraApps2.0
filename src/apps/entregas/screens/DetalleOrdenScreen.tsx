import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Typography, Badge, colors, spacing, borderRadius } from '@/design-system';
import { EntregasStackParamList } from '@/navigation/types';
import { TipoRegistro } from '../models';

type RouteParams = RouteProp<EntregasStackParamList, 'DetalleOrden'>;
type NavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'DetalleOrden'>;

const DetalleOrdenScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { cliente, entrega } = route.params;

  const [selectedTipo, setSelectedTipo] = useState<TipoRegistro | null>(null);

  const handleTipoEntregaSelect = (tipo: TipoRegistro) => {
    setSelectedTipo(tipo);
  };

  const handleContinuar = () => {
    if (!selectedTipo) {
      Alert.alert('Selección requerida', 'Por favor selecciona cómo se realizó la entrega');
      return;
    }

    Alert.alert(
      selectedTipo === TipoRegistro.COMPLETO ? 'Entrega Completa' :
      selectedTipo === TipoRegistro.PARCIAL ? 'Entrega Parcial' :
      'No Entregado',
      '¿Confirma que se entregó la orden completa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            const clienteCarga = `${cliente.carga}-${cliente.cuentaCliente}`;
            navigation.navigate('FormularioEntrega', {
              clienteCarga,
              entrega,
              tipoRegistro: selectedTipo,
            });
          },
        },
      ]
    );
  };

  const tiposEntrega = [
    {
      tipo: TipoRegistro.COMPLETO,
      icon: 'checkmark-circle',
      title: 'Entrega Completa',
      description: 'Se entregaron todos los artículos según lo programado',
      color: colors.success[500],
      bgColor: colors.success[50],
    },
    {
      tipo: TipoRegistro.PARCIAL,
      icon: 'warning',
      title: 'Entrega Parcial',
      description: 'El cliente rechazó algunos artículos',
      color: colors.warning[600],
      bgColor: colors.warning[50],
    },
    {
      tipo: TipoRegistro.NO_ENTREGADO,
      icon: 'close-circle',
      title: 'No Entregado',
      description: 'La orden no pudo ser entregada',
      color: colors.error[500],
      bgColor: colors.error[50],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Typography variant="h6">Detalle de Orden</Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card variant="elevated" padding="medium">
          <Typography variant="subtitle1" style={styles.sectionTitle}>
            Información del Cliente
          </Typography>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={colors.text.secondary} />
            <Typography variant="body2">{cliente.cliente}</Typography>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={18} color={colors.text.secondary} />
            <Typography variant="caption" color="secondary">
              {cliente.cuentaCliente}
            </Typography>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color={colors.text.secondary} />
            <Typography variant="caption" color="secondary" style={styles.direccionText}>
              {cliente.direccionEntrega}
            </Typography>
          </View>
        </Card>

        <Card variant="elevated" padding="medium" style={styles.section}>
          <Typography variant="subtitle1" style={styles.sectionTitle}>
            Información de la Orden
          </Typography>
          <View style={styles.ordenRow}>
            <Typography variant="h5" style={{ color: colors.primary[600] }}>
              {entrega.ordenVenta}
            </Typography>
            <Badge variant="info" size="medium">
              ENTREGA
            </Badge>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoGridItem}>
              <Typography variant="caption" color="secondary">
                Folio:
              </Typography>
              <Typography variant="subtitle2">{entrega.folio}</Typography>
            </View>
            <View style={styles.infoGridItem}>
              <Typography variant="caption" color="secondary">
                Carga:
              </Typography>
              <Typography variant="subtitle2">{cliente.carga}</Typography>
            </View>
          </View>
          <View style={styles.totalesRow}>
            <View style={styles.totalItem}>
              <Typography variant="h4">
                {entrega.articulos.length}
              </Typography>
              <Typography variant="caption" color="secondary">
                Artículos
              </Typography>
            </View>
            <View style={styles.totalItem}>
              <Typography variant="h4">
                {entrega.articulos.reduce((sum, art) => sum + art.cantidadProgramada, 0)}
              </Typography>
              <Typography variant="caption" color="secondary">
                Cantidad Total
              </Typography>
            </View>
            <View style={styles.totalItem}>
              <Typography variant="h4">
                {entrega.articulos.reduce((sum, art) => sum + art.peso, 0).toFixed(2)}
              </Typography>
              <Typography variant="caption" color="secondary">
                Peso (kg)
              </Typography>
            </View>
          </View>
        </Card>

        <Card variant="elevated" padding="medium" style={styles.section}>
          <Typography variant="subtitle1" style={styles.sectionTitle}>
            Artículos a Entregar
          </Typography>
          {entrega.articulos.map((articulo) => (
            <View key={articulo.id} style={styles.articuloCard}>
              <View style={styles.articuloHeader}>
                <View style={styles.articuloInfo}>
                  <Typography variant="subtitle2">{articulo.producto}</Typography>
                  <Typography variant="caption" color="secondary">
                    {articulo.descripcion}
                  </Typography>
                </View>
                <Badge variant="info" size="small">
                  {articulo.cantidadProgramada} {articulo.unidadMedida}
                </Badge>
              </View>
              <View style={styles.articuloDetails}>
                <View style={styles.articuloStat}>
                  <Typography variant="caption" color="secondary">
                    Programado:
                  </Typography>
                  <Typography variant="body2" style={{ fontWeight: '600' }}>
                    {articulo.cantidadProgramada} {articulo.unidadMedida}
                  </Typography>
                </View>
                <View style={styles.articuloStat}>
                  <Typography variant="caption" color="secondary">
                    Peso:
                  </Typography>
                  <Typography variant="body2">{articulo.peso} kg</Typography>
                </View>
              </View>
            </View>
          ))}
        </Card>

        <View style={styles.selectionSection}>
          <Typography variant="h6" style={styles.selectionTitle}>
            ¿Cómo se realizó la entrega?
          </Typography>

          {tiposEntrega.map((item) => (
            <TouchableOpacity
              key={item.tipo}
              onPress={() => handleTipoEntregaSelect(item.tipo)}
              activeOpacity={0.7}
            >
              <Card
                variant={selectedTipo === item.tipo ? 'elevated' : 'outline'}
                padding="medium"
                style={[
                  styles.tipoCard,
                  selectedTipo === item.tipo && {
                    backgroundColor: item.bgColor,
                    borderColor: item.color,
                    borderWidth: 2,
                  },
                ]}
              >
                <View style={styles.tipoContent}>
                  <View
                    style={[
                      styles.tipoIcon,
                      {
                        backgroundColor: selectedTipo === item.tipo ? item.color : item.bgColor,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={selectedTipo === item.tipo ? colors.white : item.color}
                    />
                  </View>
                  <View style={styles.tipoInfo}>
                    <Typography
                      variant="subtitle1"
                      style={{
                        color: selectedTipo === item.tipo ? item.color : colors.text.primary,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="secondary">
                      {item.description}
                    </Typography>
                  </View>
                  {selectedTipo === item.tipo && (
                    <Ionicons name="checkmark-circle" size={24} color={item.color} />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedTipo && (
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinuar}
            style={[
              styles.continuarButton,
              {
                backgroundColor:
                  selectedTipo === TipoRegistro.COMPLETO
                    ? colors.success[500]
                    : selectedTipo === TipoRegistro.PARCIAL
                    ? colors.warning[600]
                    : colors.error[500],
              },
            ]}
            activeOpacity={0.8}
          >
            <Typography variant="button" style={{ color: colors.white }}>
              Continuar
            </Typography>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'space-between',
    padding: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing[1],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[20],
  },
  section: {
    marginTop: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  direccionText: {
    flex: 1,
  },
  ordenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  infoGridItem: {
    flex: 1,
  },
  totalesRow: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    padding: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  articuloCard: {
    backgroundColor: colors.background.tertiary,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  articuloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  articuloInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  articuloDetails: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  articuloStat: {
    flex: 1,
  },
  selectionSection: {
    marginTop: spacing[4],
  },
  selectionTitle: {
    marginBottom: spacing[4],
  },
  tipoCard: {
    marginBottom: spacing[3],
  },
  tipoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  tipoIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipoInfo: {
    flex: 1,
  },
  footer: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  continuarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
});

export default DetalleOrdenScreen;
