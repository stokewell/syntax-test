import {
  navigationAttributes,
  renderDialogAction,
  renderFeatureCss,
  renderFeatureScript,
  renderMobileNavigationToggle,
  renderProjectDialog,
} from '../lib/features.mjs';
import { createProjectToolingFiles } from '../lib/project-files.mjs';
import { createShipToolingFiles } from '../lib/ship-project-files.mjs';
import { appRecipe } from './app.mjs';
import { blankRecipe } from './blank.mjs';
import { portfolioRecipe } from './portfolio.mjs';
import { productRecipe } from './product.mjs';
import { escapeHtml } from './shared.mjs';

const SETUP_FEATURES = Object.freeze(['theme', 'mobile-navigation', 'responsive-image', 'dialog']);

function renderBlankArtwork(config) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" role="img" aria-labelledby="title description">
  <title id="title">${escapeHtml(config.project.name)} concept artwork</title>
  <desc id="description">An abstract composition generated for ${escapeHtml(config.project.name)}.</desc>
  <rect width="1200" height="720" fill="#F3EFEA" />
  <circle cx="940" cy="160" r="300" fill="${escapeHtml(config.accentColor)}" opacity="0.18" />
  <path d="M120 560 420 220l230 250 170-160 250 250Z" fill="none" stroke="#24211F" stroke-width="30" stroke-linejoin="round" />
</svg>`;
}

async function resolveDefinition(definition, context) {
  return typeof definition.render === 'function' ? definition.render(context) : definition.content;
}

function wrapDefinition(definition, transform, path = definition.path) {
  return {
    path,
    render: async (context) =>
      transform(await resolveDefinition(definition, context), context.config),
  };
}

function addNavigation(html, config) {
  if (!config.features.includes('mobile-navigation')) return html;
  return html.replace(
    '        <nav class="site-nav" aria-label="Primary navigation">',
    `        ${renderMobileNavigationToggle(config)}
        <nav class="site-nav" ${navigationAttributes(config)} aria-label="Primary navigation">`,
  );
}

function addDialogAction(html, config) {
  if (!config.features.includes('dialog')) return html;
  return html.replace(
    /(<div class="(?:blank|portfolio|product)-hero__actions">[\s\S]*?)(<\/div>)/,
    `$1${renderDialogAction(config)}$2`,
  );
}

function addResponsiveImages(html, config, recipeId) {
  if (!config.features.includes('responsive-image')) return html;
  let next = html.replaceAll('<img\n', '<img\n      data-responsive-image\n');
  if (recipeId === 'blank') {
    const figure = `<figure class="blank-hero__art">
  <img
    data-responsive-image
    src="./assets/hero-art.svg"
    width="1200"
    height="720"
    alt="Abstract concept artwork for ${escapeHtml(config.project.name)}"
    loading="eager"
    decoding="async"
  />
</figure>`;
    next = next.replace(
      '          <p class="blank-hero__note"',
      `${figure}
          <p class="blank-hero__note"`,
    );
  }
  return next;
}

function finalizeScriptsAndDialog(html, config) {
  const withoutBaseScript = html.replace(/\s*<script src="\.\/site\.js" defer><\/script>/g, '');
  const dialog = renderProjectDialog(config, escapeHtml);
  const script = config.features.length > 0 ? '<script src="./site.js" defer></script>' : '';
  return withoutBaseScript.replace('</body>', `${dialog}\n${script}\n  </body>`);
}

function transformIndex(html, config, recipeId) {
  let next = addNavigation(html, config);
  next = addDialogAction(next, config);
  next = addResponsiveImages(next, config, recipeId);
  return finalizeScriptsAndDialog(next, config);
}

function transformCss(css, config, recipeId) {
  const additions = [];
  if (recipeId === 'blank' && config.features.includes('responsive-image')) {
    additions.push(`.blank-hero__art {
  max-width: 52rem;
  margin: var(--space-6) auto 0;
  overflow: hidden;
  border-radius: var(--consumer-card-radius);
}

