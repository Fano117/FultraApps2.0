import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import twrnc from 'twrnc';
import {
  testMobileApiTransformation,
  testLegacyApiTransformation,
  compareApiServices,
  validateDataStructure,
} from '../services/testApiTransformation';
import { ClienteEntregaDTO } from '../models';

export const TestApiTransformationScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [lastTest, setLastTest] = useState<string>('');

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true);
    setLastTest(testName);
    setResults(null);

    try {
      console.log(`\n🚀 Ejecutando: ${testName}\n`);
      const result = await testFunction();
      setResults(result);
      
      if (result.success) {
        Alert.alert('✅ Test Exitoso', `${testName} completado correctamente`);
      } else {
        Alert.alert('❌ Test Fallido', `Error en ${testName}`);
      }
    } catch (error) {
      console.error(`Error en ${testName}:`, error);
      Alert.alert('❌ Error', `Error ejecutando ${testName}: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const TestButton: React.FC<{
    title: string;
    onPress: () => void;
    color: string;
  }> = ({ title, onPress, color }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={twrnc`bg-${color}-600 p-4 rounded-lg mb-3 ${loading ? 'opacity-50' : ''}`}
    >
      <Text style={twrnc`text-white font-semibold text-center`}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={twrnc`flex-1 bg-gray-50`}>
      <ScrollView style={twrnc`flex-1 px-4 py-6`}>
        <View style={twrnc`mb-6`}>
          <Text style={twrnc`text-2xl font-bold text-gray-800 mb-2`}>
            🧪 Test API Transformation
          </Text>
          <Text style={twrnc`text-gray-600 mb-4`}>
            Prueba la transformación de datos del backend a ClienteEntregaDTO
          </Text>
        </View>

        {loading && (
          <View style={twrnc`bg-white p-4 rounded-lg mb-4 flex-row items-center`}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={twrnc`ml-3 text-gray-600`}>
              Ejecutando: {lastTest}...
            </Text>
          </View>
        )}

        <View style={twrnc`mb-6`}>
          <Text style={twrnc`text-lg font-semibold text-gray-800 mb-3`}>
            Tests Individuales
          </Text>

          <TestButton
            title="🔧 Mobile API Service"
            color="blue"
            onPress={() => runTest('Mobile API Service', testMobileApiTransformation)}
          />

          <TestButton
            title="🔧 Legacy API Service"
            color="indigo"
            onPress={() => runTest('Legacy API Service', testLegacyApiTransformation)}
          />

          <TestButton
            title="🔍 Comparar Ambos Servicios"
            color="purple"
            onPress={() => runTest('Comparación', compareApiServices)}
          />
        </View>

        {results && (
          <View style={twrnc`bg-white p-4 rounded-lg mb-4`}>
            <Text style={twrnc`text-lg font-semibold text-gray-800 mb-3`}>
              📊 Resultados del Test: {lastTest}
            </Text>
            
            <View style={twrnc`mb-3`}>
              <Text style={twrnc`font-medium ${results.success ? 'text-green-600' : 'text-red-600'}`}>
                Estado: {results.success ? '✅ Exitoso' : '❌ Fallido'}
              </Text>
            </View>

            {results.success && results.data && (
              <View style={twrnc`mb-3`}>
                <Text style={twrnc`text-gray-700 mb-2`}>
                  📈 Total de clientes: {results.data.length}
                </Text>
                
                {results.data.length > 0 && (
                  <View style={twrnc`bg-gray-50 p-3 rounded`}>
                    <Text style={twrnc`font-medium text-gray-800 mb-1`}>
                      Primer cliente:
                    </Text>
                    <Text style={twrnc`text-sm text-gray-600`}>
                      • {results.data[0].cliente}
                    </Text>
                    <Text style={twrnc`text-sm text-gray-600`}>
                      • Cuenta: {results.data[0].cuentaCliente}
                    </Text>
                    <Text style={twrnc`text-sm text-gray-600`}>
                      • Entregas: {results.data[0].entregas?.length || 0}
                    </Text>
                    <Text style={twrnc`text-sm text-gray-600`}>
                      • Dirección: {results.data[0].direccionEntrega?.substring(0, 40)}...
                    </Text>
                  </View>
                )}
              </View>
            )}

            {results.error && (
              <View style={twrnc`bg-red-50 p-3 rounded`}>
                <Text style={twrnc`text-red-800 font-medium mb-1`}>Error:</Text>
                <Text style={twrnc`text-red-700 text-sm`}>
                  {results.error.toString()}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={twrnc`bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4`}>
          <Text style={twrnc`text-yellow-800 font-medium mb-2`}>
            💡 Información del Test
          </Text>
          <Text style={twrnc`text-yellow-700 text-sm mb-1`}>
            • Mobile API: /api/Mobile/entregas (nuevo)
          </Text>
          <Text style={twrnc`text-yellow-700 text-sm mb-1`}>
            • Legacy API: /api/Mobile/entregas (transformación)
          </Text>
          <Text style={twrnc`text-yellow-700 text-sm mb-1`}>
            • Valida estructura ClienteEntregaDTO
          </Text>
          <Text style={twrnc`text-yellow-700 text-sm`}>
            • Verifica transformación de datos paginados
          </Text>
        </View>

        <View style={twrnc`bg-blue-50 border border-blue-200 p-4 rounded-lg`}>
          <Text style={twrnc`text-blue-800 font-medium mb-2`}>
            📋 Checklist de Validación
          </Text>
          <Text style={twrnc`text-blue-700 text-sm mb-1`}>
            ✓ Response contiene items array
          </Text>
          <Text style={twrnc`text-blue-700 text-sm mb-1`}>
            ✓ Items se transforman a ClienteEntregaDTO
          </Text>
          <Text style={twrnc`text-blue-700 text-sm mb-1`}>
            ✓ Entregas agrupadas por cliente
          </Text>
          <Text style={twrnc`text-blue-700 text-sm mb-1`}>
            ✓ CargaCuentaCliente generado correctamente
          </Text>
          <Text style={twrnc`text-blue-700 text-sm`}>
            ✓ Coordenadas y direcciones mapeadas
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};