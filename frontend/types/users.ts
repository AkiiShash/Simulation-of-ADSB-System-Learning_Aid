import { AircraftType } from '@/app/components/Aircraft';
import { TokensProps } from './common';

export type UserType = {
	id: string;
	email: string;
};

export type LoginDataType = UserType & {
	role: 'A' | 'U';
};

export type LoginStateType = LoginDataType & {
	is_login: boolean;
	tokens: TokensProps | null;
};

export type SessionInstanceType = {
	id: string;
	session: string;
	aircrafts: AircraftType[];
	created_at: string;
	simmulation_time: number;
	status: 'started' | 'closed';
};
