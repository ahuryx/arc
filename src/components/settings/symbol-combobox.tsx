import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { filterSymbols, symbolName } from "@/feeds/crypto/symbols";
import { cn } from "@/lib/utils";

export function SymbolCombobox({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const options = useMemo(() => filterSymbols(query), [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          className={cn(
            "h-7 min-w-0 flex-1 justify-between px-2.5 font-normal",
            className,
          )}
        >
          <span className="truncate">
            {value ? `${value} — ${symbolName(value)}` : "Select coin"}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="border-b border-border p-1.5">
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search coins…"
            className="h-7"
            aria-label="Search coins"
            autoComplete="off"
          />
        </div>
        <div
          id={listId}
          role="listbox"
          className="max-h-52 overflow-y-auto p-1"
        >
          {options.length === 0 ? (
            <p className="px-2 py-3 text-center text-[12px] text-muted-foreground">
              No coins found
            </p>
          ) : (
            options.map((entry) => {
              const selected = entry.symbol === value;
              return (
                <button
                  key={entry.symbol}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-start text-[12px] outline-none",
                    "hover:bg-accent focus-visible:bg-accent",
                    selected && "bg-accent/60",
                  )}
                  onClick={() => {
                    onChange(entry.symbol);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0",
                      selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{entry.symbol}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {entry.name}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
