import type { CryptoData } from "@/core/types";
import { fetchBinanceUsd } from "./providers/binance";
import { fetchCoinGeckoUsd } from "./providers/coingecko";
import { fetchNobitexUsdtIrt } from "./providers/nobitex";
import { symbolName } from "./symbols";
import type { CoinTicker, Quote, UsdQuote } from "./types";

async function fetchUsdPrices(
  symbols: string[],
): Promise<Record<string, UsdQuote>> {
  try {
    return await fetchBinanceUsd(symbols);
  } catch {
    return await fetchCoinGeckoUsd(symbols);
  }
}

export async function fetchCryptoTickers(
  config: CryptoData,
): Promise<CoinTicker[]> {
  const rows = config.rows;
  if (!rows.length) {
    return [];
  }

  const symbols = [
    ...new Set(rows.map((row) => row.symbol.toUpperCase())),
  ];
  const needToman = rows.some((row) => row.quote === "toman");

  const [usdPrices, usdtIrt] = await Promise.all([
    fetchUsdPrices(symbols),
    needToman
      ? fetchNobitexUsdtIrt().catch(() => null)
      : Promise.resolve(null),
  ]);

  return rows.map((row) => {
    const symbol = row.symbol.toUpperCase();
    const name = symbolName(symbol);
    const usd = usdPrices[symbol];
    const quote: Quote = row.quote;

    if (quote === "toman") {
      if (usdtIrt == null) {
        return {
          id: row.id,
          symbol,
          name,
          quote,
          price: null,
          change: null,
        };
      }

      if (symbol === "USDT") {
        return {
          id: row.id,
          symbol,
          name,
          quote,
          price: usdtIrt.price,
          change: usdtIrt.change,
        };
      }

      const priceUsd = usd?.price ?? null;
      return {
        id: row.id,
        symbol,
        name,
        quote,
        price: priceUsd != null ? priceUsd * usdtIrt.price : null,
        change: usd?.change ?? null,
      };
    }

    return {
      id: row.id,
      symbol,
      name,
      quote,
      price: usd?.price ?? null,
      change: usd?.change ?? null,
    };
  });
}

export function formatPrice(price: number | null, quote: Quote): string {
  if (price == null) {
    return "—";
  }
  if (quote === "toman") {
    const n = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(price);
    return `${n} Toman`;
  }
  const n =
    price >= 1000
      ? price.toLocaleString("en-US", { maximumFractionDigits: 2 })
      : price.toLocaleString("en-US", {
          maximumFractionDigits: price < 1 ? 4 : 2,
        });
  return `$${n}`;
}

export function quoteLabel(quote: Quote): string {
  return quote === "toman" ? "Toman" : "Dollar";
}
