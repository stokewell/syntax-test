import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function activate(locator, page, testInfo) {
  if (testInfo.project.name !== 'mobile-chromium') {
    await locator.click();
    return;
  }

  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error('Unable to resolve a touch target bounding box.');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/', { waitUntil: 'domcontentloaded' });
});

test('loads the canonical Syntax showcase', async ({ page }) => {
  await expect(page).toHaveTitle(/Syntax/);
  await expect(page.getByRole('heading', { level: 1, name: 'Syntax' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Use this template' })).toBeVisible();
});

test('tabs work with keyboard navigation', async ({ page }) => {
  const uiTab = page.getByRole('tab', { name: 'UI' });
  await uiTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Typography' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Typography' })).toBeVisible();
});

test('dialog restores focus to its trigger', async ({ page }, testInfo) => {
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await activate(trigger, page, testInfo);
  await expect(page.getByRole('dialog', { name: 'A dependable dialog' })).toBeVisible();
  await activate(page.getByRole('button', { name: 'Done' }), page, testInfo);
  await expect(trigger).toBeFocused();
});

test('theme preference cycles explicitly', async ({ page }, testInfo) => {
  const toggle = page.getByRole('button', { name: /Theme preference/ });
  await activate(toggle, page, testInfo);
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'light');
  await activate(toggle, page, testInfo);
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'dark');
});

test('has no serious or critical axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact),
  );
  expect(blocking).toEqual([]);
});
