import type { UsdQuote } from "../types";

/** CoinGecko ids for curated symbols — fallback only. */
const GECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  USDC: "usd-coin",
  ADA: "cardano",
  DOGE: "dogecoin",
  TRX: "tron",
  TON: "the-open-network",
  DOT: "polkadot",
  LINK: "chainlink",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  POL: "polygon-ecosystem-token",
  SHIB: "shiba-inu",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  ATOM: "cosmos",
  UNI: "uniswap",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  SUI: "sui",
  PEPE: "pepe",
  FIL: "filecoin",
  ICP: "internet-computer",
  AAVE: "aave",
  MKR: "maker",
  ETC: "ethereum-classic",
  XLM: "stellar",
  ALGO: "algorand",
  VET: "vechain",
  HBAR: "hedera-hashgraph",
  INJ: "injective-protocol",
  RENDER: "render-token",
  FET: "fetch-ai",
  IMX: "immutable-x",
  GRT: "the-graph",
  SAND: "the-sandbox",
  MANA: "decentraland",
  AXS: "axie-infinity",
  FTM: "fantom",
  EGLD: "elrond-erd-2",
  XTZ: "tezos",
  THETA: "theta-token",
  FLOW: "flow",
  EOS: "eos",
  XMR: "monero",
  ZEC: "zcash",
  DASH: "dash",
  CAKE: "pancakeswap-token",
  CRV: "curve-dao-token",
  LDO: "lido-dao",
  RUNE: "thorchain",
  WLD: "worldcoin-wld",
  SEI: "sei-network",
  TIA: "celestia",
  WIF: "dogwifcoin",
  BONK: "bonk",
};

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export async function fetchCoinGeckoUsd(
  symbols: string[],
): Promise<Record<string, UsdQuote>> {
  const upper = symbols.map((s) => s.toUpperCase());
  const ids = [
    ...new Set(
      upper
        .map((s) => GECKO_IDS[s])
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  if (!ids.length) {
    throw new Error("CoinGecko: no known symbols");
  }

  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${encodeURIComponent(ids.join(","))}` +
    `&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`CoinGecko HTTP ${res.status}`);
  }

  const json = (await res.json()) as Record<
    string,
    { usd?: number; usd_24h_change?: number }
  >;

  const byId = Object.fromEntries(
    Object.entries(GECKO_IDS).map(([sym, id]) => [id, sym]),
  );

  const result: Record<string, UsdQuote> = {};
  for (const [id, quote] of Object.entries(json)) {
    const sym = byId[id];
    if (!sym) continue;
    const price = num(quote.usd);
    if (price == null) continue;
    result[sym] = {
      price,
      change: num(quote.usd_24h_change),
    };
  }

  if (!Object.keys(result).length) {
    throw new Error("CoinGecko returned no prices");
  }

  return result;
}
