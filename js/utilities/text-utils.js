/**
 * Text utilities for improved typography
 * Includes widow prevention for browsers without text-wrap: pretty support
 */

(function() {
  'use strict';
  
  // Check if browser supports text-wrap: pretty
  function supportsTextWrapPretty() {
    const testEl = document.createElement('div');
    testEl.style.textWrap = 'pretty';
    return testEl.style.textWrap === 'pretty';
  }
  
  // Function to prevent widows in text
  function preventWidows() {
    // Only run if the browser doesn't support text-wrap: pretty
    if (supportsTextWrapPretty()) return;
    
    // Get all important text elements that might need widow prevention
    const elements = document.querySelectorAll(
      '.section-subtitle, .tab-description, .section-description, .hero-description, .feature-card p'
    );
    
    elements.forEach(element => {
      // Add class for CSS specificity
      element.classList.add('js-prevent-widows');
      
      // Get text content
      const text = element.innerHTML.trim();
      
      // Find the last space
      const lastSpace = text.lastIndexOf(' ');
      
      // If there's a space (and it's not too close to the end)
      if (lastSpace !== -1 && lastSpace > text.length - 20) {
        // Replace the last space with a non-breaking space
        const newText = text.substring(0, lastSpace) + '&nbsp;' + text.substring(lastSpace + 1);
        element.innerHTML = newText;
      }
    });
  }
  
  // Run on page load
  document.addEventListener('DOMContentLoaded', preventWidows);
})();