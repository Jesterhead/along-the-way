import clsx from 'clsx';
import type { ComponentProps } from 'react';

const variants = {
  primary:
    'w-full min-h-24 rounded-md border border-input bg-card px-3 py-2 font-serif ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
};

interface TextAreaProps extends ComponentProps<'textarea'> {
  variant?: keyof typeof variants;
}

export function TextArea({ variant = 'primary', className, ...props }: TextAreaProps) {
  return <textarea className={clsx(variants[variant], className)} {...props} />;
}
