import { Observable, BehaviorSubject } from 'rxjs';
import { Platform } from 'react-native';
import { Linking } from 'react-native';
import { config } from '@/shared/config/environments';
import * as flexpolyline from '@here/flexpolyline';

export interface RutaOptima {
  distance: number; // en metros
  duration: number; // en segundos
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  instructions: string[];
  estimatedArrival: Date;
}

export interface Ubicacion {
  latitude: number;
  longitude: number;
}

// Interface para logs de debugging
export interface RoutingServiceLogger {
  addLog: (level: 'info' | 'warning' | 'error', message: string) => void;
}

class RoutingService {
  private rutaActual = new BehaviorSubject<RutaOptima | null>(null);
  private readonly HERE_API_KEY = config.hereMapsApiKey || ''; // API Key de environments
  private logger: RoutingServiceLogger | null = null;

  /**
   * Configurar logger externo para debugging
   */
  setLogger(logger: RoutingServiceLogger | null) {
    this.logger = logger;
  }

  /**
   * Log interno que usa el logger externo si está disponible
   */
  private log(level: 'info' | 'warning' | 'error', message: string) {
    console.log(`[RoutingService] ${level.toUpperCase()}: ${message}`);
    if (this.logger) {
      this.logger.addLog(level, `[RoutingService] ${message}`);
    }
  }

  /**
   * Obtiene la ruta optimizada entre dos puntos usando HERE Maps
   */
  async obtenerRutaOptima(
    origen: Ubicacion,
    destino: Ubicacion
  ): Promise<RutaOptima> {
    try {
      // Verificar si tenemos una API Key válida
      if (!this.HERE_API_KEY || this.HERE_API_KEY.length < 20) {
        this.log('warning', '🚨 HERE Maps API Key no configurada correctamente, usando fallback');
        return this.calcularRutaFallback(origen, destino);
      }

      this.log('info', `🔑 API Key configurada: ${this.HERE_API_KEY.substring(0, 8)}...`);

      // Usando HERE Routing API v8 - Solicitar polyline en formato legacy (Google-compatible)
      // O solicitar spanPoints para obtener coordenadas directamente
      const url = `https://router.hereapi.com/v8/routes?` +
        `origin=${origen.latitude},${origen.longitude}&` +
        `destination=${destino.latitude},${destino.longitude}&` +
        `transportMode=car&` +
        `routingMode=fast&` +
        `return=summary,polyline&` +
        `spans=names&` +
        `apikey=${this.HERE_API_KEY}`;

      this.log('info', '🗺️ Solicitando ruta a HERE Maps...');
      this.log('info', `📍 Origen: [${origen.latitude.toFixed(6)}, ${origen.longitude.toFixed(6)}]`);
      this.log('info', `📍 Destino: [${destino.latitude.toFixed(6)}, ${destino.longitude.toFixed(6)}]`);

      // Usar AbortController para timeout en lugar de la propiedad timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.log('error', `HERE API Error: ${response.status} - ${response.statusText}: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error('HERE Maps API Key inválida. Verifique la configuración.');
        } else if (response.status === 403) {
          throw new Error('HERE Maps API Key sin permisos. Verifique los límites de uso.');
        } else {
          throw new Error(`Error de HERE Maps API: ${response.status} - ${response.statusText}`);
        }
      }

      const data = await response.json();
      this.log('info', `📊 Respuesta de HERE Maps recibida: ${JSON.stringify(data).length} caracteres`);

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        this.log('info', `✅ ${data.routes.length} ruta(s) encontrada(s)`);
        
        // Verificar que tenemos las secciones necesarias
        if (!route.sections || route.sections.length === 0) {
          this.log('warning', '⚠️ Respuesta de HERE incompleta (sin secciones), usando fallback');
          return this.calcularRutaFallback(origen, destino);
        }

        const section = route.sections[0];
        const summary = section.summary; // El summary está en la sección, no en la ruta

        this.log('info', `📏 Distancia: ${(summary?.length || 0)/1000}km, Duración: ${(summary?.duration || 0)/60}min`);

