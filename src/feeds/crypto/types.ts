import type { CryptoQuote, CryptoRow } from "@/core/types";

export type Quote = CryptoQuote;

export interface UsdQuote {
  price: number;
  change: number | null;
}

export interface CoinTicker {
  id: string;
  symbol: string;
  name: string;
  quote: Quote;
  price: number | null;
  change: number | null;
}

export type { CryptoRow };
