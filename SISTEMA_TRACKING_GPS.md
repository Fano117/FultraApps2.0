# 📍 Sistema de Tracking GPS en Tiempo Real con Geocercas

## 🎯 Resumen

He implementado un sistema completo de tracking GPS en tiempo real con las siguientes características:

### ✅ Funcionalidades Implementadas

1. **Entregas Reales con Flag de Testing**
   - Las entregas de prueba se guardan como entregas REALES
   - Tienen flag `EsTestData = true` para poder eliminarlas
   - Funcionan exactamente igual que entregas normales
   - Se pueden completar como cualquier entrega real

2. **Tracking GPS en Tiempo Real**
   - Ubicación del chofer actualizada cada 5 segundos
   - Envío automático al backend
   - Visualización en mapa en tiempo real
   - Histórico de ubicaciones

3. **Sistema de Geocercas**
   - Geocerca de 50m alrededor del punto de entrega
   - Visualización en el mapa (círculo azul)
   - Validación automática de proximidad
   - No se puede completar entrega si está fuera de rango

4. **Simulación de Movimiento**
   - Simula movimiento del chofer desde cualquier punto
   - Velocidad configurable (por defecto 40 km/h)
   - Visualización de ruta en tiempo real
   - Perfecto para testing sin salir de la oficina

5. **Validación de Distancia**
   - Cálculo preciso usando fórmula de Haversine
   - Botón de completar DESHABILITADO si está lejos
   - Indicador visual de distancia en metros
   - Mensaje que indica cuánto falta para estar en rango

---

## 📁 Archivos Creados

### Frontend (Mobile)

1. **`src/shared/services/gpsTrackingService.ts`**
   - Servicio principal de tracking GPS
   - Manejo de ubicación en tiempo real
   - Sistema de geocercas
   - Simulación de movimiento
   - Cálculo de distancias

2. **`src/shared/components/LiveTrackingMap.tsx`**
   - Componente de mapa con tracking en tiempo real
   - Visualización de geocerca (círculo de 50m)
   - Marcadores de chofer y punto de entrega
   - Ruta recorrida (línea morada)
   - Panel de información
   - Botón de completar (habilitado/deshabilitado)

3. **`src/screens/EntregaTrackingScreen.tsx`**
   - Pantalla principal de tracking
   - Integra mapa y controles
   - Manejo de simulación
   - Completar entrega con validación

### Backend (C#)

4. **`BACKEND_ENDPOINTS_TRACKING.cs`**
   - Controller completo con endpoints de tracking
   - Registro de ubicaciones
   - Validación de proximidad
   - Completar entregas con geocerca
   - Historial de ubicaciones

### Documentación

5. **`SISTEMA_TRACKING_GPS.md`** (este archivo)
   - Guía completa de uso
   - Instrucciones de implementación

---

## 🚀 Cómo Usar el Sistema

### Paso 1: Instalar Dependencias

```bash
# En el proyecto mobile
npm install react-native-maps expo-location

# O si usas yarn
yarn add react-native-maps expo-location
```

### Paso 2: Configurar Permisos

**Android (`android/app/src/main/AndroidManifest.xml`):**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<application>
  <!-- API Key de Google Maps -->
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="TU_API_KEY_DE_GOOGLE_MAPS"/>
</application>
```

**iOS (`ios/Podfile`):**
```ruby
# Agregar estas líneas
permissions_path = '../node_modules/react-native-permissions/ios'
pod 'Permission-LocationWhenInUse', :path => "#{permissions_path}/LocationWhenInUse"
```

**iOS (`ios/[TuApp]/Info.plist`):**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Necesitamos tu ubicación para el tracking de entregas</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Necesitamos tu ubicación para el tracking de entregas</string>
```

### Paso 3: Implementar Backend

1. Copia el contenido de `BACKEND_ENDPOINTS_TRACKING.cs`
2. Agrega el controller a tu backend
3. Ejecuta la migración:

```bash
cd backend
dotnet ef migrations add AddTrackingSystem
dotnet ef database update
```

O ejecuta el SQL manualmente (está al final del archivo).

### Paso 4: Agregar al Navegador

Agrega la pantalla de tracking a tu navegador:

**`src/navigation/types.ts`:**
```typescript
export type RootStackParamList = {
  // ... rutas existentes
  EntregaTracking: {
    entregaId: number;
    folio: string;
    puntoEntrega: Coordenadas;
    nombreCliente: string;
  };
};
```

