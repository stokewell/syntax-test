import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createAccentPalette, contrastRatio } from '../../consumer/lib/color.mjs';
import {
  ConsumerGenerationError,
  createProjectFileSet,
  getRecipe,
  listRecipes,
} from '../../consumer/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function readConfig(name) {
  return JSON.parse(
    await readFile(path.join(root, 'consumer/fixtures/configs', `${name}.json`), 'utf8'),
  );
}

function countOccurrences(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

describe('public Consumer Mode recipes', () => {
  it('publishes all four v1 recipes with explicit contracts', () => {
    expect(listRecipes()).toEqual([
      expect.objectContaining({ id: 'blank', version: 1, compatibleFeatures: ['theme'] }),
      expect.objectContaining({ id: 'portfolio', version: 1, compatibleFeatures: ['theme'] }),
      expect.objectContaining({
        id: 'product',
        version: 1,
        visualDirections: [
          'product',
          'technical',
          'playful',
          'minimal',
          'cinematic',
          'retro-interface',
        ],
        compatibleFeatures: ['theme'],
      }),
      expect.objectContaining({
        id: 'app',
        version: 1,
        visualDirections: ['product', 'technical', 'minimal', 'retro-interface'],
        compatibleFeatures: ['theme'],
      }),
    ]);
  });

  it('creates accessible light and dark accents from user input', () => {
    const palette = createAccentPalette('#6D4AFF');
    expect(contrastRatio(palette.light, '#FBFAF8')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(palette.dark, '#181716')).toBeGreaterThanOrEqual(4.5);
  });

  it('generates a small Blank project without requiring JavaScript', async () => {
    const config = await readConfig('blank-editorial');
    const fileSet = await createProjectFileSet({ config, recipe: getRecipe('blank') });
    expect([...fileSet.files.keys()]).toEqual([
      'PROJECT_BRIEF.md',
      'README.md',
      'index.html',
      'site.css',
      'site.webmanifest',
      'syntax.css',
      'syntax.project.json',
    ]);
    expect(fileSet.files.get('index.html')).not.toContain('site.js');
    expect(fileSet.files.get('syntax.css')).toContain('Syntax v1.2.0');
  });

  it('supports one-project and six-project Portfolio outputs', async () => {
    const editorial = await createProjectFileSet({
      config: await readConfig('portfolio-editorial'),
      recipe: getRecipe('portfolio'),
    });
    const product = await createProjectFileSet({
      config: await readConfig('portfolio-product'),
      recipe: getRecipe('portfolio'),
    });
    expect(countOccurrences(editorial.files.get('index.html'), /class="project-card"/g)).toBe(1);
    expect(countOccurrences(product.files.get('index.html'), /class="project-card"/g)).toBe(6);
    expect(product.files.has('assets/project-6.svg')).toBe(true);
  });

  it('generates a semantic Product page with features, steps, and repeated action', async () => {
    const fileSet = await createProjectFileSet({
      config: await readConfig('product-technical'),
      recipe: getRecipe('product'),
    });
    const html = fileSet.files.get('index.html');
    expect(countOccurrences(html, /class="feature-card"/g)).toBe(3);
    expect(countOccurrences(html, /class="step-card"/g)).toBe(3);
    expect(countOccurrences(html, />Start a feedback loop</g)).toBeGreaterThanOrEqual(2);
    expect(fileSet.files.get('site.css')).toContain('--consumer-card-radius: var(--radius-sm)');
  });

  it('generates an App shell with navigation, metrics, tasks, and an empty state', async () => {
    const fileSet = await createProjectFileSet({
      config: await readConfig('app-retro-interface'),
      recipe: getRecipe('app'),
    });
    const html = fileSet.files.get('index.html');
    expect(countOccurrences(html, /class="stat-card"/g)).toBe(3);
    expect(countOccurrences(html, /<tr>/g)).toBe(4);
    expect(html).toContain('No unassigned work is waiting in the intake queue.');
    expect(fileSet.files.get('site.css')).toContain('--consumer-font-heading: var(--font-mono)');
  });

  it('rejects malformed Product and App data', async () => {
    const product = await readConfig('product-technical');
    product.recipe.data.features = [];
    await expect(
      createProjectFileSet({ config: product, recipe: getRecipe('product') }),
    ).rejects.toThrow(/between 2 and 6 items/);

    const app = await readConfig('app-retro-interface');
    app.recipe.data.navigation = [{ label: 'Only', destination: '#only' }];
    await expect(createProjectFileSet({ config: app, recipe: getRecipe('app') })).rejects.toThrow(
      /between 2 and 6 items/,
    );
  });

  it('keeps recipe identity in project CSS rather than the Syntax bundle', async () => {
    const portfolio = await createProjectFileSet({
      config: await readConfig('portfolio-product'),
      recipe: getRecipe('portfolio'),
    });
    const app = await createProjectFileSet({
      config: await readConfig('app-retro-interface'),
      recipe: getRecipe('app'),
    });
    expect(portfolio.files.get('syntax.css')).toBe(app.files.get('syntax.css'));
    expect(portfolio.files.get('site.css')).not.toBe(app.files.get('site.css'));
  });

  it('rejects incompatible features and invalid Portfolio sizes', async () => {
    const incompatible = await readConfig('blank-editorial');
    incompatible.features = ['dialog'];
    await expect(
      createProjectFileSet({ config: incompatible, recipe: getRecipe('blank') }),
    ).rejects.toThrow(ConsumerGenerationError);

    const oversized = await readConfig('portfolio-product');
    oversized.recipe.data.projects.push({ ...oversized.recipe.data.projects[0], title: 'Seventh' });
    await expect(
      createProjectFileSet({ config: oversized, recipe: getRecipe('portfolio') }),
    ).rejects.toThrow(/between one and six projects/);
  });
});
