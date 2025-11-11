# 🎨 Vista Previa del Sistema Mock

## MockTestingScreen - Panel de Control

La pantalla `MockTestingScreen` proporciona un panel de control completo para probar todas las funcionalidades:

### Secciones Principales:

```
┌─────────────────────────────────────────────┐
│  🧪 Panel de Pruebas Mock                   │
│  Controla las simulaciones y datos          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ⚙️ Configuración General                    │
├─────────────────────────────────────────────┤
│ Modo Mock APIs                     ◯ OFF   │
│ Usar datos simulados                        │
├─────────────────────────────────────────────┤
│ Ubicación Simulada                 ◯ OFF   │
│ Usar simulador GPS                          │
├─────────────────────────────────────────────┤
│ Geofencing Mock                    ◯ OFF   │
│ Simular eventos de entrada/salida           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🚗 Simulador de Ubicación                   │
├─────────────────────────────────────────────┤
│ [▶️ Iniciar]  [⏸️ Pausar]                   │
│ [🔄 Reset a Inicio]                         │
│                                              │
│ Saltar a Destino:                           │
│ [1] [2] [3] [4] [5]                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📍 Geofencing                               │
├─────────────────────────────────────────────┤
│ [Activar Monitoreo (5 zonas)]               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🔔 Notificaciones                           │
├─────────────────────────────────────────────┤
│ [Probar Notificación]                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📊 Datos de Prueba                          │
├─────────────────────────────────────────────┤
│ 📦 Entregas disponibles: 5                  │
│ 📍 Destinos en ruta: 5                      │
│ ✅ Completadas: 1                           │
│ ⏳ Pendientes: 3                            │
│                                              │
│ [Ver Datos Almacenados]                     │
│ [🗑️ Restaurar Datos]                        │
└─────────────────────────────────────────────┘
```

## Flujo de Uso Visual

### 1. Activar Modo Mock
```
Usuario toca switch "Modo Mock APIs"
    ↓
Alert: "Modo Mock - APIs mock activadas"
    ↓
Todas las APIs ahora usan datos simulados
```

### 2. Simular Movimiento
```
Usuario toca "▶️ Iniciar Movimiento"
    ↓
Vehículo comienza a moverse (19.390, -99.170)
    ↓
Actualiza posición cada 2 segundos
    ↓
Avanza hacia Destino 1 (19.369, -99.171)
    ↓
Al llegar, avanza a Destino 2
```

### 3. Salto Manual
```
Usuario toca botón "3"
    ↓
Alert: "Salto de ubicación - Posición actualizada a destino 3"
    ↓
Posición cambia instantáneamente a (19.433, -99.133)
    ↓
Mapa actualiza marcador
```

### 4. Geofencing
```
Usuario toca "Activar Monitoreo"
    ↓
5 zonas de 200m se activan
    ↓
Vehículo se mueve/salta
    ↓
Al entrar en zona: Alert "Evento Geofence - Entrada a dest-2"
    ↓
Al salir: Alert "Evento Geofence - Salida de dest-2"
```

## Integración con Pantallas Existentes

### MapRutaScreen con Mock Activo
```
┌──────────────────────────────────┐
│ Ruta del día                     │
│ Completadas: 1/5  Distancia: 17km│
├──────────────────────────────────┤
│                                  │
│        📍 (Tu posición)          │
│         ↓                        │
│        [1] ← Destino actual      │
│         ↓                        │
│        [2]                       │
│         ↓                        │
│        [3] ← Simulando aquí      │
│         ↓                        │
│        [4]                       │
│         ↓                        │
│        [5]                       │
│                                  │
└──────────────────────────────────┘
```

### ConfirmarEntregaScreen con Mock
```
┌──────────────────────────────────┐
│ Confirmar Entrega                │
├──────────────────────────────────┤
│ Cliente: Restaurante El Buen..  │
│ Orden: #ORD-2025-001             │
├──────────────────────────────────┤
│ [📷 Capturar foto]               │
│ [✍️ Capturar firma]              │
│                                  │
│ Nombre: _________________        │
│ Observaciones: ___________       │
│                                  │
│ 📍 Ubicación: 19.3687, -99.1710 │
│    (Capturada automáticamente)   │
│                                  │
│ [Confirmar Entrega]              │
└──────────────────────────────────┘

Al confirmar con mock activo:
    ↓
Simula subida: 25% → 50% → 75% → 100%
    ↓
Success: "Entrega confirmada"
    ↓
Estado cambia a COMPLETADA
```

## Datos Mock Visualizados

### Lista de Entregas
```
┌────────────────────────────────────────┐
│ 📦 Entregas Pendientes                 │
├────────────────────────────────────────┤
│ [1] ORD-2025-001  🟡 PENDIENTE         │
│     Restaurante El Buen Sabor          │
│     📍 1.5 km • 5 min                  │
│     📦 2 productos                     │
├────────────────────────────────────────┤
│ [2] ORD-2025-002  🟡 PENDIENTE         │
│     Supermercado La Esquina            │
│     📍 3.2 km • 10 min                 │
│     📦 2 productos                     │
├────────────────────────────────────────┤
│ [3] ORD-2025-003  🔵 EN_RUTA           │
│     Farmacia San José                  │
│     📍 5.8 km • 15 min                 │
│     📦 1 producto                      │
└────────────────────────────────────────┘
```

## Logs de Consola

Cuando el mock está activo, verás logs como:
```
[MockConfig] Initialized: mockEnabled=true, mockLocationEnabled=true
[DeliveryApi] Using MOCK data for getEntregas
[MOCK] Ubicación guardada: 19.390000, -99.170000
[MockLocationSimulator] Iniciando simulación de movimiento
[MockLocationSimulator] Llegó a destino 1
[LocationService] Using mock location
[NotificationApi] Using MOCK data for subscribeToNotifications
[MOCK] Dispositivo registrado para notificaciones: abc-123
```

## Resumen de Archivos Creados

```
src/apps/entregas/mocks/
├── mockData.ts              (5,261 bytes) - Datos de prueba
├── mockApiServices.ts       (4,764 bytes) - APIs simuladas
├── mockConfig.ts            (2,724 bytes) - Configuración
├── mockLocationSimulator.ts (4,664 bytes) - Simulador GPS
├── README.md                (8,020 bytes) - Documentación
└── index.ts                 (134 bytes)   - Exports

src/apps/entregas/screens/
└── MockTestingScreen.tsx    (13,137 bytes) - Panel de control

src/apps/entregas/api/
├── deliveryApi.ts           (+mock support)
├── locationApi.ts           (+mock support)
└── notificationApi.ts       (+mock support)

src/apps/entregas/services/
└── locationService.ts       (+mock support)
```

**Total**: ~40,000 bytes de código nuevo para testing completo sin backend.