**`src/navigation/RootNavigator.tsx`:**
```typescript
import EntregaTrackingScreen from '@/screens/EntregaTrackingScreen';

// Dentro del Stack.Navigator
<Stack.Screen
  name="EntregaTracking"
  component={EntregaTrackingScreen}
  options={{ title: 'Tracking en Vivo' }}
/>
```

### Paso 5: Navegar a la Pantalla

Desde cualquier pantalla donde tengas una entrega:

```typescript
navigation.navigate('EntregaTracking', {
  entregaId: entrega.id,
  folio: entrega.folio,
  puntoEntrega: {
    latitud: entrega.direccion.latitud,
    longitud: entrega.direccion.longitud,
  },
  nombreCliente: entrega.cliente.nombre,
});
```

---

## 🎮 Controles del Mapa

### Panel de Información (Arriba)
- **Distancia al Punto:** Muestra distancia en metros
- **Velocidad:** Velocidad actual del chofer
- **Tracking GPS:** Estado (Activo/Inactivo)

### Botones Laterales (Derecha)
- **🎯 Centrar Mapa:** Centra el mapa en chofer y destino
- **▶️ Play/Pause:** Iniciar/detener tracking GPS
- **🚗 Navegar:** Iniciar/detener simulación

### Botón Principal (Abajo)
- **✅ Completar Entrega:** Solo habilitado si está dentro de 50m
- **🔒 Acércate Xm más:** Muestra distancia faltante

### Elementos del Mapa
- **📍 Rojo:** Punto de entrega
- **🚗 Morado:** Ubicación del chofer
- **🔵 Círculo:** Geocerca de 50m
- **— Línea Morada:** Ruta recorrida

---

## 🧪 Testing con Simulación

### Modo 1: Simulación Automática

1. Abre la pantalla de tracking
2. Presiona el botón **🚗 Navegar**
3. El sistema simula movimiento desde tu ubicación actual hasta el punto de entrega
4. Velocidad: 40 km/h por defecto
5. Actualización: cada 1 segundo

### Modo 2: Simulación Manual

```typescript
import { gpsTrackingService } from '@/shared/services/gpsTrackingService';

// Simular movimiento personalizado
await gpsTrackingService.simularMovimiento(
  { latitud: 20.6597, longitud: -103.3496 }, // Origen
  { latitud: 20.6710, longitud: -103.3600 }, // Destino
  {
    velocidad: 60, // km/h
    intervalo: 500, // ms
    onProgress: (ubicacion, progreso) => {
      console.log(`Progreso: ${(progreso * 100).toFixed(0)}%`);
    },
  }
);
```

### Modo 3: Simulación de Ruta Completa

```typescript
const puntos = [
  { latitud: 20.6597, longitud: -103.3496 },
  { latitud: 20.6650, longitud: -103.3550 },
  { latitud: 20.6710, longitud: -103.3600 },
];

await gpsTrackingService.simularRutaCompleta(puntos, {
  velocidad: 40,
  onProgress: (ubicacion, indice, total) => {
    console.log(`Punto ${indice + 1} de ${total}`);
  },
});
```

---

## 📊 Flujo de Completado de Entrega

```
1. Usuario abre pantalla de tracking
   ↓
2. Sistema inicia tracking GPS
   ↓
3. Ubicación se actualiza cada 5 segundos
   ↓
4. Sistema calcula distancia al punto de entrega
   ↓
5. ¿Distancia <= 50m?
   ├─ NO → Botón deshabilitado "Acércate Xm más"
   └─ SÍ → Botón habilitado "Completar Entrega"
              ↓
              Usuario presiona botón
              ↓
              Sistema valida nuevamente (backend)
              ↓
              ¿Distancia <= 50m?
              ├─ NO → Error "Fuera de rango"
              └─ SÍ → Entrega completada ✅
```

---

## 🔧 API del Servicio GPS

### Inicializar

```typescript
await gpsTrackingService.initialize();
```

### Iniciar Tracking

```typescript
await gpsTrackingService.startTracking();
```

### Detener Tracking

```typescript
await gpsTrackingService.stopTracking();
```

### Obtener Ubicación Actual

```typescript
const ubicacion = await gpsTrackingService.getUbicacionActual();
// { latitud, longitud, velocidad, precision, timestamp, enRuta }
```

### Verificar Proximidad

```typescript
const resultado = await gpsTrackingService.puedeCompletarEntrega({
  latitud: 20.6710,
  longitud: -103.3600,
});

// resultado = {
//   dentroDeGeocerca: true/false,
//   distancia: 35, // metros
//   puedeCompletar: true/false
// }
```

### Escuchar Cambios de Ubicación

```typescript
gpsTrackingService.addUbicacionListener((ubicacion) => {
  console.log(`Nueva ubicación: ${ubicacion.latitud}, ${ubicacion.longitud}`);
});
```

