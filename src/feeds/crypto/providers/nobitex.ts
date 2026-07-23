function num(v: unknown): number | null {
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export interface NobitexUsdtIrt {
  /** USDT price in Toman (RLS ÷ 10). */
  price: number;
  change: number | null;
}

/** Nobitex — USDT/IRT only. Never used for USD coin prices. */
export async function fetchNobitexUsdtIrt(): Promise<NobitexUsdtIrt> {
  const url =
    "https://apiv2.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls";
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

  const row = json.stats["usdt-rls"];
  const rls = row ? num(row.latest) : null;
  if (rls == null) {
    throw new Error("Nobitex missing usdt-rls");
  }

  return {
    price: rls / 10,
    change: row ? num(row.dayChange) : null,
  };
}
