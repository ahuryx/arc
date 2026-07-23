import type { ReactNode } from "react";
import { Settings } from "lucide-react";
import { useAppState } from "@/core/useAppState";
import { openSettings } from "@/core/workspaceHost";
import { Button } from "@/components/ui/button";

interface WidgetShellProps {
  title: string;
  children: ReactNode;
}

export function WidgetShell({ title, children }: WidgetShellProps) {
  const { workspace } = useAppState();

  return (
    <div className="relative flex size-full flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <header
        className="flex h-8 shrink-0 items-center justify-between border-b border-border px-2.5 pe-1.5"
        data-tauri-drag-region={workspace.locked ? undefined : true}
      >
        <span className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-0.5" data-no-drag>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted-foreground hover:text-foreground"
            title="Settings"
            aria-label="Settings"
            onClick={() => void openSettings()}
          >
            <Settings className="size-3" />
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden" data-no-drag>
        {children}
      </div>
    </div>
  );
}
