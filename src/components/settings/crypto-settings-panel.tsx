import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import {
  SettingsSection,
} from "@/components/settings/settings-section";
import { SymbolCombobox } from "@/components/settings/symbol-combobox";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CryptoData, CryptoQuote, CryptoRow } from "@/core/types";
import { setCryptoSettings } from "@/core/workspaceHost";
import { defaultCryptoData } from "@/feeds/crypto/defaults";
import { cn } from "@/lib/utils";

const SAVE_MS = 400;

function newRowId(): string {
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function CryptoSettingsPanel({
  value,
}: {
  value?: CryptoData | null;
}) {
  const [draft, setDraft] = useState<CryptoData>(
    () => value ?? defaultCryptoData(),
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (dirty) return;
    setDraft(value ?? defaultCryptoData());
  }, [value, dirty]);

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  function scheduleSave(next: CryptoData): void {
    setDirty(true);
    setDraft(next);
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setSaving(true);
      void setCryptoSettings(next)
        .then(() => setDirty(false))
        .finally(() => setSaving(false));
    }, SAVE_MS);
  }

  function patchRow(
    id: string,
    patch: Partial<Pick<CryptoRow, "symbol" | "quote">>,
  ): void {
    scheduleSave({
      ...draftRef.current,
      rows: draftRef.current.rows.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    });
  }

  function addRow(): void {
    scheduleSave({
      ...draftRef.current,
      rows: [
        ...draftRef.current.rows,
        { id: newRowId(), symbol: "BTC", quote: "usd" },
      ],
    });
  }

  function removeRow(id: string): void {
    if (draftRef.current.rows.length <= 1) return;
    scheduleSave({
      ...draftRef.current,
      rows: draftRef.current.rows.filter((row) => row.id !== id),
    });
  }

  function moveRow(id: string, direction: -1 | 1): void {
    const rows = [...draftRef.current.rows];
    const index = rows.findIndex((row) => row.id === id);
    if (index < 0) return;
    const next = index + direction;
    if (next < 0 || next >= rows.length) return;
    const [item] = rows.splice(index, 1);
    rows.splice(next, 0, item);
    scheduleSave({ ...draftRef.current, rows });
  }

  const hasToman = draft.rows.some((row) => row.quote === "toman");

  return (
    <SettingsSection title="Crypto">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Dollar from Binance (CoinGecko fallback). Pick Toman on any coin —
        including USDT — to price via Nobitex.
      </p>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px] text-muted-foreground">
          {draft.rows.length} coin{draft.rows.length === 1 ? "" : "s"}
          {saving ? " · Saving…" : dirty ? " · Unsaved" : ""}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1"
          onClick={addRow}
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      <ul className="flex flex-col gap-1.5" aria-label="Crypto watchlist">
        {draft.rows.map((row, index) => (
          <li
            key={row.id}
            className={cn(
              "flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 p-1.5",
              "transition-colors hover:border-border hover:bg-muted/70",
            )}
          >
            <div className="flex shrink-0 flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground"
                title="Move up"
                aria-label={`Move ${row.symbol} up`}
                disabled={index === 0}
                onClick={() => moveRow(row.id, -1)}
              >
                <ChevronUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground"
                title="Move down"
                aria-label={`Move ${row.symbol} down`}
                disabled={index === draft.rows.length - 1}
                onClick={() => moveRow(row.id, 1)}
              >
                <ChevronDown className="size-3.5" />
              </Button>
            </div>

            <SymbolCombobox
              value={row.symbol}
              onChange={(symbol) => patchRow(row.id, { symbol })}
              className="min-w-0 flex-1"
            />

            <ToggleGroup
              type="single"
              size="sm"
              value={row.quote}
              onValueChange={(value) => {
                if (value !== "usd" && value !== "toman") return;
                patchRow(row.id, { quote: value as CryptoQuote });
              }}
              aria-label={`${row.symbol} quote`}
              className="shrink-0"
            >
              <ToggleGroupItem value="usd" className="px-2 text-[11px]">
                $
              </ToggleGroupItem>
              <ToggleGroupItem value="toman" className="px-2 text-[11px]">
                Toman
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              title="Remove"
              aria-label={`Remove ${row.symbol}`}
              disabled={draft.rows.length <= 1}
              onClick={() => removeRow(row.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      {hasToman ? (
        <p className="text-[10px] text-muted-foreground">
          Toman = USD price × Nobitex USDT rate.
        </p>
      ) : null}
    </SettingsSection>
  );
}
