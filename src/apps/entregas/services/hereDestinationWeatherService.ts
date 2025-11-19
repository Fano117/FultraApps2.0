/**
 * 🌤️ HERE Destination Weather Service (SIMULADO)
 * 
 * Servicio simulado para obtener información del clima en destinos de entrega.
 * Permite planificar rutas considerando condiciones climáticas adversas.
 * 
 * NOTA: Este es un servicio SIMULADO que no realiza llamadas reales a la API de HERE Maps.
 * Los datos son generados localmente para permitir testing y desarrollo sin backend.
 * 
 * Documentación HERE Destination Weather:
 * https://developer.here.com/documentation/destination-weather/dev_guide/index.html
 */

import { config } from '@/shared/config/environments';

/**
 * Condición climática
 */
export enum WeatherCondition {
  CLEAR = 'clear',
  PARTLY_CLOUDY = 'partly_cloudy',
  CLOUDY = 'cloudy',
  RAIN = 'rain',
  HEAVY_RAIN = 'heavy_rain',
  THUNDERSTORM = 'thunderstorm',
  SNOW = 'snow',
  SLEET = 'sleet',
  FOG = 'fog',
  WIND = 'wind',
}

/**
 * Severidad de alerta climática
 */
export enum WeatherAlertSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  EXTREME = 'extreme',
}

/**
 * Clima actual en una ubicación
 */
export interface CurrentWeather {
  location: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  temperature: number; // Celsius
  feelsLike: number; // Celsius
  condition: WeatherCondition;
  description: string;
  humidity: number; // porcentaje
  windSpeed: number; // km/h
  windDirection: number; // grados
  pressure: number; // hPa
  visibility: number; // metros
  uvIndex: number; // 0-11+
  precipitation: number; // mm
  cloudCover: number; // porcentaje
  observedAt: Date;
}

/**
 * Pronóstico por hora
 */
export interface HourlyForecast {
  time: Date;
  temperature: number;
  condition: WeatherCondition;
  description: string;
  precipitationProbability: number; // porcentaje
  windSpeed: number; // km/h
  humidity: number; // porcentaje
}

/**
 * Pronóstico diario
 */
export interface DailyForecast {
  date: Date;
  temperatureMin: number;
  temperatureMax: number;
  condition: WeatherCondition;
  description: string;
  precipitationProbability: number; // porcentaje
  windSpeedMax: number; // km/h
  sunrise: Date;
  sunset: Date;
}

/**
 * Alerta climática
 */
export interface WeatherAlert {
  id: string;
  type: string;
  severity: WeatherAlertSeverity;
  title: string;
  description: string;
  instructions?: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
}

/**
 * Recomendación basada en clima
 */
export interface WeatherBasedRecommendation {
  shouldProceed: boolean;
  risk: 'low' | 'medium' | 'high';
  warnings: string[];
  suggestions: string[];
  estimatedDelay?: number; // minutos de retraso estimado
}

class HereDestinationWeatherService {
  private readonly API_KEY = config.hereMapsApiKey || '';

