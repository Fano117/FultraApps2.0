import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';
import {
  Button,
  Card,
  Input,
  Typography,
  Badge,
  colors,
  spacing,
  borderRadius,
} from '@/design-system';
import { useAppDispatch } from '@/shared/hooks';
import { saveEntregaLocal } from '../store/entregasSlice';
import { imageService, ImageEvidence, syncService } from '../services';
import { entregasStorageService } from '../services/storageService';
import {
  EntregaDTO,
  ArticuloEntregaDTO,
  TipoRegistro,
  EstadoSincronizacion,
  ImagenDTO,
  EntregaSync,
} from '../models';
import { EntregasStackParamList } from '@/navigation/types';

type RouteParams = RouteProp<EntregasStackParamList, 'EntregaDetail'>;

const EntregaDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const dispatch = useAppDispatch();
  const { clienteCarga, entrega } = route.params;

  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>(TipoRegistro.COMPLETO);
  const [articulos, setArticulos] = useState<ArticuloEntregaDTO[]>(entrega.articulos);
  const [nombreQuienEntrega, setNombreQuienEntrega] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [razonIncidencia, setRazonIncidencia] = useState('');
  const [imagenesEvidencia, setImagenesEvidencia] = useState<ImageEvidence[]>([]);
  const [imagenesFacturas, setImagenesFacturas] = useState<ImageEvidence[]>([]);
  const [imagenesIncidencia, setImagenesIncidencia] = useState<ImageEvidence[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    requestPermissions();
    getLocation();
  }, []);

  const requestPermissions = async () => {
    const hasPermissions = await imageService.requestPermissions();
    if (!hasPermissions) {
      Alert.alert(
        'Permisos necesarios',
        'Se requieren permisos de cámara y galería para continuar'
      );
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Se requiere permiso de ubicación para continuar');
    }
  };

  const getLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleCantidadChange = (index: number, cantidad: string) => {
    const newArticulos = [...articulos];
    const cantidadNum = parseInt(cantidad) || 0;
    newArticulos[index] = {
      ...newArticulos[index],
      cantidadEntregada: cantidadNum,
      restante: newArticulos[index].cantidadProgramada - cantidadNum,
    };
    setArticulos(newArticulos);
  };

  const handleAddImage = async (tipo: 'evidencia' | 'factura' | 'incidencia') => {
    const imagen = await imageService.showImageSourceSelector();
    if (imagen) {
      const rutaLocal = await imageService.guardarEvidenciaLocal(imagen);
      if (rutaLocal) {
        const imagenConRuta = { ...imagen, uri: rutaLocal };

        switch (tipo) {
          case 'evidencia':
            setImagenesEvidencia([...imagenesEvidencia, imagenConRuta]);
            break;
          case 'factura':
            setImagenesFacturas([...imagenesFacturas, imagenConRuta]);
            break;
          case 'incidencia':
            setImagenesIncidencia([...imagenesIncidencia, imagenConRuta]);
            break;
        }
      }
    }
  };

  const handleRemoveImage = (
    tipo: 'evidencia' | 'factura' | 'incidencia',
    index: number
  ) => {
    switch (tipo) {
      case 'evidencia':
        const newEvidencias = [...imagenesEvidencia];
        imageService.eliminarEvidenciaLocal(newEvidencias[index].uri);
        newEvidencias.splice(index, 1);
        setImagenesEvidencia(newEvidencias);
        break;
      case 'factura':
        const newFacturas = [...imagenesFacturas];
        imageService.eliminarEvidenciaLocal(newFacturas[index].uri);
        newFacturas.splice(index, 1);
        setImagenesFacturas(newFacturas);
        break;
      case 'incidencia':
        const newIncidencias = [...imagenesIncidencia];
        imageService.eliminarEvidenciaLocal(newIncidencias[index].uri);
        newIncidencias.splice(index, 1);
        setImagenesIncidencia(newIncidencias);
        break;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombreQuienEntrega.trim()) {
      newErrors.nombreQuienEntrega = 'El nombre de quien entrega es obligatorio';
    }

    if (tipoRegistro === TipoRegistro.NO_ENTREGADO && !razonIncidencia.trim()) {
      newErrors.razonIncidencia = 'Debe especificar la razón de no entrega';
    }

    if (tipoRegistro === TipoRegistro.NO_ENTREGADO && imagenesIncidencia.length === 0) {
      newErrors.imagenesIncidencia = 'Debe agregar al menos una imagen de evidencia';
    }

    if (tipoRegistro === TipoRegistro.COMPLETO && imagenesEvidencia.length === 0) {
      newErrors.imagenesEvidencia = 'Debe agregar al menos una imagen de evidencia';
    }

    if (tipoRegistro === TipoRegistro.PARCIAL) {
      const algunaEntregada = articulos.some((art) => art.cantidadEntregada > 0);
      if (!algunaEntregada) {
        newErrors.articulos = 'Debe entregar al menos un artículo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
      return;
    }

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
      console.error('[EntregaDetail] Error verificando entregas sync:', error);
      Alert.alert('Error', 'No se pudo verificar el estado de sincronización');
      return;
    }

    setSaving(true);

    try {
      const convertirImagenes = (imagenes: ImageEvidence[], categoria: string): ImagenDTO[] => {
        return imagenes.map((img, index) => ({
          nombre: imageService.generateImageName(
            entrega.folio,
            entrega.ordenVenta,
            entrega.tipoEntrega,
            categoria,
            index + 1
          ),
          enviado: false,
        }));
      };

      const entregaSync: EntregaSync = {
        id: `${entrega.ordenVenta}-${entrega.folio}-${Date.now()}`,
        ordenVenta: entrega.ordenVenta,
        folio: entrega.folio,
        tipoEntrega: entrega.tipoEntrega,
        razonIncidencia: tipoRegistro === TipoRegistro.NO_ENTREGADO ? razonIncidencia : undefined,
        imagenesIncidencia: convertirImagenes(imagenesIncidencia, 'incidencia'),
        imagenesFacturas: convertirImagenes(imagenesFacturas, 'factura'),
        imagenesEvidencia: convertirImagenes(imagenesEvidencia, 'evidencia'),
        comentarios: comentarios || undefined,
        nombreQuienEntrega,
        latitud: location.coords.latitude.toString(),
        longitud: location.coords.longitude.toString(),
        fechaCaptura: new Date(),
        enviadoServer: false,
        articulos: tipoRegistro === TipoRegistro.COMPLETO ? entrega.articulos : articulos,
        estado: EstadoSincronizacion.PENDIENTE_ENVIO,
        intentosEnvio: 0,
      };

      // ENVÍO DIRECTO SI HAY INTERNET
      const result = await syncService.enviarEntregaDirecto(entregaSync);

      if (result.success) {
        Alert.alert(
          'Éxito',
          'Entrega sincronizada exitosamente',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Si no hay internet o hubo error, se guarda localmente
        Alert.alert(
          'Guardado',
          result.mensaje || 'Entrega guardada. Se sincronizará automáticamente cuando haya conexión.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving entrega:', error);
      Alert.alert('Error', 'No se pudo guardar la entrega');
    } finally {
      setSaving(false);
    }
  };

  const renderImageGallery = (
    images: ImageEvidence[],
    tipo: 'evidencia' | 'factura' | 'incidencia',
    label: string,
    required: boolean = false
  ) => (
    <View style={styles.imageSection}>
      <View style={styles.imageSectionHeader}>
        <Typography variant="subtitle1">
          {label}
          {required && <Typography style={styles.required}> *</Typography>}
        </Typography>
        <Button
          variant="outline"
          size="small"
          leftIcon={<Ionicons name="camera" size={18} color={colors.primary[600]} />}
          onPress={() => handleAddImage(tipo)}
        >
          Agregar
        </Button>
      </View>

      {errors[`imagenes${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}`] && (
        <Typography variant="caption" style={styles.errorText}>
          {errors[`imagenes${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}`]}
        </Typography>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {images.map((imagen, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={{ uri: imageService.formatearRutaImagen(imagen.uri) }}
              style={styles.image}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => handleRemoveImage(tipo, index)}
            >
              <Ionicons name="close-circle" size={24} color={colors.error[500]} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card variant="elevated" padding="medium">
          <Typography variant="h6" style={styles.sectionTitle}>
            Información de Entrega
          </Typography>
          <View style={styles.infoRow}>
            <Typography variant="body2" color="secondary">
              Folio:
            </Typography>
            <Typography variant="subtitle2">{entrega.folio}</Typography>
          </View>
          <View style={styles.infoRow}>
            <Typography variant="body2" color="secondary">
              Orden de Venta:
            </Typography>
            <Typography variant="subtitle2">{entrega.ordenVenta}</Typography>
          </View>
          <View style={styles.infoRow}>
            <Typography variant="body2" color="secondary">
              Tipo:
            </Typography>
            <Badge variant="info" size="small">
              {entrega.tipoEntrega}
            </Badge>
          </View>
        </Card>

        <Card variant="elevated" padding="medium" style={styles.section}>
          <Typography variant="h6" style={styles.sectionTitle}>
            Tipo de Registro
          </Typography>
          <View style={styles.tipoRegistroButtons}>
            {[TipoRegistro.COMPLETO, TipoRegistro.PARCIAL, TipoRegistro.NO_ENTREGADO].map(
              (tipo) => (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => setTipoRegistro(tipo)}
                  style={[
                    styles.tipoButton,
                    tipoRegistro === tipo && styles.tipoButtonActive,
                  ]}
                >
                  <Typography
                    variant="body2"
                    color={tipoRegistro === tipo ? 'inverse' : 'primary'}
                  >
                    {tipo}
                  </Typography>
                </TouchableOpacity>
              )
            )}
          </View>
        </Card>

        {tipoRegistro === TipoRegistro.PARCIAL && (
          <Card variant="elevated" padding="medium" style={styles.section}>
            <Typography variant="h6" style={styles.sectionTitle}>
              Artículos
            </Typography>
            {articulos.map((articulo, index) => (
              <View key={articulo.id} style={styles.articuloCard}>
                <Typography variant="subtitle2">{articulo.producto}</Typography>
                <Typography variant="caption" color="secondary">
                  Programado: {articulo.cantidadProgramada} {articulo.unidadMedida}
                </Typography>
                <Input
                  label="Cantidad Entregada"
                  keyboardType="numeric"
                  value={articulo.cantidadEntregada.toString()}
                  onChangeText={(value) => handleCantidadChange(index, value)}
                  containerStyle={styles.cantidadInput}
                />
              </View>
            ))}
          </Card>
        )}

        {tipoRegistro === TipoRegistro.NO_ENTREGADO && (
          <Card variant="elevated" padding="medium" style={styles.section}>
            <Input
              label="Razón de No Entrega"
              multiline
              numberOfLines={3}
              value={razonIncidencia}
              onChangeText={setRazonIncidencia}
              error={errors.razonIncidencia}
              required
            />
          </Card>
        )}

        <Card variant="elevated" padding="medium" style={styles.section}>
          <Input
            label="Nombre de Quien Entrega"
            value={nombreQuienEntrega}
            onChangeText={setNombreQuienEntrega}
            error={errors.nombreQuienEntrega}
            required
          />
        </Card>

        <Card variant="elevated" padding="medium" style={styles.section}>
          <Input
            label="Comentarios"
            multiline
            numberOfLines={3}
            value={comentarios}
            onChangeText={setComentarios}
          />
        </Card>

        {tipoRegistro !== TipoRegistro.NO_ENTREGADO &&
          renderImageGallery(imagenesEvidencia, 'evidencia', 'Imágenes de Evidencia', true)}

        {tipoRegistro !== TipoRegistro.NO_ENTREGADO &&
          renderImageGallery(imagenesFacturas, 'factura', 'Imágenes de Facturas')}

        {tipoRegistro === TipoRegistro.NO_ENTREGADO &&
          renderImageGallery(imagenesIncidencia, 'incidencia', 'Imágenes de Incidencia', true)}

        <View style={styles.footer}>
          <Button variant="gradient" size="large" fullWidth onPress={handleSave} loading={saving}>
            Enviar Entrega
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  section: {
    marginTop: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tipoRegistroButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tipoButton: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[600],
    alignItems: 'center',
  },
  tipoButtonActive: {
    backgroundColor: colors.primary[600],
  },
  articuloCard: {
    padding: spacing[3],
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  cantidadInput: {
    marginTop: spacing[2],
  },
  imageSection: {
    marginTop: spacing[4],
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  required: {
    color: colors.error[500],
  },
  imageScroll: {
    marginTop: spacing[2],
  },
  imageContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
  },
  errorText: {
    color: colors.error[500],
    marginTop: spacing[1],
  },
  footer: {
    marginTop: spacing[6],
  },
});

export default EntregaDetailScreen;
