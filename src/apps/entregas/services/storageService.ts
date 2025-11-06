import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClienteEntregaDTO, EntregaDTO, EntregaSync } from '../models';

const CLIENTES_KEY = '@FultraApps:clientesEntrega';
const ENTREGAS_SYNC_KEY = '@FultraApps:entregasSync';

class EntregasStorageService {
  async getClientesEntrega(): Promise<ClienteEntregaDTO[]> {
    try {
      const data = await AsyncStorage.getItem(CLIENTES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting clientes entrega:', error);
      return [];
    }
  }

  async saveClientesEntrega(clientes: ClienteEntregaDTO[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CLIENTES_KEY, JSON.stringify(clientes));
    } catch (error) {
      console.error('Error saving clientes entrega:', error);
      throw error;
    }
  }

  async updateClientesEntrega(nuevosClientes: ClienteEntregaDTO[]): Promise<void> {
    try {
      const clientesExistentes = await this.getClientesEntrega();
      const clientesMap = new Map<string, ClienteEntregaDTO>();

      clientesExistentes.forEach(cliente => {
        const key = `${cliente.cuentaCliente}-${cliente.carga}`;
        clientesMap.set(key, cliente);
      });

      nuevosClientes.forEach(nuevoCliente => {
        const key = `${nuevoCliente.cuentaCliente}-${nuevoCliente.carga}`;
        const clienteExistente = clientesMap.get(key);

        if (clienteExistente) {
          const entregasExistentesMap = new Map(
            clienteExistente.entregas.map(e => [`${e.ordenVenta}-${e.folio}`, e])
          );

          nuevoCliente.entregas.forEach(nuevaEntrega => {
            const entregaKey = `${nuevaEntrega.ordenVenta}-${nuevaEntrega.folio}`;
            if (!entregasExistentesMap.has(entregaKey)) {
              const entregaConClave = {
                ...nuevaEntrega,
                cargaCuentaCliente: `${nuevoCliente.carga}-${nuevoCliente.cuentaCliente}`,
              };
              clienteExistente.entregas.push(entregaConClave);
            }
          });

          clientesMap.set(key, clienteExistente);
        } else {
          const entregasConClave = nuevoCliente.entregas.map(entrega => ({
            ...entrega,
            cargaCuentaCliente: `${nuevoCliente.carga}-${nuevoCliente.cuentaCliente}`,
          }));

          clientesMap.set(key, {
            ...nuevoCliente,
            entregas: entregasConClave,
          });
        }
      });

      await this.saveClientesEntrega(Array.from(clientesMap.values()));
    } catch (error) {
      console.error('Error updating clientes entrega:', error);
      throw error;
    }
  }

  async removeEntrega(ordenVenta: string, folio: string): Promise<void> {
    try {
      const clientes = await this.getClientesEntrega();

      clientes.forEach(cliente => {
        cliente.entregas = cliente.entregas.filter(
          entrega => !(entrega.ordenVenta === ordenVenta && entrega.folio === folio)
        );
      });

      const clientesConEntregas = clientes.filter(cliente => cliente.entregas.length > 0);
      await this.saveClientesEntrega(clientesConEntregas);
    } catch (error) {
      console.error('Error removing entrega:', error);
      throw error;
    }
  }

  async getEntregasSync(): Promise<EntregaSync[]> {
    try {
      const data = await AsyncStorage.getItem(ENTREGAS_SYNC_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting entregas sync:', error);
      return [];
    }
  }

  async saveEntregaSync(entrega: EntregaSync): Promise<void> {
    try {
      const entregas = await this.getEntregasSync();
      entregas.push(entrega);
      await AsyncStorage.setItem(ENTREGAS_SYNC_KEY, JSON.stringify(entregas));
    } catch (error) {
      console.error('Error saving entrega sync:', error);
      throw error;
    }
  }

  async updateEntregaSync(entregaId: string, updates: Partial<EntregaSync>): Promise<void> {
    try {
      const entregas = await this.getEntregasSync();
      const index = entregas.findIndex(e => e.id === entregaId);

      if (index !== -1) {
        entregas[index] = { ...entregas[index], ...updates };
        await AsyncStorage.setItem(ENTREGAS_SYNC_KEY, JSON.stringify(entregas));
      }
    } catch (error) {
      console.error('Error updating entrega sync:', error);
      throw error;
    }
  }

  async removeEntregaSync(entregaId: string): Promise<void> {
    try {
      const entregas = await this.getEntregasSync();
      const entregasFiltradas = entregas.filter(e => e.id !== entregaId);
      await AsyncStorage.setItem(ENTREGAS_SYNC_KEY, JSON.stringify(entregasFiltradas));
    } catch (error) {
      console.error('Error removing entrega sync:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([CLIENTES_KEY, ENTREGAS_SYNC_KEY]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export const entregasStorageService = new EntregasStorageService();
