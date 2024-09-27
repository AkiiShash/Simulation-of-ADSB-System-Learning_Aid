'use client';
import React from 'react';
import { useEffect, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/data/firebase-config';

import Aircraft, { AircraftType, CollisionPoint, Position } from '@/app/components/Aircraft';
import { useSessionWebSocketSender } from '@/websockets/SessionWebSocketProvider';
import { UserType } from '@/types/users';
import apiClient from '@/data/apiClient';
import endpoints from '@/data/endpoints';
import { ListResponseType } from '@/types/common';
import Button from '@/app/components/Button';
import { findIntersection, generateUniqueID } from '@/data/funcs';
import { Polyline } from '@/app/components/Polyline';

// const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY as string;
const MAP_ID = '54a498333d9d2e45';
const initMidPos = { lat: 7.564474318183524, lng: 80.70902422353177 };
const COLLISION_THRESHOLD_KM = 100; // Define the collision threshold distance in kilometers

function page() {
	const sendMessage = useSessionWebSocketSender();

	const [mapLoaded, setMapLoaded] = useState<boolean>(false);
	const [sessionUsersType, setSessionUsersType] = useState<'all' | 'users'>('all');

	const [midPos, setMidPos] = useState(initMidPos);
	const [collisionPositions, setCollisionPositions] = useState<Position[]>([]);
	const [aircrafts, setAircrafts] = useState<AircraftType[]>([
		{
			current_pos: { lat: 3.5205366565098357, lng: 72.81072333737761 },
			end_pos: { lat: 9.88586359862792, lng: 87.37078920289427 },
			aircraft_id: '6TRWKJ',
			id: '',
			max_altitude: 500,
			max_velocity: 600,
			start_pos: { lat: 3.5205366565098357, lng: 72.81072333737761 },
			altitude: 500,
			angle: 0,
			velocity: 600,
		},
		{
			current_pos: { lat: 9.831894453841752, lng: 72.84307876511961 },
			end_pos: { lat: 4.720407877696219, lng: 87.70100668355376 },
			aircraft_id: '7K4YTF',
			id: '',
			max_altitude: 500,
			max_velocity: 600,
			start_pos: { lat: 9.831894453841752, lng: 72.84307876511961 },
			altitude: 500,
			angle: 0,
			velocity: 600,
		},
	]);
	const [controllableAircraft, setControllableAircraft] = useState<AircraftType | undefined>();

	const [usersList, setUsersList] = useState<UserType[]>([]);
	const [selectedUsersList, setSelectedUsersList] = useState<UserType[]>([]);
	const [simmulationTime, setSimmulationTime] = useState<number>(3600);

	const [newAircraft, setNewAircraft] = useState<AircraftType>({
		aircraft_id: generateUniqueID(),
		id: '',
		current_pos: { lat: 0, lng: 0 },
		start_pos: { lat: 0, lng: 0 },
		end_pos: { lat: 0, lng: 0 },
		max_altitude: 500,
		max_velocity: 600,
		altitude: 500,
		angle: 0,
		velocity: 600,
	});

	async function loadUsersList() {
		await apiClient
			.get(endpoints.user.list)
			.then((response) => {
				const data = response.data as ListResponseType<UserType>;
				setUsersList(data.results);
			})
			.catch((error) => {
				console.log(error);
			});
	}

	function selectedUsers(user: UserType) {
		setSelectedUsersList((prevVal) => [...prevVal, user]);
	}

	function removeUserFromSelectedList(index: number) {
		setSelectedUsersList((prevVal) => prevVal.filter((usr, indx) => indx !== index));
	}

	const simmulationsRef = collection(db, 'sessions');

	async function createNewSession() {
		if (aircrafts.length === 0) {
			alert('Please create new aircrafts to create a new session.');
			return;
		}
		if (sessionUsersType === 'users' && selectedUsersList.length === 0) {
			alert('Please select users to create a new session.');
			return;
		}
		const data = {
			aircrafts: aircrafts,
			users: selectedUsersList.map((item) => item.id),
			post_type: sessionUsersType,
			simmulation_time: simmulationTime,
		};
		sendMessage('session.new', data);

		for (let i = 0; i < aircrafts.length; i++) {
			addDoc(simmulationsRef, aircrafts[i]);
		}
	}

	const [newStartPosition, setNewStartPosition] = useState<Position>(midPos);
	const [enableAddStartPosition, setEnableAddStartPosition] = useState<boolean>(false);
	const [markerStartPosRef, startPosMarker] = useAdvancedMarkerRef();

	const [newEndPosition, setNewEndPosition] = useState<Position>(midPos);
	const [enableAddEndPosition, setEnableAddEndPosition] = useState<boolean>(false);
	const [markerEndPosRef, endPosMarker] = useAdvancedMarkerRef();

	function handleDragStartMarker(event: google.maps.MapMouseEvent) {
		if (event.latLng) {
			const { lng, lat } = event.latLng;
			setNewStartPosition({ lat: lat(), lng: lng() });
			setNewAircraft({ ...newAircraft, current_pos: { lat: lat(), lng: lng() }, start_pos: { lat: lat(), lng: lng() } });
		}
	}

	function handleDragEndtMarker(event: google.maps.MapMouseEvent) {
		if (event.latLng) {
			const { lng, lat } = event.latLng;
			setNewEndPosition({ lat: lat(), lng: lng() });
			setNewAircraft({ ...newAircraft, end_pos: { lat: lat(), lng: lng() } });
		}
	}

	function addNewAircraft() {
		console.log(newAircraft);
		if (`${newAircraft.start_pos.lat},${newAircraft.start_pos.lng}` === '0,0') {
			console.log(`${newAircraft.start_pos.lat},${newAircraft.start_pos.lng}`);
			alert('Need to have valid start position for aircraft');
			return;
		}
		if (`${newAircraft.end_pos.lat},${newAircraft.end_pos.lng}` === '0,0') {
			alert('Need to have valid end position for aircraft');
			return;
		}
		if (!newAircraft.max_velocity || newAircraft.max_velocity < 100) {
			alert('Need to have valid velocity for aircraft');
			return;
		}
		if (!newAircraft.max_altitude || newAircraft.max_altitude < 100) {
			alert('Need to have valid altitude for aircraft');
			return;
		}
		setAircrafts((prevVal) => [...prevVal, newAircraft]);
		setNewAircraft({
			aircraft_id: generateUniqueID(),
			id: '',
			current_pos: { lat: 0, lng: 0 },
			start_pos: { lat: 0, lng: 0 },
			end_pos: { lat: 0, lng: 0 },
			max_altitude: 500,
			max_velocity: 600,
			altitude: 500,
			angle: 0,
			velocity: 600,
		});
		setEnableAddStartPosition(false);
		setEnableAddEndPosition(false);
		setNewStartPosition(midPos);
		setNewEndPosition(midPos);
	}

	function removeAircraft(index: number) {
		setAircrafts((prevVal) => prevVal.filter((item, indx) => indx !== index));
	}

	function onAircraftCurrentLocationChange(aircraftid: string, new_position: Position) {
		setAircrafts((prevVal) => prevVal.map((item) => (item.id === aircraftid ? { ...item, current_pos: new_position } : item)));
	}

	const [isStart, setIsStart] = useState<boolean>(false);

	const checkForCollisions = () => {
		const newCollisionPositions: Position[] = [];

		for (let i = 0; i < aircrafts.length; i++) {
			for (let j = i + 1; j < aircrafts.length; j++) {
				const line1 = aircrafts[i];
				const line2 = aircrafts[j];

				// const distance = calculateDistance(pos1, pos2);
				// if (distance < COLLISION_THRESHOLD_KM) {
				// 	newCollisionPositions.push(pos1, pos2);
				// }

				const intersection = findIntersection(line1, line2);
				if (intersection) {
					newCollisionPositions.push(intersection);
					// send alert to aircrafts
				}
			}
		}
		console.log(newCollisionPositions);

		setCollisionPositions(newCollisionPositions);
	};

	const calculateDistance = (pos1: Position, pos2: Position) => {
		const R = 6371; // Radius of the Earth in kilometers
		const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
		const dLng = ((pos2.lng - pos1.lng) * Math.PI) / 180;
		const lat1 = (pos1.lat * Math.PI) / 180;
		const lat2 = (pos2.lat * Math.PI) / 180;

		const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		const distance = R * c; // Distance in kilometers

		console.log(distance);

		return distance;
	};

	useEffect(() => {
		checkForCollisions();
	}, [aircrafts]);

	useEffect(() => {
		loadUsersList();
		let mapLoading = setTimeout(() => {
			setMapLoaded(true);
		}, 2000);

		return () => {
			clearTimeout(mapLoading);
		};
	}, []);

	return (
		<div className="p-4">
			<h1 className="text-2xl font-semibold mb-6">Create New Session</h1>
			<div className="my-4">
				{mapLoaded ? (
					<Map mapId={MAP_ID} onCenterChanged={(e) => setMidPos(e.detail.center)} style={{ height: 500, width: '100%' }} defaultCenter={midPos} defaultZoom={6}>
						{aircrafts.map((aircraft, index) => (
							<div key={index}>
								<Aircraft
									simulation_time_factor={50}
									onChangePosition={onAircraftCurrentLocationChange}
									data={aircraft}
									key={index}
									index={index}
									isStart={isStart}
								/>
								<Polyline strokeWeight={1} key={aircraft.id} path={[aircraft.start_pos, aircraft.end_pos]} />
							</div>
						))}
						{enableAddStartPosition ? (
							<>
								<AdvancedMarker ref={markerStartPosRef} draggable title={'Start Pos'} position={newStartPosition} onDrag={handleDragStartMarker} />
								<InfoWindow anchor={startPosMarker} maxWidth={100}>
									<span className="p-2 rounded-md bg-white">Start Pos</span>
								</InfoWindow>
							</>
						) : null}
						{enableAddEndPosition ? (
							<>
								<AdvancedMarker ref={markerEndPosRef} draggable title={'End Pos'} position={newEndPosition} onDrag={handleDragEndtMarker} />
								<InfoWindow anchor={endPosMarker} maxWidth={100}>
									<span className="p-2 rounded-md bg-white">End Pos</span>
								</InfoWindow>
							</>
						) : null}
						{collisionPositions.map((collisionPosition, index) => (
							<CollisionPoint key={index} position={collisionPosition} />
						))}
					</Map>
				) : (
					<div className="bg-slate-100 flex items-center justify-center" style={{ height: 500, width: '100%' }}>
						Map Loading...
					</div>
				)}
			</div>
			{/* <Button label="Start" onClick={() => setIsStart(true)} /> */}
			<div>
				<h3 className="py-4 font-semibold">Simulation time</h3>
				<div className="relative w-1/4 flex items-center">
					<span className="absolute left-4">1 : </span>
					<span className="absolute right-4">Hour</span>
					<input
						type="number"
						value={simmulationTime}
						onChange={(e) => setSimmulationTime(Number(e.target.value))}
						className="w-full rounded-md border py-2 px-24 text-right border-slate-300"
					/>
				</div>
			</div>

			<div className="my-4">
				<h3 className="py-4 font-semibold">Add Aircraft</h3>
				{aircrafts.length > 0 ? (
					<div className="flex w-full flex-row flex-wrap">
						{aircrafts.map((aircrft, index) => (
							<div
								onClick={() => removeAircraft(index)}
								className="py-2 px-4 rounded-full border border-slate-200 hover:bg-slate-100 hover:text-red-500 cursor-pointer"
								key={index}
							>
								{aircrft.aircraft_id}
							</div>
						))}
					</div>
				) : null}
				<div>{/* aircraft list */}</div>
				<div className="my-2">
					<div className="flex w-full flex-row flex-wrap">
						<div className="w-1/2 px-2 my-2">
							<label htmlFor="">Aircraft ID</label>
							<input value={newAircraft.aircraft_id} disabled placeholder="Aircraft ID" type="text" className="w-full rounded-md border py-2 px-4 border-slate-300" />
						</div>
						<div className="w-1/2 px-2 my-2">
							<label htmlFor="">Start position</label>
							<div
								onClick={() => setEnableAddStartPosition(true)}
								className="w-full rounded-md border py-2 px-4 border-slate-300"
							>{`${newAircraft.start_pos.lat}, ${newAircraft.start_pos.lng}`}</div>
						</div>
						<div className="w-1/2 px-2 my-2">
							<label htmlFor="">End position</label>
							<div
								onClick={() => setEnableAddEndPosition(true)}
								className="w-full rounded-md border py-2 px-4 border-slate-300"
							>{`${newAircraft.end_pos.lat}, ${newAircraft.end_pos.lng}`}</div>
						</div>
						<div className="w-1/2 px-2 my-2 relative">
							<label htmlFor="">Max Velocity</label>
							<input
								placeholder="Max Velocity"
								value={newAircraft.max_velocity}
								onChange={(e) => setNewAircraft({ ...newAircraft, max_velocity: Number(e.target.value) })}
								type="number"
								className="w-full rounded-md border py-2 px-4 border-slate-300"
							/>
							<span className="absolute right-6 bottom-2 text-slate-500">km/h</span>
						</div>
						<div className="w-1/2 px-2 my-2 relative">
							<label htmlFor="">Max Altitude</label>
							<input
								placeholder="Max Altitude"
								value={newAircraft.max_altitude}
								onChange={(e) => setNewAircraft({ ...newAircraft, max_altitude: Number(e.target.value) })}
								type="number"
								className="w-full rounded-md border py-2 px-4 border-slate-300"
							/>
							<span className="absolute right-6 bottom-2 text-slate-500">m</span>
						</div>
					</div>
					<Button label="Add New Aircraft" className="mx-2 mt-4" onClick={addNewAircraft} />
				</div>
			</div>
			<hr className="my-8" />
			<h3 className="pb-4 font-semibold">Select Controllable Aircraft</h3>
			<div className="flex w-full flex-row flex-wrap">
				{aircrafts.map((aircrft, index) => (
					<div
						onClick={() => setControllableAircraft(aircrft)}
						className={`py-2 px-4 rounded-full border ${
							controllableAircraft?.aircraft_id === aircrft.aircraft_id ? 'border-indigo-500 text-indigo-500' : 'border-slate-200 text-black'
						} hover:bg-slate-100 hover:text-indigo-500 cursor-pointer`}
						key={index}
					>
						{aircrft.aircraft_id}
					</div>
				))}
			</div>
			<hr className="my-8" />
			<div className="w-1/2 px-2 my-2">
				<select value={sessionUsersType} onChange={(e) => setSessionUsersType(e.target.value as 'all' | 'users')} className="w-full rounded-md border p-2 border-slate-300">
					<option value="all">Session for all users</option>
					<option value="users">Session for sellected users</option>
				</select>
			</div>
			{sessionUsersType == 'users' ? (
				<div>
					<h3 className="py-4 font-semibold">Users List</h3>
					<div>
						{selectedUsersList.length > 0 ? (
							<>
								<div className="w-full my-2 flex flex-row flex-wrap">
									{selectedUsersList.map((user, index) => (
										<span
											key={index}
											onClick={() => removeUserFromSelectedList(index)}
											className="py-2 px-4 rounded-full border border-slate-200 hover:bg-slate-100 hover:text-red-500 cursor-pointer"
										>
											{user.email}
										</span>
									))}
								</div>
								<hr className="my-6" />
							</>
						) : null}
						<div className="w-full my-2 flex flex-row flex-wrap">
							{usersList.map((user, index) => (
								<span onClick={() => selectedUsers(user)} key={index} className="py-2 px-4 rounded-full border border-slate-200 hover:bg-slate-100 cursor-pointer">
									{user.email}
								</span>
							))}
						</div>
					</div>
				</div>
			) : null}
			<Button label="Create New Session" onClick={createNewSession} className="mt-6" />
		</div>
	);
}

export default page;