  /**
   * Simula obtención del clima actual en una ubicación
   * 
   * SIMULACIÓN: Genera datos climáticos aleatorios pero realistas
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number
  ): Promise<CurrentWeather> {
    console.log(`[HereWeather] 🌤️ Obteniendo clima actual para [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]...`);

    await this.simulateDelay(300, 500);

    // Simular condiciones climáticas según ubicación y hora
    const hour = new Date().getHours();
    const condition = this.simulateWeatherCondition(latitude, hour);
    const temperature = this.simulateTemperature(latitude, hour, condition);

    const weather: CurrentWeather = {
      location: {
        latitude,
        longitude,
        city: this.getCityName(latitude, longitude),
      },
      temperature,
      feelsLike: temperature + (Math.random() * 4 - 2), // ±2°C
      condition,
      description: this.getWeatherDescription(condition),
      humidity: 40 + Math.random() * 50, // 40-90%
      windSpeed: Math.random() * 30, // 0-30 km/h
      windDirection: Math.random() * 360,
      pressure: 1010 + Math.random() * 20, // 1010-1030 hPa
      visibility: condition === WeatherCondition.FOG ? 500 + Math.random() * 2000 : 8000 + Math.random() * 2000,
      uvIndex: this.calculateUVIndex(hour, condition),
      precipitation: this.calculatePrecipitation(condition),
      cloudCover: this.calculateCloudCover(condition),
      observedAt: new Date(),
    };

    console.log(
      `[HereWeather] ✅ Clima: ${weather.description}, ${Math.round(weather.temperature)}°C, ` +
      `viento ${Math.round(weather.windSpeed)}km/h`
    );

    return weather;
  }

  /**
   * Simula pronóstico por hora (próximas 24 horas)
   */
  async getHourlyForecast(
    latitude: number,
    longitude: number,
    hours: number = 24
  ): Promise<HourlyForecast[]> {
    console.log(`[HereWeather] 📊 Obteniendo pronóstico por hora (${hours}h)...`);

    await this.simulateDelay(400, 600);

    const forecast: HourlyForecast[] = [];
    const baseTemp = this.simulateTemperature(latitude, new Date().getHours(), WeatherCondition.CLEAR);

    for (let i = 0; i < hours; i++) {
      const futureTime = new Date(Date.now() + i * 3600000);
      const hour = futureTime.getHours();
      const condition = this.simulateWeatherCondition(latitude, hour);
      
      // Temperatura varía según hora del día
      const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 5; // Varía ±5°C
      const temperature = baseTemp + tempVariation + (Math.random() * 2 - 1);

      forecast.push({
        time: futureTime,
        temperature,
        condition,
        description: this.getWeatherDescription(condition),
        precipitationProbability: this.calculatePrecipitationProbability(condition),
        windSpeed: 5 + Math.random() * 25,
        humidity: 40 + Math.random() * 40,
      });
    }

    console.log(`[HereWeather] ✅ ${forecast.length} horas pronosticadas`);

    return forecast;
  }

  /**
   * Simula pronóstico por día (próximos 7 días)
   */
  async getDailyForecast(
    latitude: number,
    longitude: number,
    days: number = 7
  ): Promise<DailyForecast[]> {
    console.log(`[HereWeather] 📅 Obteniendo pronóstico diario (${days} días)...`);

    await this.simulateDelay(400, 600);

    const forecast: DailyForecast[] = [];
    const baseTemp = this.simulateTemperature(latitude, 14, WeatherCondition.CLEAR);

    for (let i = 0; i < days; i++) {
      const futureDate = new Date(Date.now() + i * 86400000);
      const condition = this.simulateWeatherCondition(latitude, 14);
      
      // Temperatura varía día a día
      const dayVariation = Math.sin(i * Math.PI / 7) * 3;
      const tempMax = baseTemp + dayVariation + Math.random() * 3;
      const tempMin = tempMax - (5 + Math.random() * 5);

      forecast.push({
        date: futureDate,
        temperatureMin: tempMin,
        temperatureMax: tempMax,
        condition,
        description: this.getWeatherDescription(condition),
        precipitationProbability: this.calculatePrecipitationProbability(condition),
        windSpeedMax: 10 + Math.random() * 30,
        sunrise: new Date(futureDate.setHours(6, 30, 0, 0)),
        sunset: new Date(futureDate.setHours(18, 30, 0, 0)),
      });
    }

    console.log(`[HereWeather] ✅ ${forecast.length} días pronosticados`);

    return forecast;
  }

