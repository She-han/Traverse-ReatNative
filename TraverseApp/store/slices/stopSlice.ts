import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StopState, BusStop } from '../../types';

const initialState: StopState = {
  stops: {},
  nearbyStops: [],
  isLoading: false,
  error: null,
};

const stopSlice = createSlice({
  name: 'stops',
  initialState,
  reducers: {
    setStops: (state, action: PayloadAction<BusStop[]>) => {
      state.stops = {};
      action.payload.forEach(stop => {
        state.stops[stop.id] = stop;
      });
    },
    addStop: (state, action: PayloadAction<BusStop>) => {
      const stop = action.payload;
      state.stops[stop.id] = stop;
    },
    updateStop: (state, action: PayloadAction<{ stopId: string; updates: Partial<BusStop> }>) => {
      const { stopId, updates } = action.payload;
      if (state.stops[stopId]) {
        state.stops[stopId] = { ...state.stops[stopId], ...updates };
      }
    },
    setNearbyStops: (state, action: PayloadAction<string[]>) => {
      state.nearbyStops = action.payload;
    },
    updateNextBuses: (state, action: PayloadAction<{ stopId: string; nextBuses: any[] }>) => {
      const { stopId, nextBuses } = action.payload;
      if (state.stops[stopId]) {
        state.stops[stopId].nextBuses = nextBuses;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setStops,
  addStop,
  updateStop,
  setNearbyStops,
  updateNextBuses,
  setLoading,
  setError,
} = stopSlice.actions;

export default stopSlice.reducer;
