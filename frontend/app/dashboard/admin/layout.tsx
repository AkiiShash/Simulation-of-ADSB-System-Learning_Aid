'use client';

import Link from 'next/link';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@/store/store';
import { useSessionWebSocketListener } from '@/websockets/SessionWebSocketProvider';
import { SocketTypes } from '@/data/socketEndpoints';
import { newSession, setSessionList } from '@/store/app_settings';
import apiClient from '@/data/apiClient';
import endpoints from '@/data/endpoints';
import { ListResponseType } from '@/types/common';
import { SessionInstanceType } from '@/types/users';
import { useRouter } from 'next/navigation';

function TimeLine({ data }: { data: SessionInstanceType }) {
	const datetime = new Date(data.created_at.replace(' ', 'T'));
	return (
		<Link href={`/dashboard/admin/session/${data.id}`}>
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
	const navigation = useRouter();

	useSessionWebSocketListener((message) => {
		const data = JSON.parse(message) as { type: SocketTypes } & any;
		console.log(data);

		if (data.type === 'session.new') {
			dispatch(newSession(data));
		}
	});

	async function loadAllSessions() {
		await apiClient
			.get(endpoints.session.list)
			.then((response) => {
				const data = response.data as ListResponseType<SessionInstanceType>;
				console.log(data);
				dispatch(setSessionList(data.results));
				if (data.count === 0) {
					navigation.replace('/dashboard/admin/session/create');
				}
			})
			.catch((error) => {
				console.log(error);
			});
	}

	useEffect(() => {
		loadAllSessions();
	}, []);

	return (
		<div className="flex w-screen h-screen">
			<div className="h-screen border-r border-r-slate-400 p-4" style={{ width: 450 }}>
				<Link href={'/dashboard/admin/session/create'}>
					<h1 className="w-full text-center p-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white">Create New Session</h1>
				</Link>
				<ul>
					{sessiondata.map((sessionItem, index) => (
						<TimeLine data={sessionItem} key={index} />
					))}
				</ul>
			</div>
			<div className="w-full min-h-screen overflow-y-scroll">{children}</div>
		</div>
	);
}

export default layout;
