/** System/light/dark theme preference controller. */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'syntax-theme-preference';
  const VALID_PREFERENCES = ['system', 'light', 'dark'];
  const media = global.matchMedia('(prefers-color-scheme: dark)');
  let initialized = false;

  function getPreference() {
    const saved = global.localStorage.getItem(STORAGE_KEY);
    return VALID_PREFERENCES.includes(saved) ? saved : 'system';
  }

  function resolveTheme(preference) {
    if (preference === 'system') return media.matches ? 'dark' : 'light';
    return preference;
  }

  function updateControl(preference) {
    const button = document.getElementById('theme-toggle');
    const icon = document.getElementById('theme-icon');
    if (!button) return;

    button.setAttribute('aria-label', `Theme preference: ${preference}. Activate to change.`);
    button.dataset.themePreference = preference;

    if (!icon) return;
    const paths = {
      system:
        '<path d="M4 5h16v11H4zM8 20h8M12 16v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      light:
        '<path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42m0-12.72-1.42 1.42M7.06 16.94l-1.42 1.42" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>',
      dark: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" fill="currentColor"/>',
    };
    icon.innerHTML = paths[preference];
  }

  function applyPreference(preference, options = {}) {
    const safePreference = VALID_PREFERENCES.includes(preference) ? preference : 'system';
    const resolved = resolveTheme(safePreference);

    document.documentElement.dataset.themePreference = safePreference;
    document.documentElement.dataset.theme = resolved;
    updateControl(safePreference);

    if (options.persist !== false) {
      global.localStorage.setItem(STORAGE_KEY, safePreference);
    }

    document.dispatchEvent(
      new CustomEvent('syntax-theme-change', {
        detail: { preference: safePreference, theme: resolved },
      }),
    );

    return resolved;
  }

  function cyclePreference() {
    const current = getPreference();
    const next =
      VALID_PREFERENCES[(VALID_PREFERENCES.indexOf(current) + 1) % VALID_PREFERENCES.length];
    applyPreference(next);
  }

  function init() {
    if (initialized) return;
    initialized = true;

    applyPreference(getPreference(), { persist: false });
    document.getElementById('theme-toggle')?.addEventListener('click', cyclePreference);

    media.addEventListener('change', () => {
      if (getPreference() === 'system') applyPreference('system', { persist: false });
    });
  }

  global.SyntaxTheme = Object.freeze({
    init,
    getPreference,
    setPreference: applyPreference,
    getResolvedTheme: () => document.documentElement.dataset.theme || resolveTheme(getPreference()),
  });
})(window);
