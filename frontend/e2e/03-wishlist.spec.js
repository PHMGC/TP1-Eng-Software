import { test, expect } from '@playwright/test';
import { uniqueUser, registerAndLogin, firstGameId, deleteAccount } from './helpers';

test('a logged-in user can add a game to the wishlist', async ({ page, request }) => {
  const { token } = await registerAndLogin(page, request, uniqueUser());
  const gameId = await firstGameId(request);

  await page.goto(`/game/${gameId}`);

  const addButton = page.getByRole('button', { name: 'Add to Wishlist' });
  await expect(addButton).toBeVisible();
  await addButton.click();

  // The button toggles once the game is in the wishlist.
  await expect(page.getByRole('button', { name: 'Remove from Wishlist' })).toBeVisible();

  // And the game now shows on the wishlist page.
  await page.goto('/wishlist');
  await expect(page.locator('a[href^="/game/"]')).toHaveCount(1);

  await deleteAccount(request, token);
});
