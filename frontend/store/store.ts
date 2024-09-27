import { configureStore } from '@reduxjs/toolkit';
import loginDataReducer from '@/store/login';
import appSettingsReducer from '@/store/app_settings';

export const store = configureStore({
	reducer: {
		loginData: loginDataReducer,
		appSettings: appSettingsReducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
