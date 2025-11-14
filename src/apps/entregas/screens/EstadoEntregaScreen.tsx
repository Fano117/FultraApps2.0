import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Subscription } from 'rxjs';
import twrnc from 'twrnc';

import { geofencingService, DeliveryAuthorizationStatus } from '@/shared/services/geofencingService';
import { locationTrackingService, LocationUpdate } from '@/shared/services/locationTrackingService';
import { EntregasStackParamList } from '@/navigation/types';

type EstadoEntregaScreenRouteProp = RouteProp<EntregasStackParamList, 'EstadoEntrega'>;
type EstadoEntregaScreenNavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'EstadoEntrega'>;

export const EstadoEntregaScreen: React.FC = () => {
  const navigation = useNavigation<EstadoEntregaScreenNavigationProp>();
  const route = useRoute<EstadoEntregaScreenRouteProp>();
  
  // Estados
  const [currentLocation, setCurrentLocation] = useState<LocationUpdate | null>(null);
  const [authorizationStatus, setAuthorizationStatus] = useState<DeliveryAuthorizationStatus | null>(null);
  const [geofenceId] = useState<string>(route.params?.geofenceId || '');
  
  // Referencias para subscripciones
  const [locationSubscription, setLocationSubscription] = useState<Subscription | null>(null);
  const [authorizationSubscription, setAuthorizationSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (geofenceId) {
      initializeTracking();
    }
    
    return () => {
      cleanup();
    };
  }, [geofenceId]);

  const initializeTracking = () => {
    console.log('[ESTADO ENTREGA] 🚀 Iniciando tracking para geofence:', geofenceId);
    
    // Suscribirse a actualizaciones de ubicación
    const locationSub = locationTrackingService.location$.subscribe(
      (location) => {
        if (location) {
          setCurrentLocation(location);
        }
      }
    );
    setLocationSubscription(locationSub);

    // Suscribirse a actualizaciones de autorización
    const authSub = geofencingService.deliveryAuthorization$.subscribe(
      (authorization) => {
        if (authorization.geofenceId === geofenceId || !authorization.geofenceId) {
          setAuthorizationStatus(authorization);
          console.log('[ESTADO ENTREGA] 📍 Estado actualizado:', {
            autorizado: authorization.isAuthorized ? '✅' : '❌',
            distancia: authorization.distance.toFixed(1) + 'm',
            razon: authorization.reason
          });
        }
      }
    );
    setAuthorizationSubscription(authSub);
  };

  const cleanup = () => {
    console.log('[ESTADO ENTREGA] 🧹 Limpiando subscripciones...');
    
    if (locationSubscription) {
      locationSubscription.unsubscribe();
    }
    if (authorizationSubscription) {
      authorizationSubscription.unsubscribe();
    }
  };

  const getStatusColor = (): string => {
    if (!authorizationStatus) return '#6B7280';
    
    const distance = authorizationStatus.distance;
    if (distance <= 50) return '#10B981';
    if (distance <= 100) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusIcon = (): string => {
    if (!authorizationStatus) return 'location-outline';
    
    if (authorizationStatus.isAuthorized) return 'checkmark-circle-outline';
    
    const distance = authorizationStatus.distance;
    if (distance <= 100) return 'warning-outline';
    return 'close-circle-outline';
  };

  const getStatusMessage = (): string => {
    if (!authorizationStatus) return 'Verificando ubicación...';
    
    const distance = Math.round(authorizationStatus.distance);
    if (authorizationStatus.isAuthorized) {
      return `🎉 Listo para entregar (${distance}m)`;
    } else {
      return `📍 Faltan ${distance}m para llegar`;
    }
  };

  const procederAFormulario = () => {
    if (authorizationStatus?.isAuthorized) {
      navigation.goBack(); // Volver al formulario
    } else {
      Alert.alert(
        'Entrega No Autorizada',
        'Debe estar dentro del área de 50m para proceder con la entrega.',
        [{ text: 'OK' }]
      );
    }
  };

  const detenerTracking = () => {
    Alert.alert(
      'Detener Tracking',
      '¿Está seguro de detener el tracking de esta entrega?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Detener', 
          style: 'destructive',
          onPress: () => {
            cleanup();
            navigation.goBack();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={twrnc`flex-1 bg-gray-50`}>
      <StatusBar barStyle="light-content" backgroundColor={getStatusColor()} />
      
      {/* Header */}
      <View style={[twrnc`px-4 py-4`, { backgroundColor: getStatusColor() }]}>
        <View style={twrnc`flex-row items-center justify-between`}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={twrnc`mr-3`}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={twrnc`flex-1`}>
            <Text style={twrnc`text-white text-lg font-bold`}>
              📍 Estado de Entrega
            </Text>
            <Text style={twrnc`text-white text-opacity-90 text-sm mt-1`}>
              Tracking en tiempo real
            </Text>
          </View>

          <TouchableOpacity
            onPress={detenerTracking}
            style={twrnc`bg-red-600 bg-opacity-80 px-3 py-2 rounded-lg`}
          >
            <Ionicons name="stop" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido principal */}
      <View style={twrnc`flex-1 px-4 py-6`}>
        
        {/* Estado principal */}
        <View style={twrnc`bg-white rounded-xl p-6 mb-6 shadow-sm`}>
          <View style={twrnc`items-center mb-4`}>
            <View style={[
              twrnc`w-20 h-20 rounded-full items-center justify-center mb-4`,
              { backgroundColor: getStatusColor() + '20' }
            ]}>
              <Ionicons 
                name={getStatusIcon() as any} 
                size={40} 
                color={getStatusColor()} 
              />
            </View>
            
            <Text style={[twrnc`text-xl font-bold text-center mb-2`, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
            
            {authorizationStatus && (
              <Text style={twrnc`text-gray-600 text-center`}>
                {authorizationStatus.reason}
              </Text>
            )}
          </View>
        </View>

        {/* Detalles de ubicación */}
        <View style={twrnc`bg-white rounded-xl p-4 mb-6`}>
          <Text style={twrnc`text-lg font-semibold text-gray-800 mb-4`}>
            📊 Información de Ubicación
          </Text>

          {currentLocation && (
            <>
              <View style={twrnc`flex-row items-center justify-between mb-3 py-2 border-b border-gray-100`}>
                <Text style={twrnc`text-gray-600`}>📍 Coordenadas:</Text>
                <Text style={twrnc`text-gray-800 font-medium`}>
                  {currentLocation.coordinates.latitude.toFixed(6)}, {currentLocation.coordinates.longitude.toFixed(6)}
                </Text>
              </View>

              <View style={twrnc`flex-row items-center justify-between mb-3 py-2 border-b border-gray-100`}>
                <Text style={twrnc`text-gray-600`}>🎯 Precisión:</Text>
                <Text style={twrnc`text-gray-800 font-medium`}>
                  {currentLocation.accuracy?.toFixed(0) || 'N/A'} metros
                </Text>
              </View>

              <View style={twrnc`flex-row items-center justify-between mb-3 py-2 border-b border-gray-100`}>
                <Text style={twrnc`text-gray-600`}>🕐 Última actualización:</Text>
                <Text style={twrnc`text-gray-800 font-medium`}>
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </>
          )}

          {authorizationStatus && (
            <>
              <View style={twrnc`flex-row items-center justify-between mb-3 py-2 border-b border-gray-100`}>
                <Text style={twrnc`text-gray-600`}>📏 Distancia al destino:</Text>
                <Text style={twrnc`text-gray-800 font-medium`}>
                  {authorizationStatus.distance.toFixed(0)} metros
                </Text>
              </View>

              <View style={twrnc`flex-row items-center justify-between mb-3 py-2`}>
                <Text style={twrnc`text-gray-600`}>🎯 Radio requerido:</Text>
                <Text style={twrnc`text-gray-800 font-medium`}>
                  {authorizationStatus.requiredDistance} metros
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Botones de acción */}
        <View style={twrnc`mt-auto`}>
          <TouchableOpacity
            style={[
              twrnc`py-4 px-6 rounded-xl mb-3`,
              authorizationStatus?.isAuthorized 
                ? twrnc`bg-green-600` 
                : twrnc`bg-gray-400`
            ]}
            onPress={procederAFormulario}
            disabled={!authorizationStatus?.isAuthorized}
          >
            <View style={twrnc`flex-row items-center justify-center`}>
              <Ionicons 
                name={authorizationStatus?.isAuthorized ? "checkmark-circle" : "lock-closed"} 
                size={20} 
                color="white" 
              />
              <Text style={twrnc`text-white font-semibold text-lg ml-2`}>
                {authorizationStatus?.isAuthorized ? 'Proceder con Entrega' : 'Acércate al Destino'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={twrnc`py-3 px-6 bg-gray-200 rounded-xl`}
            onPress={() => navigation.goBack()}
          >
            <Text style={twrnc`text-gray-700 text-center font-medium`}>
              Volver
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};