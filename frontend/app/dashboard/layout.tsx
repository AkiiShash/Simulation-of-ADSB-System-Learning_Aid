'use client';
import { RootState } from '@/store/store';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { setRedirectURL } from '@/data/funcs';
import { LOCAL_URL } from '@/data/endpoints';
import { usePathname, useRouter } from 'next/navigation';
import WebSocketProvider from '@/websockets/WebSocketProvider';

function layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const loginData = useSelector((state: RootState) => state.loginData);
	const pathname = usePathname();
	const navigation = useRouter();

	useEffect(() => {
		if (loginData.is_login) {
			let redirect_url = `${window.location}`;
			const redirect_url_arr = redirect_url.split(LOCAL_URL);
			redirect_url = redirect_url_arr[redirect_url_arr.length - 1];
			setRedirectURL(redirect_url);
			if (pathname === '/dashboard') {
				if (loginData.role === 'A') {
					navigation.replace('/dashboard/admin');
				} else if (loginData.role === 'U') {
					navigation.replace('/dashboard/user');
				}
			}
			if (pathname.split('/').slice(0, 3).join('/') === '/dashboard/user') {
				if (loginData.role === 'A') {
					navigation.replace('/dashboard/admin');
				}
			}
			if (pathname.split('/').slice(0, 3).join('/') === '/dashboard/admin') {
				if (loginData.role === 'U') {
					navigation.replace('/dashboard/user');
				}
			}
		} else {
			navigation.replace('/');
		}
	}, [pathname, loginData.role]);

	return <WebSocketProvider>{children}</WebSocketProvider>;
}

export default layout;
