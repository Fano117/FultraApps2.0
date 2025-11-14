/**
 * Script para enviar datos de entregas de Zacatecas al backend
 */

// Datos generados específicamente para Zacatecas
const entregasZacatecas = [
  {
    "cliente": {
      "nombre": "Abarrotes La Catedral",
      "cuentaCliente": "CLI-ZAC-001",
      "carga": "CARGA-ZAC-001",
      "direccionEntrega": "Plaza de Armas s/n, Centro Histórico",
      "latitud": "22.7709",
      "longitud": "-102.5832"
    },
    "entregas": [
      {
        "ordenVenta": "OV-2024112-00001",
        "folio": "ZAC-183799",
        "tipoEntrega": "ENTREGA",
        "estado": "PENDIENTE",
        "articulos": [
          {
            "id": 1,
            "nombreCarga": "CARGA-ZAC-001",
            "nombreOrdenVenta": "OV-2024112-00001",
            "producto": "Cemento Portland",
            "cantidadProgramada": 52,
            "cantidadEntregada": 0,
            "restante": 52,
            "peso": 2600,
            "unidadMedida": "bulto",
            "descripcion": "Cemento para construcción de alta resistencia"
          },
          {
            "id": 2,
            "nombreCarga": "CARGA-ZAC-001",
            "nombreOrdenVenta": "OV-2024112-00001",
            "producto": "Varilla 3/8\"",
            "cantidadProgramada": 18,
            "cantidadEntregada": 0,
            "restante": 18,
            "peso": 95.4,
            "unidadMedida": "pieza",
            "descripcion": "Varilla corrugada para refuerzo"
          }
        ]
      }
    ]
  },
  {
    "cliente": {
      "nombre": "Tienda El Mirador",
      "cuentaCliente": "CLI-ZAC-002",
      "carga": "CARGA-ZAC-002",
      "direccionEntrega": "Cerro de la Bufa, Zacatecas",
      "latitud": "22.7875",
      "longitud": "-102.5711"
    },
    "entregas": [
      {
        "ordenVenta": "OV-2024112-00002",
        "folio": "ZAC-183800",
        "tipoEntrega": "ENTREGA",
        "estado": "PENDIENTE",
        "articulos": [
          {
            "id": 11,
            "nombreCarga": "CARGA-ZAC-002",
            "nombreOrdenVenta": "OV-2024112-00002",
            "producto": "Cemento Portland",
            "cantidadProgramada": 25,
            "cantidadEntregada": 0,
            "restante": 25,
            "peso": 1250,
            "unidadMedida": "bulto",
            "descripcion": "Cemento para construcción de alta resistencia"
          },
          {
            "id": 12,
            "nombreCarga": "CARGA-ZAC-002",
            "nombreOrdenVenta": "OV-2024112-00002",
            "producto": "Varilla 3/8\"",
            "cantidadProgramada": 15,
            "cantidadEntregada": 0,
            "restante": 15,
            "peso": 79.5,
            "unidadMedida": "pieza",
            "descripcion": "Varilla corrugada para refuerzo"
          }
        ]
      }
    ]
  },
  {
    "cliente": {
      "nombre": "Mercado González Ortega",
      "cuentaCliente": "CLI-ZAC-003",
      "carga": "CARGA-ZAC-003",
      "direccionEntrega": "Av. Hidalgo 501, Centro",
      "latitud": "22.7703",
      "longitud": "-102.5825"
    },
    "entregas": [
      {
        "ordenVenta": "OV-2024112-00003",
        "folio": "ZAC-183801",
        "tipoEntrega": "ENTREGA",
        "estado": "PENDIENTE",
        "articulos": [
          {
            "id": 21,
            "nombreCarga": "CARGA-ZAC-003",
            "nombreOrdenVenta": "OV-2024112-00003",
            "producto": "Cemento Portland",
            "cantidadProgramada": 45,
            "cantidadEntregada": 0,
            "restante": 45,
            "peso": 2250,
            "unidadMedida": "bulto",
            "descripcion": "Cemento para construcción de alta resistencia"
          },
          {
            "id": 22,
            "nombreCarga": "CARGA-ZAC-003",
            "nombreOrdenVenta": "OV-2024112-00003",
            "producto": "Varilla 3/8\"",
            "cantidadProgramada": 12,
            "cantidadEntregada": 0,
            "restante": 12,
            "peso": 63.6,
            "unidadMedida": "pieza",
            "descripcion": "Varilla corrugada para refuerzo"
          }
        ]
      }
    ]
  },
  {
    "cliente": {
      "nombre": "Papelería Universitaria",
      "cuentaCliente": "CLI-ZAC-004",
      "carga": "CARGA-ZAC-004",
      "direccionEntrega": "Av. Preparatoria s/n, Campus Siglo XXI",
      "latitud": "22.7580",
      "longitud": "-102.5950"
    },
    "entregas": [
      {
        "ordenVenta": "OV-2024112-00004",
        "folio": "ZAC-183802",
        "tipoEntrega": "ENTREGA",
        "estado": "PENDIENTE",
        "articulos": [
          {
            "id": 31,
            "nombreCarga": "CARGA-ZAC-004",
            "nombreOrdenVenta": "OV-2024112-00004",
            "producto": "Cemento Portland",
            "cantidadProgramada": 35,
            "cantidadEntregada": 0,
            "restante": 35,
            "peso": 1750,
            "unidadMedida": "bulto",
            "descripcion": "Cemento para construcción de alta resistencia"
          },
          {
            "id": 32,
            "nombreCarga": "CARGA-ZAC-004",
            "nombreOrdenVenta": "OV-2024112-00004",
            "producto": "Varilla 3/8\"",
            "cantidadProgramada": 20,
            "cantidadEntregada": 0,
            "restante": 20,
            "peso": 106,
            "unidadMedida": "pieza",
            "descripcion": "Varilla corrugada para refuerzo"
          }
        ]
      }
    ]
  },
  {
    "cliente": {
      "nombre": "Ferretería del Norte",
      "cuentaCliente": "CLI-ZAC-005",
      "carga": "CARGA-ZAC-005",
      "direccionEntrega": "Blvd. López Portillo Norte 1205",
      "latitud": "22.7850",
      "longitud": "-102.5780"
    },
    "entregas": [
      {
        "ordenVenta": "OV-2024112-00005",
        "folio": "ZAC-183803",
        "tipoEntrega": "ENTREGA",
        "estado": "PENDIENTE",
        "articulos": [
          {
            "id": 41,
            "nombreCarga": "CARGA-ZAC-005",
            "nombreOrdenVenta": "OV-2024112-00005",
            "producto": "Cemento Portland",
            "cantidadProgramada": 30,
            "cantidadEntregada": 0,
            "restante": 30,
            "peso": 1500,
            "unidadMedida": "bulto",
            "descripcion": "Cemento para construcción de alta resistencia"
          },
          {
            "id": 42,
            "nombreCarga": "CARGA-ZAC-005",
            "nombreOrdenVenta": "OV-2024112-00005",
            "producto": "Varilla 3/8\"",
            "cantidadProgramada": 25,
            "cantidadEntregada": 0,
            "restante": 25,
            "peso": 132.5,
            "unidadMedida": "pieza",
            "descripcion": "Varilla corrugada para refuerzo"
          }
        ]
      }
    ]
  }
];

