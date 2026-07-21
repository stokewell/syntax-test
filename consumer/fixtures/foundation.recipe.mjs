function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const foundationRecipe = Object.freeze({
  id: 'blank',
  version: 1,
  label: 'Foundation fixture',
  description: 'Internal deterministic generator fixture.',
  visualDirections: Object.freeze(['editorial']),
  compatibleFeatures: Object.freeze(['theme']),
  files: [
    {
      path: 'index.html',
      render: ({ config }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(config.project.name)}</title>
    <meta name="description" content="${escapeHtml(config.project.description)}" />
    <link rel="stylesheet" href="./site.css" />
  </head>
  <body>
    <main id="main">
      <p class="eyebrow">Generated with Syntax Consumer Mode</p>
      <h1>${escapeHtml(config.project.name)}</h1>
      <p>${escapeHtml(config.project.description)}</p>
      <a href="${escapeHtml(config.project.primaryAction.destination)}">${escapeHtml(config.project.primaryAction.label)}</a>
    </main>
    <footer>Built by ${escapeHtml(config.project.author)}</footer>
  </body>
</html>`,
    },
    {
      path: 'site.css',
      render: ({ config }) => `:root {
  color-scheme: light dark;
  --accent: ${config.accentColor};
  font-family: system-ui, sans-serif;
}

body {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.6;
}

a {
  color: var(--accent);
}

.eyebrow {
  color: var(--accent);
  font-weight: 700;
}`,
    },
    {
      path: 'PROJECT_BRIEF.md',
      render: ({ config }) => `# ${config.project.name}

## Concept

${config.project.description}

## Current configuration

- Recipe: ${config.recipe.id} v${config.recipe.version}
- Visual direction: ${config.visualDirection}
- Mode: ${config.mode}
- Deployment: ${config.deployment}
- Features: ${config.features.join(', ') || 'none'}

## Primary action

${config.project.primaryAction.label}: ${config.project.primaryAction.destination}
`,
    },
  ],
});
