import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { foundationRecipe } from '../../consumer/fixtures/foundation.recipe.mjs';
import {
  ConsumerConfigError,
  ConsumerGenerationError,
  ConsumerPathError,
  createProjectFileSet,
  generateProject,
  readGeneratedProject,
  validateAndNormalizeConfig,
} from '../../consumer/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const configPath = path.join(root, 'consumer/fixtures/foundation.config.json');
const expectedDirectory = path.join(root, 'consumer/fixtures/expected/foundation');
const temporaryDirectories = [];

async function readConfig() {
  return JSON.parse(await readFile(configPath, 'utf8'));
}

async function createTemporaryDirectory() {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'syntax-consumer-'));
  temporaryDirectories.push(directory);
  return directory;
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path.join(directory, entry.name), relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files.sort();
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('Consumer Mode configuration', () => {
  it('normalizes equivalent configurations into the same project file set', async () => {
    const left = await readConfig();
    left.features = ['dialog', 'theme'];
    const right = {
      deployment: left.deployment,
      mode: left.mode,
      features: ['theme', 'dialog'],
      accentColor: left.accentColor.toLowerCase(),
      visualDirection: left.visualDirection,
      recipe: { version: left.recipe.version, id: left.recipe.id },
      project: {
        secondaryAction: left.project.secondaryAction,
        primaryAction: {
          destination: left.project.primaryAction.destination,
          label: left.project.primaryAction.label,
        },
        repositoryUrl: left.project.repositoryUrl,
        canonicalUrl: left.project.canonicalUrl,
        author: left.project.author,
        description: left.project.description,
        slug: left.project.slug,
        name: left.project.name,
      },
      syntaxVersion: left.syntaxVersion,
      schemaVersion: left.schemaVersion,
      $schema: left.$schema,
    };

    const deterministicRecipe = {
      ...foundationRecipe,
      compatibleFeatures: ['theme', 'dialog'],
    };
    const leftFiles = await createProjectFileSet({ config: left, recipe: deterministicRecipe });
    const rightFiles = await createProjectFileSet({ config: right, recipe: deterministicRecipe });

    expect([...leftFiles.files.entries()]).toEqual([...rightFiles.files.entries()]);
    expect(leftFiles.manifest.generated.configurationHash).toBe(
      rightFiles.manifest.generated.configurationHash,
    );
  });

  it('reports actionable errors for unsupported values', async () => {
    const config = await readConfig();
    config.recipe.id = 'mystery';
    config.accentColor = 'teal';
    config.features = ['theme', 'telepathy'];
    config.project.repositoryUrl = 'ftp://example.com/project';

    expect(() => validateAndNormalizeConfig(config)).toThrow(ConsumerConfigError);
    try {
      validateAndNormalizeConfig(config);
    } catch (error) {
      expect(error.issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('recipe.id'),
          expect.stringContaining('accentColor'),
          expect.stringContaining('Unsupported feature'),
          expect.stringContaining('repositoryUrl'),
        ]),
      );
    }
  });

  it('rejects unknown fields instead of silently discarding them', async () => {
    const config = await readConfig();
    config.project.tagline = 'Unexpected';

    expect(() => validateAndNormalizeConfig(config)).toThrow(/project\.tagline is not supported/);
  });
});

