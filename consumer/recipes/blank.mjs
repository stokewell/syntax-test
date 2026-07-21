import { renderDirectionVariables } from '../directions/index.mjs';
import {
  assertAllowedKeys,
  createCommonFiles,
  escapeHtml,
  hasFeature,
  readString,
  renderActions,
  renderHead,
  renderThemeBootstrap,
  renderThemeButton,
} from './shared.mjs';

const ALLOWED_DATA_KEYS = Object.freeze(['eyebrow', 'note', 'footerNote']);

function readBlankData(config) {
  const data = config.recipe.data ?? {};
  assertAllowedKeys(data, ALLOWED_DATA_KEYS);

  return Object.freeze({
    eyebrow: readString(data.eyebrow, 'recipe.data.eyebrow', {
      fallback: 'Independent project',
      maximumLength: 80,
    }),
    note: readString(data.note, 'recipe.data.note', {
      fallback: 'A focused starting point with room for the idea to become itself.',
      maximumLength: 240,
    }),
    footerNote: readString(data.footerNote, 'recipe.data.footerNote', {
      fallback: `Made by ${config.project.author}`,
      maximumLength: 120,
    }),
  });
}

function renderIndex(config) {
  const data = readBlankData(config);
  const themeScript = hasFeature(config, 'theme') ? '<script src="./site.js" defer></script>' : '';
  const repositoryLink = config.project.repositoryUrl
    ? `<a href="${escapeHtml(config.project.repositoryUrl)}">Source</a>`
    : '';

  return `<!doctype html>
<html lang="en" data-direction="${escapeHtml(config.visualDirection)}">
  <head>
    ${renderHead({ config })}
    ${renderThemeBootstrap(config)}
  </head>
  <body>
    <a class="skip-to-content" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="container site-header__inner">
        <a class="site-name" href="#top">${escapeHtml(config.project.name)}</a>
        <nav class="site-nav" aria-label="Primary navigation">
          ${repositoryLink}
          ${renderThemeButton(config)}
        </nav>
      </div>
    </header>

    <main id="main-content" tabindex="-1">
      <section class="blank-hero" aria-labelledby="page-title">
        <div class="container blank-hero__inner">
          <p class="eyebrow">${escapeHtml(data.eyebrow)}</p>
          <h1 id="page-title">${escapeHtml(config.project.name)}</h1>
          <p class="blank-hero__description">${escapeHtml(config.project.description)}</p>
          <div class="blank-hero__actions">${renderActions(config)}</div>
          <p class="blank-hero__note">${escapeHtml(data.note)}</p>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container site-footer__inner">
        <p>${escapeHtml(data.footerNote)}</p>
        <p>${escapeHtml(config.visualDirection)} direction</p>
      </div>
    </footer>
    ${themeScript}
  </body>
</html>`;
}

function renderSiteCss(config) {
  return `${renderDirectionVariables(config)}

html {
  scroll-behavior: smooth;
}

body {
  min-width: 20rem;
  font-family: var(--consumer-font-body);
}

.container {
  max-width: var(--consumer-max-width);
}

.site-header {
  border-bottom: 1px solid var(--color-border);
  background: rgba(var(--color-bg-rgb), 0.92);
  backdrop-filter: blur(1rem);
}

.site-header__inner,
.site-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 4.25rem;
  gap: var(--space-3);
}

.site-name {
  color: var(--color-text);
  font-family: var(--consumer-font-heading);
  font-size: 1.15rem;
  font-weight: 700;
  text-decoration: none;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.site-nav a {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
}

.site-nav a:hover,
.site-nav a:focus-visible {
  color: var(--color-primary);
}

.theme-toggle {
  display: inline-grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-round);
  background: var(--color-surface-raised);
  color: var(--color-text);
}

.blank-hero {
  display: grid;
  min-height: calc(100svh - 8.5rem);
  align-items: center;
  padding-block: var(--consumer-section-space);
}

.blank-hero__inner {
  text-align: var(--consumer-hero-align);
}

.eyebrow {
  margin: 0 0 var(--space-3);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: var(--consumer-label-tracking);
  text-transform: var(--consumer-label-transform);
}

.blank-hero h1 {
  max-width: 12ch;
  margin: 0;
  font-family: var(--consumer-font-heading);
  font-size: var(--consumer-display-size);
  line-height: 0.95;
  letter-spacing: var(--consumer-heading-tracking);
  text-wrap: balance;
}

[data-direction='product'] .blank-hero h1,
[data-direction='product'] .blank-hero__description,
[data-direction='product'] .blank-hero__note {
  margin-inline: auto;
}

.blank-hero__description {
  max-width: 42rem;
  margin-top: var(--space-4);
  color: var(--color-text-secondary);
  font-size: clamp(1.15rem, 2.4vw, 1.5rem);
  line-height: 1.65;
}

.blank-hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: var(--consumer-hero-justify);
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.blank-hero__note {
  max-width: 34rem;
  margin-top: var(--space-6);
  padding-top: var(--space-3);
  border-top: 1px solid var(--consumer-card-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

[data-direction='product'] .blank-hero__inner {
  padding: clamp(2rem, 6vw, 5rem);
  border: 1px solid var(--color-border);
  border-radius: var(--consumer-card-radius);
  background:
    radial-gradient(circle at top right, rgba(var(--color-primary-rgb), 0.14), transparent 36%),
    var(--color-surface-raised);
  box-shadow: var(--consumer-card-shadow);
}

.site-footer {
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.site-footer p {
  margin: 0;
}

@media (max-width: 36rem) {
  .site-header__inner,
  .site-footer__inner {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    padding-block: var(--space-2);
  }

  .blank-hero__actions > * {
    width: 100%;
  }

  [data-direction='product'] .blank-hero__inner {
    padding-inline: var(--space-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}`;
}

export const blankRecipe = Object.freeze({
  id: 'blank',
  version: 1,
  label: 'Blank',
  description: 'A minimal semantic homepage with a hero, actions, and a small project-owned layer.',
  visualDirections: Object.freeze(['editorial', 'product']),
  compatibleFeatures: Object.freeze(['theme']),
  validateConfig: ({ config }) => readBlankData(config),
  createFiles: ({ config }) => [
    { path: 'index.html', render: () => renderIndex(config) },
    { path: 'site.css', render: () => renderSiteCss(config) },
    ...createCommonFiles({
      config,
      recipeSummary:
        'The Blank recipe provides a semantic shell and a deliberately small composition layer. Replace the hero and note before adding sections.',
      structure: `- \`index.html\`: semantic project content
- \`site.css\`: project-owned composition and visual direction
- \`syntax.css\`: generated Syntax framework bundle
- \`site.js\`: optional theme preference behavior when selected
- \`PROJECT_BRIEF.md\`: project intent and constraints`,
      briefSections: `## Starting content

- Eyebrow: ${readBlankData(config).eyebrow}
- Supporting note: ${readBlankData(config).note}

`,
    }),
  ],
});