        // Decodificar la polyline de HERE Maps usando librería oficial
        let coordinates: Array<{latitude: number; longitude: number}> = [];
        if (section.polyline) {
          try {
            // La librería flexpolyline devuelve [lat, lng, elevation?]
            const decoded = flexpolyline.decode(section.polyline);
            coordinates = decoded.polyline.map((point: number[]) => ({
              latitude: point[0],
              longitude: point[1]
            }));
            
            this.log('info', `🗺️ Polyline decodificada: ${coordinates.length} coordenadas`);
            
            // Validar coordenadas
            const coordinatesValid = coordinates.every(c => 
              !isNaN(c.latitude) && !isNaN(c.longitude) &&
              Math.abs(c.latitude) <= 90 && Math.abs(c.longitude) <= 180
            );
            
            if (!coordinatesValid) {
              this.log('error', '❌ Coordenadas inválidas en polyline');
              throw new Error('Invalid coordinates');
            }
            
            // Simplificar si hay muchas coordenadas
            if (coordinates.length > 150) {
              const simplified = [coordinates[0]];
              const step = Math.ceil(coordinates.length / 100);
              
              for (let i = step; i < coordinates.length - 1; i += step) {
                simplified.push(coordinates[i]);
              }
              
              simplified.push(coordinates[coordinates.length - 1]);
              coordinates = simplified;
              
              this.log('info', `🔧 Ruta simplificada a ${coordinates.length} puntos`);
            }
            
          } catch (error) {
            this.log('error', `❌ Error decodificando polyline: ${error}`);
            coordinates = [origen, destino];
          }
        } else {
          coordinates = [origen, destino];
          this.log('warning', '⚠️ Sin polyline en respuesta, usando línea directa');
        }

        const rutaOptima: RutaOptima = {
          distance: summary?.length || this.calcularDistancia(origen, destino), 
          duration: summary?.duration || this.estimarTiempo(origen, destino), 
          coordinates,
          instructions: this.extraerInstrucciones(section),
          estimatedArrival: new Date(Date.now() + (summary?.duration || this.estimarTiempo(origen, destino)) * 1000)
        };

        this.log('info', `✅ Ruta calculada con HERE Maps: ${this.formatearDistancia(rutaOptima.distance)}, ${this.formatearDuracion(rutaOptima.duration)}, ${rutaOptima.coordinates.length} coordenadas`);
        
