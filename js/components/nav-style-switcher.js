/**
 * Navigation Style Switcher
 * Allows users to switch between different navigation styles with a slot machine effect
 */

(function() {
  'use strict';

  // Define available navigation styles
  const NAV_STYLES = ['style1', 'style2', 'style3'];
  
  // Initialize the nav style switcher when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    initNavStyleSwitcher();
  });

  /**
   * Initialize the navigation style switcher functionality
   */
  function initNavStyleSwitcher() {
    // Get necessary elements
    const header = document.getElementById('main-header');
    const upButton = document.querySelector('.switcher-up');
    const downButton = document.querySelector('.switcher-down');
    
    if (!header || !upButton || !downButton) {
      console.warn('Navigation style switcher elements not found');
      return;
    }

    // Set initial style
    let currentStyleIndex = 0;
    header.setAttribute('data-nav-style', NAV_STYLES[currentStyleIndex]);
    updateButtonStates(currentStyleIndex);

    // Up button click - previous style
    upButton.addEventListener('click', () => {
      if (currentStyleIndex > 0) {
        currentStyleIndex--;
        applyNavStyle(header, currentStyleIndex);
        updateButtonStates(currentStyleIndex);
      }
    });

    // Down button click - next style
    downButton.addEventListener('click', () => {
      if (currentStyleIndex < NAV_STYLES.length - 1) {
        currentStyleIndex++;
        applyNavStyle(header, currentStyleIndex);
        updateButtonStates(currentStyleIndex);
      }
    });
  }

  /**
   * Apply the selected navigation style with a slot machine animation effect
   * @param {HTMLElement} header - The header element
   * @param {number} styleIndex - The index of the style to apply
   */
  function applyNavStyle(header, styleIndex) {
    // Get the current style index
    const currentStyle = header.getAttribute('data-nav-style');
    const currentIndex = NAV_STYLES.indexOf(currentStyle);
    
    // Determine direction (up or down)
    const isUp = styleIndex < currentIndex;
    
    // Add subtle visual feedback to the clicked button
    const button = isUp ? document.querySelector('.switcher-up') : document.querySelector('.switcher-down');
    if (button) {
      button.style.opacity = '1';
      button.style.color = 'var(--color-primary)';
      setTimeout(() => {
        button.style.opacity = '';
        button.style.color = '';
      }, 300);
    }
    
    // Set the direction class for animation
    if (isUp) {
      header.classList.add('direction-up');
    } else {
      header.classList.remove('direction-up');
    }
    
    // Add the transitioning class to trigger animation
    header.classList.add('nav-transitioning');
    
    // Set the new style at the right time in the animation lifecycle
    setTimeout(() => {
      header.setAttribute('data-nav-style', NAV_STYLES[styleIndex]);
      
      // Remove the transitioning class after animation completes
      setTimeout(() => {
        header.classList.remove('nav-transitioning');
        // Announce style change for accessibility
        const announcer = document.getElementById('nav-style-announcer') || 
                         document.createElement('div');
        if (!announcer.id) {
          announcer.id = 'nav-style-announcer';
          announcer.setAttribute('aria-live', 'polite');
          announcer.style.position = 'absolute';
          announcer.style.width = '1px';
          announcer.style.height = '1px';
          announcer.style.padding = '0';
          announcer.style.overflow = 'hidden';
          announcer.style.clip = 'rect(0, 0, 0, 0)';
          announcer.style.whiteSpace = 'nowrap';
          announcer.style.border = '0';
          document.body.appendChild(announcer);
        }
        announcer.textContent = `Navigation style ${styleIndex + 1} activated`;
      }, 600); // Match animation duration
    }, 150); // Set style midway through the animation
  }

  /**
   * Update the enabled/disabled state of the navigation style buttons
   * @param {number} currentIndex - The current style index
   */
  function updateButtonStates(currentIndex) {
    const upButton = document.querySelector('.switcher-up');
    const downButton = document.querySelector('.switcher-down');
    
    // Update buttons
    if (upButton) {
      if (currentIndex === 0) {
        upButton.setAttribute('disabled', 'disabled');
      } else {
        upButton.removeAttribute('disabled');
      }
    }
    
    if (downButton) {
      if (currentIndex === NAV_STYLES.length - 1) {
        downButton.setAttribute('disabled', 'disabled');
      } else {
        downButton.removeAttribute('disabled');
      }
    }
  }
})();