/**
 * 📍 Address Validation Service
 * 
 * Servicio para validación y geocodificación de direcciones con múltiples niveles de fallback.
 * Implementa el flujo de validación especificado:
 * 
 * 1. Usar coordenadas si existen en la API
 * 2. Si no, geocodificar usando campos desglosados (calle, colonia, cp, etc.)
 * 3. Si falla, geocodificar usando la dirección completa
 * 4. Si todo falla, marcar la parada como inválida y notificar
 * 
 * Integración con HERE Maps Geocoding API para geocodificación robusta.
 */

import { hereGeocodingService } from './hereGeocodingService';
import { 
  ApiDireccion, 
  CoordenadasValidadas, 
  DireccionValidada 
} from '../types/api-delivery';

/**
 * Configuración del servicio de validación
 */
interface ValidationConfig {
  /** Timeout para geocodificación en ms (default: 5000) */
  geocodingTimeout?: number;
  
  /** Confianza mínima para aceptar resultado (0-1, default: 0.6) */
  confianzaMinima?: number;
  
  /** País para filtrar resultados (default: 'MEX') */
  paisFiltro?: string;
  
  /** Idioma para resultados (default: 'es-MX') */
  idioma?: string;
  
  /** Habilitar logs detallados (default: true) */
  verboseLogs?: boolean;
}

class AddressValidationService {
  private config: Required<ValidationConfig> = {
    geocodingTimeout: 5000,
    confianzaMinima: 0.6,
    paisFiltro: 'MEX',
    idioma: 'es-MX',
    verboseLogs: true,
  };

