import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BusState, Bus, RealTimeUpdate } from '../../types';

// Mock API calls - replace with actual API
const busAPI = {
  fetchBuses: async (): Promise<Bus[]> => {
    // This would be replaced with actual API call
    return [];
  },
  fetchBusByRoute: async (routeId: string): Promise<Bus[]> => {
    // This would be replaced with actual API call
    return [];
  },
  updateBusLocation: async (update: RealTimeUpdate): Promise<void> => {
    // This would be replaced with actual API call
  },
};

// Async thunks
export const fetchBuses = createAsyncThunk(
  'buses/fetchBuses',
  async (_, { rejectWithValue }) => {
    try {
      const buses = await busAPI.fetchBuses();
      return buses;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch buses');
    }
  }
);

export const fetchBusesByRoute = createAsyncThunk(
  'buses/fetchBusesByRoute',
  async (routeId: string, { rejectWithValue }) => {
    try {
      const buses = await busAPI.fetchBusByRoute(routeId);
      return buses;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch buses for route');
    }
  }
);

export const updateBusRealTime = createAsyncThunk(
  'buses/updateRealTime',
  async (update: RealTimeUpdate, { rejectWithValue }) => {
    try {
      await busAPI.updateBusLocation(update);
      return update;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update bus location');
    }
  }
);

const initialState: BusState = {
  buses: {},
  activeBuses: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const busSlice = createSlice({
  name: 'buses',
  initialState,
  reducers: {
    updateBusLocation: (state, action: PayloadAction<{ busId: string; location: any; timestamp: Date }>) => {
      const { busId, location, timestamp } = action.payload;
      if (state.buses[busId]) {
        state.buses[busId].currentLocation = location;
        state.buses[busId].lastUpdated = timestamp;
      }
    },
    setBusCapacity: (state, action: PayloadAction<{ busId: string; capacity: Bus['capacity'] }>) => {
      const { busId, capacity } = action.payload;
      if (state.buses[busId]) {
        state.buses[busId].capacity = capacity;
      }
    },
    addBus: (state, action: PayloadAction<Bus>) => {
      const bus = action.payload;
      state.buses[bus.id] = bus;
      if (!state.activeBuses.includes(bus.id)) {
        state.activeBuses.push(bus.id);
      }
    },
    removeBus: (state, action: PayloadAction<string>) => {
      const busId = action.payload;
      delete state.buses[busId];
      state.activeBuses = state.activeBuses.filter(id => id !== busId);
    },
    clearBusError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Buses
    builder
      .addCase(fetchBuses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBuses.fulfilled, (state, action) => {
        state.isLoading = false;
        const buses = action.payload;
        state.buses = {};
        state.activeBuses = [];
        
        buses.forEach(bus => {
          state.buses[bus.id] = bus;
          state.activeBuses.push(bus.id);
        });
        
        state.lastUpdated = new Date();
        state.error = null;
      })
      .addCase(fetchBuses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch Buses by Route
      .addCase(fetchBusesByRoute.fulfilled, (state, action) => {
        const buses = action.payload;
        buses.forEach(bus => {
          state.buses[bus.id] = bus;
          if (!state.activeBuses.includes(bus.id)) {
            state.activeBuses.push(bus.id);
          }
        });
        state.lastUpdated = new Date();
      })
      // Update Real Time
      .addCase(updateBusRealTime.fulfilled, (state, action) => {
        const update = action.payload;
        if (state.buses[update.busId]) {
          state.buses[update.busId].currentLocation = update.location;
          state.buses[update.busId].speed = update.speed;
          state.buses[update.busId].heading = update.heading;
          state.buses[update.busId].lastUpdated = update.timestamp;
          if (update.passengers !== undefined) {
            state.buses[update.busId].passengers = update.passengers;
          }
        }
      });
  },
});

export const { 
  updateBusLocation, 
  setBusCapacity, 
  addBus, 
  removeBus, 
  clearBusError 
} = busSlice.actions;

export default busSlice.reducer;
