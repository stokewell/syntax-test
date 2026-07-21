import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { applyShipPlan, createFilesystemShipPlan } from '../../consumer/lib/ship-files.mjs';
import { createShipPlan, formatShipPlan } from '../../consumer/lib/ship.mjs';

const temporaryDirectories = [];

function config(overrides = {}) {
  return {
    $schema:
      'https://raw.githubusercontent.com/stokewell/syntax/main/consumer/schema/syntax-project.schema.json',
    schemaVersion: 1,
    syntaxVersion: '1.2.0',
    project: {
      name: 'Ship Proof',
      slug: 'ship-proof',
      description: 'A complete project used to prove safe release preparation.',
      author: 'Syntax Test Studio',
      canonicalUrl: 'https://shipproof.test/',
      repositoryUrl: null,
      primaryAction: { label: 'Explore', destination: '#main-content' },
      secondaryAction: null,
    },
    recipe: { id: 'blank', version: 1 },
    visualDirection: 'minimal',
    accentColor: '#067474',
    features: ['theme'],
    mode: 'prototype',
    deployment: 'github-pages-actions',
    generated: { generatorVersion: '0.2.0', configurationHash: 'test', files: [] },
    ...overrides,
  };
}

function projectFiles(projectConfig = config()) {
  return new Map([
    ['syntax.project.json', `${JSON.stringify(projectConfig, null, 2)}\n`],
    ['site.webmanifest', `${JSON.stringify({ name: projectConfig.project.name })}\n`],
    [
      'index.html',
      `<!doctype html><html><head><link rel="canonical" href="${projectConfig.project.canonicalUrl}"></head><body><main id="main-content"><img src="art.svg" alt="Abstract artwork"></main></body></html>`,
    ],
    ['syntax.css', '/* Syntax */\n'],
    ['site.css', 'main { display: block; }\n'],
    ['site.js', 'console.log("ready");\n'],
    ['demo/index.html', '<p>Prototype documentation</p>'],
    ['lab/index.html', '<p>Component laboratory</p>'],
  ]);
}

async function createProjectDirectory() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'syntax-ship-'));
  temporaryDirectories.push(root);
  for (const [relative, content] of projectFiles()) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('Consumer Mode Ship planner', () => {
  it('proposes deterministic release, deployment, report, and cleanup outputs', () => {
    const plan = createShipPlan({ config: config(), files: projectFiles() });

    expect(plan.blocking).toEqual([]);
    expect([...plan.proposedFiles.keys()]).toEqual([
      'syntax.project.json',
      'sitemap.xml',
      'robots.txt',
      'structured-data.json',
      'release-report.json',
      'RELEASE_CHECKLIST.md',
      'CNAME',
    ]);
    expect([...plan.deploymentOutputs.keys()]).toEqual(['.github/workflows/pages.yml']);
    expect(plan.removals).toEqual(['demo/', 'lab/']);
    expect(JSON.parse(plan.proposedFiles.get('syntax.project.json')).mode).toBe('ship');
    expect(JSON.parse(plan.proposedFiles.get('release-report.json'))).toMatchObject({
      recipe: 'blank',
      selectedFeatures: ['theme'],
      deployment: 'github-pages-actions',
    });
    expect(formatShipPlan(plan)).toContain('optional removal');
  });

  it('blocks missing metadata, canonical disagreement, placeholders, and missing alt text', () => {
    const broken = config({
      project: { ...config().project, canonicalUrl: null },
    });
    const files = projectFiles(broken);
    files.set('index.html', '<a href="#">Coming soon</a><img src="art.svg">');

    const rules = createShipPlan({ config: broken, files }).blocking.map((finding) => finding.rule);
    expect(rules).toEqual(
      expect.arrayContaining([
        'missing-canonical-url',
        'empty-link',
        'placeholder-copy',
        'missing-image-alt',
      ]),
    );
  });

  it('is safe to rerun after the manifest is already in ship mode', () => {
    const shipped = config({ mode: 'ship' });
    const first = createShipPlan({ config: shipped, files: projectFiles(shipped) });
    const second = createShipPlan({ config: shipped, files: projectFiles(shipped) });

    expect(first.blocking).toEqual([]);
    expect([...first.proposedFiles]).toEqual([...second.proposedFiles]);
  });
});

describe('Consumer Mode Ship filesystem transaction', () => {
  it('previews without mutation and writes release files without cleanup by default', async () => {
    const root = await createProjectDirectory();
    const before = await readFile(path.join(root, 'syntax.project.json'), 'utf8');
    const state = await createFilesystemShipPlan(root);

    expect(await readFile(path.join(root, 'syntax.project.json'), 'utf8')).toBe(before);
    const result = await applyShipPlan({ root, plan: state.plan });

    expect(result.removed).toEqual([]);
    expect(JSON.parse(await readFile(path.join(root, 'syntax.project.json'), 'utf8')).mode).toBe(
      'ship',
    );
    expect(await readFile(path.join(root, 'sitemap.xml'), 'utf8')).toContain(
      'https://shipproof.test/',
    );
    expect(await readFile(path.join(root, 'demo/index.html'), 'utf8')).toContain('Prototype');
  });

  it('removes only listed prototype paths when cleanup is explicitly enabled', async () => {
    const root = await createProjectDirectory();
    const state = await createFilesystemShipPlan(root);
    const result = await applyShipPlan({ root, plan: state.plan, clean: true });

    expect(result.removed).toEqual(['demo/', 'lab/']);
    await expect(readFile(path.join(root, 'demo/index.html'), 'utf8')).rejects.toThrow();
    await expect(readFile(path.join(root, 'lab/index.html'), 'utf8')).rejects.toThrow();
  });
});
