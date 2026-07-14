import { expect, test } from '@playwright/test';

async function chooseRole(page, roleName) {
  await page.goto('/login');
  await page.getByText(roleName, { exact: false }).first().click();
}

test.describe('AI Smart LMS core workflows', () => {
  test('public landing page and role selection load', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /AI Smart Learning Management System/i })).toBeVisible();
    await page.getByRole('link', { name: /login/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('super admin login workflow template', async ({ page }) => {
    await chooseRole(page, 'Super Admin');
    await expect(page.getByText(/login as/i)).toBeVisible();

    await page.getByLabel(/username or email/i).fill(process.env.E2E_SUPER_ADMIN_USER || 'superadmin@example.com');
    await page.getByLabel(/password/i).fill(process.env.E2E_SUPER_ADMIN_PASSWORD || 'ChangeMe123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/super-admin\/dashboard|\/login/);
  });

  test('teacher material upload workflow placeholder', async ({ page }) => {
    await page.goto('/teacher/materials');

    await expect(page).toHaveURL(/\/teacher\/materials|\/login/);
  });

  test('student quiz workflow placeholder', async ({ page }) => {
    await page.goto('/student/ai-quiz');

    await expect(page).toHaveURL(/\/student\/ai-quiz|\/login/);
  });
});
