import { clearTokens, storeTokens } from '@/data/tokens';
import { TokensProps } from '@/types/common';
import { LoginDataType, LoginStateType } from '@/types/users';
import { createSlice } from '@reduxjs/toolkit';

const initialState: LoginStateType = {
	id: '',
	email: '',
	role: 'U',
	is_login: false,
	tokens: {
		access: '',
		refresh: '',
	},
};

export const loginDataSlice = createSlice({
	name: 'login_data',
	initialState: initialState,
	reducers: {
		login: (state, payload) => {
			const data = payload.payload as LoginDataType;

			state.id = data.id;
			state.email = data.email;
			state.role = data.role;
			state.is_login = true;
		},
		logout: (state: any) => {
			const initState: any = initialState;
			for (var state_key in state) {
				if (state_key !== 'tokens') {
					if (state.hasOwnProperty(state_key)) {
						state[state_key] = initState[state_key];
					}
				}
			}
			clearTokens();
		},
		setTokens: (state, payload) => {
			const data = payload.payload as TokensProps;
			state.tokens = data;
			storeTokens(data);
		},
	},
});

export const { login, logout, setTokens } = loginDataSlice.actions;

export default loginDataSlice.reducer;
