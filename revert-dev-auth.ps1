# Script de PowerShell para revertir cambios de desarrollo
# Ejecutar desde la raíz del proyecto: .\revert-dev-auth.ps1

Write-Host "🔄 Iniciando reversión de cambios de autenticación de desarrollo..." -ForegroundColor Yellow

# Verificar que estamos en la raíz del proyecto
if (-not (Test-Path "src/screens/auth/LoginScreen.tsx")) {
    Write-Host "❌ Error: Ejecuta este script desde la raíz del proyecto FultraApp2.0" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Verificando archivos..." -ForegroundColor Cyan

# Crear backup del archivo actual
$backupPath = "LoginScreen.dev-backup.tsx"
Copy-Item "src/screens/auth/LoginScreen.tsx" $backupPath
Write-Host "✅ Backup creado: $backupPath" -ForegroundColor Green

# Buscar y reemplazar en LoginScreen.tsx
$loginScreenPath = "src/screens/auth/LoginScreen.tsx"
$content = Get-Content $loginScreenPath -Raw

# Revertir función handleLogin
$devPattern = "(?s)const handleLogin = async \(\) => \{.*?CÓDIGO ORIGINAL PARA OAUTH - COMENTADO PARA DESARROLLO.*?\*/.*?\};"

$originalFunction = @"
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
"@

$content = $content -replace $devPattern, $originalFunction

# Revertir texto del botón
$content = $content -replace "Entrar \(Modo Desarrollo\)", "Iniciar Sesión"

# Guardar cambios
Set-Content $loginScreenPath -Value $content -NoNewline

Write-Host "✅ LoginScreen.tsx revertido exitosamente" -ForegroundColor Green

# Eliminar archivo de documentación de desarrollo
if (Test-Path "DEV_AUTH_BYPASS.md") {
    Remove-Item "DEV_AUTH_BYPASS.md"
    Write-Host "✅ Documentación de desarrollo eliminada" -ForegroundColor Green
}

# Eliminar este script también
Write-Host "🗑️ Eliminando script de reversión..." -ForegroundColor Yellow
Remove-Item $MyInvocation.MyCommand.Path

Write-Host "🎉 ¡Reversión completada exitosamente!" -ForegroundColor Green
Write-Host "📋 Pasos siguientes:" -ForegroundColor Cyan
Write-Host "   1. Verificar que la autenticación OAuth funciona correctamente" -ForegroundColor White
Write-Host "   2. Probar el flujo completo de login/logout" -ForegroundColor White
Write-Host "   3. Eliminar el backup si todo funciona: $backupPath" -ForegroundColor White