import type { CryptoData, CryptoRow } from "@/core/types";

/**
 * Default watchlist — USDT/Toman first, then major coins (Dollar).
 * Order ≈ market importance; user can reorder in Settings.
 */
export const DEFAULT_CRYPTO_ROWS: CryptoRow[] = [
  { id: "usdt-toman", symbol: "USDT", quote: "toman" },
  { id: "btc-usd", symbol: "BTC", quote: "usd" },
  { id: "eth-usd", symbol: "ETH", quote: "usd" },
  { id: "bnb-usd", symbol: "BNB", quote: "usd" },
  { id: "sol-usd", symbol: "SOL", quote: "usd" },
  { id: "xrp-usd", symbol: "XRP", quote: "usd" },
  { id: "usdc-usd", symbol: "USDC", quote: "usd" },
  { id: "doge-usd", symbol: "DOGE", quote: "usd" },
  { id: "ada-usd", symbol: "ADA", quote: "usd" },
  { id: "trx-usd", symbol: "TRX", quote: "usd" },
  { id: "ton-usd", symbol: "TON", quote: "usd" },
];

export function defaultCryptoData(): CryptoData {
  return {
    rows: DEFAULT_CRYPTO_ROWS.map((row) => ({ ...row })),
  };
}
