import { test, expect } from '@playwright/test';

test('workbench renders current toolbar labels and panel toggles', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-ui-region="app-toolbar"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Slides' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Overlay' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Left' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bottom' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Right' })).toBeVisible();

  await page.getByRole('button', { name: 'Overlay' }).click();

  await expect(page.getByRole('button', { name: 'Left' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Right' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bottom' })).toHaveCount(0);
});
