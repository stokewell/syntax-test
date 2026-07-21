import { renderDirectionVariables } from '../directions/index.mjs';
import {
  RecipeDataError,
  assertAllowedKeys,
  assertPlainObject,
  createCommonFiles,
  escapeHtml,
  hasFeature,
  readBoolean,
  readString,
  renderActions,
  renderHead,
  renderThemeBootstrap,
  renderThemeButton,
  validateDestination,
} from './shared.mjs';

const DATA_KEYS = Object.freeze([
  'role',
  'intro',
  'aboutTitle',
  'about',
  'currently',
  'closingEyebrow',
  'closingTitle',
  'closingBody',
  'projects',
  'dataBacked',
]);
const PROJECT_KEYS = Object.freeze([
  'title',
  'status',
  'description',
  'url',
  'image',
  'alt',
  'tags',
]);

function validateAssetSource(value, path) {
  if (value === undefined || value === null || value === '') return null;
  const source = readString(value, path, { maximumLength: 1000 });
  if (/^https?:\/\//i.test(source)) return source;
  if (source.includes('\\') || source.split('/').includes('..') || /^javascript:/i.test(source)) {
    throw new RecipeDataError(`${path} must be a safe relative path or http(s) URL.`);
  }
  return source;
}

function readTags(value, path) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new RecipeDataError(`${path} must be an array.`);
  if (value.length > 5) throw new RecipeDataError(`${path} may contain at most five tags.`);

  return value.map((tag, index) =>
    readString(tag, `${path}[${index}]`, { required: true, maximumLength: 40 }),
  );
}

function readProjects(value) {
  if (!Array.isArray(value)) throw new RecipeDataError('recipe.data.projects must be an array.');
  if (value.length < 1 || value.length > 6) {
    throw new RecipeDataError('recipe.data.projects must contain between one and six projects.');
  }

  return value.map((project, index) => {
    const path = `recipe.data.projects[${index}]`;
    assertPlainObject(project, path);
    assertAllowedKeys(project, PROJECT_KEYS, path);
    const image = validateAssetSource(project.image, `${path}.image`);

    return Object.freeze({
      title: readString(project.title, `${path}.title`, { required: true, maximumLength: 100 }),
      status: readString(project.status, `${path}.status`, {
        fallback: 'Selected work',
        maximumLength: 60,
      }),
      description: readString(project.description, `${path}.description`, {
        required: true,
        maximumLength: 320,
      }),
      url: validateDestination(project.url, `${path}.url`),
      image,
      alt: image
        ? readString(project.alt, `${path}.alt`, { required: true, maximumLength: 180 })
        : readString(project.alt, `${path}.alt`, {
            fallback: 'Abstract project artwork',
            maximumLength: 180,
          }),
      tags: readTags(project.tags, `${path}.tags`),
    });
  });
}

function readPortfolioData(config) {
  const data = config.recipe.data ?? {};
  assertAllowedKeys(data, DATA_KEYS);

  return Object.freeze({
    role: readString(data.role, 'recipe.data.role', {
      fallback: 'Independent designer and builder',
      maximumLength: 100,
    }),
    intro: readString(data.intro, 'recipe.data.intro', {
      fallback: config.project.description,
      maximumLength: 500,
    }),
    aboutTitle: readString(data.aboutTitle, 'recipe.data.aboutTitle', {
      fallback: 'I like the whole problem.',
      maximumLength: 120,
    }),
    about: readString(data.about, 'recipe.data.about', {
      fallback:
        'I work across product thinking, interface design, code, content, and visual systems to give useful ideas a clear form.',
      maximumLength: 900,
    }),
    currently: readString(data.currently, 'recipe.data.currently', {
      fallback: 'Building and refining independent projects.',
      maximumLength: 240,
    }),
    closingEyebrow: readString(data.closingEyebrow, 'recipe.data.closingEyebrow', {
      fallback: 'What comes next',
      maximumLength: 80,
    }),
    closingTitle: readString(data.closingTitle, 'recipe.data.closingTitle', {
      fallback: 'The next useful thing is already in motion.',
      maximumLength: 140,
    }),
    closingBody: readString(data.closingBody, 'recipe.data.closingBody', {
      fallback: 'Follow the work as new prototypes become finished products.',
      maximumLength: 320,
    }),
    projects: readProjects(data.projects),
    dataBacked: readBoolean(data.dataBacked, 'recipe.data.dataBacked'),
  });
}

