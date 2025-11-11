# Configuración de Bypass de Autenticación para Desarrollo

## ⚠️ IMPORTANTE
Este documento detalla los cambios temporales realizados para saltarse la autenticación OAuth durante el desarrollo. **ESTOS CAMBIOS DEBEN SER REVERTIDOS ANTES DE LLEVAR LA APLICACIÓN A PRODUCCIÓN.**

## Cambios Realizados

### 1. LoginScreen.tsx
**Archivo:** `src/screens/auth/LoginScreen.tsx`

**Cambios realizados:**
- Se modificó la función `handleLogin` para saltarse el proceso de autenticación OAuth
- Se agregó un usuario mock de desarrollo
- Se comentó el código original de OAuth
- Se cambió el texto del botón a "Entrar (Modo Desarrollo)"

**Usuario mock creado:**
```typescript
const mockUserData = {
  sub: 'dev-user-001',
  name: 'Usuario de Desarrollo', 
  email: 'dev@fultra.com',
  role: 'admin'
};
```

## Pasos para Revertir los Cambios

### Paso 1: Restaurar la función handleLogin

Reemplazar la función `handleLogin` en `src/screens/auth/LoginScreen.tsx` con el código original:

```typescript
const handleLogin = async () => {
  setLoading(true);
  try {
    const success = await authService.signIn();

    if (success) {
      const userData = await authService.getUserData();
      dispatch(setUser(userData));
      dispatch(setAuthenticated(true));
    } else {
      Alert.alert(
        'Error de autenticación',
        'No se pudo iniciar sesión. Verifica tu conexión e intenta nuevamente.',
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  } catch (error: any) {
    console.error('Login error:', error);

    let errorMessage = 'Ocurrió un error al iniciar sesión';

    // Manejo específico del error de 'authorize of null'
    if (error?.message?.includes('authorize')) {
      errorMessage = 'Error de configuración de autenticación. Verifica que la aplicación esté correctamente configurada.';
    } else if (error?.message?.includes('network')) {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (error?.message?.includes('cancelled')) {
      errorMessage = 'Inicio de sesión cancelado';
    }

    Alert.alert(
      'Error',
      errorMessage,
      [{ text: 'Reintentar', onPress: handleLogin }, { text: 'Cancelar', style: 'cancel' }]
    );
  } finally {
    setLoading(false);
  }
};
```

### Paso 2: Restaurar el texto del botón

Cambiar el texto del botón de vuelta a:

```typescript
<Typography variant="body1" style={styles.loginButtonText}>
  Iniciar Sesión
</Typography>
```

### Paso 3: Verificar dependencias de OAuth

Asegurar que las siguientes dependencias estén instaladas y configuradas:

```json
{
  "expo-auth-session": "latest",
  "expo-web-browser": "latest", 
  "@react-native-async-storage/async-storage": "latest",
  "jwt-decode": "latest"
}
```

### Paso 4: Configuración del servidor OAuth

Verificar que el servidor de identidad esté configurado correctamente con:
- **Client ID:** `fultraTrackReactNative`
- **Redirect URI:** Configurada según el esquema de la app
- **Scopes:** `['openid', 'profile', 'email', 'api_FultraTrack']`

### Paso 5: Pruebas de autenticación

Una vez revertidos los cambios:
1. Probar el flujo completo de autenticación OAuth
2. Verificar que los tokens se almacenan correctamente
3. Comprobar que la renovación de tokens funciona
4. Probar el logout y limpieza de tokens

## Archivos a Eliminar después de Revertir

- `DEV_AUTH_BYPASS.md` (este archivo)

## Comandos Git para Revertir

Si los cambios están en commits específicos, puedes usar:

```bash
# Ver los commits con cambios de desarrollo
git log --oneline

# Revertir commit específico (reemplazar HASH con el hash del commit)
git revert HASH

# O hacer un reset si los cambios no han sido pusheados
git reset --hard HEAD~1
```

## Verificación Final

Antes de ir a producción, verificar:

- [ ] Función `handleLogin` restaurada
- [ ] Texto del botón cambiado a "Iniciar Sesión"  
- [ ] Código de desarrollo removido o comentado
- [ ] OAuth funcionando correctamente
- [ ] Tokens siendo almacenados y renovados
- [ ] Este archivo eliminado

---

**Fecha de creación:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Desarrollador:** GitHub Copilot
**Propósito:** Documentar cambios temporales de desarrollo para facilitar reversión