describe('Consumer Mode generation', () => {
  it('matches the committed foundation fixture byte for byte', async () => {
    const outputDirectory = path.join(await createTemporaryDirectory(), 'project');
    const result = await generateProject({
      config: await readConfig(),
      recipe: foundationRecipe,
      outputDirectory,
    });

    const expectedFiles = await listFiles(expectedDirectory);
    expect(result.files).toEqual(expectedFiles);
    expect(await listFiles(outputDirectory)).toEqual(expectedFiles);

    for (const relativePath of expectedFiles) {
      const [actual, expected] = await Promise.all([
        readFile(path.join(outputDirectory, relativePath), 'utf8'),
        readFile(path.join(expectedDirectory, relativePath), 'utf8'),
      ]);
      expect(actual, relativePath).toBe(expected);
    }
  });

  it('records deterministic provenance without timestamps', async () => {
    const fileSet = await createProjectFileSet({
      config: await readConfig(),
      recipe: foundationRecipe,
    });

    expect(fileSet.manifest.generated).toEqual({
      generatorVersion: '0.2.0',
      configurationHash: 'ab175c3dfd8f2fddcdfa58dd9524f661fbf47f085319d9859ff28889bacf66eb',
      files: ['PROJECT_BRIEF.md', 'index.html', 'site.css', 'syntax.project.json'],
    });
    expect(JSON.stringify(fileSet.manifest)).not.toMatch(/created|timestamp|date/i);
  });

  it('rejects traversal and duplicate recipe paths before writing', async () => {
    const outputDirectory = path.join(await createTemporaryDirectory(), 'project');
    const config = await readConfig();
    const traversalRecipe = {
      id: 'blank',
      version: 1,
      label: 'Test recipe',
      description: 'Test-only recipe.',
      visualDirections: ['editorial'],
      compatibleFeatures: ['theme'],
      files: [{ path: '../escape.txt', content: 'nope' }],
    };
    const duplicateRecipe = {
      id: 'blank',
      version: 1,
      label: 'Test recipe',
      description: 'Test-only recipe.',
      visualDirections: ['editorial'],
      compatibleFeatures: ['theme'],
      files: [
        { path: 'same.txt', content: 'one' },
        { path: 'same.txt', content: 'two' },
      ],
    };

    await expect(createProjectFileSet({ config, recipe: traversalRecipe })).rejects.toThrow(
      ConsumerPathError,
    );
    await expect(createProjectFileSet({ config, recipe: duplicateRecipe })).rejects.toThrow(
      ConsumerGenerationError,
    );
    await expect(readdir(outputDirectory)).rejects.toThrow();
  });

  it('preflights collisions and leaves the directory unchanged', async () => {
    const outputDirectory = path.join(await createTemporaryDirectory(), 'project');
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(path.join(outputDirectory, 'index.html'), 'project-owned\n');

    await expect(
      generateProject({ config: await readConfig(), recipe: foundationRecipe, outputDirectory }),
    ).rejects.toThrow(/Refusing to overwrite project-owned files: index\.html/);

    expect(await readFile(path.join(outputDirectory, 'index.html'), 'utf8')).toBe(
      'project-owned\n',
    );
    expect(await listFiles(outputDirectory)).toEqual(['index.html']);
  });

  it('permits explicit replacement only inside the test suite', async () => {
    const outputDirectory = path.join(await createTemporaryDirectory(), 'project');
    const config = await readConfig();
    await generateProject({ config, recipe: foundationRecipe, outputDirectory });
    await writeFile(path.join(outputDirectory, 'index.html'), 'changed\n');

    await generateProject({
      config,
      recipe: foundationRecipe,
      outputDirectory,
      unsafeAllowOverwriteForTests: true,
    });

    expect(await readFile(path.join(outputDirectory, 'index.html'), 'utf8')).toBe(
      await readFile(path.join(expectedDirectory, 'index.html'), 'utf8'),
    );
  });

  it('reads and validates a generated manifest', async () => {
    const outputDirectory = path.join(await createTemporaryDirectory(), 'project');
    await generateProject({
      config: await readConfig(),
      recipe: foundationRecipe,
      outputDirectory,
    });

    const manifest = await readGeneratedProject(outputDirectory);
    expect(manifest.project.slug).toBe('foundation-fixture');
    expect(manifest.generated.files).toContain('syntax.project.json');
  });

  it('keeps Consumer Mode outside the Syntax production bundle definition', async () => {
    const buildScript = await readFile(path.join(root, 'scripts/build.mjs'), 'utf8');
    expect(buildScript).not.toContain('consumer/');
    expect(buildScript).not.toContain('syntax.project.json');
  });
});
