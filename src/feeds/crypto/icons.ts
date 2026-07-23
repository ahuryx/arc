/**
 * Icon URLs via Ledger CDN + CoinGecko mapping
 * (same resolution order as @ledgerhq/crypto-icons docs).
 *
 * 1. https://crypto-icons.ledger.com/index.json by ledgerId
 * 2. mapping-service CoinGecko fallback by ticker
 * 3. caller shows letter fallback
 */

const LEDGER_CDN = "https://crypto-icons.ledger.com";
const MAPPING_URL =
  "https://mapping-service.api.ledger.com/v1/coingecko/mapped-assets";

/** Prefer native Ledger currency ids when known. */
const LEDGER_ID_BY_SYMBOL: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  DOGE: "dogecoin",
  TRX: "tron",
  ADA: "cardano",
  BNB: "bsc",
  LTC: "litecoin",
  BCH: "bitcoin_cash",
  ATOM: "cosmos",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  SUI: "sui",
  DOT: "polkadot",
  AVAX: "avalanche_c_chain",
  MATIC: "polygon",
  POL: "polygon",
  XLM: "stellar",
  ALGO: "algorand",
  VET: "vechain",
  XTZ: "tezos",
  EOS: "eos",
  XMR: "monero",
  ZEC: "zcash",
  DASH: "dash",
  ETC: "ethereum_classic",
  FIL: "filecoin",
  ICP: "internet_computer",
  HBAR: "hedera",
  INJ: "injective",
  THETA: "theta",
  FLOW: "flow",
  EGLD: "elrond",
  FTM: "fantom",
  TON: "ton",
  // tokens — Ledger CDN paths
  USDT: "ethereum/erc20/usd_tether__erc20_",
  USDC: "ethereum/erc20/usd_coin",
  LINK: "ethereum/erc20/chainlink",
  UNI: "ethereum/erc20/uniswap",
  AAVE: "ethereum/erc20/aave",
  MKR: "ethereum/erc20/makerdao",
  SHIB: "ethereum/erc20/shiba_inu",
  PEPE: "ethereum/erc20/pepe",
  SAND: "ethereum/erc20/the_sandbox",
  MANA: "ethereum/erc20/decentraland",
  AXS: "ethereum/erc20/axie_infinity",
  GRT: "ethereum/erc20/the_graph",
  CRV: "ethereum/erc20/curve_dao_token",
  LDO: "ethereum/erc20/lido_dao_token",
  IMX: "ethereum/erc20/immutable_x",
  FET: "ethereum/erc20/fetch_ai",
  RENDER: "ethereum/erc20/render_token",
  WLD: "ethereum/erc20/worldcoin",
  CAKE: "bsc/bep20/pancakeswap_token",
};

type LedgerIndex = Record<string, { icon?: string }>;

interface MappedAsset {
  ledgerId?: string;
  ticker?: string;
  $type?: string;
  network?: string | null;
  data?: { img?: string; marketCapRank?: number | null };
}

let indexPromise: Promise<LedgerIndex | null> | null = null;
let geckoByTickerPromise: Promise<Record<string, string>> | null = null;
let indexByTickerPromise: Promise<Record<string, string>> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

function loadIndex(): Promise<LedgerIndex | null> {
  if (!indexPromise) {
    indexPromise = fetchJson<LedgerIndex>(`${LEDGER_CDN}/index.json`).catch(
      () => null,
    );
  }
  return indexPromise;
}

/** Root CDN currencies keyed by ticker from icon filename (BTC.png → bitcoin). */
function loadIndexByTicker(): Promise<Record<string, string>> {
  if (!indexByTickerPromise) {
    indexByTickerPromise = loadIndex().then((index) => {
      const map: Record<string, string> = {};
      if (!index) return map;
      for (const [ledgerId, entry] of Object.entries(index)) {
        if (ledgerId.includes("/")) continue;
        const icon = entry.icon ?? "";
        const tick = icon.replace(/\.png$/i, "").toUpperCase();
        if (tick && !map[tick]) {
          map[tick] = ledgerId;
        }
      }
      return map;
    });
  }
  return indexByTickerPromise;
}

function loadGeckoByTicker(): Promise<Record<string, string>> {
  if (!geckoByTickerPromise) {
    geckoByTickerPromise = fetchJson<MappedAsset[]>(MAPPING_URL)
      .then((assets) => {
        const best = new Map<
          string,
          { url: string; score: number; rank: number }
        >();

        for (const asset of assets) {
          const tick = (asset.ticker ?? "").toUpperCase();
          const url = asset.data?.img;
          if (!tick || !url) continue;

          const ledgerId = asset.ledgerId ?? "";
          const score =
            (ledgerId.includes("/") ? 0 : 3) +
            (asset.$type === "Coin" ? 2 : 0) +
            (asset.network ? 0 : 1);
          const rank = asset.data?.marketCapRank ?? 99999;
          const previous = best.get(tick);
          if (
            !previous ||
            score > previous.score ||
            (score === previous.score && rank < previous.rank)
          ) {
            best.set(tick, { url, score, rank });
          }
        }

        const map: Record<string, string> = {};
        for (const [tick, row] of best) {
          map[tick] = row.url;
        }
        return map;
      })
      .catch(() => ({}));
  }
  return geckoByTickerPromise;
}

export function ledgerIdForSymbol(symbol: string): string | undefined {
  return LEDGER_ID_BY_SYMBOL[symbol.toUpperCase()];
}

/** Resolve icon URL for a ticker — Ledger CDN then CoinGecko mapping. */
export async function resolveIconUrl(symbol: string): Promise<string | null> {
  const tick = symbol.toUpperCase();
  const index = await loadIndex();
  const byTicker = await loadIndexByTicker();
  const ledgerId = LEDGER_ID_BY_SYMBOL[tick] ?? byTicker[tick];

  if (ledgerId && index?.[ledgerId]?.icon) {
    return `${LEDGER_CDN}/${index[ledgerId].icon}`;
  }

  const gecko = await loadGeckoByTicker();
  return gecko[tick] ?? null;
}
