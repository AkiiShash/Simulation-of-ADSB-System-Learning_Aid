'use client';
import React, { useEffect } from 'react';
import { getTokens } from './tokens';
import apiClient from './apiClient';
import { useDispatch, useSelector } from 'react-redux';
import { login, logout, setTokens } from '@/store/login';
import axios from 'axios';
import { RootState } from '@/store/store';
import { consolelog } from './funcs';
import endpoints from './endpoints';

const TOKEN_UPDATE_TIME = 1000 * 60 * 60 * 20;

function AuthHandler({ children }: { children: React.ReactNode }) {
	const dispatch = useDispatch();

	async function loadUser() {
		await apiClient
			.get(endpoints.auth.user)
			.then((response) => {
				dispatch(login(response.data));
			})
			.catch((error) => {
				consolelog(error);
				dispatch(logout());
			});
	}

	function loadTokens() {
		const tokens = getTokens();
		if (tokens && tokens.access !== '') {
			dispatch(setTokens(tokens));
			loadUser();
		}
	}

	useEffect(() => {
		loadTokens();

		const intervalId = setInterval(loadTokens, TOKEN_UPDATE_TIME);

		return () => clearInterval(intervalId);
	}, []);

	return <>{children}</>;
}

export default AuthHandler;
