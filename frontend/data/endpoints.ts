export const API_URL = 'http://127.0.0.1:8001';
export const LOCAL_URL = 'http://127.0.0.1:3002';

const endpoints = {
	auth: {
		login: `${API_URL}/api/user/login/`,
		refresh: `${API_URL}/api/user/refresh/`,
		user: `${API_URL}/api/user/me/`,
		register: `${API_URL}/api/user/register/`,
	},
	user: {
		list: '/api/user',
	},
	session: {
		get: (id: string) => `/api/user/session/${id}`,
		list: `/api/user/session`,
	},
};

export default endpoints;
