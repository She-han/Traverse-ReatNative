import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState, ServiceAlert } from '../../types';

const initialState: AppState = {
  isOnboarded: false,
  theme: 'light',
  isConnected: true,
  alerts: [],
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setOnboarded: (state, action: PayloadAction<boolean>) => {
      state.isOnboarded = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    addAlert: (state, action: PayloadAction<ServiceAlert>) => {
      const existingIndex = state.alerts.findIndex(alert => alert.id === action.payload.id);
      if (existingIndex !== -1) {
        state.alerts[existingIndex] = action.payload;
      } else {
        state.alerts.push(action.payload);
      }
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },
    setAlerts: (state, action: PayloadAction<ServiceAlert[]>) => {
      state.alerts = action.payload;
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },
  },
});

export const {
  setOnboarded,
  setTheme,
  setConnected,
  addAlert,
  removeAlert,
  setAlerts,
  clearAlerts,
} = appSlice.actions;

export default appSlice.reducer;
