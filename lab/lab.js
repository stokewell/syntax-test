/** Component Lab-only interaction wiring. None of this is included in dist/syntax.js. */
(function (global) {
  'use strict';

  function framework() {
    return global.animationFramework;
  }

  function resetElement(element, text) {
    element.getAnimations().forEach((animation) => animation.cancel());
    element.removeAttribute('style');
    if (typeof text === 'string') element.textContent = text;
  }

  function playPreset(element, name, options = {}) {
    const api = framework();
    if (!api?.presets?.[name]) return null;
    return api.presets[name](element, options);
  }

  function initToggleDemo() {
    const toggle = document.getElementById('interactive-toggle');
    const output = document.getElementById('toggle-demo-output');
    if (!toggle || !output) return;

    toggle.addEventListener('change', (event) => {
      output.textContent = `Toggle state: ${event.detail.checked ? 'ON' : 'OFF'}`;
    });
  }

  function initCardDemo() {
    const card = document.getElementById('image-custom-card');
    const output = document.getElementById('card-demo-output');
    if (!card || !output) return;

    card.addEventListener('card-click', () => {
      output.textContent = 'Card activation event received.';
    });
  }

  function initBasicAnimations() {
    const target = document.getElementById('basic-demo');
    if (!target) return;

    document.querySelectorAll('[data-basic-animation]').forEach((button) => {
      button.addEventListener('click', () => {
        resetElement(target);
        playPreset(target, button.dataset.basicAnimation, { duration: 520 });
      });
    });

    document.getElementById('basic-reset')?.addEventListener('click', () => resetElement(target));
  }

  function initSequenceAnimations() {
    const items = Array.from(document.querySelectorAll('.sequence-item'));
    if (!items.length) return;

    document.getElementById('play-sequence')?.addEventListener('click', () => {
      const api = framework();
      if (!api) return;
      items.forEach((item) => resetElement(item));
      const sequence = api.createSequence();
      items.forEach((item) => {
        sequence.add(api.presets.zoomIn(item, { autoplay: false, duration: 260 }), 70);
      });
      sequence.play();
    });

    document.getElementById('play-staggered')?.addEventListener('click', () => {
      items.forEach((item) => resetElement(item));
      framework()
        ?.stagger(items, 'slideInUp', {
          duration: 420,
          staggerDelay: 90,
        })
        ?.play();
    });
  }

  function initCustomAnimations() {
    const target = document.getElementById('custom-demo');
    if (!target) return;
    const original = target.dataset.originalText || target.textContent;

    document.querySelectorAll('[data-custom-animation]').forEach((button) => {
      button.addEventListener('click', () => {
        resetElement(target, original);
        playPreset(target, button.dataset.customAnimation);
      });
    });

    document
      .getElementById('custom-reset')
      ?.addEventListener('click', () => resetElement(target, original));
  }

  function init() {
    initToggleDemo();
    initCardDemo();
    initBasicAnimations();
    initSequenceAnimations();
    initCustomAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
