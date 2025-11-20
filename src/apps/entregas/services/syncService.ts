import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { Paths, Directory } from 'expo-file-system';
import { entregasStorageService } from './storageService';
import { entregasApiService } from './entregasApiService';
import { EstadoSincronizacion, EntregaSync, ImagenDTO } from '../models';
import { apiService } from '@/shared/services';
import moment from 'moment';

const BACKGROUND_SYNC_TASK = 'background-entregas-sync';
const SYNC_INTERVAL_MINUTES = 15;

export interface SyncResult {
  success: boolean;
  entregasSincronizadas: number;
  entregasConError: number;
  mensaje?: string;
}

class SyncService {
  private isSyncing = false;
  private readonly EVIDENCIAS_DIR = new Directory(Paths.document, 'FultraApps', 'Evidencias');
  private connectivitySubscription: NetInfoSubscription | null = null;
  private onSyncCompleteCallback: (() => void) | null = null;

  async checkInternetConnection(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected !== true || netInfo.isInternetReachable !== true) {
        return false;
      }

      // Verificación real: intentar conectar al servidor
      const serverReachable = await this.pingServer();
      return serverReachable;
    } catch (error) {
      console.error('Error checking internet connection:', error);
      return false;
    }
  }

  private async pingServer(): Promise<boolean> {
    try {
      // Usar un timeout corto para verificar conectividad real
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await apiService.get('/health', { signal: controller.signal, timeout: 5000 });
      clearTimeout(timeoutId);
      return true;
    } catch (error: any) {
      // Si el servidor responde con cualquier código HTTP, está alcanzable
      if (error?.message && !error.message.includes('conectar')) {
        // El servidor respondió (aunque sea con error), hay conectividad
        return true;
      }
      console.log('[SyncService] Server ping failed:', error.message);
      return false;
    }
  }

  startConnectivityListener(onSyncComplete?: () => void): void {
    if (this.connectivitySubscription) {
      return;
    }

    this.onSyncCompleteCallback = onSyncComplete || null;

    this.connectivitySubscription = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('[SyncService] Connectivity restored, checking for pending syncs...');

        const pendientes = await entregasStorageService.getEntregasSync();
        const hayPendientes = pendientes.some(
          (e) =>
            e.estado === EstadoSincronizacion.PENDIENTE_ENVIO ||
            e.estado === EstadoSincronizacion.ERROR ||
            e.estado === EstadoSincronizacion.IMAGENES_PENDIENTES
        );

        if (hayPendientes && !this.isSyncing) {
          console.log('[SyncService] Found pending syncs, starting automatic sync...');
          const result = await this.sincronizarEntregasPendientes();
          console.log('[SyncService] Auto-sync result:', result);

          if (this.onSyncCompleteCallback) {
            this.onSyncCompleteCallback();
          }
        }
      }
    });

    console.log('[SyncService] Connectivity listener started');
  }

  stopConnectivityListener(): void {
    if (this.connectivitySubscription) {
      this.connectivitySubscription();
      this.connectivitySubscription = null;
      this.onSyncCompleteCallback = null;
      console.log('[SyncService] Connectivity listener stopped');
    }
  }

  async sincronizarEntrega(entrega: EntregaSync): Promise<boolean> {
    try {
      console.log(`[SyncService] 🔄 Iniciando sincronización de entrega: ${entrega.folio}`);

      await entregasStorageService.updateEntregaSync(entrega.id, {
        estado: EstadoSincronizacion.ENVIANDO,
      });

      // Formatear fechas con moment.js para mantener zona horaria local
      const fechaCapturaISO = entrega.fechaCaptura
        ? moment(entrega.fechaCaptura).format('YYYY-MM-DDTHH:mm:ssZ')
        : moment().format('YYYY-MM-DDTHH:mm:ssZ');

      const fechaEnvioServerISO = moment().format('YYYY-MM-DDTHH:mm:ssZ');

      console.log('[SyncService] Fecha captura formateada:', fechaCapturaISO);
      console.log('[SyncService] Fecha envío servidor formateada:', fechaEnvioServerISO);

      const embarqueData = {
        ordenVenta: entrega.ordenVenta,
        folio: entrega.folio,
        tipoEntrega: entrega.tipoEntrega,
        razonIncidencia: entrega.razonIncidencia,
        imagenesIncidencia: entrega.imagenesIncidencia,
        imagenesFacturas: entrega.imagenesFacturas,
        imagenesEvidencia: entrega.imagenesEvidencia,
        comentarios: entrega.comentarios,
        nombreQuienEntrega: entrega.nombreQuienEntrega,
        latitud: entrega.latitud,
        longitud: entrega.longitud,
        fechaCaptura: fechaCapturaISO as unknown as Date, // String ISO con timezone local
        fechaEnvioServer: fechaEnvioServerISO as unknown as Date, // String ISO con timezone local
        enviadoServer: true,
        articulos: entrega.articulos,
      };

      console.log('========== ENVIAR ENTREGA - DATOS ==========');
      console.log('Folio:', entrega.folio);
      console.log('Tipo:', entrega.tipoEntrega);
      console.log('Total imágenes evidencia:', entrega.imagenesEvidencia?.length || 0);
      console.log('Total imágenes facturas:', entrega.imagenesFacturas?.length || 0);
      console.log('Total imágenes incidencia:', entrega.imagenesIncidencia?.length || 0);
      console.log('===========================================');

      // PASO 1: Enviar datos de la entrega
      console.log(`[SyncService] 📤 Enviando datos de entrega al servidor...`);
      await entregasApiService.enviarEmbarqueEntrega(embarqueData);
      console.log(`[SyncService] ✅ Datos de entrega enviados exitosamente: ${entrega.folio}`);

      await entregasStorageService.updateEntregaSync(entrega.id, {
        estado: EstadoSincronizacion.DATOS_ENVIADOS,
        enviadoServer: true,
        fechaEnvioServer: new Date(),
      });

      // PASO 2: Verificar y enviar imágenes
      const todasImagenes = [
        ...entrega.imagenesEvidencia,
        ...entrega.imagenesFacturas,
        ...entrega.imagenesIncidencia,
      ];

      if (todasImagenes.length === 0) {
        console.log(`[SyncService] ℹ️ No hay imágenes para enviar, finalizando sincronización`);
        await this.finalizarSincronizacion(entrega.id);
        return true;
      }

      console.log(`[SyncService] 📸 Enviando ${todasImagenes.length} imágenes al servidor...`);
      await entregasStorageService.updateEntregaSync(entrega.id, {
        estado: EstadoSincronizacion.IMAGENES_PENDIENTES,
      });

      const imagenesEnviadas = await this.sincronizarImagenes(todasImagenes);

      // Persistir el estado de las imágenes enviadas para evitar reenvíos
      await entregasStorageService.updateEntregaSync(entrega.id, {
        imagenesEvidencia: entrega.imagenesEvidencia,
        imagenesFacturas: entrega.imagenesFacturas,
        imagenesIncidencia: entrega.imagenesIncidencia,
      });

      if (imagenesEnviadas === todasImagenes.length) {
        console.log(`[SyncService] ✅ Todas las imágenes (${imagenesEnviadas}) enviadas exitosamente`);
        await this.finalizarSincronizacion(entrega.id);
        return true;
      } else {
        console.warn(
          `[SyncService] ⚠️ Solo se enviaron ${imagenesEnviadas} de ${todasImagenes.length} imágenes`
        );
        await entregasStorageService.updateEntregaSync(entrega.id, {
          estado: EstadoSincronizacion.IMAGENES_PENDIENTES,
          intentosEnvio: entrega.intentosEnvio + 1,
          ultimoError: `Solo se enviaron ${imagenesEnviadas} de ${todasImagenes.length} imágenes`,
        });
        return false;
      }
    } catch (error: any) {
      console.error(`[SyncService] ❌ Error sincronizando entrega ${entrega.folio}:`, error);

      await entregasStorageService.updateEntregaSync(entrega.id, {
        estado: EstadoSincronizacion.ERROR,
        intentosEnvio: entrega.intentosEnvio + 1,
        ultimoError: error.message || 'Error desconocido',
      });

      return false;
    }
  }

  private reconstruirUriImagen(nombreArchivo: string): string {
    // Reconstruir la URI completa desde el directorio de evidencias
    const rutaCompleta = `${this.EVIDENCIAS_DIR.uri}/${nombreArchivo}`;
    console.log(`[SyncService] 🔗 URI reconstruida: ${rutaCompleta}`);
    return rutaCompleta;
  }

  private async sincronizarImagenes(imagenes: ImagenDTO[]): Promise<number> {
    let imagenesEnviadas = 0;
    const totalImagenes = imagenes.length;

    for (let i = 0; i < imagenes.length; i++) {
      const imagen = imagenes[i];

      if (imagen.enviado) {
        imagenesEnviadas++;
        console.log(`[SyncService] ⏭️ Imagen ya enviada (${i + 1}/${totalImagenes}): ${imagen.nombre}`);
        continue;
      }

      try {
        console.log(`[SyncService] 📤 Subiendo imagen (${i + 1}/${totalImagenes}): ${imagen.nombre}`);

        // Reconstruir la URI completa del archivo guardado
        const uriCompleta = this.reconstruirUriImagen(imagen.nombre);

        const exito = await entregasApiService.subirImagenEvidencia(
          {
            uri: uriCompleta,
            type: 'image/jpeg',
            name: imagen.nombre,
          },
          imagen.nombre
        );

        if (exito) {
          imagenesEnviadas++;
          imagen.enviado = true;
          console.log(`[SyncService] ✅ Imagen subida (${imagenesEnviadas}/${totalImagenes}): ${imagen.nombre}`);
        } else {
          console.warn(`[SyncService] ❌ Falló la subida de imagen (${i + 1}/${totalImagenes}): ${imagen.nombre}`);
        }
      } catch (error) {
        console.error(`[SyncService] ❌ Error subiendo imagen ${imagen.nombre}:`, error);
      }
    }

    console.log(`[SyncService] 📊 Resultado: ${imagenesEnviadas}/${totalImagenes} imágenes enviadas`);
    return imagenesEnviadas;
  }

  private async finalizarSincronizacion(entregaId: string): Promise<void> {
    console.log(`[SyncService] Finalizando sincronización: ${entregaId}`);

    await entregasStorageService.updateEntregaSync(entregaId, {
      estado: EstadoSincronizacion.COMPLETADO,
    });

    await entregasStorageService.removeEntregaSync(entregaId);
  }

  async sincronizarEntregasPendientes(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[SyncService] Ya hay una sincronización en progreso, saltando...');
      return {
        success: false,
        entregasSincronizadas: 0,
        entregasConError: 0,
        mensaje: 'Sincronización en progreso',
      };
    }

    const hasInternet = await this.checkInternetConnection();
    if (!hasInternet) {
      console.log('[SyncService] Sin conexión a internet, saltando sincronización');
      return {
        success: false,
        entregasSincronizadas: 0,
        entregasConError: 0,
        mensaje: 'Sin conexión a internet',
      };
    }

    this.isSyncing = true;

    try {
      console.log('[SyncService] Iniciando sincronización de entregas pendientes');

      const entregasPendientes = await entregasStorageService.getEntregasSync();

      const entregasPorSincronizar = entregasPendientes.filter(
        (e) =>
          e.estado === EstadoSincronizacion.PENDIENTE_ENVIO ||
          e.estado === EstadoSincronizacion.ERROR ||
          e.estado === EstadoSincronizacion.IMAGENES_PENDIENTES
      );

      if (entregasPorSincronizar.length === 0) {
        console.log('[SyncService] No hay entregas pendientes de sincronizar');
        return {
          success: true,
          entregasSincronizadas: 0,
          entregasConError: 0,
          mensaje: 'No hay entregas pendientes',
        };
      }

      console.log(
        `[SyncService] Encontradas ${entregasPorSincronizar.length} entregas para sincronizar`
      );

      let sincronizadas = 0;
      let conError = 0;

      for (const entrega of entregasPorSincronizar) {
        const hasInternetNow = await this.checkInternetConnection();
        if (!hasInternetNow) {
          console.log('[SyncService] Se perdió la conexión a internet, deteniendo');
          break;
        }

        const exitoso = await this.sincronizarEntrega(entrega);
        if (exitoso) {
          sincronizadas++;
        } else {
          conError++;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(
        `[SyncService] Sincronización completada: ${sincronizadas} exitosas, ${conError} con error`
      );

      return {
        success: true,
        entregasSincronizadas: sincronizadas,
        entregasConError: conError,
        mensaje: `Sincronizadas: ${sincronizadas}, Errores: ${conError}`,
      };
    } catch (error: any) {
      console.error('[SyncService] Error en sincronización masiva:', error);
      return {
        success: false,
        entregasSincronizadas: 0,
        entregasConError: 0,
        mensaje: error.message || 'Error desconocido',
      };
    } finally {
      this.isSyncing = false;
    }
  }

  async enviarEntregaDirecto(entrega: EntregaSync): Promise<SyncResult> {
    const hasInternet = await this.checkInternetConnection();

    if (!hasInternet) {
      console.log('[SyncService] ❌ Sin conexión a internet, guardando para sincronizar después');

      await entregasStorageService.saveEntregaSync({
        ...entrega,
        estado: EstadoSincronizacion.PENDIENTE_ENVIO,
      });

      // Remover de la lista de órdenes pendientes DESPUÉS de guardar en sync
      await entregasStorageService.removeEntrega(entrega.ordenVenta, entrega.folio);

      return {
        success: false,
        entregasSincronizadas: 0,
        entregasConError: 1,
        mensaje: 'Sin conexión. La entrega se sincronizará automáticamente cuando haya internet.',
      };
    }

    console.log('[SyncService] ✅ Internet detectado, enviando entrega directamente al servidor...');
    console.log(`[SyncService] 📦 Entrega: ${entrega.folio} | Tipo: ${entrega.tipoEntrega}`);

    try {
      // Guardar temporalmente en sincronización para mostrar progreso
      // NO removemos de la lista de órdenes hasta confirmar envío exitoso
      await entregasStorageService.saveEntregaSync({
        ...entrega,
        estado: EstadoSincronizacion.ENVIANDO,
      });

      // Sincronizar datos e imágenes
      const exitoso = await this.sincronizarEntrega(entrega);

      if (exitoso) {
        // SOLO remover de órdenes pendientes si la sincronización fue exitosa
        await entregasStorageService.removeEntrega(entrega.ordenVenta, entrega.folio);
        console.log(`[SyncService] ✅ Entrega ${entrega.folio} enviada exitosamente (datos e imágenes)`);
        return {
          success: true,
          entregasSincronizadas: 1,
          entregasConError: 0,
          mensaje: 'Entrega enviada exitosamente',
        };
      } else {
        // Mantener en órdenes pendientes pero marcar como pendiente de sync
        await entregasStorageService.removeEntrega(entrega.ordenVenta, entrega.folio);
        console.log(`[SyncService] ⚠️ Error al enviar entrega ${entrega.folio}, se reintentará`);
        return {
          success: false,
          entregasSincronizadas: 0,
          entregasConError: 1,
          mensaje: 'Error al enviar. Se reintentará automáticamente.',
        };
      }
    } catch (error: any) {
      console.error(`[SyncService] ❌ Error crítico en enviarEntregaDirecto (${entrega.folio}):`, error);

      // Guardar en AsyncStorage con estado de error para reintento
      await entregasStorageService.saveEntregaSync({
        ...entrega,
        estado: EstadoSincronizacion.ERROR,
        intentosEnvio: 1,
        ultimoError: error.message || 'Error desconocido',
      });

      // Remover de órdenes pendientes ya que está en cola de sync
      await entregasStorageService.removeEntrega(entrega.ordenVenta, entrega.folio);

      return {
        success: false,
        entregasSincronizadas: 0,
        entregasConError: 1,
        mensaje: 'Error al enviar. Se reintentará automáticamente.',
      };
    }
  }

  async registerBackgroundSync(): Promise<boolean> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

      if (isRegistered) {
        console.log('[SyncService] Tarea de background ya registrada');
        return true;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: SYNC_INTERVAL_MINUTES * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log(
        `[SyncService] Tarea de background registrada (cada ${SYNC_INTERVAL_MINUTES} minutos)`
      );
      return true;
    } catch (error) {
      console.error('[SyncService] Error registrando tarea de background:', error);
      return false;
    }
  }

  async unregisterBackgroundSync(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[SyncService] Tarea de background desregistrada');
    } catch (error) {
      console.error('[SyncService] Error desregistrando tarea de background:', error);
    }
  }

  async getBackgroundSyncStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      return status;
    } catch (error) {
      console.error('[SyncService] Error obteniendo estado de background fetch:', error);
      return null;
    }
  }
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  console.log('[BackgroundTask] Ejecutando sincronización en background');

  try {
    const syncService = new SyncService();
    const result = await syncService.sincronizarEntregasPendientes();

    console.log('[BackgroundTask] Resultado:', result);

    if (result.success) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  } catch (error) {
    console.error('[BackgroundTask] Error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const syncService = new SyncService();
export { BACKGROUND_SYNC_TASK };
