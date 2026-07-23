/** Curated picker list — display names only, not price wiring. */
export const CRYPTO_SYMBOLS: Array<{ symbol: string; name: string }> = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "BNB", name: "BNB" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "TRX", name: "TRON" },
  { symbol: "TON", name: "Toncoin" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "POL", name: "Polygon" },
  { symbol: "SHIB", name: "Shiba Inu" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "BCH", name: "Bitcoin Cash" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "NEAR", name: "NEAR Protocol" },
  { symbol: "APT", name: "Aptos" },
  { symbol: "ARB", name: "Arbitrum" },
  { symbol: "OP", name: "Optimism" },
  { symbol: "SUI", name: "Sui" },
  { symbol: "PEPE", name: "Pepe" },
  { symbol: "FIL", name: "Filecoin" },
  { symbol: "ICP", name: "Internet Computer" },
  { symbol: "AAVE", name: "Aave" },
  { symbol: "MKR", name: "Maker" },
  { symbol: "ETC", name: "Ethereum Classic" },
  { symbol: "XLM", name: "Stellar" },
  { symbol: "ALGO", name: "Algorand" },
  { symbol: "VET", name: "VeChain" },
  { symbol: "HBAR", name: "Hedera" },
  { symbol: "INJ", name: "Injective" },
  { symbol: "RENDER", name: "Render" },
  { symbol: "FET", name: "Fetch.ai" },
  { symbol: "IMX", name: "Immutable" },
  { symbol: "GRT", name: "The Graph" },
  { symbol: "SAND", name: "The Sandbox" },
  { symbol: "MANA", name: "Decentraland" },
  { symbol: "AXS", name: "Axie Infinity" },
  { symbol: "FTM", name: "Fantom" },
  { symbol: "EGLD", name: "MultiversX" },
  { symbol: "XTZ", name: "Tezos" },
  { symbol: "THETA", name: "Theta Network" },
  { symbol: "FLOW", name: "Flow" },
  { symbol: "EOS", name: "EOS" },
  { symbol: "XMR", name: "Monero" },
  { symbol: "ZEC", name: "Zcash" },
  { symbol: "DASH", name: "Dash" },
  { symbol: "CAKE", name: "PancakeSwap" },
  { symbol: "CRV", name: "Curve DAO" },
  { symbol: "LDO", name: "Lido DAO" },
  { symbol: "RUNE", name: "THORChain" },
  { symbol: "WLD", name: "Worldcoin" },
  { symbol: "SEI", name: "Sei" },
  { symbol: "TIA", name: "Celestia" },
  { symbol: "WIF", name: "dogwifhat" },
  { symbol: "BONK", name: "Bonk" },
];

const NAME_BY_SYMBOL = Object.fromEntries(
  CRYPTO_SYMBOLS.map((entry) => [entry.symbol, entry.name]),
);

export function symbolName(symbol: string): string {
  const upper = symbol.toUpperCase();
  return NAME_BY_SYMBOL[upper] ?? upper;
}

export function isKnownSymbol(symbol: string): boolean {
  return symbol.toUpperCase() in NAME_BY_SYMBOL;
}

export function filterSymbols(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return CRYPTO_SYMBOLS;
  return CRYPTO_SYMBOLS.filter(
    (entry) =>
      entry.symbol.toLowerCase().includes(q) ||
      entry.name.toLowerCase().includes(q),
  );
}
