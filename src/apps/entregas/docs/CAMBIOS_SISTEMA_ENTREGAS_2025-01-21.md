# Reporte de Cambios - Sistema de Entregas

**Fecha:** 2025-01-21
**Versión:** 2.0
**Autor:** Claude Code

---

## Resumen Ejecutivo

Se han actualizado las funciones de generación de rutas del sistema de entregas para:
1. Verificar y usar `idRutaHereMaps` existente
2. Preguntar al usuario si desea recalcular cuando hay cambios
3. Implementar punto de partida flexible (almacén o GPS)
4. Crear sistema de simulación completo para desarrollo
5. Compatibilidad total con el nuevo formato JSON de la API

---

## Nuevo Formato JSON de la API

```json
{
  "folioEmbarque": "M1234-2345653",
  "idRutaHereMaps": "RUTA-1705849200000-ABC123",
  "direcciones": [
    {
      "direccion": "José María Caracas 1310, Guadalupe Victoria, 96520 Coatzacoalcos, Ver.",
      "cliente": "JUAN PGRAL REYES",
      "latitud": "18.144719522128238",
      "longitud": "-94.46089643238795",
      "cp": "96520",
      "calle": "José María Caracas",
      "noExterior": "1310",
      "colonia": "Guadalupe Victoria",
      "municipio": "Coatzacoalcos",
      "estado": "Veracruz"
    }
  ]
}
```

---

## Archivos Modificados

### 1. `routeManagementService.ts`

**Ubicación:** `src/apps/entregas/services/routeManagementService.ts`

#### Cambios Realizados:

1. **Verificación de `idRutaHereMaps`:**
   - Si existe, analiza si hay cambios sugeridos
   - Pregunta al usuario si desea recalcular
   - Intenta recuperar la ruta del backend si no hay cambios

2. **Nuevas Interfaces:**
   ```typescript
   interface RutaRecuperada {
     ruta: RutaOptima | null;
     metadata: RutaMetadata | null;
     exito: boolean;
     mensaje: string;
   }

   interface AnalisisCambiosRuta {
     hayNuevasDirecciones: boolean;
     hayDireccionesEliminadas: boolean;
     hayDireccionesModificadas: boolean;
     detallesCambios: string[];
   }
   ```

3. **Nuevos Métodos:**
   - `analizarCambiosSugeridos()`: Detecta cambios en direcciones o punto de inicio
   - `confirmarRecalculoConCambios()`: Muestra diálogo con detalles de cambios
   - `recuperarRutaDelBackend()`: Intenta obtener ruta guardada
   - `construirMetadata()`: Construye metadata de la ruta

4. **Punto de Partida Flexible:**
   - Detecta si el chofer está dentro de la geocerca del almacén (100m default)
   - Si está dentro: usa ubicación fija del almacén
   - Si está fuera: usa GPS actual como punto de inicio

#### Cómo Maneja los Escenarios:

| Escenario | Comportamiento |
|-----------|----------------|
| Nueva ruta (sin idRutaHereMaps) | Genera nueva ruta y nuevo ID |
| Ruta existente sin cambios | Intenta recuperar del backend |
| Ruta existente con cambios | Pregunta al usuario, recalcula si acepta |
| Chofer en almacén | Usa ubicación fija del almacén |
| Chofer fuera de almacén | Usa GPS actual, detecta cambio de punto inicio |

---

### 2. `addressValidationService.ts`

**Ubicación:** `src/apps/entregas/services/addressValidationService.ts`

#### Cambios Realizados:

El servicio ya estaba implementado correctamente para el nuevo formato. Se documentó su funcionamiento:

1. **Flujo de Validación de 3 Niveles:**
   - **Nivel 1:** Usar coordenadas si existen en la API (valida que no sean 0,0 o NaN)
   - **Nivel 2:** Geocodificar usando campos desglosados (calle, colonia, cp, etc.)
   - **Nivel 3:** Geocodificar usando dirección completa
   - **Nivel 4:** Marcar como inválida y notificar

