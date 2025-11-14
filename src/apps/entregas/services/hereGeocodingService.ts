/**
 * 📍 HERE Geocoding Service
 * 
 * Servicio para geocodificación, reverse geocoding y búsqueda de lugares
 * usando HERE Geocoding & Search API v7.
 * 
 * Documentación: https://developer.here.com/documentation/geocoding-search-api/dev_guide/index.html
 * API Reference: https://developer.here.com/documentation/geocoding-search-api/api-reference.html
 */

import { config } from '@/shared/config/environments';

/**
 * Resultado de geocodificación
 */
export interface GeocodingResult {
  id: string;
  title: string;
  address: {
    label: string; // Dirección completa
    countryCode: string;
    countryName: string;
    state?: string;
    county?: string;
    city?: string;
    district?: string;
    street?: string;
    houseNumber?: string;
    postalCode?: string;
  };
  position: {
    latitude: number;
    longitude: number;
  };
  resultType: string; // 'houseNumber', 'street', 'locality', etc.
  hereId?: string;
  distance?: number; // Distancia desde punto de búsqueda (metros)
  scoring?: {
    queryScore: number; // 0-1
    fieldScore: {
      streets: number[];
    };
  };
}

/**
 * Opciones de búsqueda
 */
export interface SearchOptions {
  limit?: number; // Máximo resultados (default: 10, max: 100)
  language?: string; // Código de idioma (default: 'es-MX')
  countryCode?: string; // Filtrar por país (ej: 'MEX')
  in?: {
    // Búsqueda dentro de área
    center: { latitude: number; longitude: number };
    radius?: number; // Metros (default: 10000)
  };
  at?: { latitude: number; longitude: number }; // Punto de referencia para scoring
}

/**
 * Sugerencia de autocompletado
 */
export interface AutocompleteSuggestion {
  title: string;
  id: string;
  resultType: string;
  address: {
    label: string;
  };
  highlights?: {
    title: Array<{ start: number; end: number }>;
    address: {
      label: Array<{ start: number; end: number }>;
    };
  };
}

class HereGeocodingService {
  private readonly API_KEY = config.hereMapsApiKey || '';
  private readonly GEOCODING_API_BASE = 'https://geocode.search.hereapi.com/v1';
  private readonly AUTOSUGGEST_API_BASE = 'https://autosuggest.search.hereapi.com/v1';

  /**
   * Geocodificar dirección (dirección → coordenadas)
   */
  async geocode(
    address: string,
    options: SearchOptions = {}
  ): Promise<GeocodingResult[]> {
    try {
      if (!address || address.trim().length === 0) {
        return [];
      }

      console.log(`[HereGeocodingService] 🔍 Geocodificando: "${address}"`);

      const params = new URLSearchParams({
        q: address,
        apikey: this.API_KEY,
        limit: String(options.limit || 10),
        lang: options.language || 'es-MX',
      });

      // Filtrar por país
      if (options.countryCode) {
        params.append('in', `countryCode:${options.countryCode}`);
      }

      // Búsqueda dentro de área
      if (options.in) {
        const circle = `circle:${options.in.center.latitude},${options.in.center.longitude};r=${options.in.radius || 10000}`;
        params.append('in', circle);
      }

      // Punto de referencia
      if (options.at) {
        params.append('at', `${options.at.latitude},${options.at.longitude}`);
      }

      const url = `${this.GEOCODING_API_BASE}/geocode?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.log('[HereGeocodingService] No se encontraron resultados');
        return [];
      }

      const results = data.items.map((item: any) => this.parseGeocodingResult(item));

      console.log(
        `[HereGeocodingService] ✅ ${results.length} resultado(s) encontrado(s)`
      );

      return results;
    } catch (error) {
      console.error('[HereGeocodingService] Error en geocodificación:', error);
      return [];
    }
  }

  /**
   * Reverse geocoding (coordenadas → dirección)
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
    options: { language?: string } = {}
  ): Promise<GeocodingResult | null> {
    try {
      console.log(
        `[HereGeocodingService] 📍 Reverse geocoding: ${latitude}, ${longitude}`
      );

      const params = new URLSearchParams({
        at: `${latitude},${longitude}`,
        apikey: this.API_KEY,
        lang: options.language || 'es-MX',
      });

      const url = `${this.GEOCODING_API_BASE}/revgeocode?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Reverse Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.log('[HereGeocodingService] No se encontró dirección');
        return null;
      }

      const result = this.parseGeocodingResult(data.items[0]);

      console.log(`[HereGeocodingService] ✅ Dirección: ${result.address.label}`);

      return result;
    } catch (error) {
      console.error('[HereGeocodingService] Error en reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Búsqueda con autocompletado
   */
  async autosuggest(
    query: string,
    options: SearchOptions = {}
  ): Promise<AutocompleteSuggestion[]> {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const params = new URLSearchParams({
        q: query,
        apikey: this.API_KEY,
        limit: String(options.limit || 5),
        lang: options.language || 'es-MX',
      });

      // Filtrar por país
      if (options.countryCode) {
        params.append('in', `countryCode:${options.countryCode}`);
      }

      // Punto de referencia
      if (options.at) {
        params.append('at', `${options.at.latitude},${options.at.longitude}`);
      }

      const url = `${this.AUTOSUGGEST_API_BASE}/autosuggest?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Autosuggest API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return [];
      }

      return data.items.map((item: any) => ({
        title: item.title,
        id: item.id,
        resultType: item.resultType,
        address: {
          label: item.address?.label || item.title,
        },
        highlights: item.highlights,
      }));
    } catch (error) {
      console.error('[HereGeocodingService] Error en autosuggest:', error);
      return [];
    }
  }

  /**
   * Obtener detalles completos de una sugerencia
   */
  async lookupSuggestion(suggestionId: string): Promise<GeocodingResult | null> {
    try {
      const params = new URLSearchParams({
        id: suggestionId,
        apikey: this.API_KEY,
      });

      const url = `${this.GEOCODING_API_BASE}/lookup?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Lookup API error: ${response.status}`);
      }

      const data = await response.json();

      return this.parseGeocodingResult(data);
    } catch (error) {
      console.error('[HereGeocodingService] Error en lookup:', error);
      return null;
    }
  }

  /**
   * Buscar lugares de interés (POI)
   */
  async searchPlaces(
    query: string,
    center: { latitude: number; longitude: number },
    options: { radius?: number; categories?: string[]; limit?: number } = {}
  ): Promise<GeocodingResult[]> {
    try {
      console.log(`[HereGeocodingService] 🏪 Buscando lugares: "${query}"`);

      const params = new URLSearchParams({
        q: query,
        at: `${center.latitude},${center.longitude}`,
        apikey: this.API_KEY,
        limit: String(options.limit || 20),
      });

      if (options.radius) {
        const circle = `circle:${center.latitude},${center.longitude};r=${options.radius}`;
        params.append('in', circle);
      }

      if (options.categories && options.categories.length > 0) {
        params.append('categories', options.categories.join(','));
      }

      const url = `${this.GEOCODING_API_BASE}/discover?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Discover API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return [];
      }

      const results = data.items.map((item: any) => this.parseGeocodingResult(item));

      console.log(`[HereGeocodingService] ✅ ${results.length} lugar(es) encontrado(s)`);

      return results;
    } catch (error) {
      console.error('[HereGeocodingService] Error buscando lugares:', error);
      return [];
    }
  }

