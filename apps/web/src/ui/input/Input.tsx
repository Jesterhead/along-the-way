import clsx from 'clsx';
import type { ComponentProps } from 'react';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={clsx(
        'w-full rounded-md border border-input bg-card px-3 py-2',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  );
}
