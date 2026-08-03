import type { VariantProps } from 'class-variance-authority';

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { use, useMemo } from 'react';

import { cn } from '@/lib/utils';

const toggleGroupVariants = cva(
  'inline-flex items-center justify-center rounded-md border border-border bg-muted p-0.5',
  {
    variants: {
      size: {
        default: 'h-9',
        sm: 'h-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const toggleGroupItemVariants = cva(
  'inline-flex cursor-default items-center justify-center gap-1 rounded-sm px-2.5 text-[12px] font-medium text-muted-foreground transition-colors outline-none',
  {
    variants: {
      size: {
        default: 'h-8 min-w-8',
        sm: 'h-7 min-w-7 px-2 text-[11px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleGroupVariants>
>({ size: 'default' });
ToggleGroupContext.displayName = 'ToggleGroupContext';

export function ToggleGroup({
  className,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleGroupVariants>) {
  const contextValue = useMemo(() => ({ size }), [size]);

  return (
    <ToggleGroupPrimitive.Root
      className={cn(toggleGroupVariants({ size }), className)}
      {...props}
    >
      <ToggleGroupContext value={contextValue}>{children}</ToggleGroupContext>
    </ToggleGroupPrimitive.Root>
  );
}

export function ToggleGroupItem({
  className,
  children,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleGroupItemVariants>) {
  const context = use(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        toggleGroupItemVariants({ size: size ?? context.size }),
        'hover:text-foreground focus-visible:bg-accent/80',
        'data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
