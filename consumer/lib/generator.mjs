import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { format as formatWithPrettier } from 'prettier';

import { CONSUMER_GENERATOR_VERSION } from './constants.mjs';
import { assertSafeRelativePath, resolveInside } from './path-safety.mjs';
import { validateAndNormalizeConfig } from './validation.mjs';

const PRETTIER_PARSERS = Object.freeze({
  '.css': 'css',
  '.html': 'html',
  '.js': 'babel',
  '.json': 'json',
  '.md': 'markdown',
  '.mjs': 'babel',
  '.svg': 'html',
});
const PRETTIER_OPTIONS = Object.freeze({
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  proseWrap: 'preserve',
});

export class ConsumerGenerationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConsumerGenerationError';
  }
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;

  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(',')}}`;
}

function comparePaths(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function withTrailingNewline(value) {
  return `${String(value).replace(/\r\n?/g, '\n').replace(/\n*$/, '')}\n`;
}

async function formatGeneratedContent(relativePath, content) {
  const parser = PRETTIER_PARSERS[path.posix.extname(relativePath)];
  if (!parser) return withTrailingNewline(content);

  try {
    return await formatWithPrettier(content, {
      ...PRETTIER_OPTIONS,
      parser,
      filepath: relativePath,
    });
  } catch (error) {
    throw new ConsumerGenerationError(
      `Unable to format generated file ${relativePath}: ${error.message}`,
    );
  }
}

function assertUniqueStrings(value, path) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ConsumerGenerationError(`${path} must be a non-empty array.`);
  }
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new ConsumerGenerationError(`${path} must contain non-empty strings.`);
    }
    if (seen.has(item)) throw new ConsumerGenerationError(`${path} contains a duplicate: ${item}.`);
    seen.add(item);
  }
  return seen;
}

async function resolveRecipeDefinitions(recipe, config) {
  if (recipe === null || typeof recipe !== 'object' || Array.isArray(recipe)) {
    throw new ConsumerGenerationError('Recipe definition must be an object.');
  }
  if (recipe.id !== config.recipe.id || recipe.version !== config.recipe.version) {
    throw new ConsumerGenerationError(
      `Recipe definition ${String(recipe.id)}@${String(recipe.version)} does not match configuration ${config.recipe.id}@${config.recipe.version}.`,
    );
  }
  if (typeof recipe.label !== 'string' || recipe.label.trim() === '') {
    throw new ConsumerGenerationError('Recipe definition must include a label.');
  }
  if (typeof recipe.description !== 'string' || recipe.description.trim() === '') {
    throw new ConsumerGenerationError('Recipe definition must include a description.');
  }

  const visualDirections = assertUniqueStrings(
    recipe.visualDirections,
    `Recipe ${recipe.id}.visualDirections`,
  );
  if (!visualDirections.has(config.visualDirection)) {
    throw new ConsumerGenerationError(
      `Recipe ${recipe.id} does not support the ${config.visualDirection} visual direction.`,
    );
  }

  const compatibleFeatures = assertUniqueStrings(
    recipe.compatibleFeatures,
    `Recipe ${recipe.id}.compatibleFeatures`,
  );
  const incompatible = config.features.filter((feature) => !compatibleFeatures.has(feature));
  if (incompatible.length > 0) {
    throw new ConsumerGenerationError(
      `Recipe ${recipe.id} does not support selected features: ${incompatible.join(', ')}.`,
    );
  }

  if (recipe.validateConfig !== undefined) {
    if (typeof recipe.validateConfig !== 'function') {
      throw new ConsumerGenerationError(`Recipe ${recipe.id}.validateConfig must be a function.`);
    }
    try {
      await recipe.validateConfig({ config });
    } catch (error) {
      throw new ConsumerGenerationError(`Invalid ${recipe.id} recipe data: ${error.message}`);
    }
  }

  const hasFiles = Array.isArray(recipe.files);
  const hasFactory = typeof recipe.createFiles === 'function';
  if (hasFiles === hasFactory) {
    throw new ConsumerGenerationError(
      `Recipe ${recipe.id} must define exactly one of files or createFiles.`,
    );
  }

  const definitions = hasFactory ? await recipe.createFiles({ config }) : recipe.files;
  if (!Array.isArray(definitions) || definitions.length === 0) {
    throw new ConsumerGenerationError(`Recipe ${recipe.id} must produce at least one file.`);
  }
  return definitions;
}

async function renderRecipeFiles(recipe, config) {
  const definitions = await resolveRecipeDefinitions(recipe, config);
  const files = new Map();

  for (const [index, definition] of definitions.entries()) {
    if (definition === null || typeof definition !== 'object' || Array.isArray(definition)) {
      throw new ConsumerGenerationError(`Recipe file ${index} must be an object.`);
    }

    if (definition.when !== undefined) {
      if (typeof definition.when !== 'function') {
        throw new ConsumerGenerationError(`Recipe file ${index}.when must be a function.`);
      }
      if (!(await definition.when({ config }))) continue;
    }

    const relativePath = assertSafeRelativePath(definition.path);
    if (relativePath === 'syntax.project.json') {
      throw new ConsumerGenerationError('Recipes may not define syntax.project.json.');
    }
    if (files.has(relativePath)) {
      throw new ConsumerGenerationError(`Recipe contains a duplicate file path: ${relativePath}`);
    }

    const hasContent = typeof definition.content === 'string';
    const hasRenderer = typeof definition.render === 'function';
    if (hasContent === hasRenderer) {
      throw new ConsumerGenerationError(
        `Recipe file ${relativePath} must define exactly one of content or render.`,
      );
    }

    const rendered = hasRenderer ? await definition.render({ config }) : definition.content;
    if (typeof rendered !== 'string') {
      throw new ConsumerGenerationError(`Recipe file ${relativePath} did not render a string.`);
    }
    files.set(relativePath, await formatGeneratedContent(relativePath, rendered));
  }

  return files;
}

function createConfigurationHash(config) {
  return createHash('sha256').update(stableStringify(config)).digest('hex');
}

export async function createProjectFileSet({ config: inputConfig, recipe }) {
  const config = validateAndNormalizeConfig(inputConfig);
  const configWithoutGenerated = { ...config };
  delete configWithoutGenerated.generated;

  const files = await renderRecipeFiles(recipe, configWithoutGenerated);
  const generatedPaths = [...files.keys(), 'syntax.project.json'].sort(comparePaths);
  const manifest = {
    ...configWithoutGenerated,
    generated: {
      generatorVersion: CONSUMER_GENERATOR_VERSION,
      configurationHash: createConfigurationHash(configWithoutGenerated),
      files: generatedPaths,
    },
  };
  files.set(
    'syntax.project.json',
    await formatGeneratedContent('syntax.project.json', JSON.stringify(manifest)),
  );

  return {
    config: configWithoutGenerated,
    manifest,
    files: new Map([...files.entries()].sort(([left], [right]) => comparePaths(left, right))),
  };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function generateProject({
  config,
  recipe,
  outputDirectory,
  unsafeAllowOverwriteForTests = false,
}) {
  if (typeof outputDirectory !== 'string' || outputDirectory.trim() === '') {
    throw new ConsumerGenerationError('outputDirectory must be a non-empty path.');
  }
  if (unsafeAllowOverwriteForTests && process.env.VITEST !== 'true') {
    throw new ConsumerGenerationError(
      'unsafeAllowOverwriteForTests is only available while running the Vitest suite.',
    );
  }

  const fileSet = await createProjectFileSet({ config, recipe });
  const root = path.resolve(outputDirectory);
  const destinations = [...fileSet.files.keys()].map((relativePath) => ({
    relativePath,
    absolutePath: resolveInside(root, relativePath),
  }));

  if (!unsafeAllowOverwriteForTests) {
    const collisions = [];
    for (const destination of destinations) {
      if (await fileExists(destination.absolutePath)) collisions.push(destination.relativePath);
    }
    if (collisions.length > 0) {
      throw new ConsumerGenerationError(
        `Refusing to overwrite project-owned files: ${collisions.sort(comparePaths).join(', ')}`,
      );
    }
  }

  const writtenFiles = [];
  try {
    for (const destination of destinations) {
      await mkdir(path.dirname(destination.absolutePath), { recursive: true });
      await writeFile(
        destination.absolutePath,
        fileSet.files.get(destination.relativePath),
        'utf8',
      );
      writtenFiles.push(destination.absolutePath);
    }
  } catch (error) {
    if (!unsafeAllowOverwriteForTests) {
      await Promise.all(writtenFiles.map((filePath) => rm(filePath, { force: true })));
    }
    throw new ConsumerGenerationError(`Unable to generate project: ${error.message}`);
  }

  return {
    outputDirectory: root,
    manifest: fileSet.manifest,
    files: destinations.map(({ relativePath }) => relativePath),
  };
}

export async function readGeneratedProject(outputDirectory) {
  const manifestPath = resolveInside(outputDirectory, 'syntax.project.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  return validateAndNormalizeConfig(manifest);
}
