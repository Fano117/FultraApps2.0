/**
 * 📦 Delivery Processing Service
 * 
 * Servicio orquestador principal para el procesamiento completo de entregas
 * según el nuevo formato JSON de la API.
 * 
 * Flujo completo:
 * 1. Recibir JSON de la API (folioEmbarque, idRutaHereMaps, direcciones[])
 * 2. Validar y geocodificar todas las direcciones (3 niveles de fallback)
 * 3. Determinar punto de partida (almacén o GPS actual)
 * 4. Generar o recuperar ruta HERE Maps
 * 5. Verificar incidentes de tráfico
 * 6. Guardar ruta en backend
 * 7. Notificar al usuario sobre direcciones inválidas
 * 
 * Este servicio integra:
 * - addressValidationService: Validación de direcciones
 * - routeManagementService: Gestión de rutas
 * - hereTrafficService: Información de tráfico
 */

import { Alert } from 'react-native';
import { 
  ApiDeliveryResponse, 
  EntregasProcesadas,
  OpcionesProcesamiento,
  DireccionValidada,
} from '../types/api-delivery';
import { addressValidationService } from './addressValidationService';
import { routeManagementService, ResultadoGeneracionRuta } from './routeManagementService';

/**
 * Resultado completo del procesamiento
 */
export interface ResultadoProcesamiento {
  /** Datos procesados */
  entregas: EntregasProcesadas;
  
  /** Ruta generada */
  ruta: ResultadoGeneracionRuta;
  
  /** Direcciones que fallaron validación */
  direccionesInvalidas: DireccionValidada[];
  
  /** Indica si hay incidentes críticos en la ruta */
  tieneIncidentesCriticos: boolean;
  
  /** Mensaje al usuario */
  mensaje: string;
  
  /** Éxito del procesamiento */
  exito: boolean;
}

/**
 * Estadísticas del procesamiento
 */
export interface EstadisticasProcesamiento {
  tiempoProcesamiento: number; // ms
  direccionesTotales: number;
  direccionesValidas: number;
  direccionesInvalidas: number;
  porcentajeExito: number;
  fuentesCoordenadas: Record<string, number>;
  confianzaPromedio: number;
}

