import { expect, test, type Page } from '@playwright/test';

async function openDashboard(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('treegrid', { name: 'Clients' })).toBeVisible();
  await expect(
    page.getByRole('img', { name: /^Company, by branch/ }),
  ).toBeVisible();
}

const legend = (page: Page) =>
  page.getByRole('region', { name: 'Chart' }).getByRole('listitem');

test('loads the dashboard at Company scope', async ({ page }) => {
  await openDashboard(page);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Clients' }),
  ).toBeVisible();
  await expect(legend(page)).toHaveText(['Branch 1', 'Branch 2', 'Branch 3']);
  await expect(page.getByRole('row', { name: 'Company' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('drills down to a channel split with the keyboard', async ({ page }) => {
  await openDashboard(page);

  await page.getByRole('row', { name: 'Company' }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('row', { name: 'Branch 1' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('row', { name: 'Anna Blackwood' })).toBeFocused();
  await page.keyboard.press('Space');

  await expect(legend(page)).toHaveText([
    'Existing clients',
    'New organic',
    'New paid',
  ]);
  await expect(
    page.getByRole('img', {
      name: /^Company › Branch 1 › Anna Blackwood, by acquisition channel/,
    }),
  ).toBeVisible();
});

test('does not overflow a 375px wide screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openDashboard(page);

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBe(375);
});
