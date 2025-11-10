import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput as RNTextInput,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Paths, Directory, File } from 'expo-file-system';
import { Card, Typography, Button, colors, spacing, borderRadius } from '@/design-system';
import { EntregasStackParamList } from '@/navigation/types';
import { TipoRegistro, ArticuloEntregaDTO, MotivoParcialidad, MotivoIncidencia } from '../models';
import { useAppDispatch, useAppSelector } from '@/shared/hooks';
import { syncService } from '../services/syncService';
import { loadLocalData } from '../store/entregasSlice';
import { entregasStorageService } from '../services/storageService';

type RouteParams = RouteProp<EntregasStackParamList, 'FormularioEntrega'>;
type NavigationProp = NativeStackNavigationProp<EntregasStackParamList, 'FormularioEntrega'>;

interface ArticuloEditado extends ArticuloEntregaDTO {
  cantidadEntregada: number;
}

interface ImagenEvidencia {
  uri: string;
  nombre: string;
  categoria: 'FISICA' | 'FACTURA' | 'INCIDENCIA' | 'PAGO';
}


const FormularioEntregaScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const dispatch = useAppDispatch();
  const { clienteCarga, entrega, tipoRegistro } = route.params;

  const [loading, setLoading] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);

  // Campos generales
  const [nombreRecibe, setNombreRecibe] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [ubicacion, setUbicacion] = useState<{ latitude: number; longitude: number } | null>(null);

  // Campos para parcial
  const [articulos, setArticulos] = useState<ArticuloEditado[]>(
    entrega.articulos.map((art) => ({ ...art, cantidadEntregada: art.cantidadProgramada }))
  );
  const [motivoParcial, setMotivoParcial] = useState<MotivoParcialidad | null>(null);

  // Campos para no entregado
  const [motivoNoEntregado, setMotivoNoEntregado] = useState<MotivoIncidencia | null>(null);

  // Imágenes
  const [imagenesEvidencia, setImagenesEvidencia] = useState<ImagenEvidencia[]>([]);
  const [imagenesFactura, setImagenesFactura] = useState<ImagenEvidencia[]>([]);
  const [imagenesIncidencia, setImagenesIncidencia] = useState<ImagenEvidencia[]>([]);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const [locationStatus, cameraStatus, mediaStatus] = await Promise.all([
        Location.requestForegroundPermissionsAsync(),
        ImagePicker.requestCameraPermissionsAsync(),
        ImagePicker.requestMediaLibraryPermissionsAsync(),
      ]);

      if (
        locationStatus.status !== 'granted' ||
        cameraStatus.status !== 'granted' ||
        mediaStatus.status !== 'granted'
      ) {
        Alert.alert(
          'Permisos necesarios',
          'Esta aplicación necesita permisos de ubicación, cámara y almacenamiento para funcionar correctamente.',
          [
            { text: 'Cancelar', onPress: () => navigation.goBack() },
            { text: 'Reintentar', onPress: requestPermissions },
          ]
        );
        return;
      }

      setHasPermissions(true);
      await obtenerUbicacion();
    } catch (error) {
      console.error('[FormularioEntrega] Error solicitando permisos:', error);
      Alert.alert('Error', 'No se pudieron solicitar los permisos necesarios');
    }
  };

  const obtenerUbicacion = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUbicacion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('[FormularioEntrega] Error obteniendo ubicación:', error);
      Alert.alert('Advertencia', 'No se pudo obtener la ubicación actual');
    }
  };

  const generarNombreArchivo = (
    categoria: 'FISICA' | 'FACTURA' | 'INCIDENCIA' | 'PAGO',
    secuencia: number
  ): string => {
    const fecha = new Date();
    const timestamp = fecha.getTime().toString();
    const microseconds = fecha.getMilliseconds().toString().padStart(3, '0');
    const folio = entrega.folio || 'SIN_FOLIO';
    const ordenVenta = entrega.ordenVenta || 'SIN_OV';

    let tipoTexto = '';
    switch (tipoRegistro) {
      case TipoRegistro.COMPLETO:
        tipoTexto = categoria === 'FISICA' ? 'COMPLETA_ENTREGA' : 'COMPLETA_REGISTRO';
        break;
      case TipoRegistro.PARCIAL:
        tipoTexto = categoria === 'FISICA' ? 'PARCIAL_ENTREGA' : 'PARCIAL_REGISTRO';
        break;
      case TipoRegistro.NO_ENTREGADO:
        tipoTexto = 'NO_ENTREGADO_REGISTRO';
        break;
    }

    const secuenciaStr = secuencia.toString().padStart(2, '0');
    return `${folio}${timestamp}${microseconds}_${ordenVenta}-${tipoTexto}_${categoria}_${secuenciaStr}.png`;
  };

  const tomarFoto = async (categoria: 'FISICA' | 'FACTURA' | 'INCIDENCIA' | 'PAGO') => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await guardarImagen(result.assets[0].uri, categoria);
      }
    } catch (error) {
      console.error('[FormularioEntrega] Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  const seleccionarImagen = async (categoria: 'FISICA' | 'FACTURA' | 'INCIDENCIA' | 'PAGO') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await guardarImagen(result.assets[0].uri, categoria);
      }
    } catch (error) {
      console.error('[FormularioEntrega] Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const guardarImagen = async (
    uri: string,
    categoria: 'FISICA' | 'FACTURA' | 'INCIDENCIA' | 'PAGO'
  ) => {
    try {
      // Crear directorio usando la nueva API de expo-file-system v19
      const directorioEvidencias = new Directory(Paths.document, 'FultraApps', 'Evidencias');

      if (!directorioEvidencias.exists) {
        directorioEvidencias.create({ intermediates: true, idempotent: true });
      }

      const getSecuencia = (cat: string) => {
        switch (cat) {
          case 'FISICA':
            return imagenesEvidencia.length + 1;
          case 'FACTURA':
            return imagenesFactura.length + 1;
          case 'INCIDENCIA':
            return imagenesIncidencia.length + 1;
          case 'PAGO':
            return 1;
          default:
            return 1;
        }
      };

      const secuencia = getSecuencia(categoria);
      const nombreArchivo = generarNombreArchivo(categoria, secuencia);
      const archivoDestino = new File(directorioEvidencias, nombreArchivo);

      // Copiar imagen desde la URI temporal
      const archivoOrigen = new File(uri);
      archivoOrigen.copy(archivoDestino);

      console.log('[FormularioEntrega] Imagen guardada:', archivoDestino.uri);

      const nuevaImagen: ImagenEvidencia = {
        uri: archivoDestino.uri,
        nombre: nombreArchivo,
        categoria,
      };

      switch (categoria) {
        case 'FISICA':
          setImagenesEvidencia([...imagenesEvidencia, nuevaImagen]);
          break;
        case 'FACTURA':
          setImagenesFactura([...imagenesFactura, nuevaImagen]);
          break;
        case 'INCIDENCIA':
          setImagenesIncidencia([...imagenesIncidencia, nuevaImagen]);
          break;
      }
    } catch (error) {
      console.error('[FormularioEntrega] Error guardando imagen:', error);
      Alert.alert('Error', 'No se pudo guardar la imagen');
    }
  };

  const eliminarImagen = (
    categoria: 'FISICA' | 'FACTURA' | 'INCIDENCIA' | 'PAGO',
    index: number
  ) => {
    switch (categoria) {
      case 'FISICA':
        setImagenesEvidencia(imagenesEvidencia.filter((_, i) => i !== index));
        break;
      case 'FACTURA':
        setImagenesFactura(imagenesFactura.filter((_, i) => i !== index));
        break;
      case 'INCIDENCIA':
        setImagenesIncidencia(imagenesIncidencia.filter((_, i) => i !== index));
        break;
    }
  };

  const mostrarOpcionesImagen = (categoria: 'FISICA' | 'FACTURA' | 'INCIDENCIA' | 'PAGO') => {
    Alert.alert('Seleccionar imagen', 'Elige una opción', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tomar foto', onPress: () => tomarFoto(categoria) },
      { text: 'Seleccionar de galería', onPress: () => seleccionarImagen(categoria) },
    ]);
  };

  const actualizarCantidad = (index: number, cantidad: string) => {
    const nuevosArticulos = [...articulos];
    const cantidadNum = parseInt(cantidad) || 0;
    nuevosArticulos[index].cantidadEntregada = Math.min(
      cantidadNum,
      nuevosArticulos[index].cantidadProgramada
    );
    setArticulos(nuevosArticulos);
  };

  const validarFormulario = (): boolean => {
    if (!ubicacion) {
      Alert.alert('Error', 'No se ha obtenido la ubicación. Por favor espere...');
      return false;
    }

    switch (tipoRegistro) {
      case TipoRegistro.COMPLETO:
        if (!nombreRecibe.trim()) {
          Alert.alert('Error', 'Debe ingresar el nombre de quien recibe');
          return false;
        }
        if (imagenesEvidencia.length === 0) {
          Alert.alert('Error', 'Debe capturar al menos una evidencia física');
          return false;
        }
        if (imagenesFactura.length === 0) {
          Alert.alert('Error', 'Debe capturar al menos una foto de la factura');
          return false;
        }
        break;

      case TipoRegistro.PARCIAL:
        if (!nombreRecibe.trim()) {
          Alert.alert('Error', 'Debe ingresar el nombre de quien recibe');
          return false;
        }
        if (!motivoParcial) {
          Alert.alert('Error', 'Debe seleccionar un motivo de parcialidad');
          return false;
        }
        const totalEntregado = articulos.reduce((sum, art) => sum + art.cantidadEntregada, 0);
        if (totalEntregado === 0) {
          Alert.alert('Error', 'Debe entregar al menos un artículo');
          return false;
        }
        if (imagenesEvidencia.length === 0) {
          Alert.alert('Error', 'Debe capturar al menos una evidencia física');
          return false;
        }
        if (imagenesFactura.length === 0) {
          Alert.alert('Error', 'Debe capturar al menos una foto de la factura');
          return false;
        }
        break;

      case TipoRegistro.NO_ENTREGADO:
        if (!motivoNoEntregado) {
          Alert.alert('Error', 'Debe seleccionar un motivo de no entrega');
          return false;
        }
        if (imagenesIncidencia.length === 0) {
          Alert.alert('Error', 'Debe capturar al menos una evidencia de la incidencia');
          return false;
        }
        break;
    }

    return true;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    // VALIDACIÓN CRÍTICA: Verificar si el folio ya está en sincronización
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
      console.error('[FormularioEntrega] Error verificando entregas sync:', error);
      Alert.alert('Error', 'No se pudo verificar el estado de sincronización');
      return;
    }

    setLoading(true);
    try {
      const articulosData =
        tipoRegistro === TipoRegistro.NO_ENTREGADO
          ? articulos.map((art) => ({
              id: art.id,
              cantidadProgramada: art.cantidadProgramada,
              cantidadEntregada: 0,
            }))
          : articulos.map((art) => ({
              id: art.id,
              cantidadProgramada: art.cantidadProgramada,
              cantidadEntregada: art.cantidadEntregada,
            }));

      const entregaData = {
        id: `${entrega.ordenVenta}-${entrega.folio}-${Date.now()}`,
        estado: 'PENDIENTE_ENVIO' as any,
        intentosEnvio: 0,
        clienteCarga,
        ordenVenta: entrega.ordenVenta,
        folio: entrega.folio,
        tipoEntrega: tipoRegistro,
        nombreQuienEntrega: nombreRecibe || undefined,
        comentarios: comentarios || undefined,
        razonIncidencia:
          tipoRegistro === TipoRegistro.NO_ENTREGADO
            ? motivoNoEntregado
            : tipoRegistro === TipoRegistro.PARCIAL
            ? motivoParcial
            : undefined,
        latitud: ubicacion?.latitude.toString() || '0',
        longitud: ubicacion?.longitude.toString() || '0',
        fechaCaptura: new Date(),
        enviadoServer: false,
        articulos: articulosData,
        imagenesEvidencia: imagenesEvidencia.map((img) => ({ nombre: img.nombre, enviado: false })),
        imagenesFacturas: imagenesFactura.map((img) => ({ nombre: img.nombre, enviado: false })),
        imagenesIncidencia: imagenesIncidencia.map((img) => ({ nombre: img.nombre, enviado: false })),
      };

      const result = await syncService.enviarEntregaDirecto(entregaData as any);

      // Actualizar Redux con los datos locales (incluye entregasSync y clientes actualizados)
      await dispatch(loadLocalData());

      if (result.success) {
        Alert.alert('Éxito', 'La entrega se registró correctamente', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'ClientesEntregas' }],
              });
            },
          },
        ]);
      } else {
        Alert.alert(
          'Guardado localmente',
          result.mensaje || 'La entrega se guardó localmente y se sincronizará cuando haya conexión',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'ClientesEntregas' }],
                });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('[FormularioEntrega] Error guardando:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar la entrega');
    } finally {
      setLoading(false);
    }
  };

  const formatImageUri = (uri: string): string => {
    // Asegurarse de que la URI tenga el prefijo file:// para React Native
    if (uri.startsWith('file://')) {
      return uri;
    }
    if (uri.startsWith('/')) {
      return `file://${uri}`;
    }
    return uri;
  };

  const renderImagenGallery = (
    imagenes: ImagenEvidencia[],
    categoria: 'FISICA' | 'FACTURA' | 'INCIDENCIA' | 'PAGO',
    titulo: string,
    requerida: boolean
  ) => (
    <Card variant="outline" padding="medium" style={styles.section}>
      <View style={styles.sectionHeader}>
        <Typography variant="subtitle1">{titulo}</Typography>
        {requerida && (
          <Typography variant="caption" style={{ color: colors.error[500] }}>
            * Requerida
          </Typography>
        )}
      </View>

      <View style={styles.imagenesContainer}>
        {imagenes.map((imagen, index) => (
          <View key={`${imagen.nombre}-${index}`} style={styles.imagenWrapper}>
            <Image
              source={{ uri: formatImageUri(imagen.uri) }}
              style={styles.imagenPreview}
              onError={(error) => {
                console.error('[FormularioEntrega] Error cargando imagen:', imagen.uri, error.nativeEvent.error);
              }}
            />
            <TouchableOpacity
              style={styles.eliminarButton}
              onPress={() => eliminarImagen(categoria, index)}
            >
              <Ionicons name="close-circle" size={24} color={colors.error[500]} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.agregarImagen}
          onPress={() => mostrarOpcionesImagen(categoria)}
        >
          <Ionicons name="camera-outline" size={32} color={colors.primary[600]} />
          <Typography variant="caption" color="secondary" align="center">
            Agregar
          </Typography>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (!hasPermissions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permisosContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.neutral[400]} />
          <Typography variant="h6" align="center" style={{ marginTop: spacing[4] }}>
            Solicitando permisos...
          </Typography>
          <Typography variant="body2" color="secondary" align="center">
            Esta aplicación necesita acceso a la cámara, ubicación y almacenamiento
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Typography variant="h6">
            {tipoRegistro === TipoRegistro.COMPLETO
              ? 'Entrega Completa'
              : tipoRegistro === TipoRegistro.PARCIAL
              ? 'Entrega Parcial'
              : 'No Entregado'}
          </Typography>
          <Typography variant="caption" color="secondary">
            {entrega.ordenVenta} - {entrega.folio}
          </Typography>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {tipoRegistro !== TipoRegistro.NO_ENTREGADO && (
          <Card variant="outline" padding="medium" style={styles.section}>
            <Typography variant="subtitle1" style={styles.sectionTitle}>
              Información de Recepción
            </Typography>
            <Typography variant="caption" color="secondary" style={{ marginBottom: spacing[2] }}>
              Nombre de quien recibe *
            </Typography>
            <RNTextInput
              style={styles.input}
              value={nombreRecibe}
              onChangeText={setNombreRecibe}
              placeholder="Nombre completo"
              placeholderTextColor={colors.text.tertiary}
            />
          </Card>
        )}

        {tipoRegistro === TipoRegistro.PARCIAL && (
          <>
            <Card variant="outline" padding="medium" style={styles.section}>
              <Typography variant="subtitle1" style={styles.sectionTitle}>
                Motivo de Parcialidad *
              </Typography>
              {Object.values(MotivoParcialidad).map((motivo) => (
                <TouchableOpacity
                  key={motivo}
                  style={[
                    styles.radioOption,
                    motivoParcial === motivo && styles.radioOptionSelected,
                  ]}
                  onPress={() => setMotivoParcial(motivo)}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      motivoParcial === motivo && styles.radioCircleSelected,
                    ]}
                  >
                    {motivoParcial === motivo && <View style={styles.radioCircleInner} />}
                  </View>
                  <Typography variant="body2">{motivo}</Typography>
                </TouchableOpacity>
              ))}
            </Card>

            <Card variant="outline" padding="medium" style={styles.section}>
              <Typography variant="subtitle1" style={styles.sectionTitle}>
                Cantidades Entregadas
              </Typography>
              {articulos.map((articulo, index) => (
                <View key={articulo.id} style={styles.articuloRow}>
                  <View style={styles.articuloInfo}>
                    <Typography variant="subtitle2">{articulo.producto}</Typography>
                    <Typography variant="caption" color="secondary">
                      Programado: {articulo.cantidadProgramada} {articulo.unidadMedida}
                    </Typography>
                  </View>
                  <RNTextInput
                    style={styles.cantidadInput}
                    value={articulo.cantidadEntregada.toString()}
                    onChangeText={(text) => actualizarCantidad(index, text)}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
              ))}
            </Card>
          </>
        )}

        {tipoRegistro === TipoRegistro.NO_ENTREGADO && (
          <Card variant="outline" padding="medium" style={styles.section}>
            <Typography variant="subtitle1" style={styles.sectionTitle}>
              Motivo de No Entrega *
            </Typography>
            {Object.values(MotivoIncidencia).map((motivo) => (
              <TouchableOpacity
                key={motivo}
                style={[
                  styles.radioOption,
                  motivoNoEntregado === motivo && styles.radioOptionSelected,
                ]}
                onPress={() => setMotivoNoEntregado(motivo)}
              >
                <View
                  style={[
                    styles.radioCircle,
                    motivoNoEntregado === motivo && styles.radioCircleSelected,
                  ]}
                >
                  {motivoNoEntregado === motivo && <View style={styles.radioCircleInner} />}
                </View>
                <Typography variant="body2">{motivo}</Typography>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {tipoRegistro !== TipoRegistro.NO_ENTREGADO && (
          <>
            {renderImagenGallery(imagenesEvidencia, 'FISICA', 'Evidencia Física', true)}
            {renderImagenGallery(imagenesFactura, 'FACTURA', 'Fotos de Factura', true)}
          </>
        )}

        {tipoRegistro === TipoRegistro.NO_ENTREGADO &&
          renderImagenGallery(imagenesIncidencia, 'INCIDENCIA', 'Evidencia de Incidencia', true)}

        <Card variant="outline" padding="medium" style={styles.section}>
          <Typography variant="subtitle1" style={styles.sectionTitle}>
            Comentarios Adicionales
          </Typography>
          <RNTextInput
            style={[styles.input, styles.textArea]}
            value={comentarios}
            onChangeText={setComentarios}
            placeholder="Agregar comentarios..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        <View style={styles.ubicacionInfo}>
          <Ionicons name="location" size={20} color={colors.success[600]} />
          <Typography variant="caption" color="secondary">
            {ubicacion
              ? `Ubicación: ${ubicacion.latitude.toFixed(6)}, ${ubicacion.longitude.toFixed(6)}`
              : 'Obteniendo ubicación...'}
          </Typography>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="gradient"
          size="large"
          fullWidth
          onPress={handleGuardar}
          loading={loading}
          disabled={loading || !ubicacion}
        >
          Guardar Entrega
        </Button>
      </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[20],
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    fontSize: 16,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    paddingTop: spacing[3],
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  radioOptionSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
    marginRight: spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary[600],
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[600],
  },
  articuloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
  },
  articuloInfo: {
    flex: 1,
  },
  cantidadInput: {
    width: 80,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing[2],
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
  },
  imagenesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  imagenWrapper: {
    position: 'relative',
  },
  imagenPreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[100],
  },
  eliminarButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  agregarImagen: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
  },
  ubicacionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.success[50],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  footer: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  permisosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
});

export default FormularioEntregaScreen;
