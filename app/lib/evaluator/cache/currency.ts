import { DateTime } from "luxon";
import type { CurrencyRate } from "../types";
import {
  CRYPTO_CURRENCIES,
  CRYPTO_CMC_IDS,
  isCrypto,
} from "../data/currencies";

const CACHE_KEY = "currencyCache";
const CACHE_REFRESH_HOURS = 2;

const currencyCache = new Map<string, Map<string, CurrencyRate>>();

export function getCurrencyCache(): Map<string, Map<string, CurrencyRate>> {
  return currencyCache;
}

export function getCachedRate(
  from: string,
  to: string
): CurrencyRate | undefined {
  return currencyCache.get(from)?.get(to);
}

export function setCachedRate(
  from: string,
  to: string,
  rate: CurrencyRate
): void {
  if (!currencyCache.has(from)) {
    currencyCache.set(from, new Map());
  }
  currencyCache.get(from)!.set(to, rate);
}

export function saveCacheToStorage(): void {
  const serialized: Record<string, Record<string, any>> = {};

  for (const [from, toMap] of currencyCache.entries()) {
    serialized[from] = {};
    for (const [to, rateData] of toMap.entries()) {
      serialized[from][to] = {
        value: rateData.value,
        lastUpdated: rateData.lastUpdated.toISO(),
        graph: rateData.graph,
      };
    }
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify(serialized));
}

export function loadCacheFromStorage(): boolean {
  const stored = localStorage.getItem(CACHE_KEY);
  if (!stored) return false;

  try {
    const serialized = JSON.parse(stored);
    currencyCache.clear();

    for (const [from, toMap] of Object.entries(serialized)) {
      const newMap = new Map<string, CurrencyRate>();

      for (const [to, rateData] of Object.entries(
        toMap as Record<
          string,
          { value: number; lastUpdated: string; graph?: Record<string, number> }
        >
      )) {
        newMap.set(to, {
          value: rateData.value,
          lastUpdated: DateTime.fromISO(rateData.lastUpdated),
          graph: rateData.graph,
        });
      }

      currencyCache.set(from, newMap);
    }

    return true;
  } catch (e) {
    console.error("Failed to load cache from storage:", e);
    return false;
  }
}

export function shouldRefreshCache(): boolean {
  if (currencyCache.size === 0) return true;

  let oldestUpdate: DateTime | undefined;

  for (const toMap of currencyCache.values()) {
    for (const rateData of toMap.values()) {
      if (!oldestUpdate || rateData.lastUpdated < oldestUpdate) {
        oldestUpdate = rateData.lastUpdated;
      }
    }
  }

  if (!oldestUpdate) return true;

  const hoursSinceUpdate = DateTime.now().diff(oldestUpdate, "hours").hours;
  return hoursSinceUpdate >= CACHE_REFRESH_HOURS;
}

export async function updateCurrencyRates(options?: {
  baseCurrencies?: string[];
  includeGraph?: boolean;
  graphDays?: number;
  forceRefresh?: boolean;
}): Promise<void> {
  const {
    baseCurrencies = ["USD", ...CRYPTO_CURRENCIES],
    includeGraph = false,
    graphDays = 30,
    forceRefresh = false,
  } = options || {};

  loadCacheFromStorage();

  if (!forceRefresh && !shouldRefreshCache()) {
    return;
  }

  const now = DateTime.now();

  const fiatBases = baseCurrencies.filter((c) => !isCrypto(c));

  for (const base of fiatBases) {
    try {
      const url = `https://api.frankfurter.app/latest?from=${base}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!currencyCache.has(base)) {
        currencyCache.set(base, new Map());
      }
      const baseCache = currencyCache.get(base)!;

      for (const [target, rate] of Object.entries(data.rates)) {
        let graph: Record<string, number> | undefined;

        if (includeGraph) {
          const endDate = now.toISODate();
          const startDate = now.minus({ days: graphDays }).toISODate();
          const graphUrl = `https://api.frankfurter.app/${startDate}..${endDate}?from=${base}&to=${target}`;
          const graphResponse = await fetch(graphUrl);
          const graphData = await graphResponse.json();

          graph = {};
          for (const [date, rates] of Object.entries(graphData.rates)) {
            graph[date] = (rates as any)[target];
          }
        }

        baseCache.set(target, {
          value: rate as number,
          lastUpdated: now,
          graph,
        });
      }
    } catch (e) {
      console.error(`Failed to fetch rates for ${base}:`, e);
    }
  }

  const cryptoBases = baseCurrencies.filter(isCrypto);

  if (cryptoBases.length > 0) {
    try {
      const ids = cryptoBases.map((c) => CRYPTO_CMC_IDS[c]).join(",");
      const url = `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/quote/latest?id=${ids}&convert=USD`;
      const response = await fetch(url);
      const data = await response.json();

      for (const crypto of cryptoBases) {
        const id = CRYPTO_CMC_IDS[crypto];
        const cryptoData = data.data.find((x: any) => x.id === id);

        if (cryptoData) {
          if (!currencyCache.has(crypto)) {
            currencyCache.set(crypto, new Map());
          }
          const baseCache = currencyCache.get(crypto)!;

          let graph: Record<string, number> | undefined;

          if (includeGraph) {
            const range =
              graphDays <= 1
                ? "1D"
                : graphDays <= 7
                ? "7D"
                : graphDays <= 30
                ? "1M"
                : "3M";
            const graphUrl = `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail/chart?id=${id}&range=${range}`;
            const graphResponse = await fetch(graphUrl);
            const graphData = await graphResponse.json();

            graph = {};
            if (graphData.data && graphData.data.points) {
              for (const [timestamp, point] of Object.entries(
                graphData.data.points
              )) {
                const date = DateTime.fromSeconds(
                  parseInt(timestamp)
                ).toISODate();
                if (
                  date &&
                  point &&
                  typeof point === "object" &&
                  "v" in point
                ) {
                  graph[date] = (point as any).v[0]; // price
                }
              }
            }
          }

          const price = cryptoData.quotes[0].price;
          baseCache.set("USD", {
            value: price,
            lastUpdated: now,
            graph,
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch crypto rates:", e);
    }
  }

  saveCacheToStorage();
}
