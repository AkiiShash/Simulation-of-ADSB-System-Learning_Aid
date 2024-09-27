'use client';

import React, { useEffect } from 'react';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';

function page() {
	const loginData = useSelector((state: RootState) => state.loginData);
	const navigation = useRouter();

	useEffect(() => {
		if (loginData.is_login) {
			if (loginData.role === 'A') {
				navigation.replace('/dashboard/admin');
			} else if (loginData.role === 'U') {
				navigation.replace('/dashboard/user');
			}
		}
	}, []);
	return <></>;
}

export default page;
