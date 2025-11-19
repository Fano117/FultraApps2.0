import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import twrnc from 'twrnc';
import MapView, { Marker } from 'react-native-maps';

import { simulationService, SimulacionEntrega } from '../services/simulationService';

const { width } = Dimensions.get('window');

interface FormularioEntrega {
  cliente: string;
  direccion: string;
  latitud: string;
  longitud: string;
  ordenVenta: string;
  folio: string;
  articulos: string;
  peso: string;
}

export const GestionEntregasScreen: React.FC = () => {
  const navigation = useNavigation();
  const [entregas, setEntregas] = useState<SimulacionEntrega[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoEntrega, setEditandoEntrega] = useState<SimulacionEntrega | null>(null);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [coordinadasTemporal, setCoordinadasTemporal] = useState({ lat: 25.686613, lng: -100.316113 });

  const [formulario, setFormulario] = useState<FormularioEntrega>({
    cliente: '',
    direccion: '',
    latitud: '25.686613',
    longitud: '-100.316113',
    ordenVenta: '',
    folio: '',
    articulos: '1',
    peso: '10.0'
  });

  useEffect(() => {
    cargarEntregas();
    
    // Suscribirse a cambios
    const subscription = simulationService.entregas.subscribe(setEntregas);
    return () => subscription.unsubscribe();
  }, []);

  const cargarEntregas = () => {
    const entregasActuales = simulationService.getEntregasSimulacion();
    setEntregas(entregasActuales);
  };

  const abrirModalCrear = () => {
    setEditandoEntrega(null);
    setFormulario({
      cliente: '',
      direccion: '',
      latitud: '25.686613',
      longitud: '-100.316113',
      ordenVenta: `OV-${Date.now()}`,
      folio: `EMB-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
      articulos: '1',
      peso: '10.0'
    });
    setModalVisible(true);
  };

  const abrirModalEditar = (entrega: SimulacionEntrega) => {
    if (entrega.estado !== 'PENDIENTE' && entrega.estado !== 'COMPLETADA') {
      Alert.alert(
        'No se puede editar',
        'No se puede editar una entrega que está en simulación activa.'
      );
      return;
    }

    setEditandoEntrega(entrega);
    setFormulario({
      cliente: entrega.cliente,
      direccion: entrega.direccion,
      latitud: entrega.latitud.toString(),
      longitud: entrega.longitud.toString(),
      ordenVenta: entrega.ordenVenta,
      folio: entrega.folio,
      articulos: entrega.articulos.toString(),
      peso: entrega.peso.toString()
    });
    setModalVisible(true);
  };

  const guardarEntrega = async () => {
    // Validaciones
    if (!formulario.cliente.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido');
      return;
    }
    if (!formulario.direccion.trim()) {
      Alert.alert('Error', 'La dirección es requerida');
      return;
    }
    if (!formulario.ordenVenta.trim()) {
      Alert.alert('Error', 'La orden de venta es requerida');
      return;
    }
    if (!formulario.folio.trim()) {
      Alert.alert('Error', 'El folio es requerido');
      return;
    }

    const latitud = parseFloat(formulario.latitud);
    const longitud = parseFloat(formulario.longitud);
    if (isNaN(latitud) || isNaN(longitud)) {
      Alert.alert('Error', 'Las coordenadas deben ser números válidos');
      return;
    }

    const articulos = parseInt(formulario.articulos);
    const peso = parseFloat(formulario.peso);
    if (isNaN(articulos) || articulos <= 0) {
      Alert.alert('Error', 'El número de artículos debe ser mayor a 0');
      return;
    }
    if (isNaN(peso) || peso <= 0) {
      Alert.alert('Error', 'El peso debe ser mayor a 0');
      return;
    }

    try {
      const entregaData = {
        cliente: formulario.cliente.trim(),
        direccion: formulario.direccion.trim(),
        latitud,
        longitud,
        ordenVenta: formulario.ordenVenta.trim(),
        folio: formulario.folio.trim(),
        articulos,
        peso
      };

      if (editandoEntrega) {
        await simulationService.editarEntrega(editandoEntrega.id, entregaData);
        Alert.alert('✅ Éxito', 'Entrega actualizada correctamente');
      } else {
        await simulationService.crearEntrega(entregaData);
        Alert.alert('✅ Éxito', 'Nueva entrega creada correctamente');
      }

      setModalVisible(false);
      cargarEntregas();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar la entrega');
    }
  };

  const eliminarEntrega = (entrega: SimulacionEntrega) => {
    Alert.alert(
      '🗑️ Eliminar Entrega',
      `¿Está seguro de eliminar la entrega de "${entrega.cliente}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await simulationService.eliminarEntrega(entrega.id);
              Alert.alert('✅ Eliminada', 'Entrega eliminada correctamente');
              cargarEntregas();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error al eliminar la entrega');
            }
          }
        }
      ]
    );
  };

  const generarEntregaAleatoria = async () => {
    try {
      await simulationService.generarEntregaAleatoria();
      Alert.alert('✅ Generada', 'Nueva entrega aleatoria creada');
      cargarEntregas();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al generar entrega');
    }
  };

  const reiniciarTodas = () => {
    Alert.alert(
      '🔄 Reiniciar Entregas',
      'Esto reiniciará todas las entregas a estado PENDIENTE.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          onPress: async () => {
            await simulationService.reiniciarTodasLasEntregas();
            Alert.alert('✅ Reiniciado', 'Todas las entregas han sido reiniciadas');
            cargarEntregas();
          }
        }
      ]
    );
  };

  const seleccionarEnMapa = () => {
    setCoordinadasTemporal({
      lat: parseFloat(formulario.latitud) || 25.686613,
      lng: parseFloat(formulario.longitud) || -100.316113
    });
    setMostrarMapa(true);
  };

  const confirmarCoordenadas = () => {
    setFormulario(prev => ({
      ...prev,
      latitud: coordinadasTemporal.lat.toString(),
      longitud: coordinadasTemporal.lng.toString()
    }));
    setMostrarMapa(false);
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

  const actualizarFormulario = (campo: keyof FormularioEntrega, valor: string) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
  };

  return (
    <SafeAreaView style={twrnc`flex-1 bg-gray-50`}>
      {/* Header */}
      <View style={twrnc`px-4 py-3 bg-blue-700 flex-row items-center justify-between`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={twrnc`mr-3`}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={twrnc`text-white text-lg font-bold flex-1`}>
          ⚙️ Gestión de Entregas
        </Text>
        
        <TouchableOpacity
          onPress={abrirModalCrear}
          style={twrnc`bg-blue-600 px-3 py-2 rounded-lg`}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Acciones rápidas */}
      <View style={twrnc`px-4 py-3 bg-white border-b border-gray-200`}>
        <View style={twrnc`flex-row gap-3`}>
          <TouchableOpacity
            onPress={generarEntregaAleatoria}
            style={twrnc`flex-1 bg-green-500 py-2 px-3 rounded-lg`}
          >
            <Text style={twrnc`text-white text-center font-medium text-sm`}>
              🎲 Generar Aleatoria
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={reiniciarTodas}
            style={twrnc`flex-1 bg-orange-500 py-2 px-3 rounded-lg`}
          >
            <Text style={twrnc`text-white text-center font-medium text-sm`}>
              🔄 Reiniciar Todas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de entregas */}
      <View style={twrnc`flex-1`}>
        <View style={twrnc`px-4 py-3 bg-white`}>
          <Text style={twrnc`text-lg font-semibold text-gray-800`}>
            📋 Entregas ({entregas.length})
          </Text>
        </View>

        <ScrollView style={twrnc`flex-1 px-4`} showsVerticalScrollIndicator={false}>
          {entregas.length === 0 ? (
            <View style={twrnc`py-8 items-center`}>
              <Text style={twrnc`text-gray-500 text-center`}>
                No hay entregas registradas.{'\n'}
                Crea una nueva o genera una aleatoria.
              </Text>
            </View>
          ) : (
            entregas.map((entrega) => (
              <View
                key={entrega.id}
                style={twrnc`bg-white rounded-lg p-4 mb-3 mt-3 border border-gray-200 shadow-sm`}
              >
                {/* Header de la entrega */}
                <View style={twrnc`flex-row items-center justify-between mb-3`}>
                  <View style={twrnc`flex-1 mr-3`}>
                    <Text style={twrnc`font-bold text-gray-800 text-base`}>
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

                {/* Detalles de la entrega */}
                <View style={twrnc`bg-gray-50 p-3 rounded-lg mb-3`}>
                  <View style={twrnc`flex-row justify-between mb-2`}>
                    <Text style={twrnc`text-gray-600 text-sm`}>📄 OV: {entrega.ordenVenta}</Text>
                    <Text style={twrnc`text-gray-600 text-sm`}>🏷️ Folio: {entrega.folio}</Text>
                  </View>
                  
                  <View style={twrnc`flex-row justify-between mb-2`}>
                    <Text style={twrnc`text-gray-600 text-sm`}>📦 Artículos: {entrega.articulos}</Text>
                    <Text style={twrnc`text-gray-600 text-sm`}>⚖️ Peso: {entrega.peso} kg</Text>
                  </View>
                  
                  <Text style={twrnc`text-gray-600 text-xs`}>
                    🗺️ {entrega.latitud.toFixed(6)}, {entrega.longitud.toFixed(6)}
                  </Text>
                </View>

                {/* Acciones */}
                <View style={twrnc`flex-row gap-2`}>
                  <TouchableOpacity
                    onPress={() => abrirModalEditar(entrega)}
                    style={twrnc`flex-1 bg-blue-500 py-2 px-3 rounded`}
                    disabled={entrega.estado === 'EN_RUTA' || entrega.estado === 'LLEGANDO' || entrega.estado === 'EN_ENTREGA'}
                  >
                    <Text style={twrnc`text-white text-center font-medium text-sm`}>
                      ✏️ Editar
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => eliminarEntrega(entrega)}
                    style={twrnc`flex-1 bg-red-500 py-2 px-3 rounded`}
                    disabled={entrega.estado === 'EN_RUTA' || entrega.estado === 'LLEGANDO' || entrega.estado === 'EN_ENTREGA'}
                  >
                    <Text style={twrnc`text-white text-center font-medium text-sm`}>
                      🗑️ Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Modal de creación/edición */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={twrnc`flex-1 bg-white`}>
          {/* Header del modal */}
          <View style={twrnc`px-4 py-3 bg-blue-700 flex-row items-center justify-between`}>
            <Text style={twrnc`text-white text-lg font-bold`}>
              {editandoEntrega ? '✏️ Editar Entrega' : '➕ Nueva Entrega'}
            </Text>
            
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={twrnc`p-1`}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={twrnc`flex-1 px-4 py-6`} showsVerticalScrollIndicator={false}>
            {/* Información del cliente */}
            <View style={twrnc`mb-6`}>
              <Text style={twrnc`text-lg font-semibold text-gray-800 mb-3`}>
                👤 Información del Cliente
              </Text>
              
              <View style={twrnc`mb-4`}>
                <Text style={twrnc`text-sm font-medium text-gray-700 mb-2`}>Cliente *</Text>
                <TextInput
                  style={twrnc`border border-gray-300 rounded-lg px-3 py-2 text-gray-800`}
                  value={formulario.cliente}
                  onChangeText={(text) => actualizarFormulario('cliente', text)}
                  placeholder="Nombre del cliente"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={twrnc`mb-4`}>
                <Text style={twrnc`text-sm font-medium text-gray-700 mb-2`}>Dirección *</Text>
                <TextInput
                  style={twrnc`border border-gray-300 rounded-lg px-3 py-2 text-gray-800`}
                  value={formulario.direccion}
                  onChangeText={(text) => actualizarFormulario('direccion', text)}
                  placeholder="Dirección completa"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
            </View>

            {/* Coordenadas */}
            <View style={twrnc`mb-6`}>
              <View style={twrnc`flex-row items-center justify-between mb-3`}>
                <Text style={twrnc`text-lg font-semibold text-gray-800`}>
                  🗺️ Ubicación
                </Text>
                <TouchableOpacity
                  onPress={seleccionarEnMapa}
                  style={twrnc`bg-blue-500 px-3 py-1 rounded-lg`}
                >
                  <Text style={twrnc`text-white text-sm font-medium`}>
                    📍 Seleccionar en Mapa
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={twrnc`flex-row gap-3`}>
                <View style={twrnc`flex-1`}>
                  <Text style={twrnc`text-sm font-medium text-gray-700 mb-2`}>Latitud *</Text>
                  <TextInput
                    style={twrnc`border border-gray-300 rounded-lg px-3 py-2 text-gray-800`}
                    value={formulario.latitud}
                    onChangeText={(text) => actualizarFormulario('latitud', text)}
                    placeholder="25.686613"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>

                <View style={twrnc`flex-1`}>
                  <Text style={twrnc`text-sm font-medium text-gray-700 mb-2`}>Longitud *</Text>
                  <TextInput
                    style={twrnc`border border-gray-300 rounded-lg px-3 py-2 text-gray-800`}
                    value={formulario.longitud}
                    onChangeText={(text) => actualizarFormulario('longitud', text)}
                    placeholder="-100.316113"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Información de la orden */}
            <View style={twrnc`mb-6`}>
              <Text style={twrnc`text-lg font-semibold text-gray-800 mb-3`}>
                📄 Información de la Orden
              </Text>

              <View style={twrnc`mb-4`}>
                <Text style={twrnc`text-sm font-medium text-gray-700 mb-2`}>Orden de Venta *</Text>
                <TextInput
                  style={twrnc`border border-gray-300 rounded-lg px-3 py-2 text-gray-800`}
                  value={formulario.ordenVenta}
                  onChangeText={(text) => actualizarFormulario('ordenVenta', text)}
                  placeholder="OV-2025-001"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={twrnc`mb-4`}>
                <Text style={twrnc`text-sm font-medium text-gray-700 mb-2`}>Folio *</Text>
                <TextInput
                  style={twrnc`border border-gray-300 rounded-lg px-3 py-2 text-gray-800`}
                  value={formulario.folio}
                  onChangeText={(text) => actualizarFormulario('folio', text)}
                  placeholder="EMB-0001"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={twrnc`flex-row gap-3`}>
                <View style={twrnc`flex-1`}>
                  <Text style={twrnc`text-sm font-medium text-gray-700 mb-2`}>Artículos *</Text>
                  <TextInput
                    style={twrnc`border border-gray-300 rounded-lg px-3 py-2 text-gray-800`}
                    value={formulario.articulos}
                    onChangeText={(text) => actualizarFormulario('articulos', text)}
                    placeholder="1"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>

                <View style={twrnc`flex-1`}>
                  <Text style={twrnc`text-sm font-medium text-gray-700 mb-2`}>Peso (kg) *</Text>
                  <TextInput
                    style={twrnc`border border-gray-300 rounded-lg px-3 py-2 text-gray-800`}
                    value={formulario.peso}
                    onChangeText={(text) => actualizarFormulario('peso', text)}
                    placeholder="10.0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={twrnc`px-4 py-3 bg-white border-t border-gray-200`}>
            <View style={twrnc`flex-row gap-3`}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={twrnc`flex-1 bg-gray-500 py-3 px-4 rounded-lg`}
              >
                <Text style={twrnc`text-white text-center font-medium`}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={guardarEntrega}
                style={twrnc`flex-1 bg-blue-600 py-3 px-4 rounded-lg`}
              >
                <Text style={twrnc`text-white text-center font-medium`}>
                  {editandoEntrega ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de selección de mapa */}
      <Modal
        visible={mostrarMapa}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setMostrarMapa(false)}
      >
        <SafeAreaView style={twrnc`flex-1 bg-white`}>
          <View style={twrnc`px-4 py-3 bg-blue-700 flex-row items-center justify-between`}>
            <Text style={twrnc`text-white text-lg font-bold`}>
              📍 Seleccionar Ubicación
            </Text>
            
            <TouchableOpacity
              onPress={() => setMostrarMapa(false)}
              style={twrnc`p-1`}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={twrnc`flex-1`}>
            <MapView
              style={twrnc`flex-1`}
              initialRegion={{
                latitude: coordinadasTemporal.lat,
                longitude: coordinadasTemporal.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                setCoordinadasTemporal({ lat: latitude, lng: longitude });
              }}
            >
              <Marker
                coordinate={{
                  latitude: coordinadasTemporal.lat,
                  longitude: coordinadasTemporal.lng,
                }}
                draggable
                onDragEnd={(event) => {
                  const { latitude, longitude } = event.nativeEvent.coordinate;
                  setCoordinadasTemporal({ lat: latitude, lng: longitude });
                }}
              >
                <View style={twrnc`bg-red-500 p-2 rounded-full border-2 border-white`}>
                  <Ionicons name="location" size={20} color="white" />
                </View>
              </Marker>
            </MapView>

            <View style={twrnc`absolute bottom-4 left-4 right-4`}>
              <View style={twrnc`bg-white p-3 rounded-lg shadow-lg border border-gray-200 mb-3`}>
                <Text style={twrnc`text-center text-gray-800 font-medium`}>
                  📍 {coordinadasTemporal.lat.toFixed(6)}, {coordinadasTemporal.lng.toFixed(6)}
                </Text>
                <Text style={twrnc`text-center text-gray-600 text-sm mt-1`}>
                  Toca el mapa o arrastra el marcador para ajustar la ubicación
                </Text>
              </View>

              <TouchableOpacity
                onPress={confirmarCoordenadas}
                style={twrnc`bg-blue-600 py-3 px-4 rounded-lg`}
              >
                <Text style={twrnc`text-white text-center font-medium`}>
                  ✅ Confirmar Ubicación
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};