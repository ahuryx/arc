import { createPollingFeed, type LiveFeed } from "@/core/liveFeed";
import { COINS, type CoinDef, type Quote } from "./coins";

const BASE = "https://apiv2.nobitex.ir";

export interface CoinTicker extends CoinDef {
  price: number | null;
  change: number | null;
}

function num(v: unknown): number | null {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

async function fetchMarket(
  ids: string[],
  dst: string,
): Promise<Record<string, { latest?: string; dayChange?: string }>> {
  if (!ids.length) {
    return {};
  }
  const url = `${BASE}/market/stats?srcCurrency=${encodeURIComponent(ids.join(","))}&dstCurrency=${dst}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`Nobitex HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    status?: string;
    stats?: Record<string, { latest?: string; dayChange?: string }>;
  };
  if (json.status !== "ok" || !json.stats) {
    throw new Error("Nobitex bad payload");
  }
  return json.stats;
}

export async function fetchCryptoTickers(): Promise<CoinTicker[]> {
  const usdtIds = COINS.filter((c) => c.quote === "usdt").map((c) => c.id);
  const tomanIds = COINS.filter((c) => c.quote === "toman").map((c) => c.id);

  const [usdtStats, tomanStats] = await Promise.all([
    fetchMarket(usdtIds, "usdt"),
    fetchMarket(tomanIds, "rls"),
  ]);

  return COINS.map((c) => {
    if (c.quote === "toman") {
      const s = tomanStats[`${c.id}-rls`];
      const rls = s ? num(s.latest) : null;
      return {
        ...c,
        price: rls != null ? rls / 10 : null,
        change: s ? num(s.dayChange) : null,
      };
    }
    const s = usdtStats[`${c.id}-usdt`];
    return {
      ...c,
      price: s ? num(s.latest) : null,
      change: s ? num(s.dayChange) : null,
    };
  });
}

let feed: LiveFeed<CoinTicker[]> | null = null;

export function getCryptoFeed(): LiveFeed<CoinTicker[]> {
  if (!feed) {
    feed = createPollingFeed({
      intervalMs: 5000,
      initial: [],
      fetch: fetchCryptoTickers,
    });
  }
  return feed;
}

export function formatPrice(price: number | null, quote: Quote): string {
  if (price == null) {
    return "—";
  }
  if (quote === "toman") {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      price,
    );
  }
  if (price >= 1000) {
    return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return price.toLocaleString("en-US", {
    maximumFractionDigits: price < 1 ? 4 : 2,
  });
}
