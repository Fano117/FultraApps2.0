import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ClienteEntregaDTO, EntregaSync, EstadoSincronizacion } from '../models';
import { entregasStorageService, mobileApiService } from '../services';

interface EntregasState {
  clientes: ClienteEntregaDTO[];
  entregasSync: EntregaSync[];
  loading: boolean;
  error: string | null;
  lastSync: number | null;
}

const initialState: EntregasState = {
  clientes: [],
  entregasSync: [],
  loading: false,
  error: null,
  lastSync: null,
};

export const fetchEmbarques = createAsyncThunk(
  'entregas/fetchEmbarques',
  async (_, { rejectWithValue }) => {
    try {
      // Usar solo datos locales (mock) sin llamar a la API
      console.log('[STORE] 📦 Cargando datos mock desde almacenamiento local');
      const clientes = await entregasStorageService.getClientesEntrega();
      
      if (clientes.length === 0) {
        console.log('[STORE] ℹ️ No hay datos mock. Usa la pantalla "Testing" para generar datos.');
      } else {
        console.log(`[STORE] ✅ ${clientes.length} clientes cargados desde almacenamiento local`);
      }
      
      return clientes;
    } catch (error: any) {
      console.error('[STORE] ❌ Error cargando datos locales:', error);
      return rejectWithValue(error.message || 'Error al cargar datos locales');
    }
  }
);



export const loadLocalData = createAsyncThunk(
  'entregas/loadLocalData',
  async () => {
    const clientes = await entregasStorageService.getClientesEntrega();
    const entregasSync = await entregasStorageService.getEntregasSync();
    return { clientes, entregasSync };
  }
);

export const saveEntregaLocal = createAsyncThunk(
  'entregas/saveEntregaLocal',
  async (entrega: EntregaSync, { rejectWithValue }) => {
    try {
      await entregasStorageService.saveEntregaSync(entrega);
      await entregasStorageService.removeEntrega(entrega.ordenVenta, entrega.folio);
      return entrega;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al guardar entrega');
    }
  }
);

export const actualizarEstadoEntrega = createAsyncThunk(
  'entregas/actualizarEstado',
  async ({ id, estado }: { id: string | number; estado: string }, { rejectWithValue }) => {
    try {
      console.log(`[STORE] 🔄 Actualizando estado entrega ${id} a ${estado}`);
      await mobileApiService.actualizarEstado(id, estado);
      return { id, estado };
    } catch (error: any) {
      console.error('[STORE] ❌ Error actualizando estado:', error);
      return rejectWithValue(error.message || 'Error al actualizar estado');
    }
  }
);

export const confirmarEntrega = createAsyncThunk(
  'entregas/confirmarEntrega',
  async (datos: {
    entregaId: string | number;
    latitud: number;
    longitud: number;
    fechaEntrega: string;
    nombreReceptor?: string;
    observaciones?: string;
    estado: string;
  }, { rejectWithValue }) => {
    try {
      console.log('[STORE] ✅ Confirmando entrega:', datos.entregaId);
      const result = await mobileApiService.confirmarEntrega(datos);
      return { entregaId: datos.entregaId, result };
    } catch (error: any) {
      console.error('[STORE] ❌ Error confirmando entrega:', error);
      return rejectWithValue(error.message || 'Error al confirmar entrega');
    }
  }
);



const entregasSlice = createSlice({
  name: 'entregas',
  initialState,
  reducers: {
    updateEntregaSync: (state, action: PayloadAction<{ id: string; updates: Partial<EntregaSync> }>) => {
      const index = state.entregasSync.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.entregasSync[index] = { ...state.entregasSync[index], ...action.payload.updates };
      }
    },
    removeEntregaSync: (state, action: PayloadAction<string>) => {
      state.entregasSync = state.entregasSync.filter(e => e.id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmbarques.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmbarques.fulfilled, (state, action) => {
        state.loading = false;
        state.clientes = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(fetchEmbarques.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loadLocalData.fulfilled, (state, action) => {
        const { clientes, entregasSync } = action.payload;

        // Crear un Set de entregas que están en sync para búsqueda rápida
        const entregasEnSync = new Set(
          entregasSync.map(e => `${e.ordenVenta}-${e.folio}`)
        );

        // Actualizar el estado de las entregas que están en sync
        state.clientes = clientes.map(cliente => ({
          ...cliente,
          entregas: cliente.entregas.map(entrega => {
            const key = `${entrega.ordenVenta}-${entrega.folio}`;
            if (entregasEnSync.has(key)) {
              return {
                ...entrega,
                estado: 'PENDIENTE_ENVIO'
              };
            }
            return entrega;
          })
        }));

        state.entregasSync = entregasSync;
      })
      .addCase(saveEntregaLocal.fulfilled, (state, action) => {
        state.entregasSync.push(action.payload);
      })
      .addCase(actualizarEstadoEntrega.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(actualizarEstadoEntrega.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar el estado en la estructura local si es necesario
        const { id, estado } = action.payload;
        state.clientes.forEach(cliente => {
          cliente.entregas.forEach(entrega => {
            if (entrega.id?.toString() === id.toString()) {
              entrega.estado = estado;
            }
          });
        });
      })
      .addCase(actualizarEstadoEntrega.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(confirmarEntrega.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmarEntrega.fulfilled, (state, action) => {
        state.loading = false;
        // Actualizar el estado de la entrega como completada
        const { entregaId } = action.payload;
        state.clientes.forEach(cliente => {
          cliente.entregas.forEach(entrega => {
            if (entrega.id?.toString() === entregaId.toString()) {
              entrega.estado = 'COMPLETADO';
            }
          });
        });
      })
      .addCase(confirmarEntrega.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;

        // Actualizar el estado de la entrega en el array de clientes
        state.clientes = state.clientes.map(cliente => ({
          ...cliente,
          entregas: cliente.entregas.map(entrega => {
            if (entrega.ordenVenta === action.payload.ordenVenta &&
                entrega.folio === action.payload.folio) {
              return {
                ...entrega,
                estado: 'PENDIENTE_ENVIO'
              };
            }
            return entrega;
          })
        }));
      });
  },
});

export const { updateEntregaSync, removeEntregaSync, clearError } = entregasSlice.actions;
export default entregasSlice.reducer;
