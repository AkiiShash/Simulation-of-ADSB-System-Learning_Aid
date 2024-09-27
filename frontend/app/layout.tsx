'use client';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { APIProvider } from '@vis.gl/react-google-maps';
import StateProvider from '@/store/StateProvider';
import AuthHandler from '@/data/AuthHandler';

const inter = Inter({ subsets: ['latin'] });
const API_KEY = 'AIzaSyC6rSnif1Mq9yn93AANkTtTOmrHtXX1Ngk';

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className} suppressHydrationWarning={true}>
				<StateProvider>
					<AuthHandler>
						<APIProvider apiKey={API_KEY}>{children}</APIProvider>
					</AuthHandler>
				</StateProvider>
			</body>
		</html>
	);
}
