const headerText: { [key: string]: string } = {};

import { Position } from '@/app/components/Aircraft';
import { SessionInstanceType } from '@/types/users';
import { createSlice } from '@reduxjs/toolkit';

type UserType = {
	//
};

type AppSettingsType = {
	current_session: {
		users: UserType[];
	};
	sessions: SessionInstanceType[];
	online_users: UserType[];
};

const initialState: AppSettingsType = {
	current_session: {
		users: [],
	},
	online_users: [],
	sessions: [],
};

export const appSettingsSlice = createSlice({
	name: 'app_settings',
	initialState: initialState,
	reducers: {
		newSession: (state, action: { payload: SessionInstanceType }) => {
			state.sessions.push(action.payload);
		},
		setSessionList: (state, action: { payload: SessionInstanceType[] }) => {
			state.sessions = action.payload;
		},
		newAircraftPosition: (state, action: { payload: { session_id: string; id: string; position: Position } }) => {
			const data = action.payload;
			state.sessions.map((session) => {
				if (session.id === data.session_id) {
					session.aircrafts.map((aircrft) => (aircrft.id === data.id ? { ...aircrft, current_pos: data.position } : aircrft));
				}
				return session;
			});
		},
	},
});

export const { newSession, setSessionList, newAircraftPosition } = appSettingsSlice.actions;

export default appSettingsSlice.reducer;
