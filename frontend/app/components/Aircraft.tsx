import React, { useEffect, useState } from 'react';
import { query, where, onSnapshot, collection, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/data/firebase-config';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { useSessionWebSocketListener, useSessionWebSocketSender } from '@/websockets/SessionWebSocketProvider';
import { SocketTypes } from '@/data/socketEndpoints';

export type Position = {
	lat: number;
	lng: number;
};

export type AircraftType = {
	id: string;
	aircraft_id: string;
	start_pos: Position;
	end_pos: Position;
	current_pos: Position;
	max_altitude: number;
	max_velocity: number;
	angle: number;
	altitude: number;
	velocity: number;
};

type Props = {
	simulation_time_factor?: number;
	session_id?: string;
	data: AircraftType;
	index: number;
	isStart: boolean;
	stopAnimation?: Function;
	onChangePosition: (id: string, new_position: Position) => void;
};

type CollisionPointType = {
	position: Position;
};

export function CollisionPoint({ position }: CollisionPointType) {
	return (
		<AdvancedMarker position={position}>
			<div className="bg-red-500 w-4 h-4 rounded-full" />
		</AdvancedMarker>
	);
}

function Aircraft({ data, index, onChangePosition, stopAnimation, isStart, session_id, simulation_time_factor = 10 }: Props) {
	const [angle, setAngle] = useState(0);
	const [currentPos, setCurrentPos] = useState<Position>(data.current_pos);
	const [animationStarted, setAnimationStarted] = useState(false);
	const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

	const simmulationsRef = collection(db, 'sessions');

	const [showData, setShowData] = useState<boolean>(false);
	const sendData = useSessionWebSocketSender();

	// useEffect(() => {
	// 	console.log(data);
	// 	// calculate angle here. angle from north from start pos to end pos
	// 	const angleRadians = Math.atan2(data.end_pos.lng - data.current_pos.lng, data.end_pos.lat - data.current_pos.lat);
	// 	const angleDegrees = angleRadians * (180 / Math.PI);
	// 	setAngle(angleDegrees);

	// 	if (isStart && !animationStarted) {
	// 		// Start animation if isStart is true and animation hasn't started yet
	// 		animateToEndPosition();
	// 		setAnimationStarted(true);
	// 	}
	// }, [data.current_pos, isStart]);

	useEffect(() => {
		console.log(data);
		// calculate angle here. angle from north from start pos to end pos
		const angleRadians = Math.atan2(data.end_pos.lng - data.current_pos.lng, data.end_pos.lat - data.current_pos.lat);
		const angleDegrees = angleRadians * (180 / Math.PI);
		setAngle(angleDegrees);

		if (isStart && !animationStarted) {
			// Start animation if isStart is true and animation hasn't started yet
			animateToEndPosition();
			setAnimationStarted(true);
		}

		if (animationStarted && isStart) {
			// Clear interval if session is paused or stopped
			if (timer) {
				clearInterval(timer);
				setTimer(null);
			}
		} else if (animationStarted && isStart) {
			// Restart animation if session is resumed
			animateToEndPosition();
		}

		return () => {
			if (timer) {
				clearInterval(timer);
			}
		};
	}, [data.current_pos, isStart]);

	const animateToEndPosition = () => {
		if (isStart) {
			// Calculate the distance between current position and end position using the Haversine formula
			const R = 6371; // Radius of the Earth in km
			const dLat = ((data.end_pos.lat - currentPos.lat) * Math.PI) / 180;
			const dLng = ((data.end_pos.lng - currentPos.lng) * Math.PI) / 180;
			const lat1 = (currentPos.lat * Math.PI) / 180;
			const lat2 = (data.end_pos.lat * Math.PI) / 180;

			const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			const totalDistance = R * c; // Distance in km

			// Set the animation duration based on the velocity (time = distance / (velocity * SIMULATION_TIME_FACTOR))
			const animationDuration = (totalDistance / data.velocity) * (3600000 / simulation_time_factor); // Duration in milliseconds

			// Calculate the step sizes for latitude and longitude based on the total distance and animation duration
			const stepLat = (data.end_pos.lat - currentPos.lat) / (animationDuration / 10);
			const stepLng = (data.end_pos.lng - currentPos.lng) / (animationDuration / 10);

			// Set a timer to update current position periodically
			const intervalTimer = setInterval(async () => {
				// const queryset = query(simmulationsRef, where('aircraft_id', '==', data.aircraft_id));
				// const querySnapshot = await getDocs(queryset);

				// querySnapshot.forEach(async (doc) => {
				// 	console.log(doc.data());
				// 	await updateDoc(doc.ref, {
				// 		current_pos: {
				// 			lat: currentPos.lat + stepLat,
				// 			lng: currentPos.lng + stepLng,
				// 		},
				// 	});
				// });

				// setCurrentPos((prevPos) => ({
				// 	lat: prevPos.lat + stepLat,
				// 	lng: prevPos.lng + stepLng,
				// }));
				setCurrentPos((prevPos) => {
					const newLat = prevPos.lat + stepLat;
					const newLng = prevPos.lng + stepLng;

					const newPos = {
						lat: newLat,
						lng: newLng,
					};

					const queryset = query(simmulationsRef, where('aircraft_id', '==', data.aircraft_id));
					getDocs(queryset).then((querySnapshot) => {
						querySnapshot.forEach(async (doc) => {
							await updateDoc(doc.ref, {
								current_pos: newPos,
							});
						});
					});

					return newPos;
				});
			}, 10);

			setTimer(intervalTimer);

			// Stop the animation after reaching the end position
			setTimeout(() => {
				clearInterval(intervalTimer);
				setCurrentPos(data.end_pos); // Ensure the position is exactly at the end position
			}, animationDuration);
		}
	};

	useSessionWebSocketListener((message) => {
		const socketdata = JSON.parse(message) as { type: SocketTypes; data: { aircraft: string; position: Position } };

		if (socketdata.type === 'aircraft.moved') {
			if (socketdata.data.aircraft === data.id) {
				setCurrentPos(socketdata.data.position);
			}
		}
	});

	useEffect(() => {
		const queryset = query(simmulationsRef, where('aircraft_id', '==', data.aircraft_id));
		onSnapshot(queryset, (snapshot) => {
			// console.log(snapshot);
			snapshot.forEach((doc) => {
				const live_data = doc.data() as AircraftType;
				console.log(live_data);
				setCurrentPos(live_data.current_pos);
			});
		});
	}, []);

	return (
		<AdvancedMarker
			className="relative"
			position={currentPos}
			draggable
			onDrag={(e) => (e.latLng ? onChangePosition(data.id, { lat: e.latLng?.lat(), lng: e.latLng?.lng() }) : null)}
		>
			<div style={{ transform: 'translate(8%, 38%)' }}>
				<span className="p-1 rounded-sm bg-white w-80" onClick={() => setShowData(!showData)}>
					{showData ? (
						<div className="bg-white p-2 absolute bottom-10">
							<h4>{data.aircraft_id}</h4>
							<h4>SSR Code</h4>
							<h4>Mode S Addr</h4>
							<h4>NIC Val</h4>
							<h4>Call Sign</h4>
							<h4>Geo Time</h4>
							{/* Important data */}
							<h4>Altitude: {data.altitude}</h4>
							<h4>Velocity: {data.velocity}</h4>
							<h4 className="text-red-500">Emergency Indication</h4>
						</div>
					) : (
						data.aircraft_id
					)}
				</span>
				<img src={'/data/airplane.svg'} className="w-10 h-10" style={{ transform: `rotate(${angle}deg)` }} />
			</div>
		</AdvancedMarker>
	);
}

export default Aircraft;
