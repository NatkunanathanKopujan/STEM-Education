import { render } from '@testing-library/react';
import { jest } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../src/context/authContextValue';
import { BrandingContext } from '../../src/context/brandingContextValue';
import { LanguageContext } from '../../src/context/LanguageContext';
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
  const brandingValue = {
    branding: {
      universityName: 'DBIT LMS',
      subtitle: 'Learning Management System',
      logoUrl: '',
    },
    refreshBranding: jest.fn(),
    ...options.branding,
  };
  const languageValue = {
    languagePreference: 'en',
    setLanguagePreference: jest.fn(),
    t: (key) => key,
    ...options.language,
  };

  return render(
    <MemoryRouter initialEntries={[options.route || '/']}>
      <AuthContext.Provider value={authValue}>
        <BrandingContext.Provider value={brandingValue}>
          <LanguageContext.Provider value={languageValue}>{ui}</LanguageContext.Provider>
        </BrandingContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}
