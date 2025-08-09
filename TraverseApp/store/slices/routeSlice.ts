import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RouteState, BusRoute } from '../../types';

const initialState: RouteState = {
  routes: {},
  activeRoutes: [],
  isLoading: false,
  error: null,
};

const routeSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    setRoutes: (state, action: PayloadAction<BusRoute[]>) => {
      state.routes = {};
      state.activeRoutes = [];
      
      action.payload.forEach(route => {
        state.routes[route.id] = route;
        if (route.isActive) {
          state.activeRoutes.push(route.id);
        }
      });
    },
    addRoute: (state, action: PayloadAction<BusRoute>) => {
      const route = action.payload;
      state.routes[route.id] = route;
      if (route.isActive && !state.activeRoutes.includes(route.id)) {
        state.activeRoutes.push(route.id);
      }
    },
    updateRoute: (state, action: PayloadAction<{ routeId: string; updates: Partial<BusRoute> }>) => {
      const { routeId, updates } = action.payload;
      if (state.routes[routeId]) {
        state.routes[routeId] = { ...state.routes[routeId], ...updates };
      }
    },
    toggleRouteActive: (state, action: PayloadAction<string>) => {
      const routeId = action.payload;
      if (state.routes[routeId]) {
        state.routes[routeId].isActive = !state.routes[routeId].isActive;
        
        if (state.routes[routeId].isActive) {
          if (!state.activeRoutes.includes(routeId)) {
            state.activeRoutes.push(routeId);
          }
        } else {
          state.activeRoutes = state.activeRoutes.filter(id => id !== routeId);
        }
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
  setRoutes,
  addRoute,
  updateRoute,
  toggleRouteActive,
  setLoading,
  setError,
} = routeSlice.actions;

export default routeSlice.reducer;
