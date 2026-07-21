/** Syntax framework initialization and canonical demo behavior. */
(function (global) {
  'use strict';

  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach((tabs) => {
      const buttons = Array.from(tabs.querySelectorAll('[role="tab"]'));
      const panels = buttons.map((button) =>
        document.getElementById(button.getAttribute('aria-controls')),
      );

      function select(index, focus = false) {
        buttons.forEach((button, buttonIndex) => {
          const selected = buttonIndex === index;
          button.setAttribute('aria-selected', String(selected));
          button.tabIndex = selected ? 0 : -1;
          if (panels[buttonIndex]) panels[buttonIndex].hidden = !selected;
        });
        if (focus) buttons[index]?.focus();
      }

      buttons.forEach((button, index) => {
        button.addEventListener('click', () => select(index));
        button.addEventListener('keydown', (event) => {
          let next = index;
          if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
          else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = buttons.length - 1;
          else return;
          event.preventDefault();
          select(next, true);
        });
      });
    });
  }

  function initMotionDemo() {
    const target = document.getElementById('motion-target');
    if (!target) return;

    document.querySelectorAll('[data-motion]').forEach((button) => {
      button.addEventListener('click', () => {
        const reduce = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        const frames = {
          fade: [{ opacity: 0.25 }, { opacity: 1 }],
          slide: [
            { transform: 'translateX(-1rem)', opacity: 0.4 },
            { transform: 'translateX(0)', opacity: 1 },
          ],
          pulse: [
            { transform: 'scale(1)' },
            { transform: 'scale(1.035)' },
            { transform: 'scale(1)' },
          ],
        };
        target.animate(frames[button.dataset.motion], { duration: 420, easing: 'ease-out' });
      });
    });
  }

  function initScrollableRegions() {
    document.querySelectorAll('pre, [data-scrollable-region]').forEach((region) => {
      if (!region.hasAttribute('tabindex')) region.tabIndex = 0;
    });
  }

  function init() {
    global.SyntaxTheme?.init();
    global.SyntaxFonts?.init();
    global.SyntaxNavigation?.init();
    global.SyntaxModal?.init();
    initTabs();
    initMotionDemo();
    initScrollableRegions();
    document.documentElement.classList.add('syntax-ready');
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window);
