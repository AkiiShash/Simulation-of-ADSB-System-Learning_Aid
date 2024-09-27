'use client';

import { RootState } from '@/store/store';
import React from 'react';
import { useSelector } from 'react-redux';

function page() {
	const sessionData = useSelector((state: RootState) => state.appSettings.sessions);
	return (
		<div className="w-full h-screen flex flex-col items-center justify-center">
			<h1 className="text-3xl font-semibold">{sessionData.length > 0 ? 'Select session to interact with' : 'No Available Sessions Found'}</h1>
			<div className="h-60" />
		</div>
	);
}

export default page;
