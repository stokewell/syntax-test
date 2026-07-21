function javascriptString(value) {
  return JSON.stringify(String(value));
}

export function renderConsumerPackage(config) {
  return JSON.stringify({
    name: config.project.slug,
    version: '0.1.0',
    private: true,
    description: config.project.description,
    type: 'module',
    scripts: {
      serve: 'http-server . -p 4173 -c-1',
      test: 'npm run test:consumer',
      'test:consumer': 'playwright test',
      'scan:residue': 'node scripts/scan-template-residue.mjs',
    },
    devDependencies: {
      '@axe-core/playwright': '^4.12.1',
      '@playwright/test': '^1.61.1',
      'http-server': '^14.1.1',
    },
    engines: { node: '>=22.13' },
  });
}

export function renderConsumerPlaywrightConfig() {
  return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 15_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], viewport: { width: 412, height: 839 } },
    },
  ],
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});`;
}

export function renderConsumerTest(config) {
  const selected = JSON.stringify(config.features);
  return `import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const expectedName = ${javascriptString(config.project.name)};
const selectedFeatures = ${selected};
const allFeatures = ['theme', 'mobile-navigation', 'responsive-image', 'dialog'];

test.beforeEach(async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
});

test('loads personalized metadata and primary content', async ({ page }) => {
  await expect(page).toHaveTitle(new RegExp(expectedName));
  await expect(page.getByRole('heading', { level: 1, name: expectedName })).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
});

test('has safe links, loaded images, and no horizontal overflow', async ({ page }) => {
  const unsafeLinks = await page.locator('a').evaluateAll((links) =>
    links.filter((link) => !link.getAttribute('href')).length,
  );
  expect(unsafeLinks).toBe(0);

  for (const image of await page.locator('img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node) => node.complete && node.naturalWidth > 0)).toBe(true);
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});

test('loads only selected optional feature code', async ({ page, request }) => {
  const scriptTagCount = await page.locator('script[src="./site.js"]').count();
  if (selectedFeatures.length === 0) {
    expect(scriptTagCount).toBe(0);
    return;
  }

  expect(scriptTagCount).toBe(1);
  const response = await request.get('/site.js');
  expect(response.ok()).toBe(true);
  const source = await response.text();
  for (const feature of allFeatures) {
    expect(source.includes('feature:' + feature)).toBe(selectedFeatures.includes(feature));
  }
});

test('selected interactions work by keyboard', async ({ page }) => {
  if (selectedFeatures.includes('theme')) {
    const toggle = page.getByRole('button', { name: /Theme preference/ });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'light');
  }

  if (selectedFeatures.includes('mobile-navigation')) {
    const toggle = page.getByRole('button', { name: 'Open navigation' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }

  if (selectedFeatures.includes('dialog')) {
    const trigger = page.getByRole('button', { name: 'Project details' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#project-dialog')).toHaveAttribute('open', '');
    await page.getByRole('button', { name: 'Close' }).click();
  }

  if (selectedFeatures.includes('responsive-image')) {
    await expect(page.locator('img[data-responsive-image]').first()).toBeVisible();
  }
});

test('has no serious or critical accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact),
  );
  expect(blocking).toEqual([]);
});`;
}

export function renderResidueScannerScript() {
  return `import { readFile } from 'node:fs/promises';

const files = ['index.html', 'site.webmanifest', 'package.json'];
const needles = [
  './demo/',
  'demo/index.html',
  'Syntax — Typography',
  'syntax-typography-starter',
  'stokewell.github.io/syntax',
  'https://example.com/',
  'Your Name',
  'Project Name',
  'TODO: replace',
  'Lorem ipsum',
];
const findings = [];

for (const file of files) {
  let content;
  try {
    content = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  if (needles.some((needle) => content.includes(needle))) findings.push(file);
}

if (findings.length > 0) {
  console.error('Template residue found in: ' + findings.join(', '));
  process.exitCode = 1;
} else {
  console.log('No public template residue found.');
}`;
}

export function renderConsumerWorkflow() {
  return `name: Consumer CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm install --ignore-scripts
      - run: npx playwright install --with-deps chromium
      - run: npm run scan:residue
      - run: npm test
`;
}

export function renderPublishingGuide(config) {
  const preview = config.project.canonicalUrl || 'https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/';
  return `# Publishing with GitHub Pages

This project is configured for a root-based GitHub Pages preview.

1. Push the generated project to GitHub.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select **main** and **/(root)**.
5. Save and wait for the deployment to complete.

Expected address: ${preview}

When the final domain is known, update canonical metadata in \`index.html\`, \`site.webmanifest\`, and \`syntax.project.json\`.
`;
}

export function createProjectToolingFiles(config) {
  const files = [
    { path: 'package.json', render: () => renderConsumerPackage(config) },
    { path: 'playwright.config.js', content: renderConsumerPlaywrightConfig() },
    { path: 'tests/consumer.spec.js', content: renderConsumerTest(config) },
    { path: 'scripts/scan-template-residue.mjs', content: renderResidueScannerScript() },
    { path: '.github/workflows/consumer-ci.yml', content: renderConsumerWorkflow() },
  ];

  if (config.deployment === 'github-pages-root') {
    files.push({ path: '.nojekyll', content: '' });
    files.push({ path: 'PUBLISHING.md', content: renderPublishingGuide(config) });
  }

  return files;
}