  /**
   * Simula obtención de alertas climáticas
   */
  async getWeatherAlerts(
    latitude: number,
    longitude: number
  ): Promise<WeatherAlert[]> {
    console.log(`[HereWeather] ⚠️ Verificando alertas climáticas...`);

    await this.simulateDelay(200, 400);

    const currentWeather = await this.getCurrentWeather(latitude, longitude);
    const alerts: WeatherAlert[] = [];

    // Generar alertas basadas en condiciones severas
    if (currentWeather.condition === WeatherCondition.HEAVY_RAIN) {
      alerts.push({
        id: 'alert-rain-001',
        type: 'HEAVY_RAIN',
        severity: WeatherAlertSeverity.MODERATE,
        title: 'Alerta de Lluvia Intensa',
        description: 'Se esperan lluvias intensas que pueden afectar la visibilidad y las condiciones del camino.',
        instructions: 'Conduzca con precaución, mantenga distancia de seguridad y encienda las luces.',
        startTime: new Date(),
        endTime: new Date(Date.now() + 4 * 3600000), // 4 horas
        affectedAreas: [currentWeather.location.city || 'Área local'],
      });
    }

    if (currentWeather.condition === WeatherCondition.THUNDERSTORM) {
      alerts.push({
        id: 'alert-storm-001',
        type: 'THUNDERSTORM',
        severity: WeatherAlertSeverity.SEVERE,
        title: 'Alerta de Tormenta Eléctrica',
        description: 'Tormenta eléctrica activa en el área. Alto riesgo de rayos y vientos fuertes.',
        instructions: 'Evite áreas abiertas. Considere posponer el viaje si es posible.',
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 3600000), // 2 horas
        affectedAreas: [currentWeather.location.city || 'Área local'],
      });
    }

