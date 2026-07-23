import type { UsdQuote } from "../types";

function num(v: unknown): number | null {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Binance 24hr ticker for SYMBOLUSDT pairs.
 * USDT itself has no USDTUSDT market — treat as $1.
 */
export async function fetchBinanceUsd(
  symbols: string[],
): Promise<Record<string, UsdQuote>> {
  const upper = symbols.map((s) => s.toUpperCase());
  const result: Record<string, UsdQuote> = {};

  if (upper.includes("USDT")) {
    result.USDT = { price: 1, change: 0 };
  }

  const pairs = upper
    .filter((s) => s !== "USDT")
    .map((s) => `${s}USDT`);

  if (!pairs.length) {
    return result;
  }

  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`Binance HTTP ${res.status}`);
  }

  const json = (await res.json()) as Array<{
    symbol?: string;
    lastPrice?: string;
    priceChangePercent?: string;
  }>;

  if (!Array.isArray(json)) {
    throw new Error("Binance bad payload");
  }

  for (const row of json) {
    const pair = String(row.symbol ?? "");
    if (!pair.endsWith("USDT")) continue;
    const sym = pair.slice(0, -4);
    const price = num(row.lastPrice);
    if (price == null) continue;
    result[sym] = {
      price,
      change: num(row.priceChangePercent),
    };
  }

  const missing = upper.filter((s) => !(s in result));
  if (missing.length === upper.length) {
    throw new Error("Binance returned no prices");
  }

  return result;
}
