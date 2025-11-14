import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Circle, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Subscription } from 'rxjs';
import twrnc from 'twrnc';

import { 
  simulationService, 
  SimulacionEntrega, 
  UbicacionChofer, 
  RutaOptima 
} from '../services/simulationService';

const { width, height } = Dimensions.get('window');

export const SimulacionEntregaScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // Estados
  const [entregas, setEntregas] = useState<SimulacionEntrega[]>([]);
  const [entregaActiva, setEntregaActiva] = useState<SimulacionEntrega | null>(null);
  const [ubicacionChofer, setUbicacionChofer] = useState<UbicacionChofer | null>(null);
  const [simulacionActiva, setSimulacionActiva] = useState(false);
  const [rutaActual, setRutaActual] = useState<RutaOptima | null>(null);
  const [subscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    // Suscribirse a observables
    const entregasSub = simulationService.entregas.subscribe(setEntregas);
    const ubicacionSub = simulationService.ubicacionChofer.subscribe(setUbicacionChofer);
    const entregaActivaSub = simulationService.entregaActiva.subscribe(setEntregaActiva);
    const simulacionSub = simulationService.simulacionActiva.subscribe(setSimulacionActiva);
    const rutaSub = simulationService.rutaActual.subscribe(setRutaActual);

    subscriptions.push(entregasSub, ubicacionSub, entregaActivaSub, simulacionSub, rutaSub);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  const iniciarSimulacion = async (entregaId: string) => {
    try {
      await simulationService.iniciarSimulacionEntrega(entregaId);
      Alert.alert(
        '🚚 Simulación Iniciada',
        'El chofer está en camino. Los botones de entrega se habilitarán al llegar al destino.',
        [{ text: 'Entendido' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo iniciar la simulación');
    }
  };

  const completarEntrega = () => {
    Alert.alert(
      '✅ ¿Completar Entrega?',
      'Esto finalizará la entrega actual y la marcará como completada.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Completar', 
          onPress: async () => {
            await simulationService.completarEntrega();
            Alert.alert('✅ Entrega Completada', 'La entrega ha sido registrada exitosamente.');
          }
        }
      ]
    );
  };

  const pararSimulacion = () => {
    Alert.alert(
      '🛑 ¿Detener Simulación?',
      'Esto detendrá la simulación actual sin completar la entrega.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Detener', onPress: () => simulationService.pararSimulacion() }
      ]
    );
  };

  const navegarAFormularioEntrega = () => {
    if (!entregaActiva) return;
    
    if (!simulationService.puedeRealizarEntrega()) {
      Alert.alert(
        'Entrega No Disponible',
        'Debe estar dentro del radio de 50m del punto de entrega para realizar la entrega.',
        [{ text: 'OK' }]
      );
      return;
    }

    (navigation as any).navigate('FormularioEntrega', {
      clienteCarga: `${entregaActiva.cliente}_${entregaActiva.id}`,
      entrega: {
        id: parseInt(entregaActiva.id.replace('SIM_', '')),
        ordenVenta: entregaActiva.ordenVenta,
        folio: entregaActiva.folio,
        tipoEntrega: 'ENTREGA',
        estado: 'PENDIENTE',
        articulos: [],
        cargaCuentaCliente: `CARGA_${entregaActiva.id}`
      },
      tipoRegistro: 'COMPLETO'
    });
  };

  const navegarAGestionEntregas = () => {
    (navigation as any).navigate('GestionEntregas');
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return '#6B7280';
      case 'EN_RUTA': return '#3B82F6';
      case 'LLEGANDO': return '#F59E0B';
      case 'EN_ENTREGA': return '#10B981';
      case 'COMPLETADA': return '#059669';
      default: return '#6B7280';
    }
  };

  const getTextoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return '⏳ Pendiente';
      case 'EN_RUTA': return '🚚 En Ruta';
      case 'LLEGANDO': return '🏃 Llegando';
      case 'EN_ENTREGA': return '📦 En Entrega';
      case 'COMPLETADA': return '✅ Completada';
      default: return estado;
    }
  };

  const getIconoEstado = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'time-outline';
      case 'EN_RUTA': return 'car-outline';
      case 'LLEGANDO': return 'location-outline';
      case 'EN_ENTREGA': return 'cube-outline';
      case 'COMPLETADA': return 'checkmark-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  return (
    <SafeAreaView style={twrnc`flex-1 bg-white`}>
      <StatusBar barStyle="light-content" backgroundColor="#1D4ED8" />
      
      <View style={twrnc`flex-1`}>
        {/* Header */}
        <View style={twrnc`px-4 py-3 bg-blue-700`}>
          <View style={twrnc`flex-row items-center justify-between`}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={twrnc`mr-3`}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={twrnc`flex-1`}>
              <Text style={twrnc`text-white text-lg font-bold`}>
                🚚 Simulación de Entregas
              </Text>
              {entregaActiva && (
                <Text style={twrnc`text-blue-100 text-sm mt-1`}>
                  {entregaActiva.cliente} - {getTextoEstado(entregaActiva.estado)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={navegarAGestionEntregas}
              style={twrnc`bg-blue-600 px-3 py-2 rounded-lg`}
            >
              <Ionicons name="settings-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mapa */}
        <View style={twrnc`flex-1`}>
          <MapView
            style={twrnc`flex-1`}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: 25.686613,
              longitude: -100.316113,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsTraffic={true}
          >
            {/* Marcador del chofer */}
            {ubicacionChofer && (
              <Marker
                coordinate={{
                  latitude: ubicacionChofer.latitud,
                  longitude: ubicacionChofer.longitud,
                }}
                title="🚚 Chofer"
                description={`Velocidad: ${ubicacionChofer.velocidad.toFixed(0)} km/h`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={twrnc`bg-blue-600 p-2 rounded-full border-2 border-white`}>
                  <Ionicons name="car" size={20} color="white" />
                </View>
              </Marker>
            )}

            {/* Marcadores de entregas */}
            {entregas.map((entrega) => (
              <React.Fragment key={entrega.id}>
                <Marker
                  coordinate={{
                    latitude: entrega.latitud,
                    longitude: entrega.longitud,
                  }}
                  title={`📦 ${entrega.cliente}`}
                  description={entrega.direccion}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={[
                    twrnc`p-2 rounded-full border-2 border-white`,
                    { backgroundColor: getColorEstado(entrega.estado) }
                  ]}>
                    <Ionicons 
                      name={getIconoEstado(entrega.estado) as any} 
                      size={18} 
                      color="white" 
                    />
                  </View>
                </Marker>
                
                {/* Geofence de 50m para entrega activa */}
                {entregaActiva?.id === entrega.id && (
                  <>
                    <Circle
                      center={{
                        latitude: entrega.latitud,
                        longitude: entrega.longitud,
                      }}
                      radius={50}
                      strokeColor="#10B981"
                      fillColor="rgba(16, 185, 129, 0.2)"
                      strokeWidth={2}
                    />
                    <Circle
                      center={{
                        latitude: entrega.latitud,
                        longitude: entrega.longitud,
                      }}
                      radius={100}
                      strokeColor="#F59E0B"
                      fillColor="rgba(245, 158, 11, 0.1)"
                      strokeWidth={1}
                    />
                  </>
                )}
              </React.Fragment>
            ))}

            {/* Ruta óptima */}
            {rutaActual && rutaActual.puntos.length > 1 && (
              <Polyline
                coordinates={rutaActual.puntos.map(punto => ({
                  latitude: punto.lat,
                  longitude: punto.lng
                }))}
                strokeColor="#3B82F6"
                strokeWidth={4}
                lineDashPattern={[5, 5]}
              />
            )}
          </MapView>

          {/* Información de ruta (overlay) */}
          {rutaActual && entregaActiva && (
            <View style={twrnc`absolute top-4 left-4 right-4`}>
              <View style={twrnc`bg-white rounded-lg p-3 shadow-lg border border-gray-200`}>
                <View style={twrnc`flex-row items-center justify-between`}>
                  <View>
                    <Text style={twrnc`text-sm font-semibold text-gray-800`}>
                      📍 Ruta hacia {entregaActiva.cliente}
                    </Text>
                    <Text style={twrnc`text-xs text-gray-600 mt-1`}>
                      🛣️ Distancia: {rutaActual.distanciaTotal.toFixed(1)}m | 
                      ⏱️ Tiempo est.: {rutaActual.tiempoEstimado} min
                    </Text>
                  </View>
                  <View style={[
                    twrnc`px-2 py-1 rounded-full`,
                    { backgroundColor: getColorEstado(entregaActiva.estado) }
                  ]}>
                    <Text style={twrnc`text-white text-xs font-medium`}>
                      {getTextoEstado(entregaActiva.estado)}
                    </Text>
                  </View>
                </View>
                
                {entregaActiva.estado === 'EN_ENTREGA' && (
                  <View style={twrnc`mt-2 pt-2 border-t border-gray-200`}>
                    <Text style={twrnc`text-green-700 text-sm font-medium`}>
                      🎯 ¡Listo para realizar entrega!
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Panel de entregas */}
        <View style={twrnc`h-48 bg-gray-50`}>
          <View style={twrnc`px-4 py-3 border-b border-gray-200 bg-white`}>
            <View style={twrnc`flex-row items-center justify-between`}>
              <Text style={twrnc`text-lg font-semibold text-gray-800`}>
                📋 Entregas ({entregas.length})
              </Text>
              <TouchableOpacity
                onPress={() => simulationService.reiniciarTodasLasEntregas()}
                style={twrnc`bg-gray-500 px-3 py-1 rounded-lg`}
                disabled={simulacionActiva}
              >
                <Text style={twrnc`text-white text-xs font-medium`}>
                  🔄 Reiniciar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={twrnc`flex-1 px-4`} showsVerticalScrollIndicator={false}>
            {entregas.map((entrega) => (
              <View
                key={entrega.id}
                style={[
                  twrnc`bg-white rounded-lg p-4 mb-3 mt-3 border border-gray-200`,
                  entregaActiva?.id === entrega.id && twrnc`border-blue-500 shadow-md`
                ]}
              >
                <View style={twrnc`flex-row items-center justify-between mb-2`}>
                  <View style={twrnc`flex-1 mr-3`}>
                    <Text style={twrnc`font-semibold text-gray-800 text-base`}>
                      {entrega.cliente}
                    </Text>
                    <Text style={twrnc`text-gray-600 text-sm mt-1`}>
                      📍 {entrega.direccion}
                    </Text>
                  </View>
                  <View
                    style={[
                      twrnc`px-3 py-1 rounded-full`,
                      { backgroundColor: getColorEstado(entrega.estado) }
                    ]}
                  >
                    <Text style={twrnc`text-white text-xs font-medium`}>
                      {getTextoEstado(entrega.estado)}
                    </Text>
                  </View>
                </View>

                <View style={twrnc`flex-row items-center justify-between mb-3`}>
                  <Text style={twrnc`text-gray-600 text-xs`}>
                    📦 {entrega.articulos} art. | ⚖️ {entrega.peso} kg | 📄 {entrega.folio}
                  </Text>
                </View>

                {entregaActiva?.id === entrega.id && (
                  <View style={twrnc`bg-blue-50 p-2 rounded mb-3`}>
                    <Text style={twrnc`text-blue-800 text-sm`}>
                      📏 Distancia: {entrega.distanciaRestante.toFixed(0)}m
                    </Text>
                    {entrega.tiempoEstimado > 0 && (
                      <Text style={twrnc`text-blue-800 text-sm`}>
                        ⏱️ Tiempo estimado: {entrega.tiempoEstimado} min
                      </Text>
                    )}
                  </View>
                )}

                <View style={twrnc`flex-row gap-2`}>
                  {entregaActiva?.id === entrega.id ? (
                    <>
                      {entrega.estado === 'EN_ENTREGA' ? (
                        <>
                          <TouchableOpacity
                            style={twrnc`flex-1 bg-green-600 py-2 px-3 rounded`}
                            onPress={navegarAFormularioEntrega}
                          >
                            <Text style={twrnc`text-white text-center font-medium text-sm`}>
                              ✅ Realizar Entrega
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={twrnc`flex-1 bg-blue-600 py-2 px-3 rounded`}
                            onPress={completarEntrega}
                          >
                            <Text style={twrnc`text-white text-center font-medium text-sm`}>
                              🏁 Completar
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          style={twrnc`flex-1 bg-red-500 py-2 px-3 rounded`}
                          onPress={pararSimulacion}
                        >
                          <Text style={twrnc`text-white text-center font-medium text-sm`}>
                            🛑 Detener Simulación
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[
                        twrnc`flex-1 py-2 px-3 rounded`,
                        entrega.estado === 'COMPLETADA'
                          ? twrnc`bg-gray-400`
                          : simulacionActiva
                          ? twrnc`bg-gray-300`
                          : twrnc`bg-blue-500`
                      ]}
                      onPress={() => iniciarSimulacion(entrega.id)}
                      disabled={
                        entrega.estado === 'COMPLETADA' || 
                        simulacionActiva
                      }
                    >
                      <Text style={twrnc`text-white text-center font-medium text-sm`}>
                        {entrega.estado === 'COMPLETADA'
                          ? '✓ Completada'
                          : simulacionActiva
                          ? '⏳ Esperando...'
                          : '🚚 Iniciar Simulación'
                        }
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};