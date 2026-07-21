import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { getRecipe } from '../../consumer/index.mjs';
import { scanPublicContent, scanTemplateResidue } from '../../consumer/lib/residue.mjs';
import {
  ConsumerSetupError,
  applySetupPlan,
  createSetupPlan,
  formatSetupSummary,
} from '../../consumer/lib/setup.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const configPath = path.join(root, 'consumer/fixtures/configs/setup-portfolio.json');
const temporaryDirectories = [];

async function tempDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'syntax-setup-'));
  temporaryDirectories.push(directory);
  return directory;
}

async function readConfig() {
  return JSON.parse(await readFile(configPath, 'utf8'));
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('Consumer Mode setup planning', () => {
  it('creates a personalized plan without writing files', async () => {
    const output = path.join(await tempDirectory(), 'project');
    const config = await readConfig();
    const plan = await createSetupPlan({
      config,
      recipe: getRecipe(config.recipe.id),
      outputDirectory: output,
    });

    expect(plan.blockingCollisions).toEqual([]);
    expect(plan.fileSet.files.has('syntax.project.json')).toBe(true);
    expect(plan.fileSet.files.has('package.json')).toBe(true);
    expect(plan.fileSet.files.has('tests/consumer.spec.js')).toBe(true);
    await expect(readdir(output)).rejects.toThrow();
    expect(formatSetupSummary(plan)).toContain('Setup Proof');
  });

  it('classifies only known Syntax template files as replaceable', async () => {
    const output = await tempDirectory();
    await writeFile(
      path.join(output, 'package.json'),
      JSON.stringify({ name: 'syntax-typography-starter' }),
    );
    await writeFile(path.join(output, 'index.html'), 'template root');
    await writeFile(path.join(output, 'README.md'), 'template readme');
    await writeFile(path.join(output, 'custom.txt'), 'keep me');

    const config = await readConfig();
    const plan = await createSetupPlan({
      config,
      recipe: getRecipe(config.recipe.id),
      outputDirectory: output,
    });

    expect(plan.replacements).toEqual(['README.md', 'index.html', 'package.json']);
    expect(plan.blockingCollisions).toEqual([]);
  });

  it('blocks collisions in a non-template directory', async () => {
    const output = await tempDirectory();
    await writeFile(path.join(output, 'index.html'), 'project-owned');
    const config = await readConfig();
    const plan = await createSetupPlan({
      config,
      recipe: getRecipe(config.recipe.id),
      outputDirectory: output,
    });

    expect(plan.blockingCollisions).toContain('index.html');
    await expect(applySetupPlan(plan)).rejects.toThrow(ConsumerSetupError);
    expect(await readFile(path.join(output, 'index.html'), 'utf8')).toBe('project-owned');
  });

  it('refuses an already configured project', async () => {
    const output = await tempDirectory();
    await writeFile(path.join(output, 'syntax.project.json'), '{}');
    const config = await readConfig();

    await expect(
      createSetupPlan({
        config,
        recipe: getRecipe(config.recipe.id),
        outputDirectory: output,
      }),
    ).rejects.toThrow(/already configured/);
  });
});

describe('Consumer Mode setup application', () => {
  it('applies the complete setup transaction and removes public residue', async () => {
    const output = path.join(await tempDirectory(), 'project');
    const config = await readConfig();
    const plan = await createSetupPlan({
      config,
      recipe: getRecipe(config.recipe.id),
      outputDirectory: output,
    });
    const result = await applySetupPlan(plan);

    expect(result.files).toContain('PUBLISHING.md');
    expect(result.files).toContain('.nojekyll');
    expect(JSON.parse(await readFile(path.join(output, 'package.json'), 'utf8'))).toMatchObject({
      name: 'setup-proof',
      description: config.project.description,
    });
    expect(await scanTemplateResidue(output)).toEqual([]);
    expect(await readFile(path.join(output, 'site.js'), 'utf8')).toContain(
      'feature:mobile-navigation',
    );
  });

  it('detects legacy public template residue', () => {
    expect(
      scanPublicContent({
        'index.html': '<meta http-equiv="refresh" content="0; url=./demo/" />',
        'package.json': '{"name":"syntax-typography-starter"}',
      }),
    ).toEqual(
      expect.arrayContaining([
        { file: 'index.html', rule: 'demo-redirect' },
        { file: 'package.json', rule: 'template-package-name' },
      ]),
    );
  });
});
