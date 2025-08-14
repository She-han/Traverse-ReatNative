import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { RootState } from '../types';

// Import reducers
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import busReducer from './slices/busSlice';
import routeReducer from './slices/routeSlice';
import stopReducer from './slices/stopSlice';
import locationReducer from './slices/locationSlice';
import notificationReducer from './slices/notificationSlice';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    buses: busReducer,
    routes: routeReducer,
    stops: stopReducer,
    location: locationReducer,
    notifications: notificationReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['register', 'auth.user.createdAt', 'auth.user.lastLoginAt'],
        ignoredActionPaths: ['payload.createdAt', 'payload.lastLoginAt'],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
