import React from 'react';
import SessionWebSocketProvider from './SessionWebSocketProvider';

function WebSocketProvider({ children }: { children: React.ReactNode }) {
	return (
		<>
			<SessionWebSocketProvider>
				<>{children}</>
			</SessionWebSocketProvider>
		</>
	);
}

export default WebSocketProvider;
