import type { ReactNode } from "react";
import { Settings } from "lucide-react";
import { useAppState } from "@/core/useAppState";
import { openSettings } from "@/core/workspaceHost";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WidgetShellProps {
  title: string;
  children: ReactNode;
}

export function WidgetShell({ title, children }: WidgetShellProps) {
  const { workspace } = useAppState();

  return (
    <div className="card">
      <header
        className={cn("wh", !workspace.locked && "cursor-grab")}
        data-tauri-drag-region={workspace.locked ? undefined : true}
      >
        <span className="wh-title">{title}</span>
        <div className="wh-actions" data-no-drag>
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
      <div className="wb" data-no-drag>
        {children}
      </div>
    </div>
  );
}
