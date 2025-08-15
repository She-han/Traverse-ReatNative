import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../../types';
import { authService } from '../../services/authService';
import { ErrorHandler, UserFriendlyError } from '../../utils/errorHandler';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authService.signIn(credentials.email, credentials.password);
      return response;
    } catch (error) {
      const userFriendlyError = ErrorHandler.handleAuthError(error);
      return rejectWithValue(userFriendlyError);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: { email: string; password: string; name: string }, { rejectWithValue }) => {
    try {
      const response = await authService.signUp(userData.email, userData.password, userData.name);
      return response;
    } catch (error) {
      const userFriendlyError = ErrorHandler.handleAuthError(error);
      return rejectWithValue(userFriendlyError);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.signOut();
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refreshToken();
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Token refresh failed');
    }
  }
);

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true, // Start with loading true to check auth state
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false; // Stop loading when user is set
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false; // Stop loading when auth is cleared
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        const error = action.payload as UserFriendlyError;
        state.error = error.message;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        const error = action.payload as UserFriendlyError;
        state.error = error.message;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      // Refresh Token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
      });
  },
});

export const { clearError, setUser, clearAuth, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
