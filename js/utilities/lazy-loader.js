/**
 * Responsive Images + Lazy Loading
 * A lightweight solution for optimized image loading
 */

(function() {
  // Feature detection
  const hasIntersectionObserver = 'IntersectionObserver' in window;
  const hasNativeLazyLoading = 'loading' in HTMLImageElement.prototype;
  
  // Configuration
  const config = {
    rootMargin: '200px 0px',
    threshold: 0.01
  };
  
  // CSS class names
  const CLASS_LOADING = 'lazy-loading';
  const CLASS_LOADED = 'lazy-loaded';
  const CLASS_ERROR = 'lazy-error';
  
  // Image sources
  const DATA_SRC = 'data-src';
  const DATA_SRCSET = 'data-srcset';
  const DATA_SIZES = 'data-sizes';
  
  /**
   * Load image when it enters viewport
   * @param {HTMLElement} img - Image element to load
   */
  const loadImage = (img) => {
    img.classList.add(CLASS_LOADING);
    
    // Get image sources from data attributes
    const src = img.getAttribute(DATA_SRC);
    const srcset = img.getAttribute(DATA_SRCSET);
    const sizes = img.getAttribute(DATA_SIZES);
    
    // Set the actual src, srcset and sizes
    if (srcset) {
      img.srcset = srcset;
    }
    
    if (sizes) {
      img.sizes = sizes;
    }
    
    if (src) {
      img.src = src;
    }
    
    // Handle load and error events
    const handleLoad = () => {
      img.classList.remove(CLASS_LOADING);
      img.classList.add(CLASS_LOADED);
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      
      // Dispatch event
      img.dispatchEvent(new CustomEvent('lazyloaded'));
    };
    
    const handleError = () => {
      img.classList.remove(CLASS_LOADING);
      img.classList.add(CLASS_ERROR);
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      
      // Apply fallback source if available
      const fallback = img.getAttribute('data-fallback');
      if (fallback && !img.src.includes(fallback)) {
        img.src = fallback;
      }
      
      // Dispatch event
      img.dispatchEvent(new CustomEvent('lazyerror'));
    };
    
    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);
  };
  
  /**
   * Initialize Intersection Observer for lazy loading
   * @param {NodeList} images - Collection of images to observe
   */
  const setupIntersectionObserver = (images) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, config);
    
    images.forEach(img => {
      observer.observe(img);
    });
  };
  
  /**
   * Handle images when the browser doesn't support Intersection Observer
   * @param {NodeList} images - Collection of images to load
   */
  const loadImagesImmediately = (images) => {
    images.forEach(loadImage);
  };
  
  /**
   * Initialize responsive image lazy loading
   */
  const init = () => {
    // Get all images with data-src attribute
    const lazyImages = document.querySelectorAll(`img[${DATA_SRC}]`);
    
    if (!lazyImages.length) {
      return;
    }
    
    // If native lazy loading is supported
    if (hasNativeLazyLoading) {
      lazyImages.forEach(img => {
        img.loading = 'lazy';
        loadImage(img);
      });
      return;
    }
    
    // If Intersection Observer is supported
    if (hasIntersectionObserver) {
      setupIntersectionObserver(lazyImages);
    } else {
      // Fallback for older browsers
      loadImagesImmediately(lazyImages);
    }
  };
  
  // Initialize when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose API for manual initialization
  window.lazyLoader = {
    load: (img) => loadImage(img),
    refresh: init
  };
})();