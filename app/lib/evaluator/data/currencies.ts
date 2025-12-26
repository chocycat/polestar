export const CURRENCY_SYMBOLS: Record<string, string> = {
	$: "USD",
	"€": "EUR",
	"£": "GBP",
	"¥": "JPY",
	"₹": "INR",
	"₿": "BTC",
	Ξ: "ETH",
};

export const FIAT_CURRENCIES = [
	"AUD",
	"BGN",
	"BRL",
	"CAD",
	"CHF",
	"CNY",
	"CZK",
	"DKK",
	"EUR",
	"GBP",
	"HKD",
	"HUF",
	"IDR",
	"ILS",
	"INR",
	"ISK",
	"JPY",
	"KRW",
	"MXN",
	"MYR",
	"NOK",
	"NZD",
	"PHP",
	"PLN",
	"RON",
	"SEK",
	"SGD",
	"THB",
	"TRY",
	"USD",
	"ZAR",
];

export const CRYPTO_CURRENCIES = [
	"BTC",
	"ETH",
	"USDT",
	"BNB",
	"SOL",
	"USDC",
	"XRP",
	"DOGE",
	"ADA",
	"TRX",
	"AVAX",
	"SHIB",
	"DOT",
	"LINK",
	"MATIC",
	"LTC",
	"UNI",
	"BCH",
	"XLM",
	"ATOM",
	"XMR",
	"ETC",
	"ICP",
	"FIL",
	"APT",
];

export const CRYPTO_CMC_IDS: Record<string, number> = {
	BTC: 1,
	ETH: 1027,
	USDT: 825,
	SOL: 5426,
	LTC: 2,
	XMR: 328,
};

export function isCurrency(code: string): boolean {
	const upper = code.toUpperCase();
	return FIAT_CURRENCIES.includes(upper) || CRYPTO_CURRENCIES.includes(upper);
}

export function isCrypto(code: string): boolean {
	return CRYPTO_CURRENCIES.includes(code.toUpperCase());
}

export function getCurrencyFromSymbol(symbol: string): string | undefined {
	return CURRENCY_SYMBOLS[symbol];
}
