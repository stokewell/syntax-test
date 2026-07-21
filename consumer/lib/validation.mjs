import {
  CONSUMER_SCHEMA_VERSION,
  DEPLOYMENT_IDS,
  FEATURE_IDS,
  PROJECT_MODES,
  RECIPE_IDS,
  SCHEMA_URL,
  SYNTAX_VERSION,
  VISUAL_DIRECTIONS,
} from './constants.mjs';

const TOP_LEVEL_KEYS = new Set([
  '$schema',
  'schemaVersion',
  'syntaxVersion',
  'project',
  'recipe',
  'visualDirection',
  'accentColor',
  'features',
  'mode',
  'deployment',
  'generated',
]);
const PROJECT_KEYS = new Set([
  'name',
  'slug',
  'description',
  'author',
  'canonicalUrl',
  'repositoryUrl',
  'primaryAction',
  'secondaryAction',
]);
const ACTION_KEYS = new Set(['label', 'destination']);
const RECIPE_KEYS = new Set(['id', 'version', 'data']);
const GENERATED_KEYS = new Set(['generatorVersion', 'configurationHash', 'files']);
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export class ConsumerConfigError extends Error {
  constructor(issues) {
    super(`Invalid Syntax Consumer Mode configuration:\n- ${issues.join('\n- ')}`);
    this.name = 'ConsumerConfigError';
    this.issues = issues;
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function rejectUnknownKeys(value, allowedKeys, path, issues) {
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) issues.push(`${path}.${key} is not supported.`);
  }
}

function requireNonEmptyString(value, path, issues, maximumLength = 240) {
  if (typeof value !== 'string' || value.trim() === '') {
    issues.push(`${path} must be a non-empty string.`);
    return '';
  }

  const normalized = value.trim();
  if (normalized.length > maximumLength) {
    issues.push(`${path} must be ${maximumLength} characters or fewer.`);
  }
  return normalized;
}

function normalizeNullableHttpUrl(value, path, issues) {
  if (value === null) return null;
  if (value === undefined || value === '') {
    issues.push(`${path} must be an http(s) URL or explicit null.`);
    return null;
  }
  if (typeof value !== 'string') {
    issues.push(`${path} must be an http(s) URL or null.`);
    return null;
  }

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
    return parsed.href;
  } catch {
    issues.push(`${path} must be a valid http(s) URL or null.`);
    return null;
  }
}

function normalizeDestination(value, path, issues) {
  const normalized = requireNonEmptyString(value, path, issues, 2048);
  if (!normalized) return '';
  if (/^[\u0000-\u001f\u007f]/.test(normalized) || /\s/.test(normalized)) {
    issues.push(`${path} may not contain whitespace or control characters.`);
    return normalized;
  }
  if (/^javascript:/i.test(normalized)) {
    issues.push(`${path} may not use the javascript: protocol.`);
    return normalized;
  }
  if (/^(#|\/|\.\/|\.\.\/)/.test(normalized)) return normalized;

  try {
    const parsed = new URL(normalized);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      throw new Error('Unsupported protocol');
    }
  } catch {
    issues.push(`${path} must be a valid URL, path, or fragment destination.`);
  }
  return normalized;
}

function normalizeAction(value, path, issues, required) {
  if (value === null) {
    if (required) issues.push(`${path} is required and may not be null.`);
    return null;
  }
  if (value === undefined) {
    issues.push(`${path} must be supplied${required ? '' : ' as an action or explicit null'}.`);
    return null;
  }
  if (!isPlainObject(value)) {
    issues.push(`${path} must be an object.`);
    return null;
  }

  rejectUnknownKeys(value, ACTION_KEYS, path, issues);
  return {
    label: requireNonEmptyString(value.label, `${path}.label`, issues, 80),
    destination: normalizeDestination(value.destination, `${path}.destination`, issues),
  };
}

function normalizeJsonValue(value, path, issues, depth = 0) {
  if (depth > 10) {
    issues.push(`${path} exceeds the maximum nesting depth of 10.`);
    return null;
  }
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.length > 20_000) issues.push(`${path} must be 20000 characters or fewer.`);
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) issues.push(`${path} must be a finite number.`);
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) issues.push(`${path} may contain at most 100 entries.`);
    return value.map((entry, index) =>
      normalizeJsonValue(entry, `${path}[${index}]`, issues, depth + 1),
    );
  }
  if (!isPlainObject(value)) {
    issues.push(`${path} must contain JSON-compatible values only.`);
    return null;
  }

  const keys = Object.keys(value).sort();
  if (keys.length > 100) issues.push(`${path} may contain at most 100 properties.`);
  const normalized = {};
  for (const key of keys) {
    if (UNSAFE_OBJECT_KEYS.has(key)) {
      issues.push(`${path}.${key} is not allowed.`);
      continue;
    }
    normalized[key] = normalizeJsonValue(value[key], `${path}.${key}`, issues, depth + 1);
  }
  return normalized;
}

function isSafeManifestPath(value) {
  return (
    typeof value === 'string' &&
    value.trim() !== '' &&
    !value.includes('\\') &&
    !value.startsWith('/') &&
    !value.split('/').includes('..')
  );
}

