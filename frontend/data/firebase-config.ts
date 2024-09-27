// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyASa2yWvYnWulggZUgLjhMDBpVcLvkb_mI',
	authDomain: 'adsb-simulation.firebaseapp.com',
	projectId: 'adsb-simulation',
	storageBucket: 'adsb-simulation.appspot.com',
	messagingSenderId: '401825590679',
	appId: '1:401825590679:web:9de10633013805a586e8d2',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
