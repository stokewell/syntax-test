import { access, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getSetupRecipe } from '../recipes/setup.mjs';
import { createProjectFileSet } from './generator.mjs';
import { assertNoTemplateResidue, scanTemplateResidue } from './residue.mjs';

const TEMPLATE_REPLACEABLE_PATHS = new Set([
  '.github/workflows/ci.yml',
  'README.md',
  'index.html',
  'package.json',
  'playwright.config.js',
  'site.webmanifest',
]);

export class ConsumerSetupError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConsumerSetupError';
  }
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readTemplateIdentity(root) {
  try {
    const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    return packageJson.name === 'syntax-typography-starter';
  } catch {
    return false;
  }
}

function publicFileObject(files) {
  const publicFiles = {};
  for (const relativePath of ['index.html', 'site.webmanifest', 'package.json']) {
    if (files.has(relativePath)) publicFiles[relativePath] = files.get(relativePath);
  }
  return publicFiles;
}

export function formatSetupSummary(plan) {
  const lines = [
    `Project: ${plan.fileSet.config.project.name}`,
    `Recipe: ${plan.fileSet.config.recipe.id} v${plan.fileSet.config.recipe.version}`,
    `Direction: ${plan.fileSet.config.visualDirection}`,
    `Features: ${plan.fileSet.config.features.join(', ') || 'none'}`,
    `Deployment: ${plan.fileSet.config.deployment}`,
    `Output: ${plan.outputDirectory}`,
    `Files: ${plan.fileSet.files.size}`,
  ];

  if (plan.replacements.length > 0) {
    lines.push(`Template files to replace: ${plan.replacements.join(', ')}`);
  }
  if (plan.blockingCollisions.length > 0) {
    lines.push(`Blocking collisions: ${plan.blockingCollisions.join(', ')}`);
  }
  return lines.join('\n');
}

export async function createSetupPlan({ config, outputDirectory }) {
  if (typeof outputDirectory !== 'string' || outputDirectory.trim() === '') {
    throw new ConsumerSetupError('outputDirectory must be a non-empty path.');
  }

  const root = path.resolve(outputDirectory);
  const fileSet = await createProjectFileSet({
    config,
    recipe: getSetupRecipe(config.recipe.id),
  });
  assertNoTemplateResidue(publicFileObject(fileSet.files));

  if (await exists(path.join(root, 'syntax.project.json'))) {
    throw new ConsumerSetupError(
      'This project is already configured. Consumer Mode v1 will not overwrite an existing syntax.project.json.',
    );
  }

  let rootHasEntries = false;
  try {
    rootHasEntries = (await stat(root)).isDirectory();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const isSyntaxTemplate = rootHasEntries ? await readTemplateIdentity(root) : false;
  const replacements = [];
  const blockingCollisions = [];

  for (const relativePath of fileSet.files.keys()) {
    if (!(await exists(path.join(root, relativePath)))) continue;
    if (isSyntaxTemplate && TEMPLATE_REPLACEABLE_PATHS.has(relativePath)) {
      replacements.push(relativePath);
    } else {
      blockingCollisions.push(relativePath);
    }
  }

  replacements.sort();
  blockingCollisions.sort();
  return Object.freeze({
    outputDirectory: root,
    fileSet,
    isSyntaxTemplate,
    replacements: Object.freeze(replacements),
    blockingCollisions: Object.freeze(blockingCollisions),
  });
}

export async function applySetupPlan(plan) {
  if (plan.blockingCollisions.length > 0) {
    throw new ConsumerSetupError(
      `Refusing to overwrite project-owned files: ${plan.blockingCollisions.join(', ')}`,
    );
  }

  const backups = new Map();
  const created = [];

  try {
    for (const [relativePath, content] of plan.fileSet.files) {
      const destination = path.join(plan.outputDirectory, relativePath);
      await mkdir(path.dirname(destination), { recursive: true });

      if (await exists(destination)) backups.set(destination, await readFile(destination, 'utf8'));
      else created.push(destination);

      await writeFile(destination, content, 'utf8');
    }

    const findings = await scanTemplateResidue(plan.outputDirectory);
    if (findings.length > 0) {
      const details = findings.map(({ file, rule }) => `${file}: ${rule}`).join(', ');
      throw new ConsumerSetupError(`Setup completed with template residue: ${details}`);
    }
  } catch (error) {
    await Promise.all(created.map((filePath) => rm(filePath, { force: true })));
    await Promise.all(
      [...backups.entries()].map(async ([filePath, content]) =>
        writeFile(filePath, content, 'utf8'),
      ),
    );
    throw error instanceof ConsumerSetupError
      ? error
      : new ConsumerSetupError(`Unable to apply setup transaction: ${error.message}`);
  }

  return {
    outputDirectory: plan.outputDirectory,
    manifest: plan.fileSet.manifest,
    files: [...plan.fileSet.files.keys()],
    replaced: [...plan.replacements],
  };
}
