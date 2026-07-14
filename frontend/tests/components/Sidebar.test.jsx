import { describe, expect, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import { Sidebar } from '../../src/components/navigation/Sidebar';
import { renderWithProviders } from '../utils/renderWithProviders';
import { users } from '../fixtures/lmsFixtures';

describe('Sidebar', () => {
  test('renders super admin performance and security navigation', () => {
    renderWithProviders(
      <Sidebar role="super-admin" collapsed={false} onToggle={() => {}} />,
      { user: users.superAdmin, route: '/super-admin/dashboard' },
    );

    expect(screen.getByText(/security center/i)).toBeInTheDocument();
    expect(screen.getByText(/performance/i)).toBeInTheDocument();
  });

  test('renders student specific file navigation', () => {
    renderWithProviders(
      <Sidebar role="student" collapsed={false} onToggle={() => {}} />,
      { user: users.student, route: '/student/dashboard' },
    );

    expect(screen.getByText(/my files/i)).toBeInTheDocument();
    expect(screen.getByText(/ai quiz/i)).toBeInTheDocument();
  });
});