function normalizeGenerated(value, issues) {
  if (value === undefined) return undefined;
  if (!isPlainObject(value)) {
    issues.push('generated must be an object when supplied.');
    return undefined;
  }

  rejectUnknownKeys(value, GENERATED_KEYS, 'generated', issues);
  const generatorVersion = requireNonEmptyString(
    value.generatorVersion,
    'generated.generatorVersion',
    issues,
    40,
  );
  const configurationHash = requireNonEmptyString(
    value.configurationHash,
    'generated.configurationHash',
    issues,
    128,
  );
  if (configurationHash && !/^[0-9a-f]{64}$/.test(configurationHash)) {
    issues.push('generated.configurationHash must be a lowercase SHA-256 digest.');
  }

  const files = [];
  const seenFiles = new Set();
  if (!Array.isArray(value.files)) {
    issues.push('generated.files must be an array.');
  } else {
    value.files.forEach((file, index) => {
      const normalized = requireNonEmptyString(file, `generated.files[${index}]`, issues, 500);
      if (normalized && !isSafeManifestPath(normalized)) {
        issues.push(`generated.files[${index}] must be a safe relative path.`);
      }
      if (seenFiles.has(normalized)) {
        issues.push(`generated.files may not contain duplicates: ${normalized}.`);
      }
      seenFiles.add(normalized);
      files.push(normalized);
    });
  }

  return {
    generatorVersion,
    configurationHash,
    files: files.sort(),
  };
}

export function validateAndNormalizeConfig(value) {
  const issues = [];
  if (!isPlainObject(value)) throw new ConsumerConfigError(['Configuration must be an object.']);
  rejectUnknownKeys(value, TOP_LEVEL_KEYS, 'configuration', issues);

  if (value.$schema !== undefined && value.$schema !== SCHEMA_URL) {
    issues.push(`$schema must be ${SCHEMA_URL}.`);
  }
  if (value.schemaVersion !== CONSUMER_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${CONSUMER_SCHEMA_VERSION}.`);
  }
  if (value.syntaxVersion !== SYNTAX_VERSION) {
    issues.push(`syntaxVersion must be ${SYNTAX_VERSION}.`);
  }

  const project = isPlainObject(value.project) ? value.project : {};
  if (!isPlainObject(value.project)) issues.push('project must be an object.');
  rejectUnknownKeys(project, PROJECT_KEYS, 'project', issues);

  const name = requireNonEmptyString(project.name, 'project.name', issues, 120);
  const slug = requireNonEmptyString(project.slug, 'project.slug', issues, 100);
  const description = requireNonEmptyString(
    project.description,
    'project.description',
    issues,
    320,
  );
  const author = requireNonEmptyString(project.author, 'project.author', issues, 120);
  const canonicalUrl = normalizeNullableHttpUrl(
    project.canonicalUrl,
    'project.canonicalUrl',
    issues,
  );
  const repositoryUrl = normalizeNullableHttpUrl(
    project.repositoryUrl,
    'project.repositoryUrl',
    issues,
  );
  const primaryAction = normalizeAction(
    project.primaryAction,
    'project.primaryAction',
    issues,
    true,
  );
  const secondaryAction = normalizeAction(
    project.secondaryAction,
    'project.secondaryAction',
    issues,
    false,
  );
  if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    issues.push('project.slug must use lowercase letters, numbers, and single hyphens.');
  }

  const recipe = isPlainObject(value.recipe) ? value.recipe : {};
  if (!isPlainObject(value.recipe)) issues.push('recipe must be an object.');
  rejectUnknownKeys(recipe, RECIPE_KEYS, 'recipe', issues);
  if (!RECIPE_IDS.includes(recipe.id)) {
    issues.push(`recipe.id must be one of: ${RECIPE_IDS.join(', ')}.`);
  }
  if (!Number.isInteger(recipe.version) || recipe.version < 1) {
    issues.push('recipe.version must be a positive integer.');
  }
  const recipeData =
    recipe.data === undefined ? undefined : normalizeJsonValue(recipe.data, 'recipe.data', issues);

  if (!VISUAL_DIRECTIONS.includes(value.visualDirection)) {
    issues.push(`visualDirection must be one of: ${VISUAL_DIRECTIONS.join(', ')}.`);
  }
  if (typeof value.accentColor !== 'string' || !/^#[0-9a-f]{6}$/i.test(value.accentColor)) {
    issues.push('accentColor must be a six-digit hexadecimal color such as #067474.');
  }
  if (!Array.isArray(value.features)) issues.push('features must be an array.');
  const incomingFeatures = Array.isArray(value.features) ? value.features : [];
  const seenFeatures = new Set();
  for (const feature of incomingFeatures) {
    if (!FEATURE_IDS.includes(feature)) issues.push(`Unsupported feature: ${String(feature)}.`);
    if (seenFeatures.has(feature)) issues.push(`features may not contain duplicates: ${feature}.`);
    seenFeatures.add(feature);
  }
  if (!PROJECT_MODES.includes(value.mode)) {
    issues.push(`mode must be one of: ${PROJECT_MODES.join(', ')}.`);
  }
  if (!DEPLOYMENT_IDS.includes(value.deployment)) {
    issues.push(`deployment must be one of: ${DEPLOYMENT_IDS.join(', ')}.`);
  }

  const generated = normalizeGenerated(value.generated, issues);
  if (issues.length > 0) throw new ConsumerConfigError(issues);

  const normalizedRecipe = { id: recipe.id, version: recipe.version };
  if (recipeData && Object.keys(recipeData).length > 0) normalizedRecipe.data = recipeData;

  const normalized = {
    $schema: SCHEMA_URL,
    schemaVersion: CONSUMER_SCHEMA_VERSION,
    syntaxVersion: SYNTAX_VERSION,
    project: {
      name,
      slug,
      description,
      author,
      canonicalUrl,
      repositoryUrl,
      primaryAction,
      secondaryAction,
    },
    recipe: normalizedRecipe,
    visualDirection: value.visualDirection,
    accentColor: value.accentColor.toUpperCase(),
    features: FEATURE_IDS.filter((feature) => seenFeatures.has(feature)),
    mode: value.mode,
    deployment: value.deployment,
  };

  if (generated) normalized.generated = generated;
  return normalized;
}
