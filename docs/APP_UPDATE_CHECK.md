# Sistema de Verificación de Actualizaciones

Sistema de actualización automática que **consulta directamente con Play Store (Android) y App Store (iOS)** para verificar si hay una nueva versión disponible.

## ✅ Características

- **Android + iOS**: Funciona en ambas plataformas
- **Sin backend**: Consulta directamente las tiendas oficiales
- **Actualización forzada**: Alert no cancelable que obliga al usuario a actualizar
- **Automático**: Verifica al iniciar y cuando la app vuelve al foreground
- **Compatible con Expo**: Funciona con managed workflow, sin eject

---

## 🔧 Cómo funciona

### Flujo de verificación:

```
Usuario abre la app
    ↓
Consulta Play Store/App Store
    ↓
¿Hay nueva versión disponible?
    ↓ SÍ
Muestra Alert "Actualización requerida" (no cancelable)
    ↓
Usuario presiona "Actualizar ahora"
    ↓
Abre Play Store/App Store
    ↓
Usuario instala actualización manualmente
```

### ¿Cuándo verifica?

1. **Al iniciar la app** - Primera verificación
2. **Al volver del background** - Cuando el usuario minimiza y regresa

---

## 📦 Implementación

### 1. Librería utilizada

**`react-native-version-check-expo`** - Versión compatible con Expo que consulta las tiendas oficiales.

```bash
npm install react-native-version-check-expo
```

### 2. Hook personalizado

El hook `useAppUpdate` está integrado en [src/shared/hooks/useAppUpdate.ts](../src/shared/hooks/useAppUpdate.ts)

### 3. Integración en la app

Ya está integrado en [App.tsx](../App.tsx):

```typescript
import { useAppUpdate } from './src/shared/hooks';

export default function App() {
  useAppUpdate(); // ¡Eso es todo!

  return (
    // Tu app
  );
}
```

---

## 📱 Configuración en las tiendas

### Android (Play Store)

**1. Configuración en `app.json`:**

```json
{
  "expo": {
    "version": "1.3.0",
    "android": {
      "package": "com.tuapp.nombre",
      "versionCode": 13
    }
  }
}
```

**2. Para publicar nueva versión:**

```bash
# 1. Incrementar version y versionCode en app.json
{
  "expo": {
    "version": "1.4.0",  // ← Incrementar
    "android": {
      "versionCode": 14  // ← Incrementar (IMPORTANTE)
    }
  }
}

# 2. Build de producción
eas build --platform android --profile production

# 3. Subir a Play Store Console → Producción
```

**IMPORTANTE**: El sistema compara el `version` del `app.json` con el de Play Store.

### iOS (App Store)

**1. Configuración en `app.json`:**

```json
{
  "expo": {
    "version": "1.3.0",
    "ios": {
      "bundleIdentifier": "com.tuapp.nombre",
      "buildNumber": "1.3.0"
    }
  }
}
```

**2. Para publicar nueva versión:**

```bash
# 1. Incrementar version y buildNumber en app.json
{
  "expo": {
    "version": "1.4.0",  // ← Incrementar
    "ios": {
      "buildNumber": "1.4.0"  // ← Incrementar
    }
  }
}

# 2. Build de producción
eas build --platform ios --profile production

# 3. Subir a App Store Connect → TestFlight/Producción
```

---

## 🎯 ¿Cómo detecta actualizaciones?

### Comparación de versiones

La librería hace una petición HTTP a las tiendas y compara versiones:

```typescript
// Ejemplo:
// App actual:     1.3.0
// Play Store:     1.4.0
// Resultado:      needUpdate = true
```

### URLs consultadas:

- **Android**: `https://play.google.com/store/apps/details?id=com.tuapp.nombre`
- **iOS**: `https://itunes.apple.com/lookup?bundleId=com.tuapp.nombre`

---

## 🧪 Testing

### Testing en desarrollo

**NO funciona en Expo Go**. Necesitas:

1. **Build de desarrollo:**
   ```bash
   eas build --platform android --profile development
   ```

2. **Instalar en dispositivo real**

3. **Publicar versión antigua en tienda:**
   - Versión 1.3.0 → Producción en Play Store

4. **Instalar versión más nueva localmente:**
   - Versión 1.4.0 → Dispositivo (vía build local)

5. **Abrir app v1.3.0** → Debería detectar v1.4.0

### Testing real (recomendado)

1. **Publicar versión actual en producción:**
   ```bash
   # Versión 1.3.0
   eas build --platform android --profile production
   # Subir a Play Store
   ```

2. **Usuarios instalan v1.3.0 desde Play Store**

3. **Publicar nueva versión:**
   ```bash
   # Versión 1.4.0 en app.json
   eas build --platform android --profile production
   # Subir a Play Store
   ```

4. **Usuarios con v1.3.0 abren la app** → Verán alert de actualización

---

## 📊 Logs del sistema

El hook genera logs detallados en la consola:

```
[AppUpdate] Verificando actualizaciones en tiendas...
[AppUpdate] Versión actual: 1.3.0
[AppUpdate] Versión en tienda: 1.4.0
[AppUpdate] Resultado: { currentVersion: '1.3.0', latestVersion: '1.4.0', isNeeded: true }
[AppUpdate] ¡Actualización disponible! Mostrando alerta...
[AppUpdate] Abriendo tienda: https://play.google.com/store/apps/details?id=com.tuapp.nombre
```

---

