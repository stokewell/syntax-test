const INITIAL_FEATURES = Object.freeze([
  'theme',
  'mobile-navigation',
  'responsive-image',
  'dialog',
]);

export const SETUP_FEATURE_IDS = INITIAL_FEATURES;

export function selectedSetupFeatures(config) {
  return INITIAL_FEATURES.filter((feature) => config.features.includes(feature));
}

export function renderFeatureScript(config) {
  const fragments = [];

  if (config.features.includes('theme')) {
    fragments.push(`/* feature:theme */
(() => {
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
})();`);
  }

  if (config.features.includes('mobile-navigation')) {
    fragments.push(`/* feature:mobile-navigation */
(() => {
  'use strict';

  const toggle = document.querySelector('[data-mobile-nav-toggle]');
  const navigation = document.querySelector('[data-mobile-navigation]');
  if (!toggle || !navigation) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    navigation.dataset.open = String(open);
  }

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  addEventListener('resize', () => {
    if (matchMedia('(min-width: 48.01rem)').matches) setOpen(false);
  });
})();`);
  }

  if (config.features.includes('responsive-image')) {
    fragments.push(`/* feature:responsive-image */
(() => {
  'use strict';

  for (const image of document.querySelectorAll('img[data-responsive-image]')) {
    image.decoding = 'async';
    if (!image.hasAttribute('loading')) image.loading = 'lazy';
    const reveal = () => image.dataset.loaded = 'true';
    if (image.complete) reveal();
    else image.addEventListener('load', reveal, { once: true });
  }
})();`);
  }

  if (config.features.includes('dialog')) {
    fragments.push(`/* feature:dialog */
(() => {
  'use strict';

  for (const trigger of document.querySelectorAll('[data-dialog-open]')) {
    trigger.addEventListener('click', () => {
      const dialog = document.getElementById(trigger.dataset.dialogOpen);
      if (dialog instanceof HTMLDialogElement) dialog.showModal();
    });
  }

  for (const trigger of document.querySelectorAll('[data-dialog-close]')) {
    trigger.addEventListener('click', () => {
      const dialog = trigger.closest('dialog');
      if (dialog instanceof HTMLDialogElement) dialog.close();
    });
  }

  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }
})();`);
  }

  return fragments.join('\n\n');
}

export function renderFeatureCss(config) {
  const rules = [];

  if (config.features.includes('mobile-navigation')) {
    rules.push(`.mobile-nav-toggle {
  display: none;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-round);
  background: var(--color-surface-raised);
  color: var(--color-text);
}

@media (max-width: 48rem) {
  .mobile-nav-toggle {
    display: inline-grid;
  }

  [data-mobile-navigation] {
    display: none;
    width: 100%;
    align-items: stretch;
    flex-direction: column;
    padding-block: var(--space-2);
  }

  [data-mobile-navigation][data-open='true'] {
    display: flex;
  }

  [data-mobile-navigation] a,
  [data-mobile-navigation] button {
    min-height: 2.75rem;
  }
}`);
  }

  if (config.features.includes('responsive-image')) {
    rules.push(`img[data-responsive-image] {
  transition: opacity var(--transition-medium) var(--ease-out);
}

img[data-responsive-image]:not([data-loaded='true']) {
  opacity: 0.72;
}`);
  }

  if (config.features.includes('dialog')) {
    rules.push(`.consumer-dialog {
  width: min(34rem, calc(100% - 2rem));
  padding: 0;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-xl);
  background: var(--color-surface-raised);
  color: var(--color-text);
  box-shadow: var(--shadow-lg);
}

.consumer-dialog::backdrop {
  background: rgba(0, 0, 0, 0.58);
}

.consumer-dialog__inner {
  padding: clamp(1.5rem, 5vw, 2.5rem);
}

.consumer-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}`);
  }

  if (rules.length > 0) {
    rules.push(`@media (prefers-reduced-motion: reduce) {
  img[data-responsive-image] {
    transition: none;
  }
}`);
  }

  return rules.join('\n\n');
}

export function renderMobileNavigationToggle(config) {
  if (!config.features.includes('mobile-navigation')) return '';
  return `<button
  class="mobile-nav-toggle"
  type="button"
  aria-controls="site-navigation"
  aria-expanded="false"
  aria-label="Open navigation"
  data-mobile-nav-toggle
>
  <span aria-hidden="true">☰</span>
</button>`;
}

export function navigationAttributes(config) {
  return config.features.includes('mobile-navigation')
    ? 'id="site-navigation" data-mobile-navigation data-open="false"'
    : '';
}

export function responsiveImageAttributes(config) {
  return config.features.includes('responsive-image') ? 'data-responsive-image' : '';
}

export function renderDialogAction(config) {
  if (!config.features.includes('dialog')) return '';
  return `<button class="btn-outline" type="button" data-dialog-open="project-dialog">Project details</button>`;
}

export function renderProjectDialog(config, escapeHtml) {
  if (!config.features.includes('dialog')) return '';
  return `<dialog class="consumer-dialog" id="project-dialog" aria-labelledby="project-dialog-title">
  <div class="consumer-dialog__inner">
    <p class="eyebrow">Project overview</p>
    <h2 id="project-dialog-title">${escapeHtml(config.project.name)}</h2>
    <p>${escapeHtml(config.project.description)}</p>
    <div class="consumer-dialog__actions">
      <a class="btn" href="${escapeHtml(config.project.primaryAction.destination)}">${escapeHtml(config.project.primaryAction.label)}</a>
      <button class="btn-outline" type="button" data-dialog-close>Close</button>
    </div>
  </div>
</dialog>`;
}
