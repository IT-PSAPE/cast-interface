import { test, expect } from '@playwright/test';

test('workspace renders command bar and view tabs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Views')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Show' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Edit' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Left' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bottom' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Right' })).toBeVisible();

  await page.getByRole('tab', { name: 'Edit' }).click();

  await expect(page.getByRole('button', { name: 'Left' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Right' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bottom' })).toHaveCount(0);
});
