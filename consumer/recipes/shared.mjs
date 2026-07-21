import { createSyntaxCssBundle } from '../../scripts/lib/syntax-bundle.mjs';

export class RecipeDataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RecipeDataError';
  }
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function assertPlainObject(value, path = 'recipe.data') {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new RecipeDataError(`${path} must be an object.`);
  }
  return value;
}

export function assertAllowedKeys(value, allowedKeys, path = 'recipe.data') {
  assertPlainObject(value, path);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) throw new RecipeDataError(`${path}.${key} is not supported.`);
  }
}

export function readString(value, path, { fallback, maximumLength = 400, required = false } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required && fallback === undefined) throw new RecipeDataError(`${path} is required.`);
    return fallback ?? '';
  }
  if (typeof value !== 'string') throw new RecipeDataError(`${path} must be a string.`);

  const normalized = value.trim();
  if (required && normalized === '') throw new RecipeDataError(`${path} may not be empty.`);
  if (normalized.length > maximumLength) {
    throw new RecipeDataError(`${path} must be ${maximumLength} characters or fewer.`);
  }
  return normalized;
}

export function readBoolean(value, path, fallback = false) {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean') throw new RecipeDataError(`${path} must be true or false.`);
  return value;
}

export function validateDestination(value, path) {
  const destination = readString(value, path, { required: true, maximumLength: 2048 });
  if (/\s/.test(destination) || /^javascript:/i.test(destination)) {
    throw new RecipeDataError(`${path} must be a safe URL, path, or fragment.`);
  }
  if (/^(#|\/|\.\/|\.\.\/)/.test(destination)) return destination;

  try {
    const parsed = new URL(destination);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
      throw new Error('Unsupported protocol');
    }
  } catch {
    throw new RecipeDataError(`${path} must be a safe URL, path, or fragment.`);
  }
  return destination;
}

export function renderHead({ config, title = config.project.name }) {
  const canonical = config.project.canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(config.project.canonicalUrl)}" />`
    : '';
  const repository = config.project.repositoryUrl
    ? `<meta name="source" content="${escapeHtml(config.project.repositoryUrl)}" />`
    : '';

  return `<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(config.project.description)}" />
<meta name="author" content="${escapeHtml(config.project.author)}" />
<meta name="theme-color" content="${escapeHtml(config.accentColor)}" />
${canonical}
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(config.project.description)}" />
${config.project.canonicalUrl ? `<meta property="og:url" content="${escapeHtml(config.project.canonicalUrl)}" />` : ''}
<meta name="twitter:card" content="summary" />
${repository}
<link rel="manifest" href="./site.webmanifest" />
<link rel="stylesheet" href="./syntax.css" />
<link rel="stylesheet" href="./site.css" />`;
}

export function hasFeature(config, feature) {
  return config.features.includes(feature);
}

export function renderThemeBootstrap(config) {
  if (!hasFeature(config, 'theme')) return '';

  return `<script>
  (() => {
    try {
      const preference = localStorage.getItem('syntax-theme-preference') || 'system';
      const resolved =
        preference === 'system'
          ? matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : preference;
      document.documentElement.dataset.themePreference = preference;
      document.documentElement.dataset.theme = resolved;
    } catch {
      document.documentElement.dataset.theme = 'light';
    }
  })();
</script>`;
}

export function renderThemeButton(config) {
  if (!hasFeature(config, 'theme')) return '';

  return `<button
  class="theme-toggle"
  id="theme-toggle"
  type="button"
  aria-label="Theme preference: system"
>
  <span aria-hidden="true">◐</span>
</button>`;
}

export function renderThemeScript() {
  return `(() => {
  'use strict';

  const button = document.getElementById('theme-toggle');
  if (!button) return;

  const preferences = ['system', 'light', 'dark'];
  const media = matchMedia('(prefers-color-scheme: dark)');

  function resolveTheme(preference) {
    return preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
  }

  function applyTheme(preference) {
    const normalized = preferences.includes(preference) ? preference : 'system';
    document.documentElement.dataset.themePreference = normalized;
    document.documentElement.dataset.theme = resolveTheme(normalized);
    button.setAttribute('aria-label', 'Theme preference: ' + normalized);
    localStorage.setItem('syntax-theme-preference', normalized);
  }

  button.addEventListener('click', () => {
    const current = document.documentElement.dataset.themePreference || 'system';
    const next = preferences[(preferences.indexOf(current) + 1) % preferences.length];
    applyTheme(next);
  });

  media.addEventListener('change', () => {
    if (document.documentElement.dataset.themePreference === 'system') applyTheme('system');
  });

  applyTheme(document.documentElement.dataset.themePreference || 'system');
})();`;
}

export function renderActions(config) {
  const primary = `<a class="btn" href="${escapeHtml(config.project.primaryAction.destination)}">${escapeHtml(config.project.primaryAction.label)}</a>`;
  const secondary = config.project.secondaryAction
    ? `<a class="btn-outline" href="${escapeHtml(config.project.secondaryAction.destination)}">${escapeHtml(config.project.secondaryAction.label)}</a>`
    : '';
  return `${primary}${secondary}`;
}

export function renderManifest(config) {
  return JSON.stringify({
    name: config.project.name,
    short_name: config.project.name.slice(0, 30),
    description: config.project.description,
    start_url: './',
    display: 'standalone',
    background_color: '#FBFAF8',
    theme_color: config.accentColor,
    icons: [],
  });
}

export function renderProjectBrief(config, sections = '') {
  return `# ${config.project.name}

## Concept

${config.project.description}

## Project identity

- Author: ${config.project.author}
- Canonical URL: ${config.project.canonicalUrl || 'not yet set'}
- Repository: ${config.project.repositoryUrl || 'not yet set'}
- Recipe: ${config.recipe.id} v${config.recipe.version}
- Visual direction: ${config.visualDirection}
- Mode: ${config.mode}
- Deployment: ${config.deployment}
- Features: ${config.features.join(', ') || 'none'}

## Primary action

${config.project.primaryAction.label}: ${config.project.primaryAction.destination}

${sections}
## Non-goals

- Do not add framework code merely to create project-specific visual identity.
- Do not replace semantic content with a client-side renderer unless the project genuinely needs one.
`;
}

export function renderReadme(config, recipeSummary, structure) {
  return `# ${config.project.name}

${config.project.description}

This project was generated from the Syntax **${config.recipe.id}** recipe using the **${config.visualDirection}** visual direction.

## Development

Open \`index.html\` through a local web server. In a Syntax template repository:

\`\`\`bash
npm install
npm run serve
\`\`\`

Then visit \`http://127.0.0.1:4173/\`.

## Recipe

${recipeSummary}

## Project-owned files

${structure}

Generated files are project-owned immediately. Consumer Mode will not silently overwrite later edits.
`;
}

export function createCommonFiles({ config, recipeSummary, structure, briefSections = '' }) {
  const files = [
    {
      path: 'syntax.css',
      render: () => createSyntaxCssBundle(),
    },
    {
      path: 'site.webmanifest',
      render: () => renderManifest(config),
    },
    {
      path: 'README.md',
      render: () => renderReadme(config, recipeSummary, structure),
    },
    {
      path: 'PROJECT_BRIEF.md',
      render: () => renderProjectBrief(config, briefSections),
    },
  ];

  if (hasFeature(config, 'theme')) {
    files.push({ path: 'site.js', content: renderThemeScript() });
  }

  return files;
}
