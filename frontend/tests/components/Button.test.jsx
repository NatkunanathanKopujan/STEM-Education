import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Button } from '../../src/components/ui/Button';

describe('Button', () => {
  test('renders children and supports loading state', () => {
    render(<Button isLoading>Save</Button>);

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  test('supports danger variant', () => {
    render(<Button variant="danger">Delete</Button>);

    expect(screen.getByRole('button', { name: /delete/i })).toHaveClass('bg-red-600');
  });
});
