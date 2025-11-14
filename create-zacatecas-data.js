/**
 * Script para crear datos de entregas específicos para Zacatecas
 * Incluye coordenadas reales de lugares conocidos
 */

const zacatecasEntregas = [
  {
    // Catedral de Zacatecas (Centro Histórico)
    cliente: "Abarrotes La Catedral",
    direccion: "Plaza de Armas s/n, Centro Histórico",
    coordenadas: { latitud: 22.7709, longitud: -102.5832 },
    descripcion: "Frente a la Catedral Basílica de Zacatecas"
  },
  {
    // Cerro de la Bufa
    cliente: "Tienda El Mirador",
    direccion: "Cerro de la Bufa, Zacatecas",
    coordenadas: { latitud: 22.7875, longitud: -102.5711 },
    descripcion: "Cerca del teleférico y el monumento"
  },
  {
    // Mercado González Ortega
    cliente: "Mercado González Ortega",
    direccion: "Av. Hidalgo 501, Centro",
    coordenadas: { latitud: 22.7703, longitud: -102.5825 },
    descripcion: "Mercado histórico del centro de la ciudad"
  },
  {
    // Universidad Autónoma de Zacatecas
    cliente: "Papelería Universitaria",
    direccion: "Av. Preparatoria s/n, Campus Siglo XXI",
    coordenadas: { latitud: 22.7580, longitud: -102.5950 },
    descripcion: "Zona universitaria"
  },
  {
    // Callejón de Veyna
    cliente: "Restaurante Colonial",
    direccion: "Callejón de Veyna 108, Centro",
    coordenadas: { latitud: 22.7695, longitud: -102.5840 },
    descripcion: "Callejón típico del centro histórico"
  },
  {
    // Teatro Fernando Calderón
    cliente: "Librería Cultural",
    direccion: "Calle Fernando Villalpando, Centro",
    coordenadas: { latitud: 22.7715, longitud: -102.5815 },
    descripcion: "Cerca del teatro histórico"
  },
  {
    // Ex Templo de San Agustín (Museo Pedro Coronel)
    cliente: "Galería de Arte",
    direccion: "Plaza de Santo Domingo s/n, Centro",
    coordenadas: { latitud: 22.7720, longitud: -102.5845 },
    descripcion: "Zona de museos del centro"
  },
  {
    // Acueducto del Padre Tembleque (zona norte)
    cliente: "Ferretería del Norte",
    direccion: "Blvd. López Portillo Norte 1205",
    coordenadas: { latitud: 22.7850, longitud: -102.5780 },
    descripcion: "Zona norte de la ciudad"
  },
  {
    // Lomas de la Soledad
    cliente: "Supermercado Lomas",
    direccion: "Av. López Velarde 450, Lomas de la Soledad",
    coordenadas: { latitud: 22.7650, longitud: -102.5720 },
    descripcion: "Colonia residencial"
  },
  {
    // Guadalupe (municipio conurbado)
    cliente: "Abarrotes Guadalupe",
    direccion: "Calle Morelos 123, Guadalupe",
    coordenadas: { latitud: 22.7580, longitud: -102.5620 },
    descripcion: "Municipio de Guadalupe, Zacatecas"
  }
];

// Función para generar entregas con datos realistas
function generateEntregasZacatecas() {
  const entregas = zacatecasEntregas.map((lugar, index) => {
    const fechaBase = new Date();
    fechaBase.setDate(fechaBase.getDate() + Math.floor(index / 2)); // 2 entregas por día

    const ordenes = [
      `OV-2024112-${String(index + 1).padStart(5, '0')}`,
    ];

    const folios = [
      `ZAC-${String(Date.now() + index).slice(-6)}`,
    ];

    return {
      cliente: {
        nombre: lugar.cliente,
        rfc: `ZAC${String(Math.random()).slice(2, 8)}ABC`,
        telefono: `492${Math.floor(Math.random() * 9000000) + 1000000}`,
        email: `contacto${index + 1}@${lugar.cliente.toLowerCase().replace(/\s/g, '')}.com`,
        cuentaCliente: `CLI-ZAC-${String(index + 1).padStart(3, '0')}`,
        direccion: {
          calle: lugar.direccion.split(',')[0],
          numero: "S/N",
          colonia: lugar.direccion.split(',')[1] || "Centro",
          ciudad: "Zacatecas",
          estado: "Zacatecas",
          codigoPostal: `98${String(Math.floor(Math.random() * 900) + 100)}`,
          coordenadas: lugar.coordenadas
        }
      },
      entregas: [
        {
          ordenVenta: ordenes[0],
          folio: folios[0],
          tipoEntrega: "ENTREGA",
          estado: "PENDIENTE",
          carga: `CARGA-ZAC-${String(index + 1).padStart(3, '0')}`,
          productos: [
            {
              id: (index * 10) + 1,
              nombreCarga: `CARGA-ZAC-${String(index + 1).padStart(3, '0')}`,
              nombreOrdenVenta: ordenes[0],
              producto: "Cemento Portland",
              cantidadProgramada: Math.floor(Math.random() * 50) + 10,
              cantidadEntregada: 0,
              restante: Math.floor(Math.random() * 50) + 10,
              peso: (Math.floor(Math.random() * 50) + 10) * 50, // 50kg por bulto
              unidadMedida: "bulto",
              descripcion: "Cemento para construcción de alta resistencia"
            },
            {
              id: (index * 10) + 2,
              nombreCarga: `CARGA-ZAC-${String(index + 1).padStart(3, '0')}`,
              nombreOrdenVenta: ordenes[0],
              producto: "Varilla 3/8\"",
              cantidadProgramada: Math.floor(Math.random() * 20) + 5,
              cantidadEntregada: 0,
              restante: Math.floor(Math.random() * 20) + 5,
              peso: (Math.floor(Math.random() * 20) + 5) * 5.3, // 5.3kg por pieza
              unidadMedida: "pieza",
              descripcion: "Varilla corrugada para refuerzo"
            }
          ]
        }
      ],
      direccionEntrega: lugar.direccion,
      latitud: lugar.coordenadas.latitud.toString(),
      longitud: lugar.coordenadas.longitud.toString(),
      descripcion: lugar.descripcion
    };
  });

  return entregas;
}

// Generar los datos
const entregasGeneradas = generateEntregasZacatecas();

console.log('🏗️ ENTREGAS GENERADAS PARA ZACATECAS');
console.log('=====================================');
console.log(`Total de entregas: ${entregasGeneradas.length}`);
console.log('');

entregasGeneradas.forEach((entrega, index) => {
  console.log(`${index + 1}. ${entrega.cliente.nombre}`);
  console.log(`   📍 ${entrega.direccionEntrega}`);
  console.log(`   🗺️  Lat: ${entrega.latitud}, Lon: ${entrega.longitud}`);
  console.log(`   📦 ${entrega.entregas[0].productos.length} productos`);
  console.log(`   🏷️  OV: ${entrega.entregas[0].ordenVenta}`);
  console.log('');
});

// Exportar los datos en formato JSON para uso directo
console.log('📋 DATOS EN FORMATO JSON:');
console.log('=========================');
console.log(JSON.stringify(entregasGeneradas, null, 2));
