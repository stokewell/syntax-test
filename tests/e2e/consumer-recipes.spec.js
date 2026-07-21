import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const previews = [
  ['blank-editorial', 'Field Notes'],
  ['blank-product', 'Signal Kit'],
  ['portfolio-editorial', 'Mara Vale'],
  ['portfolio-product', 'Nico Hart'],
];

for (const [preview, heading] of previews) {
  test(`${preview} loads without overflow or serious accessibility violations`, async ({
    page,
  }) => {
    await page.goto(`/consumer/previews/${preview}/`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact),
    );
    expect(blocking).toEqual([]);
  });
}

test('Portfolio recipes render one and six projects', async ({ page }) => {
  await page.goto('/consumer/previews/portfolio-editorial/');
  await expect(page.locator('.project-card')).toHaveCount(1);

  await page.goto('/consumer/previews/portfolio-product/');
  await expect(page.locator('.project-card')).toHaveCount(6);
});

test('Portfolio project artwork loads', async ({ page }) => {
  await page.goto('/consumer/previews/portfolio-product/');
  const images = page.locator('.project-card__art img');
  await expect(images).toHaveCount(6);

  for (let index = 0; index < 6; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => image.evaluate((element) => element.complete && element.naturalWidth > 0))
      .toBe(true);
  }
});

test('data-backed Portfolio remains complete without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/consumer/previews/portfolio-product/');

  await expect(page.locator('.project-card')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Tiny Signals' })).toBeVisible();
  await context.close();
});

test('theme enhancement cycles explicit preferences', async ({ page }) => {
  await page.goto('/consumer/previews/blank-product/');
  const button = page.getByRole('button', { name: /Theme preference/ });

  await button.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'light');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'dark');
});

test('Editorial and Product directions are meaningfully different', async ({ page }) => {
  await page.goto('/consumer/previews/portfolio-editorial/');
  const editorial = await page.locator('.project-card').evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { borderRadius: style.borderRadius, boxShadow: style.boxShadow };
  });

  await page.goto('/consumer/previews/portfolio-product/');
  const product = await page
    .locator('.project-card')
    .first()
    .evaluate((element) => {
      const style = window.getComputedStyle(element);
      return { borderRadius: style.borderRadius, boxShadow: style.boxShadow };
    });

  expect(editorial.borderRadius).not.toBe(product.borderRadius);
  expect(editorial.boxShadow).not.toBe(product.boxShadow);
});

test('Portfolio remains usable at 320 CSS pixels', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/consumer/previews/portfolio-product/');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
  await expect(page.locator('.project-card').first()).toBeVisible();
});

test('reduced motion disables project transitions and transforms', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/consumer/previews/portfolio-product/');

  const motion = await page
    .locator('.project-card')
    .first()
    .evaluate((element) => {
      const style = window.getComputedStyle(element);
      return { transitionDuration: style.transitionDuration, transform: style.transform };
    });
  expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.001);
  expect(motion.transform).toBe('none');
});
