import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState, UserProfile, UserPreferences } from '../../types';

const initialState: UserState = {
  profile: null,
  preferences: {
    notifications: true,
    darkMode: false,
    language: 'en',
    distanceUnit: 'km',
    notificationSettings: {
      busArrival: true,
      busDelays: true,
      routeUpdates: true,
      weeklyReport: false,
      arrivalReminder: 5
    }
  },
  favorites: {
    routes: [],
    stops: [],
  },
  achievements: [],
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    updateUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    addFavoriteRoute: (state, action: PayloadAction<string>) => {
      if (!state.favorites.routes.includes(action.payload)) {
        state.favorites.routes.push(action.payload);
      }
    },
    removeFavoriteRoute: (state, action: PayloadAction<string>) => {
      state.favorites.routes = state.favorites.routes.filter(id => id !== action.payload);
    },
    addFavoriteStop: (state, action: PayloadAction<string>) => {
      if (!state.favorites.stops.includes(action.payload)) {
        state.favorites.stops.push(action.payload);
      }
    },
    removeFavoriteStop: (state, action: PayloadAction<string>) => {
      state.favorites.stops = state.favorites.stops.filter(id => id !== action.payload);
    },
    incrementTripCount: (state) => {
      if (state.profile) {
        state.profile.totalTrips += 1;
      }
    },
    addPoints: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.points += action.payload;
      }
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setUserProfile,
  updateUserPreferences,
  addFavoriteRoute,
  removeFavoriteRoute,
  addFavoriteStop,
  removeFavoriteStop,
  incrementTripCount,
  addPoints,
  clearUserError,
} = userSlice.actions;

export default userSlice.reducer;