  /**
   * Configurar el servicio
   */
  configure(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Validar y geocodificar una dirección con flujo de fallback de 3 niveles
   */
  async validarYGecocodificarDireccion(
    direccion: ApiDireccion
  ): Promise<DireccionValidada> {
    this.log('info', `📍 Validando dirección para cliente: ${direccion.cliente}`);
    this.log('info', `   Dirección: ${direccion.direccion}`);

    // NIVEL 1: Verificar si ya tiene coordenadas
    const coordenadasApi = this.extraerCoordenadasApi(direccion);
    if (coordenadasApi) {
      this.log('success', '✅ Coordenadas encontradas en API');
      return {
        original: direccion,
        coordenadas: coordenadasApi,
        esValida: true,
        confianza: 1.0,
        direccionGeocoded: direccion.direccion,
      };
    }

    // NIVEL 2: Geocodificar usando campos desglosados
    this.log('info', '🔍 Nivel 1: Intentando geocodificación con campos desglosados...');
    const coordenadasCampos = await this.geocodificarPorCampos(direccion);
    if (coordenadasCampos) {
      this.log('success', '✅ Geocodificación exitosa con campos desglosados');
      return {
        original: direccion,
        coordenadas: coordenadasCampos.coordenadas,
        esValida: true,
        confianza: coordenadasCampos.confianza,
        direccionGeocoded: coordenadasCampos.direccionFormateada,
      };
    }

    // NIVEL 3: Geocodificar usando dirección completa
    this.log('info', '🔍 Nivel 2: Intentando geocodificación con dirección completa...');
    const coordenadasCompleta = await this.geocodificarPorDireccionCompleta(direccion);
    if (coordenadasCompleta) {
      this.log('success', '✅ Geocodificación exitosa con dirección completa');
      return {
        original: direccion,
        coordenadas: coordenadasCompleta.coordenadas,
        esValida: true,
        confianza: coordenadasCompleta.confianza,
        direccionGeocoded: coordenadasCompleta.direccionFormateada,
      };
    }

    // NIVEL 4: Falló todo, marcar como inválida
    this.log('error', '❌ No se pudo geocodificar la dirección');
    return {
      original: direccion,
      coordenadas: null,
      esValida: false,
      mensajeError: 'No se pudieron determinar las coordenadas de la dirección. Verifique la información.',
    };
  }

  /**
   * Validar múltiples direcciones en lote
   */
  async validarDirecciones(
    direcciones: ApiDireccion[]
  ): Promise<DireccionValidada[]> {
    this.log('info', `📦 Validando ${direcciones.length} direcciones...`);

    const resultados: DireccionValidada[] = [];
    
    for (let i = 0; i < direcciones.length; i++) {
      const direccion = direcciones[i];
      this.log('info', `\n[${i + 1}/${direcciones.length}] Procesando: ${direccion.cliente}`);
      
      try {
        const resultado = await this.validarYGecocodificarDireccion(direccion);
        resultados.push(resultado);
      } catch (error) {
        this.log('error', `Error validando dirección ${i + 1}: ${error}`);
        resultados.push({
          original: direccion,
          coordenadas: null,
          esValida: false,
          mensajeError: `Error durante validación: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    const validas = resultados.filter(r => r.esValida).length;
    const invalidas = resultados.length - validas;

    this.log('info', `\n📊 Resumen de validación:`);
    this.log('info', `   ✅ Válidas: ${validas}/${resultados.length}`);
    if (invalidas > 0) {
      this.log('warning', `   ❌ Inválidas: ${invalidas}/${resultados.length}`);
    }

    return resultados;
  }

  /**
   * NIVEL 1: Extraer coordenadas directamente de la API
   */
  private extraerCoordenadasApi(direccion: ApiDireccion): CoordenadasValidadas | null {
    // Verificar si existen latitud y longitud
    if (!direccion.latitud || !direccion.longitud) {
      return null;
    }

    // Convertir a número (pueden venir como string)
    const lat = typeof direccion.latitud === 'string' 
      ? parseFloat(direccion.latitud) 
      : direccion.latitud;
    const lng = typeof direccion.longitud === 'string' 
      ? parseFloat(direccion.longitud) 
      : direccion.longitud;

    // Validar que sean números válidos
    if (isNaN(lat) || isNaN(lng)) {
      this.log('warning', '⚠️ Coordenadas presentes pero inválidas (NaN)');
      return null;
    }

    // Validar rangos válidos de coordenadas
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      this.log('warning', '⚠️ Coordenadas fuera de rango válido');
      return null;
    }

    // Validar que no sean coordenadas (0, 0) o placeholders
    if (lat === 0 && lng === 0) {
      this.log('warning', '⚠️ Coordenadas son (0, 0) - probablemente placeholder');
      return null;
    }

    return {
      latitud: lat,
      longitud: lng,
      fuente: 'api',
    };
  }

  /**
   * NIVEL 2: Geocodificar usando campos desglosados
   */
  private async geocodificarPorCampos(
    direccion: ApiDireccion
  ): Promise<{ coordenadas: CoordenadasValidadas; confianza: number; direccionFormateada: string } | null> {
    // Verificar que tengamos campos suficientes
    const tieneCampos = direccion.calle || direccion.colonia || direccion.cp || direccion.municipio;
    if (!tieneCampos) {
      this.log('warning', '⚠️ No hay campos desglosados suficientes para geocodificar');
      return null;
    }

    try {
      // Construir dirección estructurada desde campos
      const partes: string[] = [];
      
      if (direccion.calle) {
        if (direccion.noExterior) {
          partes.push(`${direccion.calle} ${direccion.noExterior}`);
        } else {
          partes.push(direccion.calle);
        }
      }
      
      if (direccion.colonia) partes.push(direccion.colonia);
      if (direccion.cp) partes.push(direccion.cp);
      if (direccion.municipio) partes.push(direccion.municipio);
      if (direccion.estado) partes.push(direccion.estado);
      
      const direccionEstructurada = partes.join(', ');
      
      this.log('info', `   Buscando: "${direccionEstructurada}"`);

      // Llamar a HERE Geocoding Service
      const resultados = await hereGeocodingService.geocode(direccionEstructurada, {
        limit: 1,
        countryCode: this.config.paisFiltro,
        language: this.config.idioma,
      });

      if (resultados.length === 0) {
        this.log('warning', '   ⚠️ No se encontraron resultados');
        return null;
      }

      const resultado = resultados[0];
      const confianza = resultado.scoring?.queryScore || 0.7;

      // Verificar confianza mínima
      if (confianza < this.config.confianzaMinima) {
        this.log('warning', `   ⚠️ Confianza baja: ${(confianza * 100).toFixed(0)}%`);
        return null;
      }

      this.log('info', `   📍 Coordenadas: ${resultado.position.latitude.toFixed(6)}, ${resultado.position.longitude.toFixed(6)}`);
      this.log('info', `   🎯 Confianza: ${(confianza * 100).toFixed(0)}%`);

      return {
        coordenadas: {
          latitud: resultado.position.latitude,
          longitud: resultado.position.longitude,
          fuente: 'geocoding-fields',
        },
        confianza,
        direccionFormateada: resultado.address.label,
      };
    } catch (error) {
      this.log('error', `   ❌ Error en geocodificación por campos: ${error}`);
      return null;
    }
  }

  /**
   * NIVEL 3: Geocodificar usando dirección completa
   */
  private async geocodificarPorDireccionCompleta(
    direccion: ApiDireccion
  ): Promise<{ coordenadas: CoordenadasValidadas; confianza: number; direccionFormateada: string } | null> {
    if (!direccion.direccion || direccion.direccion.trim().length === 0) {
      this.log('warning', '⚠️ Dirección completa vacía');
      return null;
    }

    try {
      this.log('info', `   Buscando: "${direccion.direccion}"`);

      // Llamar a HERE Geocoding Service
      const resultados = await hereGeocodingService.geocode(direccion.direccion, {
        limit: 1,
        countryCode: this.config.paisFiltro,
        language: this.config.idioma,
      });

      if (resultados.length === 0) {
        this.log('warning', '   ⚠️ No se encontraron resultados');
        return null;
      }

      const resultado = resultados[0];
      const confianza = resultado.scoring?.queryScore || 0.6;

      // Para dirección completa, ser más permisivo con la confianza
      if (confianza < this.config.confianzaMinima * 0.8) {
        this.log('warning', `   ⚠️ Confianza muy baja: ${(confianza * 100).toFixed(0)}%`);
        return null;
      }

      this.log('info', `   📍 Coordenadas: ${resultado.position.latitude.toFixed(6)}, ${resultado.position.longitude.toFixed(6)}`);
      this.log('info', `   🎯 Confianza: ${(confianza * 100).toFixed(0)}%`);

      return {
        coordenadas: {
          latitud: resultado.position.latitude,
          longitud: resultado.position.longitude,
          fuente: 'geocoding-full',
        },
        confianza,
        direccionFormateada: resultado.address.label,
      };
    } catch (error) {
      this.log('error', `   ❌ Error en geocodificación por dirección completa: ${error}`);
      return null;
    }
  }

  /**
   * Obtener estadísticas de validación
   */
  getEstadisticas(direcciones: DireccionValidada[]): {
    total: number;
    validas: number;
    invalidas: number;
    porFuente: Record<string, number>;
    confianzaPromedio: number;
  } {
    const total = direcciones.length;
    const validas = direcciones.filter(d => d.esValida).length;
    const invalidas = total - validas;

    const porFuente: Record<string, number> = {};
    let sumaConfianza = 0;
    let cuentaConConfianza = 0;

    direcciones.forEach(d => {
      if (d.coordenadas) {
        porFuente[d.coordenadas.fuente] = (porFuente[d.coordenadas.fuente] || 0) + 1;
      }
      if (d.confianza !== undefined) {
        sumaConfianza += d.confianza;
        cuentaConConfianza++;
      }
    });

    return {
      total,
      validas,
      invalidas,
      porFuente,
      confianzaPromedio: cuentaConConfianza > 0 ? sumaConfianza / cuentaConConfianza : 0,
    };
  }

  /**
   * Logging helper
   */
  private log(level: 'info' | 'success' | 'warning' | 'error', message: string): void {
    if (!this.config.verboseLogs) return;

    const prefix = '[AddressValidation]';
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'success':
        console.log(`${prefix} ✅ ${message}`);
        break;
      case 'warning':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
    }
  }
}

export const addressValidationService = new AddressValidationService();
