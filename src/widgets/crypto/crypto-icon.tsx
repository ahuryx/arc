import { useEffect, useState } from "react";
import { resolveIconUrl } from "@/feeds/crypto/icons";
import { cn } from "@/lib/utils";

function LetterFallback({
  symbol,
  className,
}: {
  symbol: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground",
        className,
      )}
      aria-hidden
    >
      {symbol.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function CryptoIcon({
  symbol,
  className,
}: {
  symbol: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSrc(null);
    setFailed(false);

    void resolveIconUrl(symbol).then((url) => {
      if (cancelled) return;
      if (url) {
        setSrc(url);
      } else {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (failed) {
    return <LetterFallback symbol={symbol} className={className} />;
  }

  if (!src) {
    return (
      <div
        className={cn(
          "size-7 shrink-0 animate-pulse rounded-full bg-muted",
          className,
        )}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      className={cn("size-7 shrink-0 rounded-full", className)}
      onError={() => setFailed(true)}
    />
  );
}