function artworkPath(project, index) {
  return project.image || `assets/project-${index + 1}.svg`;
}

function renderArtwork(config, project, index) {
  const number = String(index + 1).padStart(2, '0');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-labelledby="title description">
  <title id="title">${escapeHtml(project.title)} artwork</title>
  <desc id="description">Abstract geometric placeholder artwork for ${escapeHtml(project.title)}.</desc>
  <rect width="1200" height="900" fill="#F3EFEA" />
  <circle cx="930" cy="170" r="330" fill="${escapeHtml(config.accentColor)}" opacity="0.16" />
  <path d="M120 690 500 250l250 280 170-170 170 330Z" fill="none" stroke="#24211F" stroke-width="34" stroke-linejoin="round" />
  <circle cx="500" cy="250" r="46" fill="${escapeHtml(config.accentColor)}" />
  <text x="100" y="150" fill="#24211F" font-family="ui-monospace, monospace" font-size="64" font-weight="700">${number}</text>
</svg>`;
}

function renderProjectCard(project, index) {
  const rawSource = artworkPath(project, index);
  const source =
    /^(?:https?:)?\/\//i.test(rawSource) || rawSource.startsWith('/')
      ? rawSource
      : `./${rawSource}`;
  const tags = project.tags.length
    ? `<ul class="project-tags" aria-label="${escapeHtml(project.title)} disciplines">${project.tags
        .map((tag) => `<li>${escapeHtml(tag)}</li>`)
        .join('')}</ul>`
    : '';

  return `<article class="project-card">
  <a class="project-card__art" href="${escapeHtml(project.url)}">
    <img
      src="${escapeHtml(source)}"
      width="1200"
      height="900"
      alt="${escapeHtml(project.alt)}"
      loading="${index === 0 ? 'eager' : 'lazy'}"
      decoding="async"
    />
  </a>
  <div class="project-card__body">
    <p class="project-status">${escapeHtml(project.status)}</p>
    <h3><a href="${escapeHtml(project.url)}">${escapeHtml(project.title)}</a></h3>
    <p>${escapeHtml(project.description)}</p>
    ${tags}
    <a class="project-link" href="${escapeHtml(project.url)}">View project <span aria-hidden="true">↗</span></a>
  </div>
</article>`;
}

function renderIndex(config) {
  const data = readPortfolioData(config);
  const cards = data.projects.map((project, index) => renderProjectCard(project, index)).join('');
  const themeScript = hasFeature(config, 'theme') ? '<script src="./site.js" defer></script>' : '';
  const sourceLink = config.project.repositoryUrl
    ? `<a href="${escapeHtml(config.project.repositoryUrl)}">Source</a>`
    : '';

  return `<!doctype html>
<html lang="en" data-direction="${escapeHtml(config.visualDirection)}">
  <head>
    ${renderHead({ config, title: `${config.project.name} — ${data.role}` })}
    ${renderThemeBootstrap(config)}
  </head>
  <body id="top">
    <a class="skip-to-content" href="#main-content">Skip to content</a>
    <header class="site-header">
      <div class="container site-header__inner">
        <a class="site-name" href="#top">${escapeHtml(config.project.name)}</a>
        <nav class="site-nav" aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          ${sourceLink}
          ${renderThemeButton(config)}
        </nav>
      </div>
    </header>

    <main id="main-content" tabindex="-1">
      <section class="portfolio-hero" aria-labelledby="page-title">
        <div class="container portfolio-hero__inner">
          <p class="eyebrow">${escapeHtml(data.role)}</p>
          <h1 id="page-title">${escapeHtml(config.project.name)}</h1>
          <p class="portfolio-hero__intro">${escapeHtml(data.intro)}</p>
          <div class="portfolio-hero__actions">${renderActions(config)}</div>
        </div>
      </section>

      <section class="portfolio-section" id="work" aria-labelledby="work-title">
        <div class="container">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Selected work</p>
              <h2 id="work-title">Recent projects</h2>
            </div>
            <p>${escapeHtml(config.project.description)}</p>
          </div>
          <div class="project-grid">${cards}</div>
        </div>
      </section>

      <section class="portfolio-section about-section" id="about" aria-labelledby="about-title">
        <div class="container about-layout">
          <div>
            <p class="eyebrow">About</p>
            <h2 id="about-title">${escapeHtml(data.aboutTitle)}</h2>
          </div>
          <div class="about-copy">
            <p class="lead">${escapeHtml(data.about)}</p>
            <div class="currently">
              <span>Currently</span>
              <p>${escapeHtml(data.currently)}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="portfolio-section closing-section" aria-labelledby="closing-title">
        <div class="container closing-section__inner">
          <p class="eyebrow">${escapeHtml(data.closingEyebrow)}</p>
          <h2 id="closing-title">${escapeHtml(data.closingTitle)}</h2>
          <p>${escapeHtml(data.closingBody)}</p>
          <a class="btn" href="${escapeHtml(config.project.primaryAction.destination)}">${escapeHtml(config.project.primaryAction.label)}</a>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container site-footer__inner">
        <p>${escapeHtml(config.project.author)}</p>
        <p>${data.projects.length} selected ${data.projects.length === 1 ? 'project' : 'projects'}</p>
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
  scroll-padding-top: 5rem;
}

