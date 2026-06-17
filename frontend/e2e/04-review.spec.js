import { test, expect } from '@playwright/test';
import { uniqueUser, registerAndLogin, firstGameId, deleteAccount } from './helpers';

test('a logged-in user can rate a game and see their review', async ({ page, request }) => {
  const { token } = await registerAndLogin(page, request, uniqueUser());
  const gameId = await firstGameId(request);

  await page.goto(`/game/${gameId}`);

  // Open the rating modal (sidebar button reads "Rate Game" when no review exists yet).
  await page.getByRole('button', { name: /Rate Game/ }).click();

  const reviewText = `E2E review ${Date.now()}`;
  await page.getByPlaceholder('Share your thoughts about this game...').fill(reviewText);
  await page.getByRole('button', { name: /Submit Review/ }).click();

  // The review shows up in the community reviews section.
  await expect(page.getByText(reviewText)).toBeVisible();

  await deleteAccount(request, token);
});
