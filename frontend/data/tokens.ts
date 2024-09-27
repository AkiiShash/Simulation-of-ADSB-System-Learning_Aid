import { setTokens } from '@/store/login';
import { store } from '@/store/store';
import { TokensProps } from '@/types/common';

const TOKENS_KEY = 'WL-TK';

export function storeTokens(tokens: TokensProps) {
	if (tokens) {
		window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
	}
}

export function getTokens(): TokensProps | null {
	const tokens = window.localStorage.getItem(TOKENS_KEY);
	if (tokens) {
		const loadedTokens = JSON.parse(tokens);
		return loadedTokens;
	}
	return null;
}

export function clearTokens() {
	window.localStorage.removeItem(TOKENS_KEY);
}
