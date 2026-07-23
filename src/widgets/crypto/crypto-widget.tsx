import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppState } from "@/core/useAppState";
import { useLiveFeed } from "@/hooks/use-live-feed";
import {
  formatPrice,
  getCryptoFeed,
  type CoinTicker,
} from "@/feeds/crypto/cryptoFeed";
import { defaultCryptoData } from "@/feeds/crypto/defaults";
import { cn } from "@/lib/utils";
import { CryptoIcon } from "./crypto-icon";

function CryptoSkeleton() {
  return (
    <div
      className="flex flex-col gap-1 px-2 py-2"
      aria-busy="true"
      aria-label="Loading prices"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-2">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

function CoinRow({ coin }: { coin: CoinTicker }) {
  const up = (coin.change ?? 0) >= 0;

  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent">
      <CryptoIcon symbol={coin.symbol} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-tight">
          {coin.symbol}
        </div>
        <div className="truncate text-[10px] text-muted-foreground">
          {coin.name}
        </div>
      </div>
      <div className="ms-auto flex flex-col items-end text-right">
        <div className="text-[13px] font-semibold tabular-nums">
          {formatPrice(coin.price, coin.quote)}
        </div>
        <div
          className={cn(
            "text-[11px] font-semibold tabular-nums",
            coin.change == null
              ? "text-muted-foreground"
              : up
                ? "text-up"
                : "text-down",
          )}
        >
          {coin.change == null
            ? "—"
            : `${up ? "+" : ""}${coin.change.toFixed(2)}%`}
        </div>
      </div>
    </div>
  );
}

export function CryptoWidget() {
  const { data } = useAppState();
  const crypto = data.crypto ?? defaultCryptoData();
  const configKey = JSON.stringify({ rows: crypto.rows });
  const feed = useMemo(
    () => getCryptoFeed(JSON.parse(configKey) as typeof crypto),
    [configKey],
  );
  const snapshot = useLiveFeed(feed);

  if (snapshot.status === "connecting" && !snapshot.data.length) {
    return <CryptoSkeleton />;
  }

  if (!snapshot.data.length) {
    return (
      <div className="flex h-full flex-col justify-center gap-2 px-3 py-3">
        <div className="text-[12px] text-destructive" role="alert">
          {snapshot.error ?? "Prices unavailable"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-1.5">
        {snapshot.data.map((coin) => (
          <CoinRow key={coin.id} coin={coin} />
        ))}
      </div>
    </div>
  );
}
