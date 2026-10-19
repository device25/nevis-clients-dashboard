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
  const scrollWidth = () =>
    page.evaluate(() => document.documentElement.scrollWidth);

  expect(await scrollWidth()).toBe(375);

  // The widest states: every row that can open is open, the channel split is
  // charted, and the tooltip is out.
  await page.getByRole('row', { name: 'Company' }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(
    page.getByRole('img', { name: /^Company › Branch 1 › Anna Blackwood/ }),
  ).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(13);

  await page
    .getByRole('img', { name: /^Company › Branch 1 › Anna Blackwood/ })
    .hover({ position: { x: 300, y: 100 } });
  await expect(page.getByText('Children total')).toBeVisible();

  expect(await scrollWidth()).toBe(375);
});

for (const width of [1440, 375]) {
  test(`does not move the table when the data arrives at ${String(width)}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    // The request still reaches the real server; it only leaves later, so the
    // skeleton is on screen long enough to be measured.
    await page.route('**/api/clients', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.goto('/');
    const skeletonTable = page.locator('[aria-busy="true"] > :nth-child(2)');
    await expect(skeletonTable).toBeVisible();
    const before = await skeletonTable.boundingBox();

    await expect(page.getByRole('treegrid', { name: 'Clients' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: /^Company, by branch/ }),
    ).toBeVisible();
    const after = await page
      .getByRole('region', { name: 'Table' })
      .boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThanOrEqual(1);
  });
}

for (const width of [320, 375]) {
  test(`keeps the month labels apart and inside the chart card at ${String(width)}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await openDashboard(page);

    const card = await page
      .getByRole('region', { name: 'Chart' })
      .boundingBox();
    // The month labels and, on a narrow chart, the year captions under the
    // first and last label drawn.
    const labels = page
      .getByRole('img', { name: /^Company, by branch/ })
      .locator('text')
      .filter({ hasText: /^([A-Z][a-z]{2}( \d{4})?|\d{4})$/ });
    const count = await labels.count();
    expect(await labels.allTextContents()).toEqual(
      expect.arrayContaining(['2024', '2025']),
    );
    const boxes = [];
    for (let index = 0; index < count; index += 1) {
      const box = await labels.nth(index).boundingBox();
      expect(box).not.toBeNull();
      boxes.push(box);
    }

    expect(card).not.toBeNull();
    for (const box of boxes) {
      expect(box?.x ?? 0).toBeGreaterThanOrEqual(card?.x ?? 0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        (card?.x ?? 0) + (card?.width ?? 0),
      );
    }
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        const apart =
          (a?.x ?? 0) + (a?.width ?? 0) <= (b?.x ?? 0) ||
          (b?.x ?? 0) + (b?.width ?? 0) <= (a?.x ?? 0) ||
          (a?.y ?? 0) + (a?.height ?? 0) <= (b?.y ?? 0) ||
          (b?.y ?? 0) + (b?.height ?? 0) <= (a?.y ?? 0);
        expect(apart).toBe(true);
      }
    }
  });
}

test('names both years in the full month labels at 1440px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDashboard(page);

  const labels = await page
    .getByRole('img', { name: /^Company, by branch/ })
    .locator('text')
    .allTextContents();

  expect(labels).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/ 2024$/),
      expect.stringMatching(/ 2025$/),
    ]),
  );
});

test('does not scroll horizontally at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await openDashboard(page);

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBe(320);
});
