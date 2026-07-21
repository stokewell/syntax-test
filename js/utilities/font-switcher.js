/** Accessible font-pair preview controller. */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'syntax-font-pair';
  const LINK_ID = 'dynamic-fonts-live';
  let initialized = false;
  let previousFocus = null;

  function encodeFamily(name, weights) {
    return `family=${name.trim().replace(/ /g, '+')}:${weights}`;
  }

  function loadPair(pair) {
    let link = document.getElementById(LINK_ID);
    if (!link) {
      link = document.createElement('link');
      link.id = LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?${encodeFamily(pair.heading, pair.headingWeights)}&${encodeFamily(pair.body, pair.bodyWeights)}&display=swap`;
  }

  function applyPair(key, options = {}) {
    const pairs = global.SyntaxFontPairs || {};
    const pair = pairs[key] || pairs.editorial;
    if (!pair) return;

    loadPair(pair);
    document.documentElement.style.setProperty(
      '--font-heading',
      `'${pair.heading}', ${pair.headingFallback}`,
    );
    document.documentElement.style.setProperty(
      '--font-body',
      `'${pair.body}', ${pair.bodyFallback}`,
    );
    document.documentElement.dataset.fontPair = key;

    if (options.persist !== false) global.localStorage.setItem(STORAGE_KEY, key);

    const title = document.getElementById('current-font-title');
    if (title) title.textContent = `${pair.heading} + ${pair.body}`;

    document.querySelectorAll('.font-option').forEach((option) => {
      const selected = option.dataset.fontPair === key;
      option.setAttribute('aria-checked', String(selected));
      option.tabIndex = selected ? 0 : -1;
    });

    document.fonts
      ?.load(`1rem "${pair.body}"`)
      .then(() => {
        document
          .querySelector('.type-specimen')
          ?.animate([{ opacity: 0.72 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
      })
      .catch(() => {});

    document.dispatchEvent(new CustomEvent('syntax-font-change', { detail: { key, pair } }));
  }

  function selectedKey() {
    const pairs = global.SyntaxFontPairs || {};
    const saved = global.localStorage.getItem(STORAGE_KEY);
    return saved && pairs[saved] ? saved : 'editorial';
  }

  function renderOptions() {
    const container = document.getElementById('font-options');
    const pairs = global.SyntaxFontPairs || {};
    if (!container) return;

    container.replaceChildren();
    Object.entries(pairs).forEach(([key, pair]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'font-option';
      button.dataset.fontPair = key;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'false');
      button.innerHTML = `
        <span class="font-option-heading" style="font-family: '${pair.heading}', ${pair.headingFallback}">${pair.heading}</span>
        <span class="font-option-body" style="font-family: '${pair.body}', ${pair.bodyFallback}">${pair.body} · ${pair.label}</span>
      `;
      button.addEventListener('click', () => {
        applyPair(key);
        closeDialog();
      });
      button.addEventListener('keydown', (event) => handleRadioKeys(event, key));
      container.appendChild(button);
    });
  }

  function handleRadioKeys(event, currentKey) {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key))
      return;
    event.preventDefault();
    const keys = Object.keys(global.SyntaxFontPairs || {});
    let index = keys.indexOf(currentKey);
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = keys.length - 1;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      index = (index + 1) % keys.length;
    else index = (index - 1 + keys.length) % keys.length;
    const next = keys[index];
    applyPair(next);
    document.querySelector(`.font-option[data-font-pair="${next}"]`)?.focus();
  }

  function focusableElements(dialog) {
    return Array.from(
      dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  }

  function trapFocus(event) {
    const dialog = document.getElementById('font-selector-dialog');
    if (!dialog || dialog.hidden || event.key !== 'Tab') return;
    const elements = focusableElements(dialog);
    if (!elements.length) return;
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openDialog() {
    const dialog = document.getElementById('font-selector-dialog');
    if (!dialog) return;
    previousFocus = document.activeElement;
    dialog.hidden = false;
    document.body.style.overflow = 'hidden';
    const selected = document.querySelector('.font-option[aria-checked="true"]');
    (selected || document.getElementById('font-selector-close'))?.focus();
  }

  function closeDialog() {
    const dialog = document.getElementById('font-selector-dialog');
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    document.body.style.overflow = '';
    previousFocus?.focus();
  }

  function init() {
    if (initialized) return;
    initialized = true;
    renderOptions();
    applyPair(selectedKey(), { persist: false });

    document.getElementById('font-toggle')?.addEventListener('click', openDialog);
    document.getElementById('font-selector-close')?.addEventListener('click', closeDialog);
    document.getElementById('font-selector-dialog')?.addEventListener('click', (event) => {
      if (event.target.id === 'font-selector-dialog') closeDialog();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDialog();
      trapFocus(event);
    });
  }

  global.SyntaxFonts = Object.freeze({
    init,
    applyPair,
    getSelected: selectedKey,
    openDialog,
    closeDialog,
  });
})(window);
