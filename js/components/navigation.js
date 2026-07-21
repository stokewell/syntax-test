/** Accessible responsive navigation. */
(function (global) {
  'use strict';

  let initialized = false;

  function setMobileOpen(open) {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.getElementById('mobile-navigation');
    if (!toggle || !nav) return;

    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    toggle.classList.toggle('open', open);
    nav.classList.toggle('open', open);
    nav.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) nav.querySelector('a, button')?.focus();
  }

  function closeDropdowns(except = null) {
    document.querySelectorAll('.dropdown-toggle[aria-expanded="true"]').forEach((toggle) => {
      if (toggle === except) return;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.classList.remove('active');
      document.getElementById(toggle.getAttribute('aria-controls'))?.classList.remove('active');
    });
  }

  function initDesktopDropdowns() {
    document.querySelectorAll('.dropdown-toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const menu = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!menu) return;
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        closeDropdowns(toggle);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.classList.toggle('active', open);
        menu.classList.toggle('active', open);
      });
    });

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.nav-dropdown')) closeDropdowns();
    });
  }

  function initMobileSubmenus() {
    document.querySelectorAll('.mobile-dropdown-toggle').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const submenu = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!submenu) return;
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        toggle.classList.toggle('expanded', open);
        submenu.hidden = !open;
      });
    });
  }

  function initScrollState() {
    const header = document.getElementById('main-header');
    if (!header) return;
    let ticking = false;

    global.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        global.requestAnimationFrame(() => {
          header.classList.toggle('shadow', global.scrollY > 24);
          ticking = false;
        });
      },
      { passive: true },
    );
  }

  function init() {
    if (initialized) return;
    initialized = true;

    document.querySelector('.menu-toggle')?.addEventListener('click', (event) => {
      setMobileOpen(event.currentTarget.getAttribute('aria-expanded') !== 'true');
    });

    document.querySelectorAll('.mobile-nav a').forEach((link) => {
      link.addEventListener('click', () => setMobileOpen(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        closeDropdowns();
      }
    });

    initDesktopDropdowns();
    initMobileSubmenus();
    initScrollState();
  }

  global.SyntaxNavigation = Object.freeze({ init, setMobileOpen });
})(window);