  /**
   * Validar dirección
   */
  async validateAddress(address: string): Promise<{
    valid: boolean;
    suggestion?: GeocodingResult;
    confidence?: number;
  }> {
    try {
      const results = await this.geocode(address, { limit: 1 });

      if (results.length === 0) {
        return { valid: false };
      }

      const result = results[0];
      const queryScore = result.scoring?.queryScore || 0;

      // Considerar válida si tiene score alto y es dirección específica
      const isValid =
        queryScore >= 0.7 &&
        (result.resultType === 'houseNumber' || result.resultType === 'street');

      return {
        valid: isValid,
        suggestion: result,
        confidence: queryScore,
      };
    } catch (error) {
      console.error('[HereGeocodingService] Error validando dirección:', error);
      return { valid: false };
    }
  }

  /**
   * Calcular distancia entre una dirección y un punto
   */
  async getDistanceFromAddress(
    address: string,
    point: { latitude: number; longitude: number }
  ): Promise<number | null> {
    try {
      const results = await this.geocode(address, { limit: 1, at: point });

      if (results.length === 0) {
        return null;
      }

      return results[0].distance || null;
    } catch (error) {
      console.error('[HereGeocodingService] Error calculando distancia:', error);
      return null;
    }
  }

  /**
   * Parsear resultado de geocodificación
   */
  private parseGeocodingResult(item: any): GeocodingResult {
    return {
      id: item.id || '',
      title: item.title || '',
      address: {
        label: item.address?.label || '',
        countryCode: item.address?.countryCode || '',
        countryName: item.address?.countryName || '',
        state: item.address?.state,
        county: item.address?.county,
        city: item.address?.city,
        district: item.address?.district,
        street: item.address?.street,
        houseNumber: item.address?.houseNumber,
        postalCode: item.address?.postalCode,
      },
      position: {
        latitude: item.position?.lat || 0,
        longitude: item.position?.lng || 0,
      },
      resultType: item.resultType || '',
      hereId: item.hereId,
      distance: item.distance,
      scoring: item.scoring,
    };
  }

  /**
   * Formatear dirección para display
   */
  formatAddress(result: GeocodingResult, format: 'short' | 'full' = 'full'): string {
    const addr = result.address;

    if (format === 'short') {
      const parts = [addr.street, addr.houseNumber, addr.city].filter(Boolean);
      return parts.join(', ');
    }

    // Formato completo
    return addr.label;
  }
}

export const hereGeocodingService = new HereGeocodingService();