body {
  min-width: 20rem;
  overflow-x: hidden;
  font-family: var(--consumer-font-body);
}

.container {
  max-width: var(--consumer-max-width);
}

.site-header {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  border-bottom: 1px solid var(--color-border);
  background: rgba(var(--color-bg-rgb), 0.92);
  backdrop-filter: blur(1rem);
}

.site-header__inner,
.site-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 4.5rem;
  gap: var(--space-3);
}

.site-name {
  color: var(--color-text);
  font-family: var(--consumer-font-heading);
  font-size: 1.3rem;
  font-weight: 700;
  text-decoration: none;
}

.site-nav {
  display: flex;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.site-nav a {
  color: var(--color-text-secondary);
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

.portfolio-hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
}

.portfolio-hero__inner {
  padding-block: clamp(5rem, 13vw, 10rem);
  text-align: var(--consumer-hero-align);
}

.eyebrow,
.project-status,
.currently > span {
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  letter-spacing: var(--consumer-label-tracking);
  text-transform: var(--consumer-label-transform);
}

.portfolio-hero h1,
.section-heading h2,
.about-layout h2,
.closing-section h2 {
  margin: 0;
  font-family: var(--consumer-font-heading);
  letter-spacing: var(--consumer-heading-tracking);
  text-wrap: balance;
}

.portfolio-hero h1 {
  max-width: 12ch;
  font-size: var(--consumer-display-size);
  line-height: 0.92;
}

.portfolio-hero__intro {
  max-width: 46rem;
  margin-top: var(--space-4);
  color: var(--color-text-secondary);
  font-size: clamp(1.15rem, 2vw, 1.45rem);
  line-height: 1.65;
}

[data-direction='product'] .portfolio-hero h1,
[data-direction='product'] .portfolio-hero__intro {
  margin-inline: auto;
}

.portfolio-hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: var(--consumer-hero-justify);
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.portfolio-section {
  padding-block: var(--consumer-section-space);
}

.section-heading,
.about-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.75fr);
  align-items: end;
  gap: clamp(2rem, 7vw, 7rem);
  margin-bottom: clamp(3rem, 7vw, 5rem);
}

.section-heading h2,
.about-layout h2,
.closing-section h2 {
  max-width: 13ch;
  font-size: clamp(2.5rem, 6vw, 5rem);
  line-height: 0.98;
}

.section-heading > p {
  margin: 0;
  color: var(--color-text-secondary);
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--consumer-card-minimum)), 1fr));
  gap: clamp(1.25rem, 3vw, 2.25rem);
}

.project-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--consumer-card-border);
  border-radius: var(--consumer-card-radius);
  background: var(--consumer-card-background);
  box-shadow: var(--consumer-card-shadow);
  transition:
    transform var(--transition-medium) var(--ease-out),
    box-shadow var(--transition-medium) var(--ease-out);
}

.project-card:hover {
  transform: translateY(-0.3rem);
}

.project-card__art {
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--consumer-art-radius);
  background: var(--color-surface);
}

.project-card__art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow) var(--ease-out);
}

.project-card:hover .project-card__art img,
.project-card__art:focus-visible img {
  transform: scale(1.025);
}

.project-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--consumer-card-padding);
}

.project-card h3 {
  margin: 0;
  font-family: var(--consumer-font-heading);
  font-size: clamp(1.7rem, 3vw, 2.35rem);
  line-height: 1;
}

