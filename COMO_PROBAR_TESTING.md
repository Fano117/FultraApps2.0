# 🧪 Cómo Probar el Sistema de Testing - Guía Práctica

## ✅ Pre-requisitos

### 1. Backend debe tener los endpoints implementados

Los endpoints están definidos en el archivo `BACKEND_ENDPOINTS_TESTING.cs`. Necesitas:

1. Copiar el código del archivo al backend
2. Crear el controller `TestDataController.cs` en tu proyecto backend
3. Agregar el campo `EsTestData` a las entidades (Cliente, Entrega, RutaGPS)
4. Reiniciar el backend

**Verificar si los endpoints existen:**
```bash
# Cambia la IP por la de tu backend
curl http://192.168.100.99:5104/api/mobile/test/clientes
```

Si obtienes 404, necesitas implementarlos primero.

---

## 📱 Paso 1: Agregar la Pantalla de Testing al Navegador

La pantalla ya existe en `src/screens/TestDataAdminScreen.tsx`, pero necesitas agregarla a la navegación.

### Opción A: Agregar como Tab Temporal (Recomendado para desarrollo)

Edita `src/navigation/MainTabNavigator.tsx`:

```typescript
import TestDataAdminScreen from '@/screens/TestDataAdminScreen';

// Dentro del Tab.Navigator, agrega:
<Tab.Screen
  name="TestData"
  component={TestDataAdminScreen}
  options={{
    tabBarLabel: 'Testing',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="flask" size={size} color={color} />
    ),
  }}
/>
```

### Opción B: Agregar como Botón en el Perfil

Edita `src/screens/profile/ProfileScreen.tsx` y agrega un botón:

```typescript
import { useNavigation } from '@react-navigation/native';

// En el componente:
const navigation = useNavigation();

// Agregar botón:
<TouchableOpacity
  onPress={() => navigation.navigate('TestData')}
  style={styles.testButton}
>
  <Text>🧪 Datos de Prueba</Text>
</TouchableOpacity>
```

Y actualiza `src/navigation/types.ts` para incluir la ruta:

```typescript
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  TestData: undefined; // <-- Agregar esta línea
};
```

---

## 🚀 Paso 2: Ejecutar la App y Abrir la Pantalla de Testing

```bash
# Limpiar cache y ejecutar
npm start -- --clear

# O si usas yarn
yarn start --clear
```

1. Inicia sesión en la app
2. Navega a la pestaña "Testing" o al botón que agregaste
3. Deberías ver la pantalla "🧪 Datos de Prueba"

---

## 📝 Paso 3: Generar y Cargar Datos de Prueba

### En la pantalla de Testing:

1. **Configura los parámetros:**
   - Número de Clientes: 5 (puedes ajustar con +/-)
   - Entregas por Cliente: 3
   - Generar Rutas GPS: ✓ (activado)
   - Simular Estados: ✓ (activado)

2. **Presiona "📥 Cargar Datos"**

3. **Confirma en el diálogo**

4. **Espera a que complete** (puede tardar 10-30 segundos)

5. **Verifica el resultado:**
   - Debe aparecer un Alert con:
     - ✅ Clientes: 5
     - ✅ Entregas: 15
     - ✅ Rutas: 1
     - ✅ Tiempo: XXXXms

---

## 🔍 Paso 4: Verificar los Datos en el Backend

### Opción 1: Usar SQL Server Management Studio

```sql
-- Ver clientes de prueba
SELECT * FROM Clientes WHERE EsTestData = 1;

-- Ver entregas de prueba
SELECT * FROM Entregas WHERE EsTestData = 1;

-- Ver productos en entregas
SELECT
  e.OrdenVenta,
  e.Folio,
  c.Nombre as Cliente,
  p.Nombre as Producto,
  ep.Cantidad
FROM Entregas e
JOIN Clientes c ON e.ClienteId = c.Id
JOIN EntregasProductos ep ON ep.EntregaId = e.Id
JOIN Productos p ON ep.ProductoId = p.Id
WHERE e.EsTestData = 1;

-- Contar todos los registros de prueba
SELECT
  (SELECT COUNT(*) FROM Clientes WHERE EsTestData = 1) as TotalClientes,
  (SELECT COUNT(*) FROM Entregas WHERE EsTestData = 1) as TotalEntregas,
  (SELECT COUNT(*) FROM Productos WHERE EsTestData = 1) as TotalProductos;
```

### Opción 2: Verificar desde la app

En la pantalla principal de entregas, deberías ver las nuevas entregas cargadas.

---

## 🎯 Paso 5: Probar las Funcionalidades

### Test 1: Ver Lista de Entregas

1. Ve a la pantalla de "Entregas" o "Inicio"
2. Deberías ver las 15 entregas generadas
3. Verifica que tengan:
   - ✅ Folio y Orden de Venta
   - ✅ Nombre del cliente
   - ✅ Dirección completa
   - ✅ Estado (PENDIENTE, EN_RUTA, etc.)

### Test 2: Ver Detalle de Entrega

