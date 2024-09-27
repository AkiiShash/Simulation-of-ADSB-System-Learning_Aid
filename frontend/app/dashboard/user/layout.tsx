'use client';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import * as moment from 'moment';

import { SocketTypes } from '@/data/socketEndpoints';
import { newSession, setSessionList } from '@/store/app_settings';
import { RootState } from '@/store/store';
import { useSessionWebSocketListener } from '@/websockets/SessionWebSocketProvider';
import apiClient from '@/data/apiClient';
import endpoints from '@/data/endpoints';
import { ListResponseType } from '@/types/common';
import { SessionInstanceType } from '@/types/users';

function TimeLine({ data }: { data: SessionInstanceType }) {
	const datetime = new Date(data.created_at.replace(' ', 'T'));
	return (
		<Link href={`/dashboard/user/session/${data.id}`}>
			<li className="p-2 hover:bg-slate-200 cursor-pointer">
				<h2 className="font-semibold text-xl">{datetime.toISOString().split('T')[0]}</h2>
				<h2 className="text-md">{datetime.toISOString().split('T')[1].split('.')[0]}</h2>
			</li>
		</Link>
	);
}

function layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const sessiondata = useSelector((state: RootState) => state.appSettings.sessions);
	const dispatch = useDispatch();

	const created_at = useSessionWebSocketListener((message) => {
		const data = JSON.parse(message) as { type: SocketTypes } & any;
		console.log(data);

		if (data.type === 'session.new') {
			dispatch(newSession(data));
		}
	});

	async function loadActiveSessionsList() {
		await apiClient
			.get(endpoints.session.list)
			.then((response) => {
				const data = response.data as ListResponseType<SessionInstanceType>;
				dispatch(setSessionList(data.results));
			})
			.catch((error) => {
				console.log(error);
			});
	}

	useEffect(() => {
		loadActiveSessionsList();
	}, []);

	return (
		<div className="flex">
			<div className="w-96 h-screen border-r border-r-slate-400 p-4">
				<h1 className="w-full text-2xl text-center text-indigo-600 font-semibold mb-6">Sessions</h1>
				<div className="py-4">
					<ul>
						{sessiondata.map((sessionItem, index) => (
							<TimeLine key={index} data={sessionItem} />
						))}
					</ul>
				</div>
			</div>
			<div className="w-full">{children}</div>
		</div>
	);
}

export default layout;
