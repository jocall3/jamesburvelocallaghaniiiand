import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice';
import userReducer from './slices/userSlice';
import themeReducer from './slices/themeSlice';
import apiReducer from './slices/apiSlice';
import settingsReducer from './slices/settingsSlice';
import cartReducer from './slices/cartSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    theme: themeReducer,
    api: apiReducer,
    settings: settingsReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'], // Ignore persist actions
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;