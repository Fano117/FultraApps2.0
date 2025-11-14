/**
 * Utilidades para generar keys únicas en componentes React
 * Previene el error "Encountered two children with the same key"
 */

import React from 'react';

export class KeyGenerator {
  private static keyCounters: Map<string, number> = new Map();

  /**
   * Genera una key única combinando un prefijo con un contador incremental
   */
  static generateUniqueKey(prefix: string): string {
    const currentCount = this.keyCounters.get(prefix) || 0;
    const newCount = currentCount + 1;
    this.keyCounters.set(prefix, newCount);
    return `${prefix}-${newCount}`;
  }

  /**
   * Genera una key para entrega combinando orden de venta, folio e índice
   */
  static generateEntregaKey(ordenVenta: string, folio: string, index?: number): string {
    const baseKey = `${ordenVenta}-${folio}`;
    return index !== undefined ? `${baseKey}-${index}` : baseKey;
  }

  /**
   * Genera una key para cliente combinando carga, cuenta cliente e índice
   */
  static generateClienteKey(carga: string, cuentaCliente: string, index?: number): string {
    const baseKey = `${carga || 'Sin_carga'}-${cuentaCliente || 'Sin_cuenta'}`;
    return index !== undefined ? `${baseKey}-${index}` : baseKey;
  }

  /**
   * Genera una key única usando timestamp y random
   */
  static generateTimestampKey(prefix: string = 'item'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Limpia los contadores (útil para testing)
   */
  static resetCounters(): void {
    this.keyCounters.clear();
  }

  /**
   * Sanitiza strings para usar en keys (reemplaza caracteres problemáticos)
   */
  static sanitizeKey(input: string): string {
    return input
      .replace(/[^\w\-]/g, '_') // Reemplazar caracteres especiales con _
      .replace(/^_+|_+$/g, '') // Remover _ al inicio y final
      .replace(/_+/g, '_'); // Convertir múltiples _ en uno solo
  }
}

/**
 * Hook para generar keys únicas en componentes funcionales
 */
export const useUniqueKey = (prefix: string) => {
  return () => KeyGenerator.generateUniqueKey(prefix);
};

/**
 * Función helper para arrays con elementos que pueden tener keys duplicadas
 */
export const mapWithSafeKeys = <T>(
  array: T[],
  renderFunction: (item: T, index: number) => React.ReactElement,
  keyExtractor?: (item: T, index: number) => string
) => {
  return array.map((item, index) => {
    const key = keyExtractor 
      ? keyExtractor(item, index)
      : KeyGenerator.generateTimestampKey(`item-${index}`);
    
    return React.cloneElement(renderFunction(item, index), { key });
  });
};