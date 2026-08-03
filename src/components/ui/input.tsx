import * as React from 'react';

import { cn } from '@/lib/utils';

export function Input({
  className,
  ref,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-8 w-full rounded-md border border-border bg-muted px-2.5 text-[13px] text-foreground transition-colors outline-none',
        'placeholder:text-muted-foreground',
        'focus:border-foreground/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
