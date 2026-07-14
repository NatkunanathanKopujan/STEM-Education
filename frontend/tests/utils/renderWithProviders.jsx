import { render } from '@testing-library/react';
import { jest } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../src/context/authContextValue';
import { users } from '../fixtures/lmsFixtures';

export function renderWithProviders(ui, options = {}) {
  const authValue = {
    user: options.user || users.superAdmin,
    token: 'test-token',
    role: options.user?.role || users.superAdmin.role,
    isAuthenticated: true,
    isLoading: false,
    isInitializing: false,
    isSessionExpired: false,
    homePath: '/super-admin/dashboard',
    login: jest.fn(),
    logout: jest.fn(),
    ...options.auth,
  };

  return render(
    <MemoryRouter initialEntries={[options.route || '/']}>
      <AuthContext.Provider value={authValue}>{ui}</AuthContext.Provider>
    </MemoryRouter>,
  );
}
