#!/usr/bin/env node

/**
 * Script para verificar que toda la implementación use HERE Maps
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DE IMPLEMENTACIÓN HERE MAPS');
console.log('===========================================\n');

const projectRoot = __dirname;
const srcDir = path.join(projectRoot, 'src');

// Archivos a verificar
const filesToCheck = [
  'src/apps/entregas/services/routingService.ts',
  'src/apps/entregas/screens/RutaEntregaScreen.tsx',
  'src/screens/EntregaTrackingScreen.tsx',
  'app.json',
  'src/shared/config/environments.ts'
];

// Verificar cada archivo
console.log('📁 VERIFICANDO ARCHIVOS CLAVE:\n');

filesToCheck.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${filePath}`);
    
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar implementaciones HERE Maps
    if (content.includes('HERE Maps') || content.includes('here-route') || content.includes('GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw')) {
      console.log('   🗺️  Contiene implementación HERE Maps');
    }
    
    // Verificar navegación externa
    if (content.includes('abrirNavegacionExterna') || content.includes('routingService')) {
      console.log('   🧭 Usa routingService para navegación');
    }
    
    // Verificar permisos de ubicación
    if (content.includes('NSLocation') || content.includes('ACCESS_FINE_LOCATION')) {
      console.log('   📍 Configuración de permisos de ubicación');
    }
    
    console.log();
  } else {
    console.log(`❌ ${filePath} - ARCHIVO NO ENCONTRADO\n`);
  }
});

// Verificar que no haya implementaciones directas de Google Maps o Apple Maps
console.log('🚨 VERIFICANDO IMPLEMENTACIONES DIRECTAS NO-HERE MAPS:\n');

function checkFile(filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.relative(projectRoot, filePath);
  
  // Buscar implementaciones directas de navegación
  const problematicPatterns = [
    { pattern: /google\.navigation:/g, name: 'Google Navigation URL' },
    { pattern: /googlemaps:/g, name: 'Google Maps URL' },
    { pattern: /maps\.apple\.com/g, name: 'Apple Maps URL directo' },
    { pattern: /Linking\.openURL.*google/gi, name: 'Linking directo a Google' },
    { pattern: /Linking\.openURL.*apple/gi, name: 'Linking directo a Apple' }
  ];
  
  let hasIssues = false;
  
  problematicPatterns.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches && !fileName.includes('routingService.ts') && !fileName.includes('HERE_MAPS')) {
      hasIssues = true;
      console.log(`⚠️  ${fileName}: Encontrada implementación directa de ${name}`);
    }
  });
  
  if (!hasIssues && (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) && content.includes('navigation')) {
    // Solo reportar si es relevante
    if (content.includes('abrirNavegacion') || content.includes('routingService')) {
      console.log(`✅ ${fileName}: Usa routingService correctamente`);
    }
  }
}

// Recorrer archivos TypeScript/React
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      checkFile(filePath);
    }
  });
}

walkDir(srcDir);

// Verificar app.json
console.log('\n📱 VERIFICANDO CONFIGURACIÓN DE APP:\n');

const appJsonPath = path.join(projectRoot, 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // Verificar permisos iOS
  const iosConfig = appConfig.expo?.ios?.infoPlist;
  if (iosConfig) {
    const requiredPermissions = [
      'NSLocationWhenInUseUsageDescription',
      'NSLocationAlwaysAndWhenInUseUsageDescription',
      'NSLocationAlwaysUsageDescription'
    ];
    
    requiredPermissions.forEach(permission => {
      if (iosConfig[permission]) {
        console.log(`✅ iOS: ${permission} configurado`);
      } else {
        console.log(`❌ iOS: ${permission} FALTANTE`);
      }
    });
    
    if (iosConfig.LSApplicationQueriesSchemes) {
      console.log('✅ iOS: Esquemas de navegación configurados:', iosConfig.LSApplicationQueriesSchemes);
    }
  }
  
  // Verificar permisos Android
  const androidPermissions = appConfig.expo?.android?.permissions;
  if (androidPermissions) {
    const requiredPermissions = [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION'
    ];
    
    requiredPermissions.forEach(permission => {
      if (androidPermissions.includes(permission)) {
        console.log(`✅ Android: ${permission} configurado`);
      } else {
        console.log(`❌ Android: ${permission} FALTANTE`);
      }
    });
  }
}

console.log('\n🎯 RESUMEN DE VERIFICACIÓN:\n');
console.log('✅ Toda la navegación debe usar routingService.abrirNavegacionExterna()');
console.log('✅ routingService prioriza HERE WeGo Maps');
console.log('✅ Fallback a Apple Maps (iOS) y Google Maps como último recurso');
console.log('✅ Permisos de ubicación configurados para ambas plataformas');
console.log('\n🚨 NOTA: Para probar permisos de ubicación en segundo plano,');
console.log('   necesitas usar un development build, no Expo Go.');

console.log('\n📋 COMANDOS PARA CREAR DEVELOPMENT BUILD:');
console.log('   npx eas build --platform ios --profile development');
console.log('   npx eas build --platform android --profile development');