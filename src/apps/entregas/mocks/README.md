# 🧪 Sistema de Pruebas Mock - FultraApps

## Descripción

Este módulo proporciona un sistema completo de simulación de datos para probar todas las funcionalidades de rastreo y gestión de entregas sin necesidad de conexión al backend real.

## 📋 Características

### 1. Datos Mock Disponibles
- ✅ **5 Entregas de prueba** con diferentes estados (Pendiente, En Ruta, Completada)
- ✅ **5 Clientes** con información completa
- ✅ **5 Direcciones** en Ciudad de México con coordenadas reales
- ✅ **Productos variados** (harina, aceite, arroz, medicamentos, etc.)
- ✅ **Ruta optimizada** con polyline de coordenadas

### 2. APIs Mock Implementadas
- ✅ `MockDeliveryApiService` - Gestión de entregas
- ✅ `MockLocationApiService` - Rastreo de ubicación
- ✅ `MockNotificationApiService` - Notificaciones push

### 3. Simuladores
- ✅ **MockLocationSimulator** - Simula movimiento del vehículo por la ruta
  - Movimiento automático entre destinos
  - Velocidad realista (30 km/h)
  - Actualización cada 2 segundos
  - Salto manual a cualquier destino
  - Reset a posición inicial

### 4. Pantalla de Pruebas
- ✅ **MockTestingScreen** - Panel de control completo
  - Toggle para activar/desactivar modos mock
  - Controles de simulación de ubicación
  - Prueba de geofencing
  - Prueba de notificaciones
  - Visualización de datos almacenados
  - Reset de datos

## 🚀 Uso Rápido

### Activar Modo Mock

1. Navega a la pantalla de **Mock Testing** (agregar al menú de desarrollo)
2. Activa el switch "Modo Mock APIs"
3. ¡Listo! Todas las APIs usarán datos simulados

### Simular Movimiento

1. Activa "Ubicación Simulada"
2. Presiona "▶️ Iniciar Movimiento"
3. El vehículo se moverá automáticamente por la ruta

### Saltar a Ubicación Específica

1. En el panel "Saltar a Destino", toca cualquier botón numerado (1-5)
2. La ubicación cambiará instantáneamente

### Probar Geofencing

1. Presiona "Activar Monitoreo (5 zonas)"
2. Simula movimiento o salta a un destino
3. Recibirás alertas al entrar/salir de zonas

## 📝 Integración en Código

### Verificar si Mock está Activo

```typescript
import { mockConfig } from '@/apps/entregas/mocks';

// En cualquier parte de tu código
if (mockConfig.isMockEnabled()) {
  console.log('Usando datos mock');
}
```

### Usar Mock Location Simulator

```typescript
import { mockLocationSimulator } from '@/apps/entregas/mocks';

// Obtener ubicación actual
const location = mockLocationSimulator.getCurrentLocation();

// Iniciar simulación automática
mockLocationSimulator.startSimulation(2000); // Actualizar cada 2 segundos

// Detener simulación
mockLocationSimulator.stopSimulation();

// Saltar a destino específico
mockLocationSimulator.jumpToDestination(2); // Destino #3

// Reset
mockLocationSimulator.reset();

// Escuchar cambios de ubicación
mockLocationSimulator.addListener((location) => {
  console.log('Nueva ubicación:', location.latitude, location.longitude);
});
```

### Acceder a Datos Mock

```typescript
import { 
  mockEntregas, 
  mockClientes, 
  mockDirecciones,
  mockProductos,
  mockCurrentLocation,
  mockRouteCoordinates 
} from '@/apps/entregas/mocks';

// Usar directamente
console.log('Total entregas:', mockEntregas.length);
console.log('Primera entrega:', mockEntregas[0]);
```

### Usar APIs Mock Directamente

```typescript
import { 
  mockDeliveryApi, 
  mockLocationApi, 
  mockNotificationApi 
} from '@/apps/entregas/mocks';

// Obtener entregas
const entregas = await mockDeliveryApi.getEntregas({ page: 1, pageSize: 20 });

// Actualizar ubicación
await mockLocationApi.updateLocation({
  choferId: '123',
  latitud: 19.4326,
  longitud: -99.1332,
  timestamp: new Date(),
});

// Ver ubicaciones guardadas
const locations = mockLocationApi.getStoredLocations();
console.log('Ubicaciones:', locations.length);
```

## 🎮 Escenarios de Prueba

### Escenario 1: Confirmar Entrega Completa

1. Activa "Modo Mock APIs"
2. Ve a la pantalla de entregas
3. Selecciona una entrega pendiente
4. Navega al mapa de ruta
5. Simula llegada al destino (saltar a destino)
6. Confirma la entrega con foto y firma simuladas
7. Verifica que el estado cambie a "COMPLETADA"