---

## 🎯 Geocercas: Cómo Funcionan

### Concepto

Una **geocerca** es un perímetro virtual alrededor de un punto geográfico.

### Implementación

- **Radio:** 50 metros (configurable)
- **Cálculo:** Fórmula de Haversine (precisión de ~1 metro)
- **Validación:** Frontend Y Backend (doble verificación)
- **Visual:** Círculo azul en el mapa

### Configuración Personalizada

```typescript
const geocerca = {
  centro: { latitud: 20.6710, longitud: -103.3600 },
  radio: 100, // 100 metros
};

const resultado = gpsTrackingService.verificarGeocerca(
  ubicacionChofer,
  geocerca
);
```

---

## 📡 Endpoints del Backend

### POST /api/mobile/chofer/ubicacion
Registrar ubicación del chofer

**Request:**
```json
{
  "latitud": 20.6597,
  "longitud": -103.3496,
  "velocidad": 45,
  "precision": 5,
  "enRuta": true
}
```

### POST /api/mobile/entregas/{id}/completar
Completar entrega (con validación de geocerca)

**Request:**
```json
{
  "estado": "COMPLETADO",
  "fechaCompletado": "2025-11-11T10:30:00Z",
  "ubicacionCompletado": {
    "latitud": 20.6710,
    "longitud": -103.3600
  },
  "observaciones": "Entrega exitosa"
}
```

**Response (Error si está lejos):**
```json
{
  "error": "Fuera de rango",
  "mensaje": "Debes estar a menos de 50m del punto de entrega. Distancia actual: 75m",
  "distancia": 75
}
```

### GET /api/mobile/entregas/{id}/puede-completar
Verificar si puede completar

**Response:**
```json
{
  "puedeCompletar": true,
  "distancia": 35,
  "radio": 50,
  "ubicacionChofer": { "latitud": 20.6705, "longitud": -103.3595 },
  "puntoEntrega": { "latitud": 20.6710, "longitud": -103.3600 }
}
```

---

## 🔒 Seguridad

### Frontend
- Validación de distancia en tiempo real
- Botón deshabilitado si está lejos
- UI clara para el usuario

### Backend
- **CRÍTICO:** Siempre validar distancia en backend
- No confiar solo en el frontend
- Registrar ubicación de completado
- Auditoría de movimientos

---

## 📝 Notas Importantes

### Entregas de Prueba
- Se guardan como entregas REALES
- Flag `EsTestData = true`
- Funcionan exactamente igual
- Se pueden completar normalmente
- Se eliminan con el botón "Limpiar Datos"

### Precisión del GPS
- En exteriores: 5-10 metros
- En interiores: 10-50 metros
- Simulación: precisión perfecta

### Performance
- Ubicación cada 5 segundos (configurable)
- Solo envía si se movió 10 metros
- Histórico limitado para no saturar BD

### Modo Desarrollo
- Usar simulación para testing
- No necesitas salir a la calle
- Velocidad acelerada para probar rápido

---

## ✅ Checklist de Implementación

```
Backend:
□ Endpoints de tracking implementados
□ Migración de BD ejecutada
□ Tabla UbicacionesChofer creada
□ Campos en Entregas agregados
□ Validación de geocerca en backend

Frontend:
□ Dependencias instaladas (react-native-maps, expo-location)
□ Permisos configurados (Android/iOS)
□ Pantalla de tracking agregada al navegador
□ Navegación desde lista de entregas
□ Google Maps API Key configurada

Testing:
□ Simulación de movimiento funciona
□ Geocerca se visualiza correctamente
□ Botón se habilita/deshabilita según distancia
□ Completar entrega funciona
□ Backend valida distancia correctamente
```

---

## 🎉 Resultado Final

Con este sistema tendrás:

✅ **Tracking en Tiempo Real**
- Ve dónde está el chofer en todo momento
- Actualización cada 5 segundos
- Ruta completa visualizada

✅ **Geocercas Funcionales**
- 50m alrededor del punto de entrega
- Visualización clara en el mapa
- Validación automática

✅ **Seguridad**
- No se puede completar si está lejos
- Validación en frontend Y backend
- Auditoría de ubicaciones

✅ **Testing Fácil**
- Simulación de movimiento
- No necesitas salir de la oficina
- Velocidad configurable

✅ **UX Excelente**
- Indicadores visuales claros
- Mensajes informativos
- Botones habilitados/deshabilitados automáticamente

---

**Versión:** 1.0.0
**Fecha:** 2025-11-11
**Estado:** ✅ Completamente Implementado
