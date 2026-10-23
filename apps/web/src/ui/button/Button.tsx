import clsx from 'clsx';
import type { ComponentProps } from 'react';

const variants = {
  primary: 'bg-accent text-accent-foreground hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
  ghost: 'text-link hover:bg-border/40',
};

interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof variants;
}

export function Button({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'rounded-md px-4 py-2 font-medium transition-opacity',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
