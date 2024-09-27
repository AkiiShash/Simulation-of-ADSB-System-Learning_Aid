import axios from 'axios';
import * as jwt_decode from 'jwt-decode';
import dayjs from 'dayjs';

import { store } from '@/store/store';
import { logout, setTokens } from '@/store/login';
import endpoints, { API_URL } from './endpoints';
import { getTokens } from './tokens';

let isRefreshing = false;
let refreshQueue: any[] = [];

const apiClient = axios.create({
	baseURL: API_URL,
	timeout: 1000 * 60,
});

apiClient.interceptors.request.use(
	async (request) => {
		let tokens = store.getState().loginData.tokens;

		if (!tokens) {
			return request;
		}
		if (tokens.access === '') {
			return request;
		} else {
			tokens = getTokens();
			if (!tokens) {
				return request;
			}
		}
		const user = jwt_decode.jwtDecode(tokens.access);

		if (user.exp) {
			const isExpired = dayjs.unix(user.exp).diff(dayjs(), 'minute') <= 4.5;

			if (isExpired) {
				if (!isRefreshing) {
					isRefreshing = true;
					try {
						const result = await axios.post(endpoints.auth.refresh, { refresh: tokens.refresh });
						store.dispatch(setTokens(result.data));
						request.headers.Authorization = `JWT ${result.data.access}`;
						isRefreshing = false;
						refreshQueue.forEach((prom) => prom());
						refreshQueue = [];
					} catch (e) {
						console.log(e);
						store.dispatch(logout());
					}
				}
				// If a refresh is already in progress, queue the request
				else {
					return new Promise((resolve, reject) => {
						refreshQueue.push(() => {
							request.headers.Authorization = `JWT ${store.getState().loginData.tokens?.access}`;
							resolve(request);
						});
					});
				}
			} else {
				request.headers.Authorization = `JWT ${tokens.access}`;
			}
		}

		request.headers.Authorization = `JWT ${tokens.access}`;

		return request;
	},
	(error) => {
		return Promise.reject(error);
	},
);

export default apiClient;