1. Haz clic en una entrega
2. Verifica que se muestre:
   - ✅ Información del cliente
   - ✅ Dirección con coordenadas GPS
   - ✅ Lista de productos con cantidades
   - ✅ Horario de entrega
   - ✅ Observaciones

### Test 3: Ver en Mapa (si tienes pantalla de mapa)

1. Abre el mapa de entregas
2. Deberías ver los marcadores en Guadalajara
3. Las coordenadas están cerca de 20.6597, -103.3496

---

## 🧹 Paso 6: Limpiar Datos de Prueba

Cuando termines de probar:

1. Regresa a la pantalla de "🧪 Datos de Prueba"
2. Presiona "🗑️ Limpiar Datos"
3. Confirma en el diálogo destructivo
4. Espera confirmación
5. Los datos se eliminarán del backend

**Verificar en SQL:**
```sql
-- Debe devolver 0
SELECT COUNT(*) FROM Clientes WHERE EsTestData = 1;
SELECT COUNT(*) FROM Entregas WHERE EsTestData = 1;
```

---

## 🐛 Problemas Comunes

### Error: "Unable to resolve ./enhancedApiService"

✅ **YA CORREGIDO** - Los imports fueron actualizados a `apiService`

### Error: "Endpoint no existe (404)"

**Solución:** Implementa los endpoints en el backend usando el archivo `BACKEND_ENDPOINTS_TESTING.cs`

### Error: "Network request failed"

**Causas posibles:**
1. Backend no está corriendo
2. IP incorrecta en `src/shared/config/environments.ts`
3. Firewall bloqueando la conexión

**Verificar config:**
```typescript
// src/shared/config/environments.ts
export const config = {
  apiUrl: 'http://192.168.100.99:5104/api', // Verificar esta IP
  // ...
};
```

### Error: "Unauthorized (401)"

**Solución:**
1. Haz logout y login nuevamente
2. Verifica que el token no haya expirado
3. Verifica credenciales en `environments.ts`

### Los datos se cargan pero no aparecen en la lista

**Causas posibles:**
1. Filtro de fecha no coincide
2. Filtro de chofer no coincide
3. Datos no asignados al chofer correcto

**Solución temporal:** Desactiva los filtros de fecha/chofer para ver todos los datos.

---

## 📊 Datos de Ejemplo Generados

El sistema genera datos **REALISTAS** para Guadalajara:

### Clientes
- Nombres mexicanos reales
- RFCs válidos (formato: ABCD701210ABC)
- Teléfonos con lada 33 (Guadalajara)
- Direcciones reales en colonias de GDL

### Entregas
- Folios únicos (formato: E-20251111-001)
- Órdenes de venta (formato: OV-20251111-001)
- Fechas del día actual
- Estados variados: PENDIENTE, EN_RUTA, EN_SITIO, ENTREGADO

### Productos
- Materiales de construcción:
  - Cemento gris
  - Varilla corrugada
  - Blocks de concreto
  - Arena sílica
  - Gravilla 3/4
  - Cal hidratada
- Cantidades realistas
- Pesos en kg

### Coordenadas GPS
- Centro de Guadalajara: 20.6597, -103.3496
- Variaciones de ±0.1 grados (~10 km)
- Rutas simuladas con 100+ puntos

---

## ✅ Checklist de Verificación

Usa este checklist para asegurarte que todo funciona:

- [ ] Backend tiene los endpoints implementados
- [ ] Pantalla de Testing agregada a la navegación
- [ ] Puedo abrir la pantalla de Testing
- [ ] Puedo configurar parámetros (clientes, entregas)
- [ ] Botón "Cargar Datos" funciona sin errores
- [ ] Se muestran resultados (clientes: X, entregas: Y)
- [ ] Los datos aparecen en la base de datos (SQL)
- [ ] Los datos aparecen en la lista de entregas
- [ ] Puedo ver el detalle de una entrega
- [ ] Las coordenadas GPS están en Guadalajara
- [ ] Botón "Limpiar Datos" elimina todo
- [ ] Después de limpiar, la BD está vacía (EsTestData = 1)

---

## 🎉 Siguiente Paso

Una vez que todo funcione correctamente, puedes:

1. **Desarrollar nuevas features** usando estos datos de prueba
2. **Probar la UI/UX** con datos realistas
3. **Hacer demos** a clientes con datos mexicanos
4. **Testing de performance** cargando 50+ entregas
5. **Probar flujos completos** de entrega

---

## 📚 Archivos Relacionados

- 📄 `BACKEND_ENDPOINTS_TESTING.cs` - Código para el backend
- 📄 `TEST_COMPLETE_INTEGRATION.md` - Tests avanzados
- 📱 `src/screens/TestDataAdminScreen.tsx` - Pantalla de administración
- 🔧 `src/shared/services/testDataService.ts` - Servicio de datos
- 🎲 `src/shared/services/testDataGenerator.ts` - Generador de datos
- 📦 `src/shared/models/testData.models.ts` - Modelos

---

**¿Necesitas ayuda?** Revisa el archivo `TEST_COMPLETE_INTEGRATION.md` para tests más avanzados.

**Fecha:** 2025-11-11
**Estado:** ✅ Listo para usar
