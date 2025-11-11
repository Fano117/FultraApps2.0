# Configuración Backend Local - Puerto 5103

## 🚀 Estado Actual

### ✅ Configuración Aplicada
- **URL Backend:** `http://localhost:5103/api`
- **Ambiente Activo:** `development`
- **Bypass OAuth:** ✅ Activado
- **Debug Service:** ✅ Implementado

### 📝 Cambios Realizados

1. **environments.ts:**
   - Configurado `development` con `localhost:5103`
   - Agregado ambiente `local` para dispositivos físicos

2. **LoginScreen.tsx:**
   - Agregado botón "Probar Conexión Backend"
   - Importado `debugService`

3. **debugService.ts:**
   - Servicio para probar conectividad
   - Pruebas de endpoints específicos
   - Diagnósticos detallados

## 🔧 Verificaciones del Backend

### Endpoints Principales
- `GET /health` - Estado del servidor
- `GET /EmbarquesEntrega` - Lista de entregas
- `POST /EmbarquesEntrega` - Crear entrega
- `POST /EmbarquesEntrega/subir-imagen-evidencia` - Subir imágenes

### Headers Requeridos
```http
Content-Type: application/json
X-API-Key: qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=
Authorization: Bearer <token>
```

## 🛠️ Comandos Útiles

### Verificar Backend Local
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:5103/api/health

# Verificar endpoint de entregas
curl -H "X-API-Key: qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=" \
     http://localhost:5103/api/EmbarquesEntrega
```

### Debug en la App
1. Abrir la app en Expo
2. Presionar "Probar Conexión Backend"
3. Revisar console logs en Metro

### Cambiar Ambientes
```typescript
// En environments.ts, cambiar:
export const CURRENT_ENV: keyof typeof environments = 'development'; // localhost
// o
export const CURRENT_ENV: keyof typeof environments = 'local'; // IP de red
```

## 🐛 Troubleshooting

### Error: "No se puede conectar al servidor"
1. Verificar que el backend esté corriendo en puerto 5103
2. Comprobar firewall de Windows
3. Verificar que no haya CORS issues

### Error: "404 Not Found"
1. Verificar rutas del backend (`/api/health`, `/api/EmbarquesEntrega`)
2. Comprobar configuración del routing en el backend

### Error: "401 Unauthorized"  
1. Verificar que la API Key sea correcta
2. Comprobar configuración de autenticación en el backend

### Error en Dispositivo Físico
1. Cambiar a ambiente `local` con IP de red
2. Verificar conectividad de red
3. Comprobar que el firewall permita conexiones entrantes

## 📱 Testing en Dispositivo

Para probar en dispositivo físico:
1. Obtener IP de tu PC: `ipconfig`
2. Cambiar ambiente a `local` o actualizar la IP
3. Asegurar que PC y dispositivo estén en la misma red
4. Verificar firewall de Windows

## 🔄 Reverting Changes

Para volver a producción:
1. Ejecutar `.\revert-dev-auth.ps1`
2. Cambiar `CURRENT_ENV` a `production`
3. Remover botón de debug del LoginScreen

---
**Última actualización:** November 11, 2025
**Backend URL:** http://localhost:5103/api