import { renderDirectionVariables } from '../directions/index.mjs';
import {
  RecipeDataError,
  assertAllowedKeys,
  assertPlainObject,
  createCommonFiles,
  escapeHtml,
  hasFeature,
  readString,
  renderActions,
  renderHead,
  renderThemeBootstrap,
  renderThemeButton,
} from './shared.mjs';

const DATA_KEYS = Object.freeze([
  'eyebrow',
  'headline',
  'proof',
  'featureTitle',
  'features',
  'stepsTitle',
  'steps',
  'closingTitle',
  'closingBody',
]);
const ITEM_KEYS = Object.freeze(['title', 'description']);

function readItems(value, path, { minimum = 2, maximum = 6 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new RecipeDataError(`${path} must contain between ${minimum} and ${maximum} items.`);
  }

  return value.map((item, index) => {
    const itemPath = `${path}[${index}]`;
    assertPlainObject(item, itemPath);
    assertAllowedKeys(item, ITEM_KEYS, itemPath);
    return Object.freeze({
      title: readString(item.title, `${itemPath}.title`, { required: true, maximumLength: 100 }),
      description: readString(item.description, `${itemPath}.description`, {
        required: true,
        maximumLength: 280,
      }),
    });
  });
}

function readProductData(config) {
  const data = config.recipe.data ?? {};
  assertAllowedKeys(data, DATA_KEYS);
  return Object.freeze({
    eyebrow: readString(data.eyebrow, 'recipe.data.eyebrow', {
      fallback: 'A focused product',
      maximumLength: 80,
    }),
    headline: readString(data.headline, 'recipe.data.headline', {
      fallback: config.project.description,
      maximumLength: 180,
    }),
    proof: readString(data.proof, 'recipe.data.proof', {
      fallback: 'Designed to make one useful promise clear, credible, and easy to try.',
      maximumLength: 320,
    }),
    featureTitle: readString(data.featureTitle, 'recipe.data.featureTitle', {
      fallback: 'What it does well',
      maximumLength: 120,
    }),
    features: readItems(data.features, 'recipe.data.features'),
    stepsTitle: readString(data.stepsTitle, 'recipe.data.stepsTitle', {
      fallback: 'How it works',
      maximumLength: 120,
    }),
    steps: readItems(data.steps, 'recipe.data.steps', { minimum: 2, maximum: 4 }),
    closingTitle: readString(data.closingTitle, 'recipe.data.closingTitle', {
      fallback: 'Start with the smallest useful version.',
      maximumLength: 160,
    }),
    closingBody: readString(data.closingBody, 'recipe.data.closingBody', {
      fallback: 'Use the product, learn from the response, and deepen only what earns its place.',
      maximumLength: 320,
    }),
  });
}

function renderItems(items, className) {
  return items
    .map(
      (item, index) => `<article class="${className}">
  <p class="item-number">${String(index + 1).padStart(2, '0')}</p>
  <h3>${escapeHtml(item.title)}</h3>
  <p>${escapeHtml(item.description)}</p>
</article>`,
    )
    .join('');
}

function renderIndex(config) {
  const data = readProductData(config);
  const sourceLink = config.project.repositoryUrl
    ? `<a href="${escapeHtml(config.project.repositoryUrl)}">Source</a>`
    : '';
  const themeScript = hasFeature(config, 'theme') ? '<script src="./site.js" defer></script>' : '';

  return `<!doctype html>
<html lang="en" data-direction="${escapeHtml(config.visualDirection)}">
  <head>
    ${renderHead({ config, title: `${config.project.name} — ${data.headline}` })}
    ${renderThemeBootstrap(config)}
  </head>
  <body id="top">
    <a class="skip-to-content" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="container site-header__inner">
        <a class="site-name" href="#top">${escapeHtml(config.project.name)}</a>
        <nav class="site-nav" aria-label="Primary navigation">
          <a href="#features">Features</a>
          <a href="#process">Process</a>
          ${sourceLink}
          ${renderThemeButton(config)}
        </nav>
      </div>
    </header>

    <main id="main-content" tabindex="-1">
      <section class="product-hero" aria-labelledby="page-title">
        <div class="container product-hero__inner">
          <p class="eyebrow">${escapeHtml(data.eyebrow)}</p>
          <h1 id="page-title">${escapeHtml(data.headline)}</h1>
          <p class="product-hero__proof">${escapeHtml(data.proof)}</p>
          <div class="product-hero__actions">${renderActions(config)}</div>
        </div>
      </section>

      <section class="product-section" id="features" aria-labelledby="features-title">
        <div class="container">
          <div class="section-heading">
            <p class="eyebrow">Core value</p>
            <h2 id="features-title">${escapeHtml(data.featureTitle)}</h2>
          </div>
          <div class="feature-grid">${renderItems(data.features, 'feature-card')}</div>
        </div>
      </section>

      <section class="product-section process-section" id="process" aria-labelledby="process-title">
        <div class="container process-layout">
          <div class="section-heading">
            <p class="eyebrow">Process</p>
            <h2 id="process-title">${escapeHtml(data.stepsTitle)}</h2>
          </div>
          <div class="step-list">${renderItems(data.steps, 'step-card')}</div>
        </div>
      </section>

      <section class="product-section closing-section" aria-labelledby="closing-title">
        <div class="container closing-section__inner">
          <h2 id="closing-title">${escapeHtml(data.closingTitle)}</h2>
          <p>${escapeHtml(data.closingBody)}</p>
          <div class="closing-actions">${renderActions(config)}</div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container site-footer__inner">
        <p>${escapeHtml(config.project.author)}</p>
        <p>${data.features.length} focused capabilities</p>
      </div>
    </footer>
    ${themeScript}
  </body>
</html>`;
}

