/**
 * focus-visible polyfill
 * Adds .focus-visible class to elements when they're focused via keyboard
 * but not when focused via mouse/touch
 */

(function() {
  'use strict';

  /**
   * Applies the :focus-visible polyfill at the given scope.
   * A scope in this case is either the top-level Document or a Shadow Root.
   */
  function applyFocusVisiblePolyfill(scope) {
    var hadKeyboardEvent = false;
    var hadFocusVisibleRecently = false;
    var hadFocusVisibleRecentlyTimeout = null;

    var isHandlingKeyboardThrottle = false;
    
    // Modern browsers already support :focus-visible, so just add the class for older ones
    if ('focusVisible' in document.documentElement.style) {
      document.documentElement.classList.add('js-focus-visible');
      return;
    }

    /**
     * Helper function for deciding whether an element should receive focus-visible class
     * @param {Element} el - the element to check
     * @returns {boolean}
     */
    function shouldApplyFocusVisibleClass(el) {
      if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'SELECT' && el.getAttribute('contenteditable') !== 'true') {
        return hadKeyboardEvent;
      }
      return hadKeyboardEvent || (el.tagName === 'INPUT' && el.type !== 'hidden');
    }

    /**
     * Add the `focus-visible` class to the given element if it was not added by
     * the author.
     * @param {Element} el
     */
    function addFocusVisibleClass(el) {
      if (el.classList.contains('focus-visible')) {
        return;
      }
      el.classList.add('focus-visible');
      el.setAttribute('data-focus-visible-added', '');
    }

    /**
     * Remove the `focus-visible` class from the given element if it was not
     * originally added by the author.
     * @param {Element} el
     */
    function removeFocusVisibleClass(el) {
      if (!el.hasAttribute('data-focus-visible-added')) {
        return;
      }
      el.classList.remove('focus-visible');
      el.removeAttribute('data-focus-visible-added');
    }

    /**
     * If the most recent user interaction was via the keyboard and the key
     * pressed was Tab, then the user is likely trying to focus with a keyboard.
     */
    function onKeyDown(e) {
      if (isHandlingKeyboardThrottle) {
        return;
      }
      
      isHandlingKeyboardThrottle = true;
      setTimeout(function() {
        isHandlingKeyboardThrottle = false;
      }, 50);
      
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      
      if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        hadKeyboardEvent = true;
      }
    }

    /**
     * If at any point a user clicks with a pointing device, ensure that we change
     * the modality away from keyboard.
     */
    function onPointerDown() {
      hadKeyboardEvent = false;
    }

    /**
     * On `focus`, add the `focus-visible` class to the target if:
     * - the target received focus as a result of keyboard navigation, or
     * - the event target is an element that will likely require interaction
     *   via the keyboard (e.g. a text box)
     */
    function onFocus(e) {
      if (shouldApplyFocusVisibleClass(e.target)) {
        addFocusVisibleClass(e.target);
      }
    }

    /**
     * On `blur`, remove the `focus-visible` class from the target.
     */
    function onBlur(e) {
      if (e.target.classList.contains('focus-visible')) {
        removeFocusVisibleClass(e.target);
        hadFocusVisibleRecently = true;
        window.clearTimeout(hadFocusVisibleRecentlyTimeout);
        hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
          hadFocusVisibleRecently = false;
        }, 100);
      }
    }

    // Bind simple event listeners
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);

    // Add a class to the document to indicate polyfill is active
    document.documentElement.classList.add('js-focus-visible');
  }

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    applyFocusVisiblePolyfill(document);
  });
})();