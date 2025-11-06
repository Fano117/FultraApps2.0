import * as ImagePicker from 'expo-image-picker';
import { Paths, Directory, File } from 'expo-file-system';
import { Alert, Platform } from 'react-native';

export interface ImageEvidence {
  uri: string;
  nombre: string;
  type: string;
}

class ImageService {
  private readonly EVIDENCIAS_DIR = new Directory(Paths.document, 'FultraApps', 'Evidencias');

  async initializeDirectory(): Promise<void> {
    try {
      if (!this.EVIDENCIAS_DIR.exists) {
        this.EVIDENCIAS_DIR.create({ intermediates: true, idempotent: true });
      }
    } catch (error) {
      console.error('Error initializing directory:', error);
      throw error;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

      return cameraStatus.granted && mediaStatus.granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  async showImageSourceSelector(): Promise<ImageEvidence | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Seleccionar imagen',
        'Elige una opción',
        [
          {
            text: 'Cámara',
            onPress: async () => {
              const result = await this.launchCamera();
              resolve(result);
            },
          },
          {
            text: 'Galería',
            onPress: async () => {
              const result = await this.launchImageLibrary();
              resolve(result);
            },
          },
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }

  private async launchCamera(): Promise<ImageEvidence | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          nombre: this.extractFileName(asset.uri),
          type: 'image/jpeg',
        };
      }

      return null;
    } catch (error) {
      console.error('Error launching camera:', error);
      Alert.alert('Error', 'No se pudo abrir la cámara');
      return null;
    }
  }

  private async launchImageLibrary(): Promise<ImageEvidence | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          nombre: this.extractFileName(asset.uri),
          type: 'image/jpeg',
        };
      }

      return null;
    } catch (error) {
      console.error('Error launching image library:', error);
      Alert.alert('Error', 'No se pudo abrir la galería');
      return null;
    }
  }

  async guardarEvidenciaLocal(evidencia: ImageEvidence): Promise<string | null> {
    try {
      await this.initializeDirectory();

      const nombreArchivo = evidencia.nombre.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const archivoDestino = new File(this.EVIDENCIAS_DIR, nombreArchivo);

      const archivoOrigen = new File(evidencia.uri);
      archivoOrigen.copy(archivoDestino);

      if (archivoDestino.exists) {
        console.log(`Archivo guardado: ${archivoDestino.uri}`);
        return archivoDestino.uri;
      }

      return null;
    } catch (error) {
      console.error('Error guardando evidencia local:', error);
      return null;
    }
  }

  async eliminarEvidenciaLocal(rutaArchivo: string): Promise<boolean> {
    try {
      const archivo = new File(rutaArchivo);

      if (archivo.exists) {
        archivo.delete();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error eliminando evidencia local:', error);
      return false;
    }
  }

  generateImageName(
    folio: string,
    ordenVenta: string,
    tipo: string,
    categoria: string,
    secuencia: number
  ): string {
    const fecha = new Date();
    const timestamp = fecha.getTime();
    const microseconds = fecha.getMilliseconds().toString().padStart(3, '0');
    const secuenciaPadded = secuencia.toString().padStart(2, '0');

    return `${folio}${timestamp}${microseconds}_${ordenVenta}-${tipo}_${categoria}_${secuenciaPadded}.png`;
  }

  async limpiarEvidenciasAntiguas(dias: number = 30): Promise<number> {
    try {
      await this.initializeDirectory();

      const archivos = this.EVIDENCIAS_DIR.list();
      const ahora = Date.now();
      const diasEnMs = dias * 24 * 60 * 60 * 1000;
      let archivosEliminados = 0;

      for (const archivo of archivos) {
        if (archivo instanceof File) {
          try {
            const fileInfo = archivo.info();
            if (fileInfo.modificationTime) {
              const tiempoTranscurrido = ahora - fileInfo.modificationTime * 1000;

              if (tiempoTranscurrido > diasEnMs) {
                archivo.delete();
                archivosEliminados++;
              }
            }
          } catch (err) {
            console.error('Error procesando archivo:', err);
          }
        }
      }

      return archivosEliminados;
    } catch (error) {
      console.error('Error limpiando evidencias antiguas:', error);
      return 0;
    }
  }

  private extractFileName(uri: string): string {
    const parts = uri.split('/');
    return parts[parts.length - 1] || `image_${Date.now()}.jpg`;
  }

  formatearRutaImagen(ruta: string): string {
    if (ruta.startsWith('file://')) {
      return ruta;
    }
    if (ruta.startsWith('/')) {
      return `file://${ruta}`;
    }
    return ruta;
  }
}

export const imageService = new ImageService();
