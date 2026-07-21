import { renderDirectionVariables } from '../directions/index.mjs';
import {
  RecipeDataError,
  assertAllowedKeys,
  assertPlainObject,
  createCommonFiles,
  escapeHtml,
  hasFeature,
  readString,
  renderHead,
  renderThemeBootstrap,
  renderThemeButton,
} from './shared.mjs';

const DATA_KEYS = Object.freeze(['workspaceTitle', 'navigation', 'stats', 'tasks', 'emptyState']);
const NAV_KEYS = Object.freeze(['label', 'destination']);
const STAT_KEYS = Object.freeze(['label', 'value', 'detail']);
const TASK_KEYS = Object.freeze(['title', 'status', 'owner']);

function readArray(value, path, { minimum, maximum, keys, map }) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new RecipeDataError(`${path} must contain between ${minimum} and ${maximum} items.`);
  }
  return value.map((item, index) => {
    const itemPath = `${path}[${index}]`;
    assertPlainObject(item, itemPath);
    assertAllowedKeys(item, keys, itemPath);
    return Object.freeze(map(item, itemPath));
  });
}

function readAppData(config) {
  const data = config.recipe.data ?? {};
  assertAllowedKeys(data, DATA_KEYS);
  return Object.freeze({
    workspaceTitle: readString(data.workspaceTitle, 'recipe.data.workspaceTitle', {
      fallback: 'Workspace overview',
      maximumLength: 120,
    }),
    navigation: readArray(data.navigation, 'recipe.data.navigation', {
      minimum: 2,
      maximum: 6,
      keys: NAV_KEYS,
      map: (item, path) => ({
        label: readString(item.label, `${path}.label`, { required: true, maximumLength: 60 }),
        destination: readString(item.destination, `${path}.destination`, {
          required: true,
          maximumLength: 160,
        }),
      }),
    }),
    stats: readArray(data.stats, 'recipe.data.stats', {
      minimum: 2,
      maximum: 4,
      keys: STAT_KEYS,
      map: (item, path) => ({
        label: readString(item.label, `${path}.label`, { required: true, maximumLength: 60 }),
        value: readString(item.value, `${path}.value`, { required: true, maximumLength: 40 }),
        detail: readString(item.detail, `${path}.detail`, { required: true, maximumLength: 160 }),
      }),
    }),
    tasks: readArray(data.tasks, 'recipe.data.tasks', {
      minimum: 1,
      maximum: 8,
      keys: TASK_KEYS,
      map: (item, path) => ({
        title: readString(item.title, `${path}.title`, { required: true, maximumLength: 100 }),
        status: readString(item.status, `${path}.status`, { required: true, maximumLength: 50 }),
        owner: readString(item.owner, `${path}.owner`, { required: true, maximumLength: 80 }),
      }),
    }),
    emptyState: readString(data.emptyState, 'recipe.data.emptyState', {
      fallback: 'Nothing needs attention right now.',
      maximumLength: 220,
    }),
  });
}

function renderNavigation(items) {
  return items
    .map(
      (item, index) =>
        `<a href="${escapeHtml(item.destination)}"${index === 0 ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`,
    )
    .join('');
}

function renderStats(items) {
  return items
    .map(
      (item) => `<article class="stat-card">
  <p class="stat-label">${escapeHtml(item.label)}</p>
  <p class="stat-value">${escapeHtml(item.value)}</p>
  <p class="stat-detail">${escapeHtml(item.detail)}</p>
</article>`,
    )
    .join('');
}

function renderTasks(items) {
  return items
    .map(
      (item) => `<tr>
  <th scope="row">${escapeHtml(item.title)}</th>
  <td><span class="status-pill">${escapeHtml(item.status)}</span></td>
  <td>${escapeHtml(item.owner)}</td>
</tr>`,
    )
    .join('');
}