function renderSiteCss(config) {
  return `${renderDirectionVariables(config)}

html { scroll-behavior: smooth; scroll-padding-top: 5rem; }
body { min-width: 20rem; overflow-x: hidden; font-family: var(--consumer-font-body); }
.container { max-width: var(--consumer-max-width); }
.site-header { position: sticky; top: 0; z-index: var(--z-nav); border-bottom: 1px solid var(--color-border); background: rgba(var(--color-bg-rgb), 0.92); backdrop-filter: blur(1rem); }
.site-header__inner, .site-footer__inner { display: flex; min-height: 4.5rem; align-items: center; justify-content: space-between; gap: var(--space-3); }
.site-name { color: var(--color-text); font-family: var(--consumer-font-heading); font-size: 1.2rem; font-weight: 700; text-decoration: none; }
.site-nav { display: flex; align-items: center; gap: clamp(0.75rem, 2vw, 1.5rem); font-size: var(--font-size-sm); font-weight: 600; }
.site-nav a { color: var(--color-text-secondary); text-decoration: none; }
.site-nav a:hover, .site-nav a:focus-visible { color: var(--color-primary); }
.theme-toggle { display: inline-grid; width: 2.5rem; height: 2.5rem; place-items: center; padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-round); background: var(--color-surface-raised); color: var(--color-text); }
.product-hero, .product-section { padding-block: var(--consumer-section-space); }
.product-hero__inner { max-width: 70rem; text-align: var(--consumer-hero-align); }
[data-direction='product'] .product-hero__inner, [data-direction='playful'] .product-hero__inner { margin-inline: auto; }
.eyebrow { margin: 0 0 var(--space-3); color: var(--color-primary); font-size: var(--font-size-xs); font-weight: 700; letter-spacing: var(--consumer-label-tracking); text-transform: var(--consumer-label-transform); }
.product-hero h1 { max-width: 13ch; margin: 0; font-family: var(--consumer-font-heading); font-size: var(--consumer-display-size); line-height: 0.95; letter-spacing: var(--consumer-heading-tracking); text-wrap: balance; }
[data-direction='product'] .product-hero h1, [data-direction='playful'] .product-hero h1 { margin-inline: auto; }
.product-hero__proof { max-width: 46rem; margin-top: var(--space-4); color: var(--color-text-secondary); font-size: clamp(1.15rem, 2.4vw, 1.5rem); line-height: 1.65; }
[data-direction='product'] .product-hero__proof, [data-direction='playful'] .product-hero__proof { margin-inline: auto; }
.product-hero__actions, .closing-actions { display: flex; flex-wrap: wrap; justify-content: var(--consumer-hero-justify); gap: var(--space-2); margin-top: var(--space-4); }
.product-section { border-top: 1px solid var(--color-border); }
.section-heading { max-width: 48rem; margin-bottom: var(--space-5); }
.section-heading h2, .closing-section h2 { margin: 0; font-family: var(--consumer-font-heading); font-size: clamp(2.25rem, 5vw, 4.5rem); line-height: 1; letter-spacing: var(--consumer-heading-tracking); text-wrap: balance; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--consumer-card-minimum)), 1fr)); gap: var(--space-3); }
.feature-card, .step-card { padding: var(--consumer-card-padding); border: 1px solid var(--consumer-card-border); border-radius: var(--consumer-card-radius); background: var(--consumer-card-background); box-shadow: var(--consumer-card-shadow); }
.feature-card h3, .step-card h3 { margin-block: var(--space-2); font-family: var(--consumer-font-heading); }
.feature-card p:last-child, .step-card p:last-child, .closing-section p { color: var(--color-text-secondary); }
.item-number { margin: 0; color: var(--color-primary); font-family: var(--font-mono); font-size: var(--font-size-xs); font-weight: 700; }
.process-layout { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(2rem, 8vw, 7rem); }
.step-list { display: grid; gap: var(--space-3); }
.closing-section__inner { display: grid; justify-items: center; text-align: center; }
.closing-section p { max-width: 42rem; margin-block: var(--space-4); }
.site-footer { border-top: 1px solid var(--color-border); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
.site-footer p { margin: 0; }
@media (max-width: 48rem) { .process-layout { grid-template-columns: 1fr; } .site-nav a:first-child, .site-nav a:nth-child(2) { display: none; } .site-footer__inner { align-items: flex-start; flex-direction: column; justify-content: center; padding-block: var(--space-3); } }
@media (max-width: 28rem) { .site-nav > a { display: none; } .product-hero__actions > *, .closing-actions > * { width: 100%; } }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }`;
}

export const productRecipe = Object.freeze({
  id: 'product',
  version: 1,
  label: 'Product',
  description:
    'A persuasive product page with a focused promise, feature proof, process, and closing action.',
  visualDirections: Object.freeze([
    'product',
    'technical',
    'playful',
    'minimal',
    'cinematic',
    'retro-interface',
  ]),
  compatibleFeatures: Object.freeze(['theme']),
  validateConfig: ({ config }) => readProductData(config),
  createFiles: ({ config }) => [
    { path: 'index.html', render: () => renderIndex(config) },
    { path: 'site.css', render: () => renderSiteCss(config) },
    ...createCommonFiles({
      config,
      recipeSummary:
        'The Product recipe provides a focused promise, capability proof, a short process, and a repeated primary action.',
      structure: `- \`index.html\`: semantic product content
- \`site.css\`: project-owned composition and visual direction
- \`syntax.css\`: generated Syntax framework bundle
- \`site.js\`: optional theme preference behavior when selected`,
      briefSections: `## Product structure

- Headline: ${readProductData(config).headline}
- Capabilities: ${readProductData(config).features.length}
- Process steps: ${readProductData(config).steps.length}

`,
    }),
  ],
});
