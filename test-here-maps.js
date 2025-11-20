#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE PRUEBA HERE MAPS API
 * 
 * Este script prueba la conectividad con HERE Maps API y valida que
 * la API key esté funcionando correctamente.
 */

const config = {
  hereMapsApiKey: 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw'
};

async function testHereMapsAPI() {
  console.log('🧪 TESTING HERE MAPS API');
  console.log('========================');
  
  // Coordenadas de prueba: Ciudad de México a Guadalajara
  const origen = { latitude: 19.4326, longitude: -99.1332 }; // CDMX
  const destino = { latitude: 20.6597, longitude: -103.3496 }; // Guadalajara
  
  console.log(`📍 Origen: ${origen.latitude}, ${origen.longitude} (CDMX)`);
  console.log(`📍 Destino: ${destino.latitude}, ${destino.longitude} (Guadalajara)`);
  console.log(`🔑 API Key: ${config.hereMapsApiKey.substring(0, 10)}...`);
  console.log('');

  try {
    const url = `https://router.hereapi.com/v8/routes?` +
      `origin=${origen.latitude},${origen.longitude}&` +
      `destination=${destino.latitude},${destino.longitude}&` +
      `transportMode=car&` +
      `routingMode=fast&` +
      `return=summary,polyline,actions&` +
      `apikey=${config.hereMapsApiKey}`;

    console.log('🌐 Realizando request a HERE Maps...');
    console.log(`URL: ${url.substring(0, 100)}...`);
    console.log('');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ERROR ${response.status}:`, errorText);
      
      if (response.status === 401) {
        console.error('🔑 API Key inválida o expirada');
      } else if (response.status === 403) {
        console.error('🚫 API Key sin permisos o límites excedidos');
      }
      return;
    }

    const data = await response.json();
    console.log('✅ Response exitosa!');
    console.log('');

    console.log('🔍 DEBUG - Estructura de respuesta:');
    console.log('Routes length:', data.routes?.length);
    console.log('First route keys:', data.routes?.[0] ? Object.keys(data.routes[0]) : 'No route');
    console.log('Summary:', data.routes?.[0]?.summary);
    console.log('');

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const section = route.sections[0];
      const summary = section.summary;
      
      console.log('📊 RESULTADOS:');
      console.log(`   Distancia: ${(summary.length / 1000).toFixed(1)} km`);
      console.log(`   Tiempo: ${Math.round(summary.duration / 60)} minutos`);
      console.log(`   Secciones: ${route.sections?.length || 0}`);
      console.log('');
      
      console.log(`🗺️  Polyline length: ${section.polyline?.length || 0} caracteres`);
      console.log(`🧭 Actions: ${section.actions?.length || 0}`);
      
      if (section.actions && section.actions.length > 0) {
        console.log('');
        console.log('📋 Primeras instrucciones:');
        section.actions.slice(0, 3).forEach((action, index) => {
          console.log(`   ${index + 1}. ${action.instruction || action.action || 'Continuar'}`);
        });
      }
      
      console.log('');
      console.log('🎉 HERE MAPS API FUNCIONANDO CORRECTAMENTE! 🎉');
      
    } else {
      console.warn('⚠️  No se encontraron rutas en la respuesta');
      console.log('Response data:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar la prueba
testHereMapsAPI();