    if (currentWeather.windSpeed > 50) {
      alerts.push({
        id: 'alert-wind-001',
        type: 'HIGH_WIND',
        severity: WeatherAlertSeverity.MODERATE,
        title: 'Alerta de Vientos Fuertes',
        description: `Vientos de ${Math.round(currentWeather.windSpeed)}km/h. Riesgo para vehículos altos.`,
        instructions: 'Conduzca con precaución especialmente en vehículos altos o con remolque.',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3 * 3600000), // 3 horas
        affectedAreas: [currentWeather.location.city || 'Área local'],
      });
    }

    if (currentWeather.visibility < 1000) {
      alerts.push({
        id: 'alert-fog-001',
        type: 'FOG',
        severity: WeatherAlertSeverity.MODERATE,
        title: 'Alerta de Niebla Densa',
        description: `Visibilidad reducida a ${Math.round(currentWeather.visibility)}m.`,
        instructions: 'Reduzca velocidad, encienda luces y mantenga distancia de seguridad.',
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 3600000), // 2 horas
        affectedAreas: [currentWeather.location.city || 'Área local'],
      });
    }

    console.log(`[HereWeather] ${alerts.length > 0 ? '⚠️' : '✅'} ${alerts.length} alerta(s) activa(s)`);

    return alerts;
  }

  /**
   * Simula análisis de ruta considerando clima en múltiples puntos
   */
  async analyzeRouteWeather(
    waypoints: Array<{ latitude: number; longitude: number; nombre?: string }>,
    departureTime: Date = new Date()
  ): Promise<{
    overallRisk: 'low' | 'medium' | 'high';
    weatherByWaypoint: Array<{
      waypoint: { latitude: number; longitude: number; nombre?: string };
      weather: CurrentWeather;
      alerts: WeatherAlert[];
      estimatedArrival: Date;
    }>;
    warnings: string[];
    recommendation: WeatherBasedRecommendation;
  }> {
    console.log(`[HereWeather] 🗺️ Analizando clima en ruta con ${waypoints.length} puntos...`);

    await this.simulateDelay(600, 1000);

    const weatherByWaypoint = [];
    const allWarnings: string[] = [];
    let highestRisk: 'low' | 'medium' | 'high' = 'low';

    // Estimar 30 minutos entre cada waypoint
    let currentTime = departureTime;

    for (const waypoint of waypoints) {
      const weather = await this.getCurrentWeather(waypoint.latitude, waypoint.longitude);
      const alerts = await this.getWeatherAlerts(waypoint.latitude, waypoint.longitude);

      weatherByWaypoint.push({
        waypoint,
        weather,
        alerts,
        estimatedArrival: new Date(currentTime),
      });

      // Evaluar riesgo
      const waypointRisk = this.evaluateWeatherRisk(weather, alerts);
      if (waypointRisk === 'high' || (waypointRisk === 'medium' && highestRisk === 'low')) {
        highestRisk = waypointRisk;
      }

      // Agregar warnings
      if (weather.condition === WeatherCondition.HEAVY_RAIN || weather.condition === WeatherCondition.THUNDERSTORM) {
        allWarnings.push(`${waypoint.nombre || 'Punto'}: ${weather.description}`);
      }

      if (alerts.length > 0) {
        alerts.forEach(alert => {
          allWarnings.push(`${waypoint.nombre || 'Punto'}: ${alert.title}`);
        });
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000); // +30 min
    }

    const recommendation = this.generateWeatherRecommendation(highestRisk, allWarnings);

    console.log(`[HereWeather] ✅ Análisis completo: Riesgo ${highestRisk}, ${allWarnings.length} advertencia(s)`);

    return {
      overallRisk: highestRisk,
      weatherByWaypoint,
      warnings: allWarnings,
      recommendation,
    };
  }

  /**
   * Simula condición climática según ubicación y hora
   */
  private simulateWeatherCondition(latitude: number, hour: number): WeatherCondition {
    // Simular patrones más realistas
    const random = Math.random();
    
    // Horario nocturno más probabilidad de despejado
    if (hour < 6 || hour > 22) {
      return random > 0.3 ? WeatherCondition.CLEAR : WeatherCondition.CLOUDY;
    }
    
    // Zonas tropicales más lluvia
    if (Math.abs(latitude) < 23.5 && random > 0.7) {
      return random > 0.85 ? WeatherCondition.HEAVY_RAIN : WeatherCondition.RAIN;
    }

    // Distribución general
    if (random > 0.9) return WeatherCondition.RAIN;
    if (random > 0.8) return WeatherCondition.CLOUDY;
    if (random > 0.7) return WeatherCondition.PARTLY_CLOUDY;
    if (random > 0.95) return WeatherCondition.THUNDERSTORM;
    if (random > 0.98) return WeatherCondition.FOG;
    
    return WeatherCondition.CLEAR;
  }

  /**
   * Simula temperatura según ubicación y hora
   */
  private simulateTemperature(latitude: number, hour: number, condition: WeatherCondition): number {
    // Base según latitud (más calor cerca del ecuador)
    let baseTemp = 30 - Math.abs(latitude) * 0.5;
    
    // Variación según hora del día
    const hourlyVariation = Math.sin((hour - 6) * Math.PI / 12) * 8;
    baseTemp += hourlyVariation;
    
    // Ajuste según condición
    if (condition === WeatherCondition.RAIN || condition === WeatherCondition.HEAVY_RAIN) {
      baseTemp -= 5;
    } else if (condition === WeatherCondition.CLEAR) {
      baseTemp += 2;
    }
    
    return Math.round(baseTemp * 10) / 10;
  }

  /**
   * Obtiene descripción legible de la condición
   */
  private getWeatherDescription(condition: WeatherCondition): string {
    const descriptions: Record<WeatherCondition, string> = {
      [WeatherCondition.CLEAR]: 'Despejado',
      [WeatherCondition.PARTLY_CLOUDY]: 'Parcialmente nublado',
      [WeatherCondition.CLOUDY]: 'Nublado',
      [WeatherCondition.RAIN]: 'Lluvia',
      [WeatherCondition.HEAVY_RAIN]: 'Lluvia intensa',
      [WeatherCondition.THUNDERSTORM]: 'Tormenta eléctrica',
      [WeatherCondition.SNOW]: 'Nieve',
      [WeatherCondition.SLEET]: 'Aguanieve',
      [WeatherCondition.FOG]: 'Niebla',
      [WeatherCondition.WIND]: 'Ventoso',
    };
    
    return descriptions[condition];
  }

  /**
   * Calcula índice UV según hora y condición
   */
  private calculateUVIndex(hour: number, condition: WeatherCondition): number {
    if (hour < 6 || hour > 18) return 0;
    
    let baseUV = Math.sin((hour - 6) * Math.PI / 12) * 8;
    
    if (condition === WeatherCondition.CLOUDY || condition === WeatherCondition.RAIN) {
      baseUV *= 0.5;
    }
    
    return Math.max(0, Math.round(baseUV));
  }

  /**
   * Calcula precipitación según condición
   */
  private calculatePrecipitation(condition: WeatherCondition): number {
    if (condition === WeatherCondition.HEAVY_RAIN) return 10 + Math.random() * 20;
    if (condition === WeatherCondition.RAIN) return 2 + Math.random() * 8;
    if (condition === WeatherCondition.THUNDERSTORM) return 15 + Math.random() * 30;
    return 0;
  }

  /**
   * Calcula cobertura de nubes según condición
   */
  private calculateCloudCover(condition: WeatherCondition): number {
    if (condition === WeatherCondition.CLEAR) return 0 + Math.random() * 20;
    if (condition === WeatherCondition.PARTLY_CLOUDY) return 30 + Math.random() * 40;
    if (condition === WeatherCondition.CLOUDY) return 70 + Math.random() * 30;
    if (condition === WeatherCondition.RAIN || condition === WeatherCondition.HEAVY_RAIN) return 90 + Math.random() * 10;
    return 50;
  }

  /**
   * Calcula probabilidad de precipitación
   */
  private calculatePrecipitationProbability(condition: WeatherCondition): number {
    if (condition === WeatherCondition.HEAVY_RAIN || condition === WeatherCondition.THUNDERSTORM) return 90 + Math.random() * 10;
    if (condition === WeatherCondition.RAIN) return 60 + Math.random() * 30;
    if (condition === WeatherCondition.CLOUDY) return 20 + Math.random() * 30;
    if (condition === WeatherCondition.PARTLY_CLOUDY) return 10 + Math.random() * 20;
    return Math.random() * 10;
  }

  /**
   * Evalúa riesgo basado en clima y alertas
   */
  private evaluateWeatherRisk(
    weather: CurrentWeather,
    alerts: WeatherAlert[]
  ): 'low' | 'medium' | 'high' {
    if (alerts.some(a => a.severity === WeatherAlertSeverity.EXTREME || a.severity === WeatherAlertSeverity.SEVERE)) {
      return 'high';
    }
    
    if (weather.condition === WeatherCondition.THUNDERSTORM || weather.visibility < 500) {
      return 'high';
    }
    
    if (weather.condition === WeatherCondition.HEAVY_RAIN || weather.windSpeed > 50) {
      return 'medium';
    }
    
    if (alerts.length > 0 || weather.condition === WeatherCondition.RAIN) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Genera recomendación basada en análisis climático
   */
  private generateWeatherRecommendation(
    risk: 'low' | 'medium' | 'high',
    warnings: string[]
  ): WeatherBasedRecommendation {
    const recommendations: Record<typeof risk, WeatherBasedRecommendation> = {
      low: {
        shouldProceed: true,
        risk: 'low',
        warnings: [],
        suggestions: ['Condiciones climáticas favorables para el viaje'],
      },
      medium: {
        shouldProceed: true,
        risk: 'medium',
        warnings,
        suggestions: [
          'Conduzca con precaución',
          'Mantenga distancia de seguridad',
          'Considere retraso de 15-30 minutos si las condiciones empeoran',
        ],
        estimatedDelay: 20,
      },
      high: {
        shouldProceed: false,
        risk: 'high',
        warnings,
        suggestions: [
          'Se recomienda posponer el viaje',
          'Condiciones climáticas peligrosas',
          'Espere a que mejoren las condiciones',
          'Si debe viajar, extreme precauciones',
        ],
        estimatedDelay: 60,
      },
    };
    
    return recommendations[risk];
  }

  /**
   * Obtiene nombre de ciudad según coordenadas (simplificado)
   */
  private getCityName(latitude: number, longitude: number): string {
    // Simulación simple de ciudades principales de México
    const cities = [
      { lat: 19.43, lng: -99.13, name: 'Ciudad de México' },
      { lat: 25.69, lng: -100.32, name: 'Monterrey' },
      { lat: 20.66, lng: -103.35, name: 'Guadalajara' },
      { lat: 32.52, lng: -117.04, name: 'Tijuana' },
    ];
    
    // Encontrar ciudad más cercana
    const closest = cities.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.lat - latitude) + Math.abs(prev.lng - longitude);
      const currDist = Math.abs(curr.lat - latitude) + Math.abs(curr.lng - longitude);
      return currDist < prevDist ? curr : prev;
    });
    
    return closest.name;
  }

  /**
   * Simula delay de red
   */
  private simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

export const hereDestinationWeatherService = new HereDestinationWeatherService();