## 🔧 Personalización

### 1. Cambiar el mensaje del Alert

```typescript
// src/shared/hooks/useAppUpdate.ts

const showUpdateAlert = (latestVersion: string) => {
  Alert.alert(
    'Nueva versión disponible',  // ← Personalizar título
    `Actualiza a la versión ${latestVersion} para seguir disfrutando de nuevas funciones.`,  // ← Personalizar mensaje
    [
      {
        text: 'Ir a la tienda',  // ← Personalizar botón
        onPress: () => {
          Linking.openURL(VersionCheck.getStoreUrl());
        },
      },
    ],
    { cancelable: false }  // false = forzado, true = opcional
  );
};
```

### 2. Hacer la actualización opcional (no forzada)

```typescript
Alert.alert(
  'Actualización disponible',
  `Hay una nueva versión (${latestVersion}). ¿Deseas actualizar?`,
  [
    {
      text: 'Más tarde',
      style: 'cancel',
    },
    {
      text: 'Actualizar',
      onPress: () => Linking.openURL(VersionCheck.getStoreUrl()),
    },
  ],
  { cancelable: true }  // ← true = permite cerrar el alert
);
```

### 3. Verificar solo en ciertas condiciones

```typescript
const checkForUpdate = async () => {
  // Solo verificar en producción
  if (__DEV__) {
    console.log('[AppUpdate] Deshabilitado en desarrollo');
    return;
  }

  // Solo verificar cada X días
  const lastCheck = await AsyncStorage.getItem('lastUpdateCheck');
  const daysSinceCheck = (Date.now() - parseInt(lastCheck || '0')) / (1000 * 60 * 60 * 24);

  if (daysSinceCheck < 7) {
    console.log('[AppUpdate] Ya se verificó hace menos de 7 días');
    return;
  }

  // ... resto del código
  await AsyncStorage.setItem('lastUpdateCheck', Date.now().toString());
};
```

### 4. Deshabilitar temporalmente

```typescript
// App.tsx

export default function App() {
  // Comentar para deshabilitar
  // useAppUpdate();

  return (
    // Tu app
  );
}
```

---

## ⚠️ Limitaciones

### Lo que SÍ verifica:
- ✅ Nuevas versiones publicadas en las tiendas
- ✅ Funciona en Android y iOS
- ✅ No requiere backend propio

### Lo que NO verifica:
- ❌ Actualizaciones OTA (JavaScript/assets sin pasar por tiendas)
  - Para esto necesitas **EAS Update** de Expo
- ❌ No descarga e instala automáticamente
  - Solo abre la tienda, el usuario instala manualmente
- ❌ No funciona sin internet
  - Necesita conexión para consultar las tiendas

---

## 🆚 Comparación con otras soluciones

| Característica | react-native-version-check-expo | EAS Update | Google In-App Updates |
|----------------|--------------------------------|------------|----------------------|
| **Plataformas** | ✅ Android + iOS | ✅ Android + iOS | ❌ Solo Android |
| **Verifica tiendas** | ✅ Sí | ❌ No | ✅ Sí |
| **Actualiza JS/assets** | ❌ No | ✅ Sí | ❌ No |
| **Instalación automática** | ❌ No (abre tienda) | ✅ Sí | ✅ Sí |
| **Compatible con Expo** | ✅ Sí | ✅ Sí | ❌ No (incompatible) |
| **Necesita backend** | ❌ No | ❌ No (usa Expo) | ❌ No |

### ¿Cuál usar?

- **`react-native-version-check-expo`** (actual): Para verificar actualizaciones de **versiones nativas** en las tiendas
- **EAS Update**: Para actualizaciones **OTA de JavaScript/assets** sin pasar por tiendas
- **Ambos**: Para cobertura completa (actualizaciones rápidas OTA + verificación de tiendas)

---

## 🔗 URLs de las tiendas

### Android
```
https://play.google.com/store/apps/details?id=com.tuapp.nombre
```

### iOS
```
https://apps.apple.com/app/id1234567890
```

El hook obtiene estas URLs automáticamente usando:
```typescript
const storeUrl = VersionCheck.getStoreUrl();
```

---

## 🐛 Troubleshooting

### "App is up to date" pero hay nueva versión en la tienda

**Causa**: La versión puede tardar hasta 2-4 horas en propagarse en los servidores de las tiendas.

**Solución**: Espera unas horas y vuelve a probar.

---

### Error: "Cannot read property 'getCurrentVersion'"

**Causa**: Falta configuración en `app.json`.

**Solución**: Verifica que tienes:
```json
{
  "expo": {
    "version": "1.3.0",
    "android": {
      "package": "com.tuapp.nombre"
    }
  }
}
```

---

### No detecta actualización en iOS

**Causa**: La app debe estar publicada en App Store (no funciona en TestFlight).

**Solución**: Publica al menos una versión en producción en App Store.

---

### Alert aparece cada vez que abro la app

**Causa**: El usuario no está actualizando desde la tienda.

**Solución**: Esto es esperado. El alert seguirá apareciendo hasta que instale la nueva versión.

---

## 📚 Documentación oficial

- [react-native-version-check-expo](https://www.npmjs.com/package/react-native-version-check-expo)
- [Expo Application](https://docs.expo.dev/versions/latest/sdk/application/)

---

**Implementado por:** Claude Code
**Fecha:** 2025-11-20
**Versión:** 2.0
**Librería:** react-native-version-check-expo