.blank-hero__art img {
  display: block;
  width: 100%;
  height: auto;
}`);
  }
  if (config.features.includes('mobile-navigation')) {
    additions.push(`@media (max-width: 48rem) {
  [data-mobile-navigation] a {
    display: flex !important;
    align-items: center;
  }
}`);
  }
  const featureCss = renderFeatureCss(config);
  if (featureCss) additions.push(featureCss);
  return additions.length > 0 ? `${css}\n\n${additions.join('\n\n')}` : css;
}

function transformConsumerTest(content) {
  const themeBlock = `  if (selectedFeatures.includes('theme')) {
    const toggle = page.getByRole('button', { name: /Theme preference/ });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme-preference', 'light');
  }`;
  const mobileBlock = `  if (selectedFeatures.includes('mobile-navigation')) {
    const toggle = page.getByRole('button', { name: 'Open navigation' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }`;
  const mobileReplacement = `  if (selectedFeatures.includes('mobile-navigation')) {
    const toggle = page.getByRole('button', { name: 'Open navigation' });
    if (await toggle.isVisible()) {
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    } else {
      await expect(page.locator('[data-mobile-navigation]')).toBeVisible();
    }
  }`;

  return content.replace(
    `${themeBlock}\n\n${mobileBlock}`,
    `${mobileReplacement}\n\n${themeBlock}`,
  );
}

function addShipScript(content) {
  const packageJson = JSON.parse(content);
  packageJson.scripts['prepare:ship'] = 'node scripts/prepare-ship.mjs';
  return JSON.stringify(packageJson);
}

function setupToolingDefinitions(config) {
  const files = createProjectToolingFiles(config).map((definition) => {
    if (definition.path === '.github/workflows/consumer-ci.yml') {
      return { ...definition, path: '.github/workflows/ci.yml' };
    }
    if (definition.path === 'tests/consumer.spec.js') {
      return wrapDefinition(definition, transformConsumerTest);
    }
    if (definition.path === 'package.json') {
      return wrapDefinition(definition, addShipScript);
    }
    return definition;
  });
  files.push(...createShipToolingFiles());
  return files;
}

function createSetupRecipe(baseRecipe) {
  return Object.freeze({
    ...baseRecipe,
    compatibleFeatures: SETUP_FEATURES,
    createFiles: ({ config }) => {
      const files = baseRecipe
        .createFiles({ config })
        .filter((definition) => definition.path !== 'site.js')
        .map((definition) => {
          if (definition.path === 'index.html') {
            return wrapDefinition(definition, (content) =>
              transformIndex(content, config, baseRecipe.id),
            );
          }
          if (definition.path === 'site.css') {
            return wrapDefinition(definition, (content) =>
              transformCss(content, config, baseRecipe.id),
            );
          }
          if (definition.path === 'README.md') {
            return wrapDefinition(definition, (content) =>
              content.replace(
                'optional theme preference behavior when selected',
                'selected optional behavior only',
              ),
            );
          }
          return definition;
        });

      if (baseRecipe.id === 'blank' && config.features.includes('responsive-image')) {
        files.push({ path: 'assets/hero-art.svg', render: () => renderBlankArtwork(config) });
      }

      const featureScript = renderFeatureScript(config);
      if (featureScript) files.push({ path: 'site.js', content: featureScript });
      files.push(...setupToolingDefinitions(config));
      return files;
    },
  });
}

const setupRecipes = Object.freeze({
  blank: createSetupRecipe(blankRecipe),
  portfolio: createSetupRecipe(portfolioRecipe),
  product: createSetupRecipe(productRecipe),
  app: createSetupRecipe(appRecipe),
});

export function getSetupRecipe(id) {
  const recipe = setupRecipes[id];
  if (!recipe) throw new Error(`Setup recipe ${String(id)} is not implemented.`);
  return recipe;
}

export function listSetupRecipes() {
  return Object.values(setupRecipes).map((recipe) => ({
    id: recipe.id,
    version: recipe.version,
    label: recipe.label,
    description: recipe.description,
    visualDirections: [...recipe.visualDirections],
    compatibleFeatures: [...recipe.compatibleFeatures],
  }));
}