### Escenario 2: Rastreo en Tiempo Real

1. Activa "Ubicación Simulada"
2. Inicia movimiento automático
3. Abre el mapa de ruta
4. Observa el marcador moviéndose por la ruta
5. Verifica que las distancias se actualicen

### Escenario 3: Alertas de Geofencing

1. Activa geofencing en MockTestingScreen
2. Simula movimiento o salta entre destinos
3. Observa las alertas de entrada/salida de zonas
4. Verifica que se activen a la distancia correcta

### Escenario 4: Modo Offline

1. Activa "Modo Mock APIs"
2. Desactiva WiFi/datos móviles
3. Realiza operaciones (ver entregas, actualizar ubicación)
4. Verifica que todo funcione sin conexión
5. Reactiva conexión
6. Verifica sincronización automática

## 📊 Datos de Prueba Incluidos

### Entregas

| ID | Orden | Cliente | Estado | Distancia |
|----|-------|---------|--------|-----------|
| e1 | ORD-2025-001 | Restaurante El Buen Sabor | PENDIENTE | 1.5 km |
| e2 | ORD-2025-002 | Supermercado La Esquina | PENDIENTE | 3.2 km |
| e3 | ORD-2025-003 | Farmacia San José | EN_RUTA | 5.8 km |
| e4 | ORD-2025-004 | Panadería Dulce Aroma | PENDIENTE | 7.1 km |
| e5 | ORD-2025-005 | Ferretería El Tornillo | COMPLETADA | 0 km |

### Ubicaciones

Todas las direcciones están en **Ciudad de México**:
1. Av. Insurgentes Sur (Crédito Constructor)
2. Av. Revolución (San Ángel)
3. Calle Madero (Centro)
4. Av. Chapultepec (Roma Norte)
5. Calle Amsterdam (Condesa)

## 🔧 Configuración Avanzada

### Cambiar Delay de APIs Mock

```typescript
// En mockApiServices.ts
const MOCK_DELAY = 500; // Cambiar a ms deseados
```

### Modificar Velocidad de Simulación

```typescript
// En MockLocationSimulator
mockLocationSimulator.startSimulation(1000); // 1 segundo
```

### Agregar Más Datos de Prueba

```typescript
// En mockData.ts
export const mockEntregas: Entrega[] = [
  // Agregar más entregas aquí
  {
    id: 'e6',
    numeroOrden: 'ORD-2025-006',
    // ... más campos
  }
];
```

## 🐛 Debugging

### Ver Logs de Mock

Todos los servicios mock registran sus acciones en consola:

```
[MOCK] Ubicación guardada: 19.432600, -99.133200
[DeliveryApi] Using MOCK data for getEntregas
[MockLocationSimulator] Iniciando simulación de movimiento
```

### Limpiar Datos

```typescript
// Reset completo del sistema mock
mockDeliveryApi.resetMockData();
mockLocationApi.clearLocations();
mockLocationSimulator.reset();
await mockConfig.reset();
```

## 🚨 Notas Importantes

1. **Modo Mock vs Producción**: Siempre desactiva el modo mock antes de compilar para producción
2. **Persistencia**: Las configuraciones se guardan en AsyncStorage y persisten entre sesiones
3. **Performance**: El simulador de ubicación consume batería similar al GPS real
4. **Geofencing**: Los eventos de geofencing funcionan mejor con datos mock que con emulador

## 📱 Agregar al Menú de la App

Para facilitar el acceso, agrega la pantalla MockTestingScreen al menú:

```typescript
// En tu navegador
import { MockTestingScreen } from '@/apps/entregas/screens/MockTestingScreen';

// Agregar ruta
<Stack.Screen 
  name="MockTesting" 
  component={MockTestingScreen}
  options={{ title: 'Pruebas Mock' }}
/>
```

## ✅ Checklist de Pruebas

Antes de cada release, verifica:

- [ ] Modo mock desactivado por defecto
- [ ] Todas las APIs funcionan con mock activo
- [ ] Todas las APIs funcionan con mock desactivado
- [ ] Simulador de ubicación inicia/detiene correctamente
- [ ] Geofencing detecta entrada/salida de zonas
- [ ] Notificaciones de prueba funcionan
- [ ] Reset restaura datos correctamente
- [ ] No hay logs mock en producción

## 🤝 Contribuir

Para agregar nuevos datos de prueba o funcionalidades mock:

1. Agrega datos en `mockData.ts`
2. Implementa lógica en `mockApiServices.ts`
3. Actualiza `MockTestingScreen.tsx` si es necesario
4. Documenta en este README

---

**Versión**: 1.0  
**Última actualización**: 2025-01-11  
**Autor**: FultraApps Team
