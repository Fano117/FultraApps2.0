const flexpolyline = require('@here/flexpolyline');

const test = async () => {
  // Coordenadas de prueba (Zacatecas)
  const origen = { lat: 22.7709, lng: -102.5832 };
  const destino = { lat: 22.7810, lng: -102.5650 };
  
  const API_KEY = 'GYo3JTyTU2DjUu_dGyaDc2LIZyANv1zL5-Lot729yhw';
  
  // Request corregido: formato flexpolyline y detalles completos
  const url = `https://router.hereapi.com/v8/routes?` +
    `origin=${origen.lat},${origen.lng}&` +
    `destination=${destino.lat},${destino.lng}&` +
    `transportMode=car&` +
    `return=summary,polyline,actions,instructions&` +
    `polyline=flex&` +
    `apikey=${API_KEY}`;
  
  console.log('🔍 Solicitando ruta a HERE Maps...');
  console.log('📍 Origen:', origen);
  console.log('📍 Destino:', destino);
  console.log('');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('✅ Respuesta recibida');
    console.log('📦 Status:', response.status);
    console.log('');
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      console.log('🗺️  Rutas encontradas:', data.routes.length);
      
      if (route.sections && route.sections.length > 0) {
        const section = route.sections[0];
        
        console.log('📊 Summary:');
        console.log('   - Distancia:', section.summary.length, 'metros');
        console.log('   - Duración:', section.summary.duration, 'segundos');
        console.log('');
        
        console.log('🔤 Polyline (primeros 100 caracteres):');
        console.log('   ', section.polyline.substring(0, 100) + '...');
        console.log('   Total caracteres:', section.polyline.length);
        console.log('');
        
        // Decodificar polyline usando librería oficial
        try {
          const decoded = flexpolyline.decode(section.polyline);
          const coordinates = decoded.polyline.map(point => ({
            latitude: point[0],
            longitude: point[1]
          }));
          
          console.log('📍 Coordenadas decodificadas:', coordinates.length, 'puntos');
          console.log('   Primera coord:', coordinates[0]);
          console.log('   Última coord:', coordinates[coordinates.length - 1]);
          console.log('');
          
          // Mostrar algunas coordenadas
          console.log('🗺️  Primeras 5 coordenadas:');
          coordinates.slice(0, 5).forEach((coord, i) => {
            console.log(`   ${i + 1}. [${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}]`);
          });
          
          // Verificar si hay coordenadas válidas
          const coordinatesValid = coordinates.every(c => 
            !isNaN(c.latitude) && !isNaN(c.longitude) &&
            Math.abs(c.latitude) <= 90 && Math.abs(c.longitude) <= 180
          );
          
          console.log('');
          console.log('✅ Validación de coordenadas:', coordinatesValid ? 'TODAS VÁLIDAS ✅' : '❌ HAY INVÁLIDAS');
          
          // Verificar que las coordenadas estén en el rango esperado (Zacatecas)
          const inRange = coordinates.every(c => 
            c.latitude >= 22.7 && c.latitude <= 22.8 &&
            c.longitude >= -102.6 && c.longitude <= -102.5
          );
          console.log('✅ Coordenadas en rango Zacatecas:', inRange ? 'SÍ ✅' : 'NO ❌');
          
        } catch (error) {
          console.error('❌ Error decodificando polyline:', error.message);
        }
        
      } else {
        console.log('❌ No se encontraron secciones en la ruta');
      }
    } else {
      console.log('❌ No se encontraron rutas');
      console.log('Respuesta completa:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

test();
