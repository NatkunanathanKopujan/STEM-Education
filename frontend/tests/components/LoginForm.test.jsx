import { describe, expect, jest, test } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../src/components/auth/LoginForm';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('LoginForm', () => {
  test('validates required fields', async () => {
    renderWithProviders(<LoginForm onSubmit={jest.fn()} selectedRole="teacher" />);

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/username or email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  test('submits credentials with remember me enabled', async () => {
    const onSubmit = jest.fn();
    renderWithProviders(<LoginForm onSubmit={onSubmit} selectedRole="student" />);

    await userEvent.type(screen.getByLabelText(/username or email/i), 'student@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      identifier: 'student@example.com',
      password: 'password123',
      rememberMe: true,
    }), expect.anything()));
  });
});
