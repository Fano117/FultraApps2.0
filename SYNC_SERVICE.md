# Servicio de Sincronización en Background

## 📋 Descripción General

El **Sync Service** es un servicio inteligente que maneja la sincronización de entregas con el servidor, funcionando tanto en foreground como en background. Implementa una estrategia **offline-first** con reintentos automáticos cada 15 minutos.

## 🎯 Funcionalidades Principales

### 1. **Envío Directo (Con Internet)**

Cuando se guarda una nueva entrega:

```typescript
const result = await syncService.enviarEntregaDirecto(entregaSync);
```

**Flujo:**
1. ✅ **Verifica conexión a internet** usando `@react-native-community/netinfo`
2. Si **HAY internet** → Envía directamente al servidor
   - Envía los datos de la entrega
   - Sube las imágenes una por una
   - Marca como completada
   - **Usuario ve: "Entrega sincronizada exitosamente"**
3. Si **NO HAY internet** → Guarda localmente
   - Almacena en AsyncStorage
   - Estado: `PENDIENTE_ENVIO`
   - **Usuario ve: "Se sincronizará automáticamente cuando haya internet"**

### 2. **Sincronización en Background (Cada 15 minutos)**

El servicio se ejecuta automáticamente cada 15 minutos en background:

```typescript
// Se registra al iniciar la app
await syncService.registerBackgroundSync();
```

**Flujo automático:**
1. ⏰ Cada 15 minutos se ejecuta la tarea en background
2. 🌐 Verifica si hay conexión a internet
3. ✅ Si HAY internet:
   - Busca entregas pendientes (`PENDIENTE_ENVIO`, `ERROR`, `IMAGENES_PENDIENTES`)
   - Intenta sincronizar cada una
   - Actualiza estados en tiempo real
4. ❌ Si NO HAY internet:
   - No hace nada, espera los próximos 15 minutos

## 🔄 Estados de Sincronización

```typescript
enum EstadoSincronizacion {
  PENDIENTE_ENVIO        // Guardada localmente, esperando conexión
  ENVIANDO               // Enviando datos al servidor
  DATOS_ENVIADOS         // Datos enviados, falta subir imágenes
  IMAGENES_PENDIENTES    // Subiendo imágenes
  COMPLETADO             // Todo sincronizado correctamente
  ERROR                  // Hubo un error, se reintentará
}
```

## 📱 Casos de Uso

### Caso 1: Usuario con Internet
```
1. Usuario completa entrega
2. App verifica internet → ✅ HAY
3. Envía directamente al servidor
4. Usuario ve confirmación inmediata
5. Entrega eliminada de pendientes
```

### Caso 2: Usuario sin Internet
```
1. Usuario completa entrega
2. App verifica internet → ❌ NO HAY
3. Guarda localmente en AsyncStorage
4. Usuario ve: "Se sincronizará automáticamente"
5. Usuario cierra la app
6. [15 minutos después]
7. Background service se ejecuta
8. Detecta que ahora hay internet
9. Sincroniza automáticamente
10. Usuario ve notificación (opcional)
```

### Caso 3: Sincronización Parcial con Errores
```
1. Service intenta sincronizar
2. Envía datos ✅
3. Intenta subir 5 imágenes:
   - Imagen 1: ✅
   - Imagen 2: ✅
   - Imagen 3: ❌ (error de red)
   - Imagen 4: ❌
   - Imagen 5: ❌
4. Estado: ERROR
5. intentosEnvio++
6. [15 minutos después]
7. Reintenta solo las imágenes que fallaron
```

## 🛠️ Implementación Técnica

### Componentes Principales

#### 1. **SyncService Class**
```typescript
class SyncService {
  // Verificar internet
  async checkInternetConnection(): Promise<boolean>

  // Enviar una entrega (datos + imágenes)
  async sincronizarEntrega(entrega: EntregaSync): Promise<boolean>

  // Sincronizar todas las pendientes
  async sincronizarEntregasPendientes(): Promise<SyncResult>

  // Envío directo (nuevo registro)
  async enviarEntregaDirecto(entrega: EntregaSync): Promise<SyncResult>

  // Registrar tarea en background
  async registerBackgroundSync(): Promise<boolean>
}
```

#### 2. **Background Task**
```typescript
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  const syncService = new SyncService();
  const result = await syncService.sincronizarEntregasPendientes();

  return result.success
    ? BackgroundFetch.BackgroundFetchResult.NewData
    : BackgroundFetch.BackgroundFetchResult.Failed;
});
```