.project-card h3 a {
  color: var(--color-text);
  text-decoration: none;
}

.project-card h3 a:hover,
.project-card h3 a:focus-visible {
  color: var(--color-primary);
}

.project-card__body > p:not(.project-status) {
  margin-top: var(--space-3);
  color: var(--color-text-secondary);
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: none;
  margin: var(--space-3) 0 0;
  padding: 0;
  list-style: none;
}

.project-tags li {
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-round);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.project-link {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-4);
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: none;
}

.project-link span {
  transition: transform var(--transition-fast) var(--ease-out);
}

.project-link:hover span,
.project-link:focus-visible span {
  transform: translate(0.15rem, -0.15rem);
}

[data-direction='editorial'] .project-card {
  border-inline: 0;
  border-bottom: 0;
  padding-top: var(--space-2);
}

[data-direction='editorial'] .project-card__body {
  padding-inline: 0;
}

[data-direction='product'] .portfolio-hero {
  background:
    radial-gradient(circle at 80% 10%, rgba(var(--color-primary-rgb), 0.16), transparent 35%),
    var(--color-surface);
}

.about-section {
  border-block: 1px solid var(--color-border);
  background: var(--color-surface);
}

.about-layout {
  align-items: start;
  margin-bottom: 0;
}

.about-copy .lead {
  margin-top: 0;
  color: var(--color-text);
  font-size: clamp(1.2rem, 2.3vw, 1.6rem);
  line-height: 1.6;
}

.currently {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-strong);
}

.currently p {
  margin: 0;
}

.closing-section__inner {
  display: grid;
  justify-items: start;
}

[data-direction='product'] .closing-section__inner {
  justify-items: center;
  text-align: center;
}

.closing-section__inner > p:not(.eyebrow) {
  max-width: 42rem;
  margin-block: var(--space-4);
  color: var(--color-text-secondary);
}

.site-footer {
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.site-footer p {
  margin: 0;
}

@media (max-width: 48rem) {
  .site-nav a:first-child,
  .site-nav a:nth-child(2) {
    display: none;
  }

  .section-heading,
  .about-layout {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .site-footer__inner {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    padding-block: var(--space-3);
  }
}

@media (max-width: 28rem) {
  .site-nav > a {
    display: none;
  }

  .portfolio-hero__actions > * {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  .project-card,
  .project-card__art img,
  .project-link span {
    transition: none;
  }

  .project-card:hover,
  .project-card:hover .project-card__art img,
  .project-card__art:focus-visible img {
    transform: none;
  }
}`;
}

function createPortfolioFiles(config) {
  const data = readPortfolioData(config);
  const files = [
    { path: 'index.html', render: () => renderIndex(config) },
    { path: 'site.css', render: () => renderSiteCss(config) },
    ...createCommonFiles({
      config,
      recipeSummary:
        'The Portfolio recipe provides an introduction, selected work, an about section, and a closing action. Project cards are statically rendered for resilience and searchability.',
      structure: `- \`index.html\`: semantic portfolio content and statically rendered projects
- \`site.css\`: project-owned composition and visual direction
- \`syntax.css\`: generated Syntax framework bundle
- \`assets/\`: local project artwork generated when an image is not supplied
- \`content/projects.json\`: optional editable project data mirror
- \`site.js\`: optional theme preference behavior when selected`,
      briefSections: `## Portfolio content

- Role: ${data.role}
- Selected projects: ${data.projects.length}
- Data-backed mirror: ${data.dataBacked ? 'yes' : 'no'}
- About focus: ${data.aboutTitle}

`,
    }),
  ];

  data.projects.forEach((project, index) => {
    if (!project.image) {
      files.push({
        path: artworkPath(project, index),
        render: () => renderArtwork(config, project, index),
      });
    }
  });

  if (data.dataBacked) {
    files.push({
      path: 'content/projects.json',
      render: () => JSON.stringify(data.projects, null, 2),
    });
  }

  return files;
}

export const portfolioRecipe = Object.freeze({
  id: 'portfolio',
  version: 1,
  label: 'Portfolio',
  description: 'A resilient personal portfolio with one to six statically rendered projects.',
  visualDirections: Object.freeze(['editorial', 'product']),
  compatibleFeatures: Object.freeze(['theme']),
  validateConfig: ({ config }) => readPortfolioData(config),
  createFiles: ({ config }) => createPortfolioFiles(config),
});
