# 🔧 Solución de Errores - Backend Testing

## ❌ Error Actual

```
ERROR Error creando entrega F-88731445: [Error: Ocurrió un error al procesar la solicitud]
ERROR Error creando entrega F-88731446: [Error: Ocurrió un error al procesar la solicitud]
...
ERROR Error creando ruta GPS: [Error: Ocurrió un error al procesar la solicitud]
```

**Estado:** El backend está recibiendo las peticiones pero algo falla en el procesamiento.

---

## 🔍 Diagnóstico

### ✅ Lo que SÍ funciona:

1. La app se conecta al backend ✅
2. La autenticación funciona (modo dev con `alfredo.gallegos`) ✅
3. Las peticiones llegan al backend ✅

### ❌ Lo que NO funciona:

1. Crear entregas en el backend ❌
2. Crear rutas GPS en el backend ❌

### 🎯 Posibles Causas:

1. **Los endpoints `/api/mobile/test/*` NO existen** (404)
2. **Los endpoints existen pero hay error en el procesamiento** (500)
3. **Falta el campo `EsTestData` en las entidades** (SQL error)
4. **Error de validación en el backend** (modelo incorrecto)

---

## 🛠️ Soluciones

### Solución 1: Verificar si los Endpoints Existen

```bash
# Verificar endpoint de entregas
curl -X POST http://192.168.100.99:5104/api/mobile/test/entregas \
  -H "Content-Type: application/json" \
  -H "X-Dev-User: alfredo.gallegos" \
  -H "X-Dev-Mode: true" \
  -d '{"ordenVenta":"TEST","folio":"TEST"}'
```

**Si obtienes 404:**
- Los endpoints NO están implementados
- Necesitas agregar el código del archivo `BACKEND_ENDPOINTS_TESTING.cs`

**Si obtienes 500:**
- Los endpoints existen pero hay un error
- Ve a la Solución 2

---

### Solución 2: Ver Logs del Backend

En la terminal donde corre el backend, deberías ver el error específico.

**Busca errores como:**

```
❌ Error en SQL:
   "Invalid column name 'EsTestData'"
   → Falta migración de BD

❌ Error de validación:
   "The field X is required"
   → Modelo incorrecto

❌ Error de foreign key:
   "Cannot insert duplicate key"
   → Datos duplicados
```

---

### Solución 3: Implementar los Endpoints (Si no existen)

Si los endpoints NO están implementados, sigue estos pasos:

#### 1. Agregar el Controller

Crea el archivo `TestDataController.cs` en tu backend:

**Ubicación:**
```
Backend/
└── Controllers/
    └── TestDataController.cs
```

**Contenido:**
Copia todo el código de `BACKEND_ENDPOINTS_TESTING.cs`

#### 2. Agregar el Campo `EsTestData`

**Opción A: Entity Framework Migration**

```bash
cd backend
dotnet ef migrations add AddTestDataFlags
dotnet ef database update
```

**Opción B: SQL Directo**

```sql
-- Agregar campo a Clientes
ALTER TABLE Clientes
ADD EsTestData BIT NOT NULL DEFAULT 0;

-- Agregar campo a Entregas
ALTER TABLE Entregas
ADD EsTestData BIT NOT NULL DEFAULT 0;

-- Agregar campo a RutasGPS (si existe)
ALTER TABLE RutasGPS
ADD EsTestData BIT NOT NULL DEFAULT 0;
```

#### 3. Reiniciar el Backend

```bash
# Detener el backend (Ctrl+C)
# Reiniciar
dotnet run
```

---

### Solución 4: Ajustar el Formato de Datos (Workaround Temporal)

Si no puedes implementar los endpoints ahora mismo, puedes desactivar temporalmente la carga al backend.

**En `testDataService.ts`, cambia esto:**

```typescript
private async createEntrega(entrega: EntregaTest): Promise<void> {
  try {
    await apiService.post('/mobile/test/entregas', entregaPayload);
  } catch (error: any) {
    if (error.status === 404) {
      console.warn('Endpoint /mobile/test/entregas no existe - datos guardados localmente');
      return; // <-- Ya hace esto
    }
    // AGREGAR ESTO:
    console.warn('Error creando entrega, continuando:', error.message);
    return; // Continuar sin fallar
  }
}
```

**Esto permite:**
- ✅ Generar datos localmente (sigue funcionando)
- ⚠️ NO cargar al backend (pero no falla)
- ✅ Seguir desarrollando y probando

---

## 🎯 Solución Recomendada

### Paso 1: Verificar el Estado del Backend

```bash
# Ver si los endpoints existen
curl http://192.168.100.99:5104/api/mobile/test/entregas

# Respuesta esperada:
# - 404: Endpoints NO existen → Implementar
# - 405: Endpoints existen pero método incorrecto → Revisar código
# - 500: Endpoints existen pero hay error → Ver logs backend
```

### Paso 2: Implementar si NO existen

1. Copia `BACKEND_ENDPOINTS_TESTING.cs` → Backend
2. Agrega campo `EsTestData` (SQL o migration)
3. Reinicia backend
4. Vuelve a probar

