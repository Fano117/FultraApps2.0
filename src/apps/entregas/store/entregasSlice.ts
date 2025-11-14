import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ClienteEntregaDTO, EntregaSync, EstadoSincronizacion } from '../models';
import { entregasStorageService, entregasApiService, mobileApiService } from '../services';
import { testEntregasApiService } from '../services/testEntregasApiService';

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
      // Usar el nuevo endpoint móvil
      console.log('[STORE] 📱 Usando nuevo endpoint móvil /Mobile/entregas');
      const clientes = await mobileApiService.getEntregas();
      await entregasStorageService.updateClientesEntrega(clientes);
      return clientes;
    } catch (error: any) {
      console.error('[STORE] ❌ Error con endpoint móvil, intentando fallback:', error);
      try {
        // Fallback al método legacy
        console.log('[STORE] 🔄 Fallback al método legacy');
        const clientes = await entregasApiService.fetchEntregasMoviles();
        await entregasStorageService.updateClientesEntrega(clientes);
        return clientes;
      } catch (fallbackError: any) {
        console.error('[STORE] ❌ Error en fallback:', fallbackError);
        return rejectWithValue(fallbackError.message || 'Error al cargar embarques');
      }
    }
  }
);

export const fetchEmbarquesWithTestData = createAsyncThunk(
  'entregas/fetchEmbarquesWithTestData',
  async (_, { rejectWithValue }) => {
    try {
      const clientes = await testEntregasApiService.fetchEntregasConFallback();
      await entregasStorageService.updateClientesEntrega(clientes);
      return clientes;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al cargar embarques con datos de prueba');
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

export const crearDatosPrueba = createAsyncThunk(
  'entregas/crearDatosPrueba',
  async (config: { cantidadClientes?: number; cantidadEntregas?: number; generarRutaGPS?: boolean } = {}, { rejectWithValue }) => {
    try {
      console.log('[STORE] 🧪 Creando datos de prueba...');
      const result = await mobileApiService.crearDatosPrueba(config);
      return result;
    } catch (error: any) {
      console.error('[STORE] ❌ Error creando datos de prueba:', error);
      return rejectWithValue(error.message || 'Error al crear datos de prueba');
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
      .addCase(fetchEmbarquesWithTestData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmbarquesWithTestData.fulfilled, (state, action) => {
        state.loading = false;
        state.clientes = action.payload;
        state.lastSync = Date.now();
      })
      .addCase(fetchEmbarquesWithTestData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(loadLocalData.fulfilled, (state, action) => {
        state.clientes = action.payload.clientes;
        state.entregasSync = action.payload.entregasSync;
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
      })
      .addCase(crearDatosPrueba.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(crearDatosPrueba.fulfilled, (state) => {
        state.loading = false;
        // Los datos se recargarán con la siguiente llamada a fetch
      })
      .addCase(crearDatosPrueba.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateEntregaSync, removeEntregaSync, clearError } = entregasSlice.actions;
export default entregasSlice.reducer;
