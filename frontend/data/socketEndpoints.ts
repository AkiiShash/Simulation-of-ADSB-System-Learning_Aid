import { store } from '@/store/store';

const API_URL = 'http://127.0.0.1:8001';

// ?token=${store.getState().loginData.tokens?.access}
const socket_url = (url: string) => `ws:${API_URL.split(':').slice(1).join(':')}/ws${url}}`;

const socketEndpoints = {
	session: socket_url(`/session`),
};

export type SocketTypes = 'session.start' | 'session.pause' | 'session.resume' | 'session.new' | 'session.close' | 'admin.login' | 'user.login' | 'user.logout' | 'aircraft.moved';

export function sendSocketData(type: SocketTypes, data?: any): string {
	return JSON.stringify({
		token: store.getState().loginData.tokens?.access,
		type: type,
		data: data,
	});
}

export default socketEndpoints;