#### 3. **Registro en App.tsx**
```typescript
useEffect(() => {
  const setupBackgroundSync = async () => {
    await syncService.registerBackgroundSync();
  };
  setupBackgroundSync();
}, []);
```

## 📊 Logs y Debugging

El servicio genera logs detallados para debugging:

```
[SyncService] Verificando conexión a internet...
[SyncService] Encontradas 3 entregas para sincronizar
[SyncService] Sincronizando entrega: 12345
[SyncService] Datos de entrega enviados: 12345
[SyncService] Subiendo imagen: 12345_evidencia_01.png
[SyncService] Imagen subida exitosamente
[SyncService] Sincronización completada: 3 exitosas, 0 con error
[BackgroundTask] Ejecutando sincronización en background
[BackgroundTask] Resultado: { success: true, entregasSincronizadas: 3 }
```

## ⚙️ Configuración

### Intervalo de Sincronización
```typescript
const SYNC_INTERVAL_MINUTES = 15; // Modificable
```

### Permisos Necesarios (app.json)
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["fetch"]
    }
  },
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED"
    ]
  }
}
```

## 🔒 Seguridad

### Validaciones Implementadas:
- ✅ Verificación de internet antes de cada intento
- ✅ Reintentos limitados (máximo por configuración)
- ✅ Manejo de errores con logging
- ✅ Estado persistente en AsyncStorage
- ✅ Tokens de autenticación manejados por el API service

### Manejo de Errores:
```typescript
try {
  await syncService.sincronizarEntrega(entrega);
} catch (error) {
  // Incrementa intentosEnvio
  // Guarda ultimoError
  // Estado: ERROR
  // Se reintentará en 15 minutos
}
```

## 📈 Rendimiento

### Optimizaciones:
- ✅ Sincronización solo cuando hay internet
- ✅ Espera de 1 segundo entre entregas para no saturar
- ✅ Compresión de imágenes antes de subir
- ✅ Reintentos inteligentes (solo imágenes que fallaron)
- ✅ Limpieza automática de entregas completadas

### Consumo de Batería:
- Background fetch optimizado por el OS
- Solo se ejecuta cuando el sistema lo permite
- No mantiene conexiones abiertas
- Se cancela si no hay internet

## 🧪 Testing

### Probar Sincronización Manual:
```typescript
// En cualquier parte de la app
import { syncService } from '@/apps/entregas/services';

const result = await syncService.sincronizarEntregasPendientes();
console.log(result);
```

### Simular Sin Internet:
1. Activar modo avión
2. Crear una entrega
3. Ver que se guarda localmente
4. Desactivar modo avión
5. Esperar 15 minutos O forzar sincronización manual

### Ver Estado del Background Service:
```typescript
const status = await syncService.getBackgroundSyncStatus();
console.log('Background status:', status);
// Available | Restricted | Denied
```

## 📱 Experiencia de Usuario

### Feedback Visual:

**Al crear entrega:**
- Con internet: "✅ Entrega sincronizada exitosamente"
- Sin internet: "💾 Se sincronizará automáticamente cuando haya conexión"

**En pantalla de Pendientes:**
- Badge de estado en tiempo real
- Botón "Sincronizar" para forzar
- Contador de intentos
- Mensaje de último error (si aplica)

### Notificaciones (Opcional):
Puedes extender el servicio para mostrar notificaciones locales:
```typescript
// Al completar sincronización en background
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Entregas sincronizadas',
    body: `${result.entregasSincronizadas} entregas enviadas al servidor`,
  },
  trigger: null,
});
```

## 🚀 Próximas Mejoras

- [ ] Prioridad de sincronización (entregas más antiguas primero)
- [ ] Compresión de imágenes con calidad configurable
- [ ] Reintentos exponenciales (15min, 30min, 1h, 2h)
- [ ] Notificaciones push cuando se complete sincronización
- [ ] Dashboard de estadísticas de sincronización
- [ ] Modo "solo WiFi" para ahorrar datos móviles
- [ ] Cancelación de sincronización en progreso

## 📞 Soporte

Si tienes problemas con la sincronización:
1. Verifica los logs en la consola
2. Revisa el estado del background fetch
3. Confirma que los permisos están otorgados
4. Prueba forzar una sincronización manual

---

**Desarrollado con ❤️ por el equipo de Fultra**
