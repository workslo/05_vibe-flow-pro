import { expect, test } from '@playwright/test';

test('development loop revises once and then passes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /AI development loop/i }).click();

  await page.getByLabel('Feature summary').fill('Add retry controls');
  await page
    .getByLabel('Acceptance criteria')
    .fill('A user can set the retry limit');
  await page.getByRole('button', { name: 'Run loop' }).click();

  await expect(page.getByText('Passed')).toBeVisible();
  await expect(page.getByText('2 iterations')).toBeVisible();
  await expect(
    page.getByText('Handle the failed scripted acceptance case.'),
  ).toBeVisible();
});

test('development loop rejects an empty brief', async ({ page }) => {
  await page.goto('/development-loop');
  await page.getByRole('button', { name: 'Run loop' }).click();

  await expect(
    page.getByText(
      'Add a feature summary and at least one acceptance criterion.',
    ),
  ).toBeVisible();
});
