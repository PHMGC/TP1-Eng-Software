import { test, expect } from '@playwright/test';

test('a visitor can browse the catalog and open a game detail page', async ({ page }) => {
  await page.goto('/games');

  // The catalog renders one link per game card (href="/game/:id").
  const firstCard = page.locator('a[href^="/game/"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();

  await expect(page).toHaveURL(/\/game\/\d+/);
  await expect(page.getByRole('heading', { name: 'About This Game' })).toBeVisible();
});