class DeliveryProcessingService {
  /**
   * Procesar entregas completas desde el JSON de la API
   */
  async procesarEntregasDesdeAPI(
    apiResponse: ApiDeliveryResponse,
    opciones: OpcionesProcesamiento = {}
  ): Promise<ResultadoProcesamiento> {
    const tiempoInicio = Date.now();
    
    console.log('='.repeat(80));
    console.log('[DeliveryProcessing] 📦 INICIANDO PROCESAMIENTO DE ENTREGAS');
    console.log('='.repeat(80));
    console.log(`Folio Embarque: ${apiResponse.folioEmbarque}`);
    console.log(`ID Ruta HERE Maps: ${apiResponse.idRutaHereMaps || 'NO DEFINIDO (nueva ruta)'}`);
    console.log(`Total Direcciones: ${apiResponse.direcciones.length}`);
    console.log('='.repeat(80));

    try {
      // PASO 1: Validar y geocodificar todas las direcciones
      console.log('\n📍 PASO 1: Validación y Geocodificación de Direcciones');
      console.log('-'.repeat(80));
      
      const direccionesValidadas = await addressValidationService.validarDirecciones(
        apiResponse.direcciones
      );

      const direccionesValidas = direccionesValidadas.filter(d => d.esValida);
      const direccionesInvalidas = direccionesValidadas.filter(d => !d.esValida);

      console.log('\n📊 Resultados de Validación:');
      console.log(`   ✅ Válidas: ${direccionesValidas.length}/${direccionesValidadas.length}`);
      if (direccionesInvalidas.length > 0) {
        console.log(`   ❌ Inválidas: ${direccionesInvalidas.length}/${direccionesValidadas.length}`);
        console.log('\n   Direcciones inválidas:');
        direccionesInvalidas.forEach((d, idx) => {
          console.log(`   ${idx + 1}. ${d.original.cliente} - ${d.original.direccion}`);
          console.log(`      Error: ${d.mensajeError}`);
        });
      }

      // Verificar si hay suficientes direcciones válidas
      if (direccionesValidas.length === 0) {
        throw new Error('No se pudo validar ninguna dirección. Verifique los datos.');
      }

      // PASO 2: Generar o recuperar ruta
      console.log('\n🗺️ PASO 2: Generación de Ruta HERE Maps');
      console.log('-'.repeat(80));
      
      const resultadoRuta = await routeManagementService.generarORecuperarRuta(
        direccionesValidadas,
        apiResponse.idRutaHereMaps,
        opciones
      );

      console.log('\n✅ Ruta generada exitosamente:');
      console.log(`   ID: ${resultadoRuta.idRutaHereMaps}`);
      console.log(`   Tipo: ${resultadoRuta.esRutaNueva ? 'Nueva' : 'Recalculada'}`);
      console.log(`   Punto inicio: ${resultadoRuta.puntoInicio.nombre} (${resultadoRuta.puntoInicio.tipo})`);
      console.log(`   Distancia: ${(resultadoRuta.metadata.distanciaTotal / 1000).toFixed(2)} km`);
      console.log(`   Duración: ${Math.round(resultadoRuta.metadata.duracionEstimada / 60)} min`);
      console.log(`   Paradas: ${resultadoRuta.metadata.numeroParadas}`);

      // PASO 3: Verificar incidentes de tráfico
      console.log('\n🚦 PASO 3: Verificación de Tráfico');
      console.log('-'.repeat(80));
      
      const incidentes = await routeManagementService.verificarIncidentesEnRuta(
        resultadoRuta.ruta
      );

      if (incidentes.tieneIncidentes) {
        console.log(`⚠️ Incidentes detectados en la ruta`);
        if (incidentes.recomendarDesvio) {
          console.log(`🚨 Se recomienda recalcular ruta: ${incidentes.razon}`);
        }
      } else {
        console.log('✅ No se detectaron incidentes en la ruta');
      }

      // PASO 4: Guardar ruta en backend
      console.log('\n💾 PASO 4: Guardado de Ruta en Backend');
      console.log('-'.repeat(80));
      
      const guardadoExitoso = await routeManagementService.guardarRutaEnBackend(
        apiResponse.folioEmbarque,
        resultadoRuta.idRutaHereMaps,
        resultadoRuta.metadata
      );

      if (guardadoExitoso) {
        console.log('✅ Ruta guardada en backend');
      } else {
        console.log('⚠️ No se pudo guardar la ruta en backend (continuando)');
      }

      // PASO 5: Notificar direcciones inválidas
      if (direccionesInvalidas.length > 0) {
        this.notificarDireccionesInvalidas(direccionesInvalidas);
      }

      // Construir resultado
      const entregas: EntregasProcesadas = {
        folioEmbarque: apiResponse.folioEmbarque,
        idRutaHereMaps: resultadoRuta.idRutaHereMaps,
        rutaNueva: resultadoRuta.esRutaNueva,
        direcciones: direccionesValidadas,
        direccionesValidas: direccionesValidas.length,
        direccionesInvalidas: direccionesInvalidas.length,
        timestampProcesamiento: new Date(),
      };

      const tiempoTotal = Date.now() - tiempoInicio;
      
      console.log('\n' + '='.repeat(80));
      console.log('✅ PROCESAMIENTO COMPLETADO EXITOSAMENTE');
      console.log('='.repeat(80));
      console.log(`Tiempo total: ${tiempoTotal}ms`);
      console.log(`Éxito: ${direccionesValidas.length}/${direccionesValidadas.length} direcciones`);
      console.log('='.repeat(80) + '\n');

      return {
        entregas,
        ruta: resultadoRuta,
        direccionesInvalidas,
        tieneIncidentesCriticos: incidentes.recomendarDesvio,
        mensaje: this.generarMensajeResumen(entregas, incidentes.recomendarDesvio),
        exito: true,
      };

    } catch (error) {
      console.error('\n' + '='.repeat(80));
      console.error('❌ ERROR EN PROCESAMIENTO');
      console.error('='.repeat(80));
      console.error(error);
      console.error('='.repeat(80) + '\n');

      throw error;
    }
  }

  /**
   * Procesar entregas en modo simulación (para desarrollo)
   */
  async procesarEntregasSimuladas(
    ejemploJSON: ApiDeliveryResponse,
    opciones: OpcionesProcesamiento = {}
  ): Promise<ResultadoProcesamiento> {
    console.log('[DeliveryProcessing] 🧪 MODO SIMULACIÓN');
    
    // Agregar flag de simulación a las opciones
    const opcionesSimulacion = {
      ...opciones,
      confirmarRecalculo: false, // No mostrar diálogos en simulación
    };

    return await this.procesarEntregasDesdeAPI(ejemploJSON, opcionesSimulacion);
  }

  /**
   * Obtener estadísticas del último procesamiento
   */
  getEstadisticas(resultado: ResultadoProcesamiento): EstadisticasProcesamiento {
    const stats = addressValidationService.getEstadisticas(resultado.entregas.direcciones);
    
    return {
      tiempoProcesamiento: Date.now() - resultado.entregas.timestampProcesamiento.getTime(),
      direccionesTotales: stats.total,
      direccionesValidas: stats.validas,
      direccionesInvalidas: stats.invalidas,
      porcentajeExito: (stats.validas / stats.total) * 100,
      fuentesCoordenadas: stats.porFuente,
      confianzaPromedio: stats.confianzaPromedio,
    };
  }

  /**
   * Notificar al usuario sobre direcciones inválidas
   */
  private notificarDireccionesInvalidas(direccionesInvalidas: DireccionValidada[]): void {
    if (direccionesInvalidas.length === 0) return;

    const mensajeDetalle = direccionesInvalidas
      .map((d, idx) => `${idx + 1}. ${d.original.cliente}\n   ${d.original.direccion}`)
      .join('\n\n');

    Alert.alert(
      '⚠️ Direcciones Inválidas',
      `No se pudieron validar ${direccionesInvalidas.length} dirección(es):\n\n${mensajeDetalle}\n\nEstas entregas no se incluirán en la ruta. Por favor, verifique los datos.`,
      [{ text: 'Entendido', style: 'default' }]
    );
  }

