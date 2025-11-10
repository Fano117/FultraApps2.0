import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { CameraCapture, SignaturePad, LoadingSpinner } from '../components';
import { Entrega, ConfirmacionEntrega } from '../types';
import { deliveryApiService, locationService } from '../services';
import { colors, spacing } from '@/design-system';

type RootStackParamList = {
  ConfirmarEntrega: { entrega: Entrega };
};

type ConfirmarEntregaScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConfirmarEntrega'
>;
type ConfirmarEntregaScreenRouteProp = RouteProp<RootStackParamList, 'ConfirmarEntrega'>;

interface ConfirmarEntregaScreenProps {
  navigation: ConfirmarEntregaScreenNavigationProp;
  route: ConfirmarEntregaScreenRouteProp;
}

export const ConfirmarEntregaScreen: React.FC<ConfirmarEntregaScreenProps> = ({
  navigation,
  route,
}) => {
  const { entrega } = route.params;
  const [nombreReceptor, setNombreReceptor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [firmaUri, setFirmaUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCapturePhoto = (uri: string) => {
    setFotoUri(uri);
    setShowCamera(false);
  };

  const handleCaptureSignature = (signature: string) => {
    setFirmaUri(signature);
    setShowSignature(false);
  };

  const handleSubmit = async () => {
    if (!nombreReceptor.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingrese el nombre del receptor');
      return;
    }

    if (!fotoUri) {
      Alert.alert('Foto requerida', 'Por favor capture una foto de la entrega');
      return;
    }

    if (!firmaUri) {
      Alert.alert('Firma requerida', 'Por favor capture la firma del receptor');
      return;
    }

    try {
      setIsSubmitting(true);

      const location = await locationService.getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'No se pudo obtener la ubicación actual');
        return;
      }

      const confirmacion: ConfirmacionEntrega = {
        entregaId: entrega.id,
        fecha: new Date(),
        nombreReceptor: nombreReceptor.trim(),
        observaciones: observaciones.trim() || undefined,
        fotoUri,
        firmaUri,
        latitud: location.latitude,
        longitud: location.longitude,
      };

      const response = await deliveryApiService.confirmarEntrega(
        entrega.id,
        confirmacion,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (response.success) {
        Alert.alert(
          'Éxito',
          'La entrega ha sido confirmada correctamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'No se pudo confirmar la entrega');
      }
    } catch (error) {
      console.error('Error confirmando entrega:', error);
      Alert.alert('Error', 'Ocurrió un error al confirmar la entrega');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (showCamera) {
    return <CameraCapture onCapture={handleCapturePhoto} onCancel={() => setShowCamera(false)} />;
  }

  if (showSignature) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.signatureHeader}>
          <TouchableOpacity onPress={() => setShowSignature(false)}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
        <SignaturePad
          onSave={handleCaptureSignature}
          onClear={() => setFirmaUri(null)}
        />
      </SafeAreaView>
    );
  }

  if (isSubmitting) {
    return (
      <LoadingSpinner
        message={`Enviando entrega... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}`}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de entrega</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Cliente:</Text>
              <Text style={styles.infoValue}>{entrega.cliente.nombre}</Text>
              <Text style={styles.infoLabel}>Orden:</Text>
              <Text style={styles.infoValue}>#{entrega.numeroOrden}</Text>
              <Text style={styles.infoLabel}>Dirección:</Text>
              <Text style={styles.infoValue}>{entrega.direccion.calle}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos de confirmación</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del receptor *"
              value={nombreReceptor}
              onChangeText={setNombreReceptor}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observaciones (opcional)"
              value={observaciones}
              onChangeText={setObservaciones}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evidencia fotográfica</Text>
            {fotoUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: fotoUri }} style={styles.photo} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => setShowCamera(true)}
                >
                  <Text style={styles.retakeButtonText}>Retomar foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => setShowCamera(true)}
              >
                <Text style={styles.captureButtonText}>📷 Capturar foto</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Firma del receptor</Text>
            {firmaUri ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: firmaUri }} style={styles.signature} resizeMode="contain" />
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={() => setShowSignature(true)}
                >
                  <Text style={styles.retakeButtonText}>Capturar nueva firma</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.captureButton}
                onPress={() => setShowSignature(true)}
              >
                <Text style={styles.captureButtonText}>✍️ Capturar firma</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!nombreReceptor || !fotoUri || !firmaUri) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!nombreReceptor || !fotoUri || !firmaUri}
          >
            <Text style={styles.submitButtonText}>Confirmar entrega</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: spacing.md,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: spacing[3],
  },
  infoValue: {
    fontSize: 16,
    color: colors.neutral[900],
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing[3],
  },
  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },
  captureButton: {
    backgroundColor: colors.primary[500],
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  photoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
  },
  signature: {
    width: '100%',
    height: 150,
    backgroundColor: 'white',
  },
  retakeButton: {
    backgroundColor: colors.neutral[200],
    padding: spacing[3],
    alignItems: 'center',
  },
  retakeButtonText: {
    color: colors.neutral[700],
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.success.main,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signatureHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  cancelText: {
    color: colors.primary[500],
    fontSize: 16,
    fontWeight: '600',
  },
});
