import { test, expect } from '@playwright/test';
import { API, uniqueUser } from './helpers';

test('a visitor can register and ends up authenticated on the profile page', async ({ page, request }) => {
  const user = uniqueUser();

  await page.goto('/register');
  await page.getByPlaceholder('Seu usuário').fill(user.username);
  await page.getByPlaceholder('seu@email.com').fill(user.email);
  await page.getByPlaceholder('Senha segura').fill(user.password);
  await page.getByRole('button', { name: 'Cadastrar' }).click();

  // Register auto-logs-in and redirects to the profile.
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByText(`Bem-vindo, ${user.username}`)).toBeVisible();

  // Cleanup: remove the account created during the test.
  const token = await page.evaluate(() => localStorage.getItem('wastedhours_token'));
  await request.delete(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
});