function renderIndex(config) {
  const data = readAppData(config);
  const themeScript = hasFeature(config, 'theme') ? '<script src="./site.js" defer></script>' : '';

  return `<!doctype html>
<html lang="en" data-direction="${escapeHtml(config.visualDirection)}">
  <head>
    ${renderHead({ config, title: `${config.project.name} — ${data.workspaceTitle}` })}
    ${renderThemeBootstrap(config)}
  </head>
  <body>
    <a class="skip-to-content" href="#main-content">Skip to content</a>
    <div class="app-shell">
      <aside class="app-sidebar" aria-label="Application navigation">
        <a class="app-brand" href="#main-content">${escapeHtml(config.project.name)}</a>
        <nav class="app-nav">${renderNavigation(data.navigation)}</nav>
        <p class="app-owner">${escapeHtml(config.project.author)}</p>
      </aside>

      <div class="app-main">
        <header class="app-header">
          <div>
            <p class="eyebrow">Application prototype</p>
            <h1>${escapeHtml(data.workspaceTitle)}</h1>
          </div>
          <div class="app-header__actions">
            ${config.project.secondaryAction ? `<a class="btn-outline" href="${escapeHtml(config.project.secondaryAction.destination)}">${escapeHtml(config.project.secondaryAction.label)}</a>` : ''}
            <a class="btn" href="${escapeHtml(config.project.primaryAction.destination)}">${escapeHtml(config.project.primaryAction.label)}</a>
            ${renderThemeButton(config)}
          </div>
        </header>

        <main id="main-content" tabindex="-1">
          <section aria-labelledby="overview-title">
            <h2 class="visually-hidden" id="overview-title">Overview</h2>
            <div class="stat-grid">${renderStats(data.stats)}</div>
          </section>

          <section class="workspace-panel" aria-labelledby="tasks-title">
            <div class="panel-heading">
              <div>
                <p class="eyebrow">Current work</p>
                <h2 id="tasks-title">Tasks and activity</h2>
              </div>
              <button class="btn-outline" type="button">Filter</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th scope="col">Task</th><th scope="col">Status</th><th scope="col">Owner</th></tr></thead>
                <tbody>${renderTasks(data.tasks)}</tbody>
              </table>
            </div>
          </section>

          <section class="workspace-panel empty-panel" aria-labelledby="empty-title">
            <p class="eyebrow">Queue</p>
            <h2 id="empty-title">All clear</h2>
            <p>${escapeHtml(data.emptyState)}</p>
          </section>
        </main>
      </div>
    </div>
    ${themeScript}
  </body>
</html>`;
}

