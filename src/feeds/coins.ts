export type Quote = "usdt" | "toman";

export interface CoinDef {
  id: string;
  symbol: string;
  name: string;
  faName: string;
  quote: Quote;
  color: string;
  icon: string;
}

const ICON = (sym: string) =>
  `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${sym.toLowerCase()}.svg`;

/** Nobitex srcCurrency ids — `ton` rejected by API (InvalidCurrency). */
export const COINS: CoinDef[] = [
  {
    id: "usdt",
    symbol: "USDT",
    name: "Tether",
    faName: "تتر",
    quote: "toman",
    color: "#26a17b",
    icon: ICON("usdt"),
  },
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    faName: "بیت‌کوین",
    quote: "usdt",
    color: "#f7931a",
    icon: ICON("btc"),
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    faName: "اتریوم",
    quote: "usdt",
    color: "#627eea",
    icon: ICON("eth"),
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    faName: "سولانا",
    quote: "usdt",
    color: "#14b8a6",
    icon: ICON("sol"),
  },
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP",
    faName: "ریپل",
    quote: "usdt",
    color: "#3ba9ff",
    icon: ICON("xrp"),
  },
  {
    id: "doge",
    symbol: "DOGE",
    name: "Dogecoin",
    faName: "دوج‌کوین",
    quote: "usdt",
    color: "#cb9800",
    icon: ICON("doge"),
  },
  {
    id: "trx",
    symbol: "TRX",
    name: "TRON",
    faName: "ترون",
    quote: "usdt",
    color: "#ef4444",
    icon: ICON("trx"),
  },
];
