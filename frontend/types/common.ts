export type TokensProps = {
	refresh: string;
	access: string;
};

export type LoginData<K> = {
	tokens: TokensProps;
	data: K;
};

export type ListResponseType<K> = {
	count: number;
	next: null | undefined | string;
	previous: null | undefined | string;
	results: K[];
};
