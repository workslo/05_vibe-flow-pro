import { expect, test } from '@playwright/test';

test('tax ops mapper renders the lineage map from the picker', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Tax operations mapper/i }).click();

  await expect(page).toHaveURL(/\/tax-ops-mapper$/);

  await expect(
    page.getByRole('heading', { name: 'Order capture' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Tax lot selection' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '1099-B production' }),
  ).toBeVisible();

  const orderCaptureNode = page
    .locator('.react-flow__node')
    .filter({ hasText: 'Order capture' });

  const positionBeforeDrag = await orderCaptureNode.boundingBox();
  const flowPositionBeforeDrag = await orderCaptureNode.evaluate(
    (node) => (node as HTMLElement).style.transform,
  );

  expect(positionBeforeDrag).not.toBeNull();
  await page.mouse.move(
    positionBeforeDrag!.x + positionBeforeDrag!.width / 2,
    positionBeforeDrag!.y + positionBeforeDrag!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    positionBeforeDrag!.x + positionBeforeDrag!.width / 2 + 120,
    positionBeforeDrag!.y + positionBeforeDrag!.height / 2 + 80,
    { steps: 10 },
  );
  await page.mouse.up();

  const flowPositionAfterDrag = await orderCaptureNode.evaluate(
    (node) => (node as HTMLElement).style.transform,
  );

  expect(flowPositionAfterDrag).toBe(flowPositionBeforeDrag);

  await orderCaptureNode.click();
  await page.keyboard.press('Delete');
  await expect(orderCaptureNode).toBeVisible();

  await expect(page.getByText('Data passport')).toBeVisible();
  await expect(page.getByText('Break explorer')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Missing cost basis/ }),
  ).toBeVisible();

  await page.getByRole('button', { name: /Proceeds variance/ }).click();
  await expect(
    page.getByText(
      'Trade economics on the client statement and 1099-B may not tie to execution records.',
    ),
  ).toBeVisible();
});