function renderSiteCss(config) {
  return `${renderDirectionVariables(config)}

body { min-width: 20rem; overflow-x: hidden; font-family: var(--consumer-font-body); }
.app-shell { display: grid; min-height: 100svh; grid-template-columns: minmax(13rem, 17rem) minmax(0, 1fr); }
.app-sidebar { display: flex; position: sticky; top: 0; height: 100svh; flex-direction: column; padding: var(--space-4); border-right: 1px solid var(--color-border); background: var(--color-surface); }
.app-brand { color: var(--color-text); font-family: var(--consumer-font-heading); font-size: 1.3rem; font-weight: 800; text-decoration: none; }
.app-nav { display: grid; gap: var(--space-1); margin-top: var(--space-5); }
.app-nav a { padding: 0.75rem 0.9rem; border-radius: max(var(--consumer-card-radius), var(--radius-sm)); color: var(--color-text-secondary); font-size: var(--font-size-sm); font-weight: 650; text-decoration: none; }
.app-nav a:hover, .app-nav a:focus-visible, .app-nav a[aria-current='page'] { background: rgba(var(--color-primary-rgb), 0.12); color: var(--color-primary); }
.app-owner { margin-top: auto; color: var(--color-text-secondary); font-size: var(--font-size-xs); }
.app-main { min-width: 0; padding: clamp(1rem, 3vw, 3rem); background: var(--color-bg); }
.app-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); max-width: var(--consumer-max-width); margin-inline: auto; padding-bottom: var(--space-4); }
.app-header h1 { margin: 0; font-family: var(--consumer-font-heading); font-size: clamp(2rem, 5vw, 4.5rem); line-height: 1; letter-spacing: var(--consumer-heading-tracking); }
.app-header__actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--space-2); }
.eyebrow { margin: 0 0 var(--space-2); color: var(--color-primary); font-size: var(--font-size-xs); font-weight: 700; letter-spacing: var(--consumer-label-tracking); text-transform: var(--consumer-label-transform); }
.theme-toggle { display: inline-grid; width: 2.5rem; height: 2.5rem; place-items: center; padding: 0; border: 1px solid var(--color-border); border-radius: var(--radius-round); background: var(--color-surface-raised); color: var(--color-text); }
main { display: grid; max-width: var(--consumer-max-width); gap: var(--space-4); margin-inline: auto; }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: var(--space-3); }
.stat-card, .workspace-panel { padding: var(--consumer-card-padding); border: 1px solid var(--consumer-card-border); border-radius: var(--consumer-card-radius); background: var(--consumer-card-background); box-shadow: var(--consumer-card-shadow); }
.stat-label, .stat-detail { margin: 0; color: var(--color-text-secondary); }
.stat-label { font-size: var(--font-size-sm); }
.stat-value { margin-block: var(--space-2); font-family: var(--consumer-font-heading); font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; line-height: 1; }
.stat-detail { font-size: var(--font-size-xs); }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.panel-heading h2, .empty-panel h2 { margin: 0; font-family: var(--consumer-font-heading); font-size: clamp(1.6rem, 3vw, 2.4rem); letter-spacing: var(--consumer-heading-tracking); }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; border-top: 1px solid var(--color-border); text-align: left; }
thead th { border-top: 0; color: var(--color-text-secondary); font-size: var(--font-size-xs); text-transform: uppercase; letter-spacing: 0.08em; }
tbody th { font-weight: 650; }
.status-pill { display: inline-flex; padding: 0.25rem 0.6rem; border: 1px solid var(--color-border); border-radius: var(--radius-round); background: rgba(var(--color-primary-rgb), 0.1); color: var(--color-primary); font-size: var(--font-size-xs); font-weight: 700; }
.empty-panel { text-align: center; }
.empty-panel p:last-child { max-width: 38rem; margin-inline: auto; color: var(--color-text-secondary); }
@media (max-width: 52rem) { .app-shell { grid-template-columns: 1fr; } .app-sidebar { position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--color-border); } .app-nav { display: flex; overflow-x: auto; margin-top: var(--space-3); } .app-owner { display: none; } .app-header { align-items: flex-start; flex-direction: column; } .app-header__actions { justify-content: flex-start; } }
@media (max-width: 30rem) { .app-main { padding-inline: var(--space-2); } .app-header__actions > a { width: 100%; } th, td { padding-inline: 0.65rem; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }`;
}

export const appRecipe = Object.freeze({
  id: 'app',
  version: 1,
  label: 'App',
  description:
    'A semantic application shell with navigation, summary metrics, a task table, and empty-state coverage.',
  visualDirections: Object.freeze(['product', 'technical', 'minimal', 'retro-interface']),
  compatibleFeatures: Object.freeze(['theme']),
  validateConfig: ({ config }) => readAppData(config),
  createFiles: ({ config }) => [
    { path: 'index.html', render: () => renderIndex(config) },
    { path: 'site.css', render: () => renderSiteCss(config) },
    ...createCommonFiles({
      config,
      recipeSummary:
        'The App recipe provides a responsive application shell with navigation, summary metrics, task activity, and an empty state.',
      structure: `- \`index.html\`: semantic application shell and workspace content
- \`site.css\`: project-owned application layout and visual direction
- \`syntax.css\`: generated Syntax framework bundle
- \`site.js\`: optional theme preference behavior when selected`,
      briefSections: `## Application structure

- Workspace: ${readAppData(config).workspaceTitle}
- Navigation items: ${readAppData(config).navigation.length}
- Summary metrics: ${readAppData(config).stats.length}
- Tasks: ${readAppData(config).tasks.length}

`,
    }),
  ],
});