  /**
   * Generar mensaje resumen del procesamiento
   */
  private generarMensajeResumen(
    entregas: EntregasProcesadas,
    tieneIncidentesCriticos: boolean
  ): string {
    const partes: string[] = [];

    partes.push(`Ruta ${entregas.rutaNueva ? 'creada' : 'recalculada'} exitosamente`);
    partes.push(`${entregas.direccionesValidas} parada(s) válida(s)`);

    if (entregas.direccionesInvalidas > 0) {
      partes.push(`⚠️ ${entregas.direccionesInvalidas} dirección(es) no pudo(ieron) validarse`);
    }

    if (tieneIncidentesCriticos) {
      partes.push('🚨 Incidentes críticos detectados en la ruta');
    }

    return partes.join(' • ');
  }

  /**
   * Generar datos de ejemplo para simulación
   */
  generarEjemploJSON(tipo: 'con-coordenadas' | 'sin-coordenadas' | 'mixto' = 'mixto'): ApiDeliveryResponse {
    const ejemplos = {
      'con-coordenadas': {
        folioEmbarque: 'SIM-CON-COORD-001',
        idRutaHereMaps: null,
        direcciones: [
          {
            direccion: 'José María Caracas 1310, Guadalupe Victoria, 96520 Coatzacoalcos, Ver.',
            cliente: 'JUAN PGRAL REYES',
            latitud: '18.144719522128238',
            longitud: '-94.46089643238795',
            cp: '96520',
            calle: 'José María Caracas',
            noExterior: '1310',
            colonia: 'Guadalupe Victoria',
            municipio: 'Coatzacoalcos',
            estado: 'Veracruz',
          },
          {
            direccion: 'Río Lerma 122, Colinas del Lago, 54744 Cuautitlán Izcalli, Méx.',
            cliente: 'TRANSPORTES MARVA',
            latitud: '19.64295650284401',
            longitud: '-99.22825623421272',
            cp: '54744',
            calle: 'Río Lerma',
            noExterior: '122',
            colonia: 'Colinas del Lago',
            municipio: 'Cuautitlán Izcalli',
            estado: 'México',
          },
        ],
      },
      'sin-coordenadas': {
        folioEmbarque: 'SIM-SIN-COORD-001',
        idRutaHereMaps: null,
        direcciones: [
          {
            direccion: 'C. 7 Sur 5943, Girasol, 72440 Heroica Puebla de Zaragoza, Pue.',
            cliente: 'TRANSPORTES FABRES',
            cp: '72440',
            calle: 'C. 7 Sur',
            noExterior: '5943',
            colonia: 'Girasol',
            municipio: 'Heroica Puebla de Zaragoza',
            estado: 'Puebla',
          },
          {
            direccion: 'Av. Reforma 250, Centro, 06000 Ciudad de México, CDMX',
            cliente: 'DISTRIBUIDORA CENTRAL',
            cp: '06000',
            calle: 'Av. Reforma',
            noExterior: '250',
            colonia: 'Centro',
            municipio: 'Ciudad de México',
            estado: 'CDMX',
          },
        ],
      },
      'mixto': {
        folioEmbarque: 'M1234-2345653',
        idRutaHereMaps: 'ID-1234',
        direcciones: [
          {
            direccion: 'José María Caracas 1310, Guadalupe Victoria, 96520 Coatzacoalcos, Ver.',
            cliente: 'JUAN PGRAL REYES',
            latitud: '18.144719522128238',
            longitud: '-94.46089643238795',
            cp: '96520',
            calle: 'José María Caracas',
            noExterior: '1310',
            colonia: 'Guadalupe Victoria',
            municipio: 'Coatzacoalcos',
            estado: 'Veracruz',
          },
          {
            direccion: 'Río Lerma 122, Colinas del Lago, 54744 Cuautitlán Izcalli, Méx.',
            cliente: 'TRANSPORTES MARVA',
            cp: '54744',
            calle: 'Río Lerma',
            noExterior: '122',
            colonia: 'Colinas del Lago',
            municipio: 'Cuautitlán Izcalli',
            estado: 'México',
          },
          {
            direccion: 'C. 7 Sur 5943, Girasol, 72440 Heroica Puebla de Zaragoza, Pue.',
            cliente: 'TRANSPORTES FABRES',
            latitud: '19.64295650284401',
            longitud: '-99.22825623421272',
            cp: '72440',
            calle: 'C. 7 Sur',
            noExterior: '5943',
            colonia: 'Girasol',
            municipio: 'Heroica Puebla de Zaragoza',
            estado: 'Puebla',
          },
        ],
      },
    };

    return ejemplos[tipo];
  }
}

export const deliveryProcessingService = new DeliveryProcessingService();
