import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LocationState, Location } from '../../types';
import * as ExpoLocation from 'expo-location';

// Async thunks
export const requestLocationPermission = createAsyncThunk(
  'location/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Permission request failed');
    }
  }
);

export const getCurrentLocation = createAsyncThunk(
  'location/getCurrentLocation',
  async (_, { rejectWithValue }) => {
    try {
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });
      
      const coords: Location = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return coords;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get location');
    }
  }
);

export const watchLocation = createAsyncThunk(
  'location/watchLocation',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const coords: Location = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          dispatch(updateCurrentLocation(coords));
        }
      );
      
      return subscription;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to watch location');
    }
  }
);

const initialState: LocationState = {
  currentLocation: null,
  isLocationEnabled: false,
  isLoading: false,
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    updateCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      state.isLocationEnabled = true;
    },
    clearLocationError: (state) => {
      state.error = null;
    },
    setLocationEnabled: (state, action: PayloadAction<boolean>) => {
      state.isLocationEnabled = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Request Permission
    builder
      .addCase(requestLocationPermission.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestLocationPermission.fulfilled, (state) => {
        state.isLoading = false;
        state.isLocationEnabled = true;
        state.error = null;
      })
      .addCase(requestLocationPermission.rejected, (state, action) => {
        state.isLoading = false;
        state.isLocationEnabled = false;
        state.error = action.payload as string;
      })
      // Get Current Location
      .addCase(getCurrentLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLocation = action.payload;
        state.error = null;
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Watch Location
      .addCase(watchLocation.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { updateCurrentLocation, clearLocationError, setLocationEnabled } = locationSlice.actions;
export default locationSlice.reducer;
