import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type NumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "onChange" | "value"
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

function clampOptional(value: number, min?: number, max?: number): number {
  let next = value;
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  return next;
}

export function NumberInput({
  className,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled,
  id,
  onBlur,
  onKeyDown,
  ...props
}: NumberInputProps) {
  const [draft, setDraft] = React.useState(String(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = (raw: string) => {
    const parsed = Number(raw);
    const next = clampOptional(
      Number.isFinite(parsed) ? parsed : (min ?? 0),
      min,
      max,
    );
    onValueChange(next);
    setDraft(String(next));
  };

  const bump = (direction: 1 | -1) => {
    if (disabled) return;
    const base = Number(draft);
    const current = Number.isFinite(base) ? base : value;
    const next = clampOptional(current + direction * step, min, max);
    onValueChange(next);
    setDraft(String(next));
  };

  return (
    <div
      className={cn(
        "group relative inline-flex h-8 overflow-hidden rounded-md border border-border bg-muted",
        "transition-colors focus-within:border-foreground/30",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <input
        {...props}
        id={id}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={draft}
        className={cn(
          "h-full min-w-0 flex-1 border-0 bg-transparent pe-7 ps-2.5 text-[13px] text-foreground tabular-nums outline-none",
        )}
        onFocus={() => setFocused(true)}
        onChange={(event) => {
          const raw = event.target.value.replace(/[^\d.-]/g, "");
          setDraft(raw);
        }}
        onBlur={(event) => {
          setFocused(false);
          commit(draft);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            bump(1);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            bump(-1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            commit(draft);
            event.currentTarget.blur();
          }
          onKeyDown?.(event);
        }}
      />
      <div className="absolute inset-y-0 end-0 flex w-5 flex-col border-s border-border">
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || (typeof max === "number" && value >= max)}
          aria-label="Increase"
          className="flex flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => bump(1)}
        >
          <ChevronUp className="size-2.5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled || (typeof min === "number" && value <= min)}
          aria-label="Decrease"
          className="flex flex-1 items-center justify-center border-t border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => bump(-1)}
        >
          <ChevronDown className="size-2.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