// Función para enviar los datos al backend
async function enviarDatosZacatecas() {
  const baseUrl = 'http://localhost:5104/api';
  const apiKey = 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=';
  
  console.log('🚀 ENVIANDO DATOS DE ENTREGAS PARA ZACATECAS');
  console.log('===========================================');
  
  try {
    // Limpiar datos anteriores
    console.log('🗑️ Limpiando datos anteriores...');
    const limpiarResponse = await fetch(`${baseUrl}/Mobile/test-clear-all`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': apiKey,
        'X-Dev-User': 'alfredo.gallegos',
        'X-Dev-Mode': 'true',
        'Content-Type': 'application/json'
      }
    });
    
    if (limpiarResponse.ok) {
      console.log('✅ Datos anteriores limpiados');
    } else {
      console.log('⚠️ No se pudieron limpiar datos anteriores (puede que no existan)');
    }

    // Enviar las entregas de Zacatecas
    console.log(`📦 Enviando ${entregasZacatecas.length} entregas de Zacatecas...`);
    
    for (let i = 0; i < entregasZacatecas.length; i++) {
      const entrega = entregasZacatecas[i];
      
      console.log(`   ${i + 1}/5 - ${entrega.cliente.nombre}...`);
      
      const response = await fetch(`${baseUrl}/Mobile/test-add-delivery`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'X-Dev-User': 'alfredo.gallegos',
          'X-Dev-Mode': 'true',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entrega)
      });

      if (response.ok) {
        const result = await response.text();
        console.log(`   ✅ ${entrega.cliente.nombre} - Enviado exitosamente`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ ${entrega.cliente.nombre} - Error: ${response.status} - ${errorText}`);
      }
      
      // Esperar un poco entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('');
    console.log('🎉 PROCESO COMPLETADO');
    console.log('==================');
    console.log('✅ Se han enviado las entregas de Zacatecas al backend');
    console.log('🗺️ Coordenadas incluyen lugares emblemáticos:');
    console.log('   • Plaza de Armas (Catedral)');
    console.log('   • Cerro de la Bufa');
    console.log('   • Mercado González Ortega');
    console.log('   • Campus Universitario');
    console.log('   • Blvd. López Portillo Norte');
    console.log('');
    console.log('🔄 Ahora puedes probar la app y verás entregas cercanas en Zacatecas!');
    
  } catch (error) {
    console.error('❌ Error enviando datos:', error);
  }
}

// Verificar datos actuales antes de enviar
async function verificarDatos() {
  const baseUrl = 'http://localhost:5104/api';
  const apiKey = 'qXwXO937WpdJ4MCnUMx77a7B6CIuwqDDAe1kr6rPc9A=';
  
  console.log('🔍 VERIFICANDO DATOS ACTUALES');
  console.log('============================');
  
  try {
    const response = await fetch(`${baseUrl}/EmbarquesEntrega`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'X-Dev-User': 'alfredo.gallegos',
        'X-Dev-Mode': 'true'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 Entregas actuales en el backend: ${data.length}`);
      
      if (data.length > 0) {
        console.log('📍 Primeras 3 ubicaciones:');
        data.slice(0, 3).forEach((entrega, index) => {
          console.log(`   ${index + 1}. ${entrega.cliente} - ${entrega.direccionEntrega}`);
        });
      }
      console.log('');
    } else {
      console.log('❌ Error consultando datos actuales');
    }
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  }
}

// Ejecutar el proceso
async function main() {
  await verificarDatos();
  await enviarDatosZacatecas();
}

main().catch(console.error);