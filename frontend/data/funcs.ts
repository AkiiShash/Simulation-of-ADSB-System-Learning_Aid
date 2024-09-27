import * as geolib from 'geolib';
import { Position } from '@/app/components/Aircraft';

export function getMsgFromDict(dict: any) {
	for (var key in dict) {
		if (dict.hasOwnProperty(key)) {
			if (key === 'password_confirm') {
				if (dict['password']) {
					return dict['password'];
				}
			}
			return dict[key];
		}
	}
}

export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

const REDIRECT_URL = 'WL-RDRCT';

export function setRedirectURL(url: string) {
	window.localStorage.setItem(REDIRECT_URL, url);
}

export function getRedirectURL() {
	return window.localStorage.getItem(REDIRECT_URL);
}

export function consolelog(message: any) {
	console.log(message);
}

export function generateUniqueID() {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const charactersLength = characters.length;
	let uniqueID = '';

	for (let i = 0; i < 6; i++) {
		// Generate a random index to select a character from the 'characters' string
		const randomIndex = Math.floor(Math.random() * charactersLength);
		// Append the selected character to the unique ID
		uniqueID += characters.charAt(randomIndex);
	}

	return uniqueID;
}

type Line = {
	start_pos: Position;
	end_pos: Position;
};

// Convert geographic coordinates to Cartesian coordinates
function toCartesian(position: Position) {
	const R = 6371; // Radius of the Earth in km
	const latRad = (position.lat * Math.PI) / 180;
	const lonRad = (position.lng * Math.PI) / 180;
	const x = R * lonRad * Math.cos(latRad);
	const y = R * latRad;
	return { lng: x, lat: y };
}

// Convert Cartesian coordinates back to geographic coordinates
function toGeographic(x: number, y: number) {
	const R = 6371; // Radius of the Earth in km
	const lat = y / R;
	const lon = x / (R * Math.cos(lat));
	return { lat: (lat * 180) / Math.PI, lng: (lon * 180) / Math.PI };
}

// Function to find the intersection of two lines given by their endpoints
export function findIntersection(line1: Line, line2: Line) {
	const { start_pos: start1, end_pos: end1 } = line1;
	const { start_pos: start2, end_pos: end2 } = line2;

	// Convert geographic coordinates to Cartesian coordinates
	const p1 = toCartesian(start1);
	const p2 = toCartesian(end1);
	const p3 = toCartesian(start2);
	const p4 = toCartesian(end2);
	// const p1 = start1;
	// const p2 = end1;
	// const p3 = start2;
	// const p4 = end2;

	// Calculate the line parameters A, B, and C for both lines
	const A1 = p2.lat - p1.lat;
	const B1 = p1.lng - p2.lng;
	const C1 = A1 * p1.lng + B1 * p1.lat;

	const A2 = p4.lat - p3.lat;
	const B2 = p3.lng - p4.lng;
	const C2 = A2 * p3.lng + B2 * p3.lat;

	// Calculate the determinant
	const det = A1 * B2 - A2 * B1;

	if (det === 0) {
		// Lines are parallel, no intersection
		return null;
	} else {
		// Calculate the intersection point in Cartesian coordinates
		const x = (B2 * C1 - B1 * C2) / det;
		const y = (A1 * C2 - A2 * C1) / det;

		// Convert the intersection point back to geographic coordinates
		const intersection = toGeographic(x, y);
		return intersection;
	}
}
