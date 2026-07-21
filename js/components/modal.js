/** Lightweight accessible dialog controller. */
(function (global) {
  'use strict';

  const SELECTOR = '.modal';
  let initialized = false;
  let activeModal = null;
  let previousFocus = null;

  function focusables(modal) {
    return Array.from(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  }

  function open(id, trigger = document.activeElement) {
    const modal = document.getElementById(id);
    if (!modal) return;

    previousFocus = trigger instanceof HTMLElement ? trigger : null;
    activeModal = modal;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    focusables(modal)[0]?.focus();
    modal.dispatchEvent(new CustomEvent('modal-open'));
  }

  function close(modal = activeModal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    modal.dispatchEvent(new CustomEvent('modal-close'));
    activeModal = null;
    previousFocus?.focus();
    previousFocus = null;
  }

  function trapFocus(event) {
    if (!activeModal || event.key !== 'Tab') return;
    const elements = focusables(activeModal);
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

  function init() {
    if (initialized) return;
    initialized = true;

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-modal-target]');
      if (trigger) {
        event.preventDefault();
        open(trigger.dataset.modalTarget, trigger);
        return;
      }

      const closeButton = event.target.closest('[data-modal-close]');
      if (closeButton) {
        event.preventDefault();
        close(closeButton.closest(SELECTOR));
        return;
      }

      if (event.target.matches(SELECTOR)) close(event.target);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && activeModal) {
        event.preventDefault();
        close();
      }
      trapFocus(event);
    });
  }

  global.SyntaxModal = Object.freeze({
    init,
    open,
    close,
    closeAll: () => document.querySelectorAll(SELECTOR).forEach((modal) => close(modal)),
  });
})(window);
