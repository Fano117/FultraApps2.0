import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ClienteEntregaDTO, EntregaSync, EstadoSincronizacion } from '../models';
import { entregasStorageService, entregasApiService } from '../services';

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
      const clientes = await entregasApiService.fetchEmbarquesEntrega();
      await entregasStorageService.updateClientesEntrega(clientes);
      return clientes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al cargar embarques');
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
