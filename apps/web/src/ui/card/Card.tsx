import clsx from 'clsx';
import type { ComponentProps } from 'react';

const variants = {
  primary: 'rounded-card border border-border bg-card text-card-foreground p-6 shadow-card',
};

interface CardProps extends ComponentProps<'div'> {
  variant?: keyof typeof variants;
}

export function Card({ variant = 'primary', className, ...props }: CardProps) {
  return <div className={clsx(variants[variant], className)} {...props} />;
}
