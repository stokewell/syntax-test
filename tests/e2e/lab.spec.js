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
  await page.goto('/lab/', { waitUntil: 'domcontentloaded' });
});

test('loads every Component Lab category', async ({ page }) => {
  await expect(page).toHaveTitle(/Component Lab/);
  await expect(page.getByRole('heading', { level: 1, name: 'Component Lab' })).toBeVisible();

  for (const name of [
    'Images as functional examples',
    'Encapsulated behavior without a framework',
    'UI components without custom elements',
    'Real structures, not static diagrams',
    'Editorial range and stress testing',
    'The complete restored motion toolkit',
  ]) {
    await expect(page.getByRole('heading', { name })).toBeVisible();
  }
});

test('registers the restored custom elements', async ({ page }) => {
  const registered = await page.evaluate(() =>
    ['responsive-image', 'custom-card', 'toggle-switch', 'tabs-container'].every((name) =>
      Boolean(customElements.get(name)),
    ),
  );
  expect(registered).toBe(true);
});

test('restored image examples load successfully', async ({ page }) => {
  const images = [
    page.locator('responsive-image img'),
    page.locator('#image-custom-card img'),
    page.locator('.lab-media-frame img'),
  ];

  for (const image of images) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => image.evaluate((element) => element.complete && element.naturalWidth > 0))
      .toBe(true);
  }
});

test('interactive toggle reports its state', async ({ page }) => {
  const toggle = page.locator('#interactive-toggle').locator('input');
  await toggle.evaluate((input) => input.click());
  await expect(page.getByText('Toggle state: OFF')).toBeVisible();
});

test('Web Component tabs support keyboard navigation', async ({ page }) => {
  const tabs = page.locator('tabs-container').first();
  const first = tabs.locator('[role="tab"]').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.locator('[role="tab"]').nth(1)).toBeFocused();
});

test('modal restores focus to its trigger', async ({ page }, testInfo) => {
  const trigger = page.getByRole('button', { name: 'Open modal' });
  await activate(trigger, page, testInfo);
  await expect(page.getByRole('dialog', { name: 'Accessible modal dialog' })).toBeVisible();
  await activate(page.getByRole('button', { name: 'Confirm' }), page, testInfo);
  await expect(trigger).toBeFocused();
});

test('motion controls invoke the shipped animation framework', async ({ page }, testInfo) => {
  await activate(page.getByRole('button', { name: 'Pulse' }), page, testInfo);
  await expect
    .poll(async () =>
      page.locator('#basic-demo').evaluate((element) => element.getAnimations().length),
    )
    .toBeGreaterThan(0);
});

test('typewriter retains content when reduced motion is requested', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await activate(page.getByRole('button', { name: 'Typewriter' }), page, testInfo);
  await expect(page.locator('#custom-demo')).toHaveText('Custom Animation');
});

test('has no serious or critical axe violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact),
  );
  expect(blocking).toEqual([]);
});