2. **Validación de Coordenadas:**
   ```typescript
   // Rechaza coordenadas inválidas:
   - NaN
   - Fuera de rango (lat > 90, lng > 180)
   - Placeholders (0, 0)
   ```

---

### 3. `deliveryProcessingService.ts`

**Ubicación:** `src/apps/entregas/services/deliveryProcessingService.ts`

#### Cambios Realizados:

1. **Método `procesarEscenarioSimulacion()`:**
   ```typescript
   async procesarEscenarioSimulacion(
     tipoEscenario: 'con-coordenadas-y-ruta' | 'sin-coordenadas' | 'mixto' |
                   'ruta-existente-fuera-almacen' | 'coordenadas-invalidas' |
                   'multiples-paradas',
     opciones: OpcionesProcesamiento = {}
   ): Promise<ResultadoProcesamiento>
   ```

2. **Método `obtenerEscenariosDisponibles()`:**
   - Lista todos los escenarios de simulación disponibles
   - Retorna información útil para UI

3. **Mejoras en `procesarEntregasSimuladas()`:**
   - Control de diálogos de confirmación
   - Mejor logging de información

---

### 4. `mockData.ts`

**Ubicación:** `src/apps/entregas/mocks/mockData.ts`

#### Cambios Realizados:

Se reemplazó completamente el archivo para usar el nuevo formato JSON.

1. **Escenarios de Simulación:**

| Escenario | Descripción | Uso |
|-----------|-------------|-----|
| `con-coordenadas-y-ruta` | Coords completas + ruta existente | Probar flujo normal |
| `sin-coordenadas` | Sin coords (requiere geocodificación) | Probar geocodificación |
| `mixto` | Algunas con coords, otras sin | Probar validación mixta |
| `ruta-existente-fuera-almacen` | Ruta existe, chofer fuera de geocerca | Probar recálculo |
| `coordenadas-invalidas` | Coords 0,0 o NaN | Probar fallback |
| `multiples-paradas` | 5 destinos | Probar optimización |

2. **Helpers para Simulación:**
   ```typescript
   obtenerEscenarioMock(tipo): ApiDeliveryResponse
   obtenerTodosLosEscenarios(): Array<{tipo, descripcion, datos}>
   generarApiResponsePersonalizada(folio, direcciones, idRuta)
   generarDireccionPrueba(cliente, direccion, conCoords, coords)
   ```

3. **Ubicaciones de Prueba:**
   - `mockUbicacionAlmacen`: Ubicación fija del almacén
   - `mockUbicacionChoferEnAlmacen`: Chofer dentro de geocerca
   - `mockUbicacionChoferFueraAlmacen`: Chofer en ruta

---

## Flujo de Procesamiento Actualizado

```
┌─────────────────────────────────────┐
│     API Response (JSON)             │
│ - folioEmbarque                     │
│ - idRutaHereMaps (opcional)         │
│ - direcciones[]                     │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ 1. addressValidationService         │
│    - Nivel 1: Coords de API         │
│    - Nivel 2: Geocoding campos      │
│    - Nivel 3: Geocoding completo    │
│    - Nivel 4: Marcar inválida       │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ 2. routeManagementService           │
│    ¿Existe idRutaHereMaps?          │
│    ├─ SÍ: ¿Hay cambios?             │
│    │      ├─ SÍ: Confirmar usuario  │
│    │      └─ NO: Recuperar backend  │
│    └─ NO: Generar nueva ruta        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ 3. Determinar punto de inicio       │
│    ¿Chofer en geocerca almacén?     │
│    ├─ SÍ: Usar ubicación almacén    │
│    └─ NO: Usar GPS actual           │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ 4. HERE Maps Routing API            │
│    - Calcular ruta optimizada       │
│    - Generar nuevo idRutaHereMaps   │
│    - Guardar en backend             │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│ 5. Resultado                        │
│    - Ruta con polyline              │
│    - Metadata (distancia, tiempo)   │
│    - idRutaHereMaps guardado        │
└─────────────────────────────────────┘
```

---

## Uso del Sistema de Simulación

### Ejemplo 1: Probar escenario específico

```typescript
import { deliveryProcessingService } from '@/apps/entregas/services';

// Procesar escenario con coordenadas completas y ruta existente
const resultado = await deliveryProcessingService.procesarEscenarioSimulacion(
  'con-coordenadas-y-ruta',
  {
    radioGeocerca: 100,
    ubicacionAlmacen: {
      latitud: 19.4326,
      longitud: -99.1332,
      nombre: 'Almacén Central'
    }
  }
);

console.log('Resultado:', resultado);
```

### Ejemplo 2: Listar escenarios disponibles

```typescript
const escenarios = await deliveryProcessingService.obtenerEscenariosDisponibles();

escenarios.forEach(e => {
  console.log(`${e.tipo}: ${e.descripcion}`);
  console.log(`  Folio: ${e.folioEmbarque}`);
  console.log(`  Ruta existente: ${e.tieneRutaExistente ? 'SÍ' : 'NO'}`);
  console.log(`  Direcciones: ${e.numeroDirecciones}`);
});
```

### Ejemplo 3: Usar datos mock directamente

```typescript
import {
  mockApiResponseConCoordenadasYRuta,
  mockApiResponseSinCoordenadas,
  obtenerEscenarioMock
} from '@/apps/entregas/mocks';

// Opción 1: Usar exportación directa
const datos1 = mockApiResponseConCoordenadasYRuta;

// Opción 2: Usar función helper
const datos2 = obtenerEscenarioMock('sin-coordenadas');
```

---

## Configuración de Geocerca

```typescript
const opciones: OpcionesProcesamiento = {
  // Radio de la geocerca del almacén en metros
  radioGeocerca: 100, // Default: 100m

  // Ubicación del almacén (sobrescribe default)
  ubicacionAlmacen: {
    latitud: 19.4326,
    longitud: -99.1332,
    nombre: 'Mi Almacén'
  },

  // Forzar recálculo (ignora idRutaHereMaps existente)
  forzarRecalculo: false,

  // Mostrar diálogo de confirmación
  confirmarRecalculo: true // false para simulación
};
```

---

## Notas Importantes

1. **Compatibilidad Backward:**
   - El método `generarEjemploJSON()` sigue funcionando pero está marcado como `@deprecated`
   - Usar `procesarEscenarioSimulacion()` para nuevas implementaciones

2. **Recuperación de Ruta del Backend:**
   - Actualmente marcado como TODO
   - Simula que la recuperación no está disponible
   - Cuando se implemente, usar endpoint: `GET /mobile/embarques/ruta/{idRutaHereMaps}`

3. **Guardado de Ruta:**
   - Actualmente simula el guardado (log en consola)
   - Cuando se implemente, usar endpoint: `POST /mobile/embarques/guardar-ruta`

4. **Formato de ID de Ruta:**
   - Formato: `RUTA-{timestamp}-{random}`
   - Ejemplo: `RUTA-1705849200000-ABC123`

---

## Checklist de Verificación

- [x] `routeManagementService.ts` - Verificación de idRutaHereMaps
- [x] `routeManagementService.ts` - Confirmación de recálculo al usuario
- [x] `routeManagementService.ts` - Generación de nuevo idRutaHereMaps
- [x] `routeManagementService.ts` - Punto de partida flexible (almacén/GPS)
- [x] `addressValidationService.ts` - Validación de coordenadas
- [x] `addressValidationService.ts` - Geocodificación de 3 niveles
- [x] `deliveryProcessingService.ts` - Integración con nuevo formato
- [x] `deliveryProcessingService.ts` - Sistema de simulación por escenarios
- [x] `mockData.ts` - Datos de prueba con nuevo formato JSON
- [x] `mockData.ts` - Múltiples escenarios de simulación
- [x] Documentación completa

---

## Próximos Pasos (TODO)

1. Implementar endpoint real para recuperar ruta del backend
2. Implementar endpoint real para guardar ruta en backend
3. Agregar optimización multi-parada con HERE Multi-Stop Optimizer
4. Integrar con sistema de notificaciones para alertar cambios de ruta
5. Agregar persistencia local de rutas (AsyncStorage) para modo offline

---

**Fin del Reporte**
