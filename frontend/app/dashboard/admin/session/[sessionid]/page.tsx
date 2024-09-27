'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Map } from '@vis.gl/react-google-maps';
import Aircraft, { AircraftType, Position } from '@/app/components/Aircraft';
import { useRouter } from 'next/navigation';

import { RootState } from '@/store/store';
import { Polyline } from '@/app/components/Polyline';
import { newAircraftPosition } from '@/store/app_settings';
import Button from '@/app/components/Button';
import { useSessionWebSocketSender } from '@/websockets/SessionWebSocketProvider';

const MAP_ID = '54a498333d9d2e45';
const initMidPos = { lat: 7.564474318183524, lng: 80.70902422353177 };

function page({ params }: { params: any }) {
	const sessionID = params.sessionid;
	const navigation = useRouter();

	const dispatch = useDispatch();

	const sessionData = useSelector((state: RootState) => state.appSettings.sessions.find((obj) => obj.id === sessionID));

	// function onAircraftCurrentLocationChange(id: string, new_position: Position) {
	// 	dispatch(newAircraftPosition({ id: id, session_id: sessionID, position: new_position }));
	// }

	function onAircraftCurrentLocationChange(aircraftid: string, new_position: Position) {
		setAircrafts((prevVal) => prevVal.map((item) => (item.id === aircraftid ? { ...item, current_pos: new_position } : item)));
	}

	const [aircrafts, setAircrafts] = useState<AircraftType[]>([]);

	useEffect(() => {
		console.log(sessionData);
		console.log(sessionData && sessionData.id === '');
		if (!sessionData || sessionData.id === '') {
			navigation.replace('/dashboard/user/session/');
		} else {
			setAircrafts(sessionData.aircrafts);
		}
	}, []);

	const [sessionStarted, setSessionStarted] = useState<boolean>(sessionData?.status === 'started');

	const sendMsg = useSessionWebSocketSender();

	function startSimulation() {
		// sendMsg('session.start', { id: sessionID });
		setSessionStarted(true);
	}

	function pauseSimulation() {
		// sendMsg('session.pause', { id: sessionID });
		setSessionStarted(false);
	}

	console.log(sessionData?.status === 'started');

	return (
		<div className="w-full flex">
			<div className="w-1/5 p-2">
				{sessionStarted ? <Button label="Pause Simulation" btnType="danger" onClick={pauseSimulation} /> : <Button label="Start Simulation" onClick={startSimulation} />}
			</div>
			<div className="w-4/5">
				{sessionData ? (
					<Map mapId={MAP_ID} className="w-full h-screen" defaultCenter={initMidPos} defaultZoom={6}>
						{aircrafts.map((aircraft, index) => (
							<div key={index}>
								<Aircraft
									onChangePosition={onAircraftCurrentLocationChange}
									data={aircraft}
									key={index}
									index={index}
									isStart={sessionStarted}
									session_id={sessionData.id}
									simulation_time_factor={sessionData.simmulation_time}
								/>
								<Polyline strokeWeight={1} key={aircraft.id} path={[aircraft.start_pos, aircraft.end_pos]} />
							</div>
						))}
					</Map>
				) : (
					<div className="bg-slate-100 flex items-center justify-center w-full h-screen">Map Loading...</div>
				)}
			</div>
		</div>
	);
}

export default page;