### Paso 3: Debuggear si SÍ existen

1. Revisa los logs del backend
2. Identifica el error específico
3. Corrige el problema
4. Reinicia backend

---

## 📝 Script de Diagnóstico Rápido

Crea un archivo `test-backend.sh`:

```bash
#!/bin/bash

echo "🔍 Diagnóstico del Backend Testing"
echo "==================================="

BACKEND_URL="http://192.168.100.99:5104"

echo ""
echo "1. Verificando endpoint de clientes..."
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BACKEND_URL}/api/mobile/test/clientes" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test"}'

echo ""
echo "2. Verificando endpoint de entregas..."
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BACKEND_URL}/api/mobile/test/entregas" \
  -H "Content-Type: application/json" \
  -d '{"ordenVenta":"TEST"}'

echo ""
echo "3. Verificando endpoint de rutas..."
curl -s -o /dev/null -w "%{http_code}" \
  -X POST "${BACKEND_URL}/api/mobile/test/rutas-gps" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test"}'

echo ""
echo ""
echo "Códigos de respuesta:"
echo "  404 = Endpoint no existe (implementar)"
echo "  405 = Método no permitido (revisar verbo HTTP)"
echo "  500 = Error en el servidor (ver logs backend)"
echo "  400 = Datos inválidos (revisar modelo)"
echo "  200/201 = ✅ Funciona correctamente"
```

**Ejecutar:**
```bash
chmod +x test-backend.sh
./test-backend.sh
```

---

## 🔧 Modificación Temporal del Mobile

Si necesitas seguir desarrollando AHORA y el backend no está listo, puedes hacer que el sistema funcione solo localmente:

### Editar `testDataService.ts`:

```typescript
/**
 * Modo LOCAL ONLY (sin backend)
 * Descomenta esto si el backend no está listo
 */
private async createCliente(cliente: any): Promise<void> {
  console.log('📝 Cliente generado (no enviado al backend):', cliente.nombre);
  return; // <-- Agregar esto para omitir backend

  // El código original queda comentado:
  // try {
  //   await apiService.post('/mobile/test/clientes', cliente);
  // } catch (error: any) {
  //   ...
  // }
}

private async createEntrega(entrega: EntregaTest): Promise<void> {
  console.log('📦 Entrega generada (no enviada al backend):', entrega.folio);
  return; // <-- Agregar esto para omitir backend

  // El código original queda comentado
}

private async createRutaGPS(ruta: any): Promise<void> {
  console.log('🗺️ Ruta GPS generada (no enviada al backend)');
  return; // <-- Agregar esto para omitir backend

  // El código original queda comentado
}
```

**Con esto:**
- ✅ Genera datos correctamente
- ✅ Guarda en AsyncStorage
- ✅ Muestra en la app (datos locales)
- ⚠️ NO carga al backend (temporal)
- ✅ Puedes seguir desarrollando

---

## 📊 Matriz de Diagnóstico

| HTTP Code | Significado | Acción |
|-----------|-------------|--------|
| 404 | Endpoint no existe | Implementar controller |
| 405 | Método incorrecto | Verificar POST/GET/DELETE |
| 500 | Error del servidor | Ver logs backend |
| 400 | Datos inválidos | Revisar modelo/DTOs |
| 401 | No autorizado | Revisar headers auth |
| 200/201 | ✅ Success | ¡Funciona! |

---

## 🎯 Siguiente Paso Recomendado

### Opción 1: Implementar Backend (Mejor)

1. Lee el archivo `BACKEND_ENDPOINTS_TESTING.cs`
2. Copia el código al backend
3. Agrega el campo `EsTestData`
4. Reinicia el backend
5. Prueba de nuevo

**Tiempo:** 15-30 minutos

### Opción 2: Modo Local (Temporal)

1. Modifica `testDataService.ts` como se explicó arriba
2. Sigue desarrollando con datos locales
3. Implementa el backend después

**Tiempo:** 5 minutos

---

## ✅ Checklist de Verificación

Después de aplicar la solución:

```
□ Backend está corriendo
□ Endpoints responden (no 404)
□ Campo EsTestData existe en BD
□ Test 4 funciona sin errores
□ Los datos aparecen en SQL
□ Test 5 limpia correctamente
```

---

## 💡 Tips

1. **Desarrolla primero con datos locales**
   - Usa Tests 1-3 (sin backend)
   - Implementa features
   - Integra backend después

2. **Usa logs del backend**
   - Siempre revisa la terminal del backend
   - Los errores específicos están ahí

3. **Verifica con SQL**
   - Usa SQL Server Management Studio
   - Ejecuta queries para verificar datos

---

## 📞 ¿Necesitas Más Ayuda?

Si después de aplicar estas soluciones sigues teniendo problemas:

1. **Copia el error EXACTO** del backend (terminal)
2. **Verifica el HTTP code** (404, 500, etc.)
3. **Revisa la tabla de diagnóstico** arriba
4. **Aplica la solución correspondiente**

---

**Última actualización:** 2025-11-11
**Estado:** En resolución
