/**
 * Script de prueba para verificar las funciones del sistema de testing
 *
 * NOTA: Este es un script de verificación manual.
 * Para ejecutarlo en la app, copia el código relevante a una pantalla de prueba.
 */

import { testDataGenerator } from './src/shared/services/testDataGenerator';
import { testDataService } from './src/shared/services/testDataService';
import { TestDataConfig } from './src/shared/models/testData.models';

/**
 * TEST 1: Generar datos de prueba
 */
export async function testGenerateData() {
  console.log('🧪 TEST 1: Generando datos de prueba...');

  try {
    const config: TestDataConfig = {
      numClientes: 3,
      numEntregasPorCliente: 2,
      fechaInicio: new Date(),
      generarRutaGPS: true,
      simularEstados: true,
    };

    const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSet(config);

    console.log('✅ Datos generados exitosamente:');
    console.log(`  • Clientes: ${clientes.length}`);
    console.log(`  • Entregas: ${entregas.length}`);
    console.log(`  • Rutas GPS: ${rutas?.length || 0}`);

    // Verificar estructura de cliente
    if (clientes.length > 0) {
      const cliente = clientes[0];
      console.log('\n📋 Ejemplo de cliente generado:');
      console.log(`  • Nombre: ${cliente.nombre}`);
      console.log(`  • RFC: ${cliente.rfc}`);
      console.log(`  • Teléfono: ${cliente.telefono}`);
      console.log(`  • Email: ${cliente.email}`);
      console.log(`  • Ciudad: ${cliente.direccion.ciudad}`);
      console.log(`  • Coordenadas: ${cliente.direccion.coordenadas.latitud}, ${cliente.direccion.coordenadas.longitud}`);
    }

    // Verificar estructura de entrega
    if (entregas.length > 0) {
      const entrega = entregas[0];
      console.log('\n📦 Ejemplo de entrega generada:');
      console.log(`  • Folio: ${entrega.folio}`);
      console.log(`  • Orden Venta: ${entrega.ordenVenta}`);
      console.log(`  • Estado: ${entrega.estado}`);
      console.log(`  • Cliente: ${entrega.cliente.nombre}`);
      console.log(`  • Productos: ${entrega.productos.length}`);
      if (entrega.productos.length > 0) {
        console.log(`    - ${entrega.productos[0].nombre} (${entrega.productos[0].cantidad} ${entrega.productos[0].unidad})`);
      }
    }

    // Verificar ruta GPS
    if (rutas && rutas.length > 0) {
      const ruta = rutas[0];
      console.log('\n🗺️ Ruta GPS generada:');
      console.log(`  • Puntos: ${ruta.puntos.length}`);
      console.log(`  • Primer punto: ${ruta.puntos[0].latitud}, ${ruta.puntos[0].longitud}`);
      console.log(`  • Último punto: ${ruta.puntos[ruta.puntos.length - 1].latitud}, ${ruta.puntos[ruta.puntos.length - 1].longitud}`);
    }

    return { success: true, clientes, entregas, rutas };
  } catch (error: any) {
    console.error('❌ Error generando datos:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * TEST 2: Cargar datos al backend (requiere backend funcionando)
 */
export async function testLoadData() {
  console.log('\n🧪 TEST 2: Cargando datos al backend...');
  console.log('⚠️ Requiere que el backend esté corriendo y tenga los endpoints implementados');

  try {
    const config: TestDataConfig = {
      numClientes: 2,
      numEntregasPorCliente: 2,
      fechaInicio: new Date(),
      generarRutaGPS: true,
      simularEstados: true,
    };

    const result = await testDataService.loadTestData(config);

    if (result.success) {
      console.log('✅ Datos cargados exitosamente:');
      console.log(`  • Clientes creados: ${result.data.clientesCreados}`);
      console.log(`  • Entregas creadas: ${result.data.entregasCreadas}`);
      console.log(`  • Rutas generadas: ${result.data.rutasGeneradas}`);
      console.log(`  • Tiempo de ejecución: ${result.data.tiempoEjecucion}ms`);

      if (result.errores && result.errores.length > 0) {
        console.warn('⚠️ Errores durante la carga:');
        result.errores.forEach(error => console.warn(`  - ${error}`));
      }
    } else {
      console.error('❌ Fallo la carga:', result.message);
      if (result.errores) {
        result.errores.forEach(error => console.error(`  - ${error}`));
      }
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error cargando datos:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * TEST 3: Verificar si hay datos cargados
 */
export async function testCheckLoadedData() {
  console.log('\n🧪 TEST 3: Verificando datos cargados...');

  try {
    const hasData = await testDataService.hasTestDataLoaded();

    if (hasData) {
      console.log('✅ Hay datos de prueba cargados');

      const info = await testDataService.getTestDataInfo();
      if (info) {
        console.log('📊 Información de datos cargados:');
        console.log(`  • Fecha de carga: ${new Date(info.timestamp).toLocaleString()}`);
        console.log(`  • Clientes: ${info.results?.clientesCreados || 0}`);
        console.log(`  • Entregas: ${info.results?.entregasCreadas || 0}`);
        console.log(`  • Rutas GPS: ${info.results?.rutasGeneradas || 0}`);
      }
    } else {
      console.log('ℹ️ No hay datos de prueba cargados');
    }

    return { success: true, hasData };
  } catch (error: any) {
    console.error('❌ Error verificando datos:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * TEST 4: Limpiar datos (requiere backend funcionando)
 */
export async function testClearData() {
  console.log('\n🧪 TEST 4: Limpiando datos de prueba...');
  console.log('⚠️ Requiere que el backend esté corriendo');

  try {
    const result = await testDataService.clearTestData();

    if (result.success) {
      console.log('✅ Datos limpiados exitosamente');
      console.log(`  • Tiempo de ejecución: ${result.data.tiempoEjecucion}ms`);
    } else {
      console.error('❌ Fallo la limpieza:', result.message);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Error limpiando datos:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * TEST 5: Probar generación de múltiples datasets
 */
export async function testMultipleDatasets() {
  console.log('\n🧪 TEST 5: Probando múltiples configuraciones...');

  const configs = [
    { numClientes: 1, numEntregasPorCliente: 1, generarRutaGPS: false, simularEstados: false },
    { numClientes: 3, numEntregasPorCliente: 2, generarRutaGPS: true, simularEstados: false },
    { numClientes: 5, numEntregasPorCliente: 3, generarRutaGPS: true, simularEstados: true },
  ];

  const results = [];

  for (let i = 0; i < configs.length; i++) {
    const config = { ...configs[i], fechaInicio: new Date() };
    console.log(`\n  Test ${i + 1}/${configs.length}:`, config);

    try {
      const { clientes, entregas, rutas } = testDataGenerator.generateTestDataSet(config);

      const expectedClientes = config.numClientes;
      const expectedEntregas = config.numClientes * config.numEntregasPorCliente;
      const expectedRutas = config.generarRutaGPS ? 1 : 0;

      const clientesOk = clientes.length === expectedClientes;
      const entregasOk = entregas.length === expectedEntregas;
      const rutasOk = (rutas?.length || 0) === expectedRutas;

      if (clientesOk && entregasOk && rutasOk) {
        console.log(`    ✅ PASS - Clientes: ${clientes.length}, Entregas: ${entregas.length}, Rutas: ${rutas?.length || 0}`);
        results.push({ config, success: true });
      } else {
        console.log(`    ❌ FAIL - Esperado: C:${expectedClientes}, E:${expectedEntregas}, R:${expectedRutas}`);
        console.log(`             Obtenido: C:${clientes.length}, E:${entregas.length}, R:${rutas?.length || 0}`);
        results.push({ config, success: false });
      }
    } catch (error: any) {
      console.log(`    ❌ ERROR - ${error.message}`);
      results.push({ config, success: false, error: error.message });
    }
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;

  console.log(`\n📊 Resultados: ${passed}/${results.length} tests pasaron`);
  if (failed > 0) {
    console.log(`⚠️ ${failed} tests fallaron`);
  }

  return { success: failed === 0, results };
}

/**
 * Ejecutar todos los tests
 */
export async function runAllTests() {
  console.log('🚀 EJECUTANDO TODOS LOS TESTS DEL SISTEMA DE PRUEBAS\n');
  console.log('═'.repeat(60));

  const results = {
    test1: await testGenerateData(),
    test3: await testCheckLoadedData(),
    test5: await testMultipleDatasets(),
  };

  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN DE TESTS:');
  console.log('  • Test 1 (Generar datos): ' + (results.test1.success ? '✅ PASS' : '❌ FAIL'));
  console.log('  • Test 3 (Verificar datos): ' + (results.test3.success ? '✅ PASS' : '❌ FAIL'));
  console.log('  • Test 5 (Múltiples configs): ' + (results.test5.success ? '✅ PASS' : '❌ FAIL'));

  console.log('\n⚠️ Tests 2 y 4 requieren backend funcionando (no ejecutados)');
  console.log('  • Test 2 (Cargar al backend): testLoadData()');
  console.log('  • Test 4 (Limpiar datos): testClearData()');

  console.log('\n💡 Para ejecutar tests con backend:');
  console.log('  await testLoadData()');
  console.log('  await testClearData()');

  return results;
}

/**
 * INSTRUCCIONES DE USO:
 *
 * 1. Para probar en la app, copia las funciones necesarias a TestDataAdminScreen.tsx
 * 2. O crea un botón de prueba que ejecute estas funciones
 * 3. Los tests 1, 3 y 5 funcionan SIN backend
 * 4. Los tests 2 y 4 requieren backend con endpoints implementados
 *
 * Ejemplo de uso en un componente:
 *
 * import { testGenerateData } from './test-data-functions.test';
 *
 * const handleTest = async () => {
 *   const result = await testGenerateData();
 *   console.log(result);
 * };
 */