        this.rutaActual.next(rutaOptima);
        return rutaOptima;

      } else {
        this.log('warning', '⚠️ HERE Maps no devolvió rutas, usando fallback');
        this.log('info', `📊 Estructura de respuesta: ${Object.keys(data).join(', ')}`);
        return this.calcularRutaFallback(origen, destino);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.log('error', `Error calculando ruta con HERE Maps: ${error.message}`);
      } else {
        this.log('error', `Error desconocido calculando ruta: ${JSON.stringify(error)}`);
      }
      
      // Fallback: línea recta con estimación básica
      this.log('info', '🔄 Usando cálculo de ruta fallback...');
      return this.calcularRutaFallback(origen, destino);
    }
  }

  /**
   * Ruta fallback cuando falla la API
   */
  private calcularRutaFallback(origen: Ubicacion, destino: Ubicacion): RutaOptima {
    const distancia = this.calcularDistancia(origen, destino);
    const velocidadPromedio = 40; // 40 km/h en ciudad
    const duracionSegundos = (distancia / 1000) / velocidadPromedio * 3600;

    this.log('info', `🔄 Calculando ruta fallback - Distancia: ${(distancia/1000).toFixed(2)}km, Duración estimada: ${(duracionSegundos/60).toFixed(0)}min`);

    const rutaFallback: RutaOptima = {
      distance: distancia,
      duration: duracionSegundos,
      coordinates: [origen, destino],
      instructions: [
        `Dirigirse hacia el destino (${(distancia / 1000).toFixed(2)} km)`,
        'Llegar al destino'
      ],
      estimatedArrival: new Date(Date.now() + duracionSegundos * 1000)
    };

    this.log('warning', '⚠️ Usando ruta fallback (línea directa) - Las rutas podrían no ser óptimas');
    this.rutaActual.next(rutaFallback);
    return rutaFallback;
  }

  /**
   * Extrae instrucciones de navegación de HERE Maps
   */
  private extraerInstrucciones(section: any): string[] {
    const instrucciones: string[] = [];
    
    if (section && section.actions) {
      section.actions.forEach((action: any) => {
        if (action.instruction) {
          instrucciones.push(action.instruction);
        }
      });
    }

    // Si no hay instrucciones específicas, agregar instrucciones básicas
    if (instrucciones.length === 0) {
      instrucciones.push('Continúe por la ruta hacia el destino');
      instrucciones.push('Ha llegado a su destino');
    }

    return instrucciones;
  }

  /**
   * Calcula distancia usando fórmula Haversine
   */
  private calcularDistancia(origen: Ubicacion, destino: Ubicacion): number {
    const R = 6371000; // Radio de la Tierra en metros
    const lat1Rad = origen.latitude * Math.PI / 180;
    const lat2Rad = destino.latitude * Math.PI / 180;
    const deltaLat = (destino.latitude - origen.latitude) * Math.PI / 180;
    const deltaLng = (destino.longitude - origen.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Estima tiempo de viaje basado en distancia
   */
  private estimarTiempo(origen: Ubicacion, destino: Ubicacion): number {
    const distancia = this.calcularDistancia(origen, destino);
    const velocidadPromedio = 35; // 35 km/h promedio en ciudad con tráfico
    const tiempoHoras = (distancia / 1000) / velocidadPromedio;
    return Math.round(tiempoHoras * 3600); // convertir a segundos
  }

  /**
   * Formatea duración en texto legible
   */
  formatearDuracion(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    } else {
      return `${minutos}m`;
    }
  }

  /**
   * Formatea distancia en texto legible
   */
  formatearDistancia(metros: number): string {
    if (metros < 1000) {
      return `${Math.round(metros)}m`;
    } else {
      return `${(metros / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Observable de la ruta actual
   */
  getRutaActual(): Observable<RutaOptima | null> {
    return this.rutaActual.asObservable();
  }

  /**
   * Abrir navegación en app externa
   */
  async abrirNavegacionExterna(destino: Ubicacion, p0: { latitude: any; longitude: any; }): Promise<void> {
    const { latitude, longitude } = destino;

    if (Platform.OS === 'ios') {
      // Intentar abrir HERE WeGo Maps primero
      const hereWeGoUrl = `here-route://mylocation/${latitude},${longitude}`;
      try {
        const canOpenHere = await Linking.canOpenURL(hereWeGoUrl);
        if (canOpenHere) {
          await Linking.openURL(hereWeGoUrl);
          return;
        }
      } catch (error) {
        console.log('HERE WeGo no disponible, intentando Apple Maps');
      }

      // Fallback a Apple Maps
      const appleMapsUrl = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      const canOpen = await Linking.canOpenURL(appleMapsUrl);
      
      if (canOpen) {
        await Linking.openURL(appleMapsUrl);
        return;
      }
    }

    // Android o fallback general
    try {
      // Intentar HERE WeGo
      const hereWeGoUrl = `here-route://mylocation/${latitude},${longitude}`;
      const canOpenHere = await Linking.canOpenURL(hereWeGoUrl);
      
      if (canOpenHere) {
        await Linking.openURL(hereWeGoUrl);
        return;
      }
    } catch (error) {
      console.log('HERE WeGo no disponible, usando Google Maps');
    }

    // Fallback final a Google Maps (disponible en ambas plataformas)
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    const canOpenGoogle = await Linking.canOpenURL(googleMapsUrl);
    
    if (canOpenGoogle) {
      await Linking.openURL(googleMapsUrl);
    } else {
      throw new Error('No se puede abrir ninguna aplicación de navegación');
    }
  }

  /**
   * Limpiar ruta actual
   */
  limpiarRuta(): void {
    this.rutaActual.next(null);
  }
}

export const routingService = new RoutingService();
export default routingService;