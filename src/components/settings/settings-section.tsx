import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SettingsSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-[var(--section-bg)] p-3",
        className,
      )}
    >
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-9 items-center justify-between gap-3 py-1",
        className,
      )}
    >
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className="cursor-pointer text-[13px] text-foreground/80"
        >
          {label}
        </label>
      ) : (
        <span className="text-[13px] text-foreground/80">{label}</span>
      )}
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
