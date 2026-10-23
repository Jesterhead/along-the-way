import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('renders its children as the accessible name', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Cancel</Button>
      </form>,
    );

    const button = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(button);

    expect(button).toHaveAttribute('type', 'button');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the form when type="submit" is set explicitly', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('passes native props through, such as onClick and disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Edit</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <Button onClick={onClick} disabled>
        Edit
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps a className passed by the caller', () => {
    render(<Button className="w-full">Wide</Button>);

    expect(screen.getByRole('button', { name: 'Wide' })).toHaveClass('w-full');
  });
});
