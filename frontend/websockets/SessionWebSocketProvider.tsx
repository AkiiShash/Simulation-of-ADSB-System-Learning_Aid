import socketEndpoints, { sendSocketData, SocketTypes } from '@/data/socketEndpoints';
import { store } from '@/store/store';
import React, { useEffect, useState, createContext, useContext } from 'react';

const SessionWebSocketContext = createContext<WebSocket | null>(null);

export const useSessionWebSocket = () => useContext(SessionWebSocketContext);

export const useSessionWebSocketListener = (onMessage: (data: string) => void): void => {
	// const socket = useSessionWebSocket();
	const socket = useContext(SessionWebSocketContext);

	useEffect(() => {
		if (!socket) return;

		const handleMessage = (event: MessageEvent) => {
			console.log(event.data);
			onMessage(event.data);
		};

		socket.addEventListener('message', handleMessage);

		socket.addEventListener('open', () => {
			console.log('connection stablished');
			if (store.getState().loginData.role === 'A') {
				socket.send(sendSocketData('admin.login'));
			} else if (store.getState().loginData.role === 'U') {
				socket.send(sendSocketData('user.login'));
			}
		});

		socket.addEventListener('close', () => {
			console.log('connection closed');
			// alert('connection closed');
		});

		return () => {
			socket.removeEventListener('message', handleMessage);
		};
	}, [socket, onMessage]);
};

export const useSessionWebSocketSender = (): ((type: SocketTypes, message: object) => void) => {
	// const socket = useSessionWebSocket();
	const socket = useContext(SessionWebSocketContext);

	const sendMessage = (type: SocketTypes, message: object) => {
		if (socket) {
			socket.send(sendSocketData(type, message));
		}
	};

	return sendMessage;
};

function SessionWebSocketProvider({ children }: { children: React.ReactNode }) {
	const [socket, setSocket] = useState<WebSocket | null>(null);

	useEffect(() => {
		if (!socket) {
			const newSocket = new WebSocket(socketEndpoints.session);
			setSocket(newSocket);
		}

		return () => {};
	}, []);

	return <SessionWebSocketContext.Provider value={socket}>{children}</SessionWebSocketContext.Provider>;
}

export default SessionWebSocketProvider;
