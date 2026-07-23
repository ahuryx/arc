import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
}

/** Boolean switch — thin wrapper kept for existing settings call sites. */
export function Toggle({
  checked,
  onCheckedChange,
  className,
  ...props
}: ToggleProps) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(className)}
      {...props}
    />
  );
}
