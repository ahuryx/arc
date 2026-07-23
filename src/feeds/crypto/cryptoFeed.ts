import { createPollingFeed, type LiveFeed } from "@/core/liveFeed";
import type { CryptoData } from "@/core/types";
import { fetchCryptoTickers } from "./fetchTickers";
import type { CoinTicker } from "./types";

const feeds = new Map<string, LiveFeed<CoinTicker[]>>();

function feedKey(config: CryptoData): string {
  return JSON.stringify({
    rows: config.rows.map((row) => ({
      id: row.id,
      symbol: row.symbol.toUpperCase(),
      quote: row.quote,
    })),
  });
}

/** Polling feed keyed by crypto settings — new key when rows/nobitex change. */
export function getCryptoFeed(config: CryptoData): LiveFeed<CoinTicker[]> {
  const key = feedKey(config);
  let feed = feeds.get(key);
  if (!feed) {
    const snapshot = structuredClone(config);
    feed = createPollingFeed({
      intervalMs: 8000,
      initial: [],
      fetch: () => fetchCryptoTickers(snapshot),
    });
    feeds.set(key, feed);
  }
  return feed;
}

export type { CoinTicker } from "./types";
export { formatPrice, quoteLabel } from "./fetchTickers";
export { resolveIconUrl, ledgerIdForSymbol } from "./icons";
