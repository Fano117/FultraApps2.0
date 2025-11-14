import React, { useState, useEffect, useCallback } from 'react';
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
import { entregasStorageService } from '../services/storageService';
import { geofencingService } from '@/shared/services/geofencingService';
import { locationTrackingService } from '@/shared/services/locationTrackingService';
import { permissionsService } from '@/shared/services/permissionsService';
import { gpsTrackingService } from '../../../shared/services/gpsTrackingService';

type RouteParams = RouteProp<EntregasStackParamList, 'DetalleOrden'>;
type NavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'DetalleOrden'>;

const DetalleOrdenScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { cliente, entrega } = route.params;

  const [selectedTipo, setSelectedTipo] = useState<TipoRegistro | null>(null);
  const [trackingIniciado, setTrackingIniciado] = useState(false);
  const [geofenceId, setGeofenceId] = useState<string | null>(null);
  const [dentroGeofence, setDentroGeofence] = useState(false);
  const [distanciaDestino, setDistanciaDestino] = useState<number | null>(null);
  const [ubicacionActual, setUbicacionActual] = useState<any>(null);

  // Función para calcular distancia entre dos coordenadas usando Haversine
  const calcularDistancia = useCallback((punto1: any, punto2: any): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = punto1.latitude * Math.PI / 180;
    const φ2 = punto2.latitude * Math.PI / 180;
    const Δφ = (punto2.latitude - punto1.latitude) * Math.PI / 180;
    const Δλ = (punto2.longitude - punto1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Generar ubicación mock cercana al destino para testing
  const generarUbicacionCercana = useCallback(() => {
    const destino = {
      latitude: parseFloat(cliente.latitud),
      longitude: parseFloat(cliente.longitud)
    };
    
    // Generar ubicación entre 30m-2km del destino
    const distanciaAleatoria = 30 + Math.random() * 1970; // 30m a 2km
    const anguloAleatorio = Math.random() * 2 * Math.PI;
    
    // Convertir metros a grados (aproximado)
    const offsetLat = (distanciaAleatoria / 111320) * Math.cos(anguloAleatorio);
    const offsetLng = (distanciaAleatoria / (111320 * Math.cos(destino.latitude * Math.PI / 180))) * Math.sin(anguloAleatorio);
    
    return {
      latitude: destino.latitude + offsetLat,
      longitude: destino.longitude + offsetLng,
      accuracy: 5 + Math.random() * 10,
      timestamp: Date.now()
    };
  }, [cliente.latitud, cliente.longitud]);

  // Monitorear ubicación y calcular distancia
  useEffect(() => {
    const iniciarMonitoreo = async () => {
      // Generar ubicación inicial
      const ubicacionMock = generarUbicacionCercana();
      setUbicacionActual(ubicacionMock);
      
      // Calcular distancia al destino
      const destino = {
        latitude: parseFloat(cliente.latitud),
        longitude: parseFloat(cliente.longitud)
      };
      
      const distancia = calcularDistancia(ubicacionMock, destino);
      setDistanciaDestino(distancia);
      setDentroGeofence(distancia <= 50); // 50m geofence
      
      console.log(`[DETALLE ORDEN] 📍 Ubicación: ${ubicacionMock.latitude}, ${ubicacionMock.longitude}`);
      console.log(`[DETALLE ORDEN] 📏 Distancia: ${distancia.toFixed(0)}m`);
      console.log(`[DETALLE ORDEN] ${distancia <= 50 ? '✅' : '❌'} Dentro geofence: ${distancia <= 50}`);
    };

    iniciarMonitoreo();
  }, [cliente.latitud, cliente.longitud, calcularDistancia, generarUbicacionCercana]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (geofenceId) {
        geofencingService.removeGeofence(geofenceId);
        console.log('[DETALLE ORDEN] 🧹 Geofence limpiado:', geofenceId);
      }
    };
  }, [geofenceId]);

  const handleTipoEntregaSelect = async (tipo: TipoRegistro) => {
    // Validar que esté dentro del geofence antes de permitir la selección
    if (!dentroGeofence) {
      Alert.alert(
        '🚫 Fuera del Área de Entrega',
        `Debe estar dentro del radio de 50m para realizar la entrega.\n\nDistancia actual: ${distanciaDestino ? Math.round(distanciaDestino) : 'N/A'}m\n\nPor favor, acérquese al punto de entrega.`,
        [
          { text: 'OK' },
          {
            text: 'Ver Mapa',
            onPress: () => {
              navigation.navigate('EntregaTracking', {
                entregaId: entrega.id,
                folio: entrega.folio,
                puntoEntrega: {
                  latitud: parseFloat(cliente.latitud),
                  longitud: parseFloat(cliente.longitud)
                },
                nombreCliente: cliente.cliente
              });
            }
          }
        ]
      );
      return;
    }

    setSelectedTipo(tipo);
    
    // Iniciar tracking GPS y geofencing cuando se selecciona un tipo
    if (!trackingIniciado) {
      await iniciarTrackingYGeofencing();
    }
  };

  const iniciarTrackingYGeofencing = async () => {
    try {
      console.log('[DETALLE ORDEN] 🚀 Iniciando tracking y geofencing...');
      
      // Verificar permisos
      const permissions = await permissionsService.requestAllPermissions();
      if (!permissions.location.granted) {
        Alert.alert(
          'Permisos Requeridos',
          'Se necesitan permisos de ubicación para el tracking de entregas.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Iniciar tracking de ubicación
      const trackingStarted = await locationTrackingService.startTracking();
      if (!trackingStarted) {
        Alert.alert('Error', 'No se pudo iniciar el tracking de ubicación');
        return;
      }

      // Crear geofence para la entrega
      const targetCoordinates = {
        latitude: parseFloat(cliente.latitud),
        longitude: parseFloat(cliente.longitud)
      };

      const newGeofenceId = await geofencingService.createDeliveryGeofence(
        entrega.id || 0,
        entrega.folio,
        cliente.cliente,
        targetCoordinates,
        50 // 50 metros de radio
      );
      
      setGeofenceId(newGeofenceId);
      setTrackingIniciado(true);
      
      console.log('[DETALLE ORDEN] ✅ Tracking y geofencing iniciados');
      
    } catch (error) {
      console.error('[DETALLE ORDEN] ❌ Error iniciando tracking:', error);
      Alert.alert('Error', 'Error inicializando el tracking de entrega');
    }
  };

  const handleNavigateToMap = () => {
    // Parsear coordenadas del cliente
    const latitude = parseFloat(cliente.latitud) || 0;
    const longitude = parseFloat(cliente.longitud) || 0;
    
    if (latitude === 0 || longitude === 0) {
      Alert.alert(
        'Error de ubicación',
        'No se pudieron obtener las coordenadas del punto de entrega.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('EntregaTracking', {
      entregaId: entrega.id || 0,
      folio: entrega.folio,
      puntoEntrega: {
        latitud: latitude,
        longitud: longitude
      },
      nombreCliente: cliente.cliente
    });
  };

  const handleContinuar = async () => {
    if (!selectedTipo) {
      Alert.alert('Selección requerida', 'Por favor selecciona cómo se realizó la entrega');
      return;
    }

    // VALIDACIÓN: Verificar si el folio ya está en sincronización
    try {
      const entregasSync = await entregasStorageService.getEntregasSync();
      const yaExiste = entregasSync.some(
        e => e.ordenVenta === entrega.ordenVenta && e.folio === entrega.folio
      );

      if (yaExiste) {
        Alert.alert(
          'Entrega ya procesada',
          'Este folio ya ha sido registrado y está en proceso de sincronización. No se puede realizar la entrega nuevamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
    } catch (error) {
      console.error('[DetalleOrden] Error verificando entregas sync:', error);
      Alert.alert('Error', 'No se pudo verificar el estado de sincronización');
      return;
    }

    Alert.alert(
      selectedTipo === TipoRegistro.COMPLETO ? 'Entrega Completa' :
      selectedTipo === TipoRegistro.PARCIAL ? 'Entrega Parcial' :
      'No Entregado',
      trackingIniciado ? 'El tracking GPS continuará en la siguiente pantalla.' : '¿Confirma que se entregó la orden completa?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => {
            const clienteCarga = `${cliente.carga}-${cliente.cuentaCliente}`;
            
            // Transferir el geofenceId al formulario para continuar el tracking
            const geofenceIdToTransfer = geofenceId;
            
            // Limpiar el geofenceId local para que no se elimine al desmontar
            setGeofenceId(null);
            
            navigation.navigate('FormularioEntrega', {
              clienteCarga,
              entrega,
              tipoRegistro: selectedTipo,
              geofenceId: geofenceIdToTransfer, // Pasar el geofenceId al formulario
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

          {trackingIniciado && (
            <View style={styles.trackingStatus}>
              <Ionicons name="location" size={16} color={colors.success[600]} />
              <Typography variant="caption" style={{ color: colors.success[700], marginLeft: spacing[1] }}>
                📍 Tracking GPS activo - Los botones se habilitarán al llegar al destino
              </Typography>
            </View>
          )}

          {/* Estado de ubicación y geofence */}
          <Card 
            variant={dentroGeofence ? 'elevated' : 'outline'} 
            padding="medium" 
            style={StyleSheet.flatten([
              styles.estadoCard,
              dentroGeofence ? {
                backgroundColor: colors.success[50],
                borderColor: colors.success[500],
                borderWidth: 2
              } : {
                backgroundColor: colors.error[50],
                borderColor: colors.error[500],
                borderWidth: 2
              }
            ])}
          >
            <View style={styles.estadoContent}>
              <View style={[
                styles.estadoIcon,
                { backgroundColor: dentroGeofence ? colors.success[500] : colors.error[500] }
              ]}>
                <Ionicons 
                  name={dentroGeofence ? "checkmark-circle" : "location"} 
                  size={24} 
                  color={colors.white}
                />
              </View>
              <View style={styles.estadoInfo}>
                <Typography 
                  variant="subtitle1" 
                  style={{ color: dentroGeofence ? colors.success[700] : colors.error[700] }}
                >
                  {dentroGeofence ? '✅ En Zona de Entrega' : '📍 Fuera del Área de Entrega'}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="secondary"
                >
                  Distancia: {distanciaDestino ? `${Math.round(distanciaDestino)}m` : 'Calculando...'}
                </Typography>
                {!dentroGeofence && (
                  <Typography 
                    variant="caption" 
                    style={{ color: colors.error[600], marginTop: 4 }}
                  >
                    Debe estar dentro de 50m para realizar entrega
                  </Typography>
                )}
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('EntregaTracking', {
                  entregaId: entrega.id,
                  folio: entrega.folio,
                  puntoEntrega: {
                    latitud: parseFloat(cliente.latitud),
                    longitud: parseFloat(cliente.longitud)
                  },
                  nombreCliente: cliente.cliente
                })}
                style={[styles.verMapaButton, { backgroundColor: colors.primary[500] }]}
              >
                <Ionicons name="map" size={20} color={colors.white} />
                <Typography variant="caption" style={{ color: colors.white, marginLeft: 4 }}>
                  Ver Mapa
                </Typography>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Botones de selección de entrega - ahora con validación condicional */}
          {tiposEntrega.map((item) => (
            <TouchableOpacity
              key={item.tipo}
              onPress={() => handleTipoEntregaSelect(item.tipo)}
              activeOpacity={0.7}
              disabled={item.tipo !== TipoRegistro.NO_ENTREGADO && !dentroGeofence}
            >
              <Card
                variant={selectedTipo === item.tipo ? 'elevated' : 'outline'}
                padding="medium"
                style={StyleSheet.flatten([
                  styles.tipoCard,
                  selectedTipo === item.tipo && {
                    backgroundColor: item.bgColor,
                    borderColor: item.color,
                    borderWidth: 2,
                  },
                  (item.tipo !== TipoRegistro.NO_ENTREGADO && !dentroGeofence) && { opacity: 0.5 } // Opacidad reducida cuando está deshabilitado
                ])}
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
                        opacity: dentroGeofence ? 1 : 0.6
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="secondary"
                      style={{
                        opacity: (item.tipo !== TipoRegistro.NO_ENTREGADO && !dentroGeofence) ? 0.6 : 1
                      }}
                    >
                      {item.description}
                    </Typography>
                    {(item.tipo !== TipoRegistro.NO_ENTREGADO && !dentroGeofence) && (
                      <Typography 
                        variant="caption" 
                        style={{ 
                          color: colors.error[500],
                          marginTop: 4,
                          fontWeight: '600'
                        }}
                      >
                        🔒 Requiere estar en zona de entrega
                      </Typography>
                    )}
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

      {/* Botón flotante del mapa */}
      <TouchableOpacity
        style={styles.mapButton}
        onPress={handleNavigateToMap}
        activeOpacity={0.8}
      >
        <Ionicons name="map" size={24} color={colors.white} />
        <Typography variant="caption" style={styles.mapButtonText}>
          Ver Mapa
        </Typography>
      </TouchableOpacity>

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
  mapButton: {
    position: 'absolute',
    bottom: spacing[8],
    right: spacing[4],
    backgroundColor: colors.primary[600],
    borderRadius: 25,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mapButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  estadoCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  estadoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  estadoInfo: {
    flex: 1,
  },
  verMapaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success[50],
    padding: spacing[2],
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.success[200],
  },
});

export default DetalleOrdenScreen;
