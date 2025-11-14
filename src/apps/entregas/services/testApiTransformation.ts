/**
 * Test de Transformación de API - FultraApps Entregas
 * Valida que los servicios transformen correctamente la respuesta del backend
 */

import { mobileApiService } from './mobileApiService';
import { entregasApiService } from './entregasApiService';
import { ClienteEntregaDTO } from '../models';

/**
 * Test del servicio mobile API
 */
export const testMobileApiTransformation = async () => {
  console.log('\n🧪 === TEST MOBILE API SERVICE ===\n');
  
  try {
    console.log('📞 Llamando a mobileApiService.getEntregas()...');
    const startTime = Date.now();
    
    const entregas = await mobileApiService.getEntregas();
    const endTime = Date.now();
    
    console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
    console.log(`📊 Total de clientes: ${entregas.length}`);
    
    if (entregas.length > 0) {
      console.log('\n📋 MUESTRA DE DATOS TRANSFORMADOS:');
      entregas.slice(0, 3).forEach((cliente, index) => {
        console.log(`\n👤 Cliente ${index + 1}:`);
        console.log(`  - Cliente: ${cliente.cliente}`);
        console.log(`  - Cuenta: ${cliente.cuentaCliente}`);
        console.log(`  - Carga: ${cliente.carga}`);
        console.log(`  - Dirección: ${cliente.direccionEntrega.substring(0, 50)}...`);
        console.log(`  - Coordenadas: ${cliente.latitud}, ${cliente.longitud}`);
        console.log(`  - Entregas: ${cliente.entregas.length}`);
        
        if (cliente.entregas.length > 0) {
          console.log(`  - Primera entrega:`);
          const entrega = cliente.entregas[0];
          console.log(`    • ID: ${entrega.id}`);
          console.log(`    • Orden Venta: ${entrega.ordenVenta}`);
          console.log(`    • Folio: ${entrega.folio}`);
          console.log(`    • Estado: ${entrega.estado}`);
          console.log(`    • CargaCuentaCliente: ${entrega.cargaCuentaCliente}`);
          console.log(`    • Artículos: ${entrega.articulos.length}`);
        }
      });
    } else {
      console.log('❌ No se encontraron entregas');
    }
    
    console.log('\n✅ Mobile API Service - Test completado\n');
    return { success: true, data: entregas };
    
  } catch (error) {
    console.error('\n❌ Mobile API Service - Error:', error);
    return { success: false, error };
  }
};

/**
 * Test del servicio legacy API
 */
export const testLegacyApiTransformation = async () => {
  console.log('\n🧪 === TEST LEGACY API SERVICE ===\n');
  
  try {
    console.log('📞 Llamando a entregasApiService.fetchEntregasMoviles()...');
    const startTime = Date.now();
    
    const entregas = await entregasApiService.fetchEntregasMoviles();
    const endTime = Date.now();
    
    console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
    console.log(`📊 Total de clientes: ${entregas.length}`);
    
    if (entregas.length > 0) {
      console.log('\n📋 MUESTRA DE DATOS TRANSFORMADOS:');
      entregas.slice(0, 3).forEach((cliente, index) => {
        console.log(`\n👤 Cliente ${index + 1}:`);
        console.log(`  - Cliente: ${cliente.cliente}`);
        console.log(`  - Cuenta: ${cliente.cuentaCliente}`);
        console.log(`  - Carga: ${cliente.carga}`);
        console.log(`  - Dirección: ${cliente.direccionEntrega.substring(0, 50)}...`);
        console.log(`  - Coordenadas: ${cliente.latitud}, ${cliente.longitud}`);
        console.log(`  - Entregas: ${cliente.entregas.length}`);
        
        if (cliente.entregas.length > 0) {
          console.log(`  - Primera entrega:`);
          const entrega = cliente.entregas[0];
          console.log(`    • ID: ${entrega.id}`);
          console.log(`    • Orden Venta: ${entrega.ordenVenta}`);
          console.log(`    • Folio: ${entrega.folio}`);
          console.log(`    • Estado: ${entrega.estado}`);
          console.log(`    • CargaCuentaCliente: ${entrega.cargaCuentaCliente}`);
          console.log(`    • Artículos: ${entrega.articulos.length}`);
        }
      });
    } else {
      console.log('❌ No se encontraron entregas');
    }
    
    console.log('\n✅ Legacy API Service - Test completado\n');
    return { success: true, data: entregas };
    
  } catch (error) {
    console.error('\n❌ Legacy API Service - Error:', error);
    return { success: false, error };
  }
};

/**
 * Comparar ambos servicios
 */
export const compareApiServices = async () => {
  console.log('\n🔍 === COMPARACIÓN DE SERVICIOS API ===\n');
  
  const mobileResult = await testMobileApiTransformation();
  const legacyResult = await testLegacyApiTransformation();
  
  console.log('📊 RESUMEN DE COMPARACIÓN:');
  console.log(`Mobile Service: ${mobileResult.success ? '✅' : '❌'} - ${mobileResult.success ? mobileResult.data?.length : 0} clientes`);
  console.log(`Legacy Service: ${legacyResult.success ? '✅' : '❌'} - ${legacyResult.success ? legacyResult.data?.length : 0} clientes`);
  
  if (mobileResult.success && legacyResult.success) {
    const mobileCount = mobileResult.data?.length || 0;
    const legacyCount = legacyResult.data?.length || 0;
    
    if (mobileCount === legacyCount) {
      console.log('✅ Ambos servicios devuelven la misma cantidad de registros');
    } else {
      console.log(`⚠️ Diferencia en cantidad: Mobile(${mobileCount}) vs Legacy(${legacyCount})`);
    }
  }
  
  console.log('\n🏁 Comparación completada\n');
};

/**
 * Validar estructura de datos
 */
export const validateDataStructure = (cliente: ClienteEntregaDTO): boolean => {
  const errors: string[] = [];
  
  if (!cliente.cliente) errors.push('cliente vacío');
  if (!cliente.cuentaCliente) errors.push('cuentaCliente vacío');
  if (!cliente.carga) errors.push('carga vacía');
  if (!cliente.direccionEntrega) errors.push('direccionEntrega vacía');
  if (!cliente.latitud) errors.push('latitud vacía');
  if (!cliente.longitud) errors.push('longitud vacía');
  if (!Array.isArray(cliente.entregas)) errors.push('entregas no es array');
  
  cliente.entregas.forEach((entrega, index) => {
    if (!entrega.id) errors.push(`entrega[${index}].id vacío`);
    if (!entrega.ordenVenta) errors.push(`entrega[${index}].ordenVenta vacío`);
    if (!entrega.folio) errors.push(`entrega[${index}].folio vacío`);
    if (!entrega.cargaCuentaCliente) errors.push(`entrega[${index}].cargaCuentaCliente vacío`);
  });
  
  if (errors.length > 0) {
    console.log(`❌ Errores de validación para ${cliente.cliente}:`, errors);
    return false;
  }
  
  return true;
};