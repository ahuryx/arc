import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
}

/** Lab Glass Widgets toggle (exact .toggle / .toggle.on). */
export function Toggle({
  checked,
  onCheckedChange,
  className,
  ...props
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn("toggle", checked && "on", className)}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    />
  );
}
