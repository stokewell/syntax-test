/**
 * micro animations - animation framework
 * ultra-light javascript animation framework using vanilla JS and CSS
 * No dependencies, no build system required
 */

(function() {
  'use strict';
  
  // Animation registry
  const animations = new Map();
  
  // Animation sequence registry
  const sequences = new Map();
  
  // Default configuration
  const defaults = {
    duration: 300,             // Duration in ms
    easing: 'ease-in-out',     // CSS easing function
    delay: 0,                  // Delay in ms
    iterations: 1,             // Number of iterations (Infinity for infinite)
    direction: 'normal',       // Animation direction
    autoplay: true,            // Start immediately
    fillMode: 'forwards',      // What values apply before/after animation
    respectReducedMotion: true // Honor user's reduced motion preference
  };
  
  // Custom cubic-bezier easings
  const easings = {
    // Standard
    'linear': 'linear',
    'ease': 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
    
    // Custom named bezier curves
    'swift-out': 'cubic-bezier(0.55, 0, 0.1, 1)',
    'bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    'snappy': 'cubic-bezier(0.23, 1, 0.32, 1)',
    'elastic': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    'gentle': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    'anticipate': 'cubic-bezier(0.38, 0.01, 0.78, 0.13)',
    'elegant': 'cubic-bezier(0.2, 0.85, 0.4, 1)'
  };
  
  /**
   * Check if reduced motion is enabled
   * @return {boolean} True if reduced motion is preferred
   */
  const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  
  /**
   * Animation class that handles a single animation instance
   */
  class Animation {
    /**
     * Create a new animation
     * @param {Object} options - Animation configuration options
     */
    constructor(options) {
      this.id = 'anim_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      this.element = options.element;
      this.keyframes = options.keyframes || [];
      this.options = { ...defaults, ...options };
      this.animation = null;
      this.state = 'idle';
      this.progress = 0;
      this._callbacks = {
        start: [],
        update: [],
        complete: [],
        cancel: []
      };
      
      // Register callbacks if provided
      if (typeof this.options.onStart === 'function') this.onStart(this.options.onStart);
      if (typeof this.options.onUpdate === 'function') this.onUpdate(this.options.onUpdate);
      if (typeof this.options.onComplete === 'function') this.onComplete(this.options.onComplete);
      if (typeof this.options.onCancel === 'function') this.onCancel(this.options.onCancel);
      
      // Add this animation to the registry
      animations.set(this.id, this);
      
      // Autoplay if requested and reduced motion not enabled
      if (this.options.autoplay && !(this.options.respectReducedMotion && prefersReducedMotion())) {
        this.play();
      }
    }
    
    /**
     * Register start callback
     * @param {Function} callback - Function to call on animation start
     */
    onStart(callback) {
      this._callbacks.start.push(callback);
      return this;
    }
    
    /**
     * Register update callback
     * @param {Function} callback - Function to call on animation update
     */
    onUpdate(callback) {
      this._callbacks.update.push(callback);
      return this;
    }
    
    /**
     * Register complete callback
     * @param {Function} callback - Function to call on animation complete
     */
    onComplete(callback) {
      this._callbacks.complete.push(callback);
      return this;
    }
    
    /**
     * Register cancel callback
     * @param {Function} callback - Function to call on animation cancel
     */
    onCancel(callback) {
      this._callbacks.cancel.push(callback);
      return this;
    }
    
    /**
     * Execute callbacks of a specific type
     * @param {string} type - Type of callback to execute
     * @param {...any} args - Arguments to pass to callbacks
     */
    _executeCallbacks(type, ...args) {
      if (this._callbacks[type] && this._callbacks[type].length > 0) {
        this._callbacks[type].forEach(callback => callback(...args));
      }
    }
    
    /**
     * Start or resume the animation
     */
    play() {
      // Skip animation if reduced motion is preferred
      if (this.options.respectReducedMotion && prefersReducedMotion()) {
        // Apply final state immediately
        if (this.keyframes && this.keyframes.length) {
          const finalFrame = this.keyframes[this.keyframes.length - 1];
          this._applyStyles(finalFrame);
        }
        this.state = 'finished';
        this.progress = 1;
        this._executeCallbacks('complete', this);
        return this;
      }
      
      if (!this.element || !this.keyframes || this.keyframes.length === 0) {
        console.error('Cannot play animation: Invalid configuration');
        return this;
      }
      
      if (this.animation && this.state === 'paused') {
        this.animation.play();
        this.state = 'running';
        return this;
      }
      
      // Process easing
      let easing = this.options.easing;
      if (easings[easing]) {
        easing = easings[easing];
      }
      
      // Create Web Animation
      this.animation = this.element.animate(this.keyframes, {
        duration: this.options.duration,
        easing: easing,
        delay: this.options.delay,
        iterations: this.options.iterations,
        direction: this.options.direction,
        fill: this.options.fillMode
      });
      
      // Track state and trigger start callbacks
      this.state = 'running';
      this._executeCallbacks('start', this);
      
      // Set up callbacks
      this.animation.onfinish = () => {
        this.state = 'finished';
        this.progress = 1;
        this._executeCallbacks('complete', this);
      };
      
      // Track progress
      const updateProgress = () => {
        if (this.state === 'running') {
          const time = this.animation.currentTime || 0;
          const duration = this.options.duration;
          this.progress = Math.min(1, time / duration);
          
          // Execute update callbacks
          this._executeCallbacks('update', this.progress, this);
          
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
      
      return this;
    }
    
    /**
     * Apply styles from a keyframe directly to the element
     * @param {Object} styles - CSS properties to apply
     */
    _applyStyles(styles) {
      if (!this.element || !styles) return;
      
      Object.keys(styles).forEach(property => {
        if (property !== 'offset' && property !== 'easing' && property !== 'composite') {
          this.element.style[property] = styles[property];
        }
      });
    }
    
    /**
     * Pause the animation
     */
    pause() {
      if (this.animation && this.state === 'running') {
        this.animation.pause();
        this.state = 'paused';
      }
      return this;
    }
    
    /**
     * Cancel the animation and reset to initial state
     */
    cancel() {
      if (this.animation) {
        this.animation.cancel();
        this.state = 'idle';
        this.progress = 0;
        this._executeCallbacks('cancel', this);
      }
      return this;
    }
    
    /**
     * Immediately finish the animation
     */
    finish() {
      if (this.animation && this.state !== 'finished') {
        this.animation.finish();
        this.state = 'finished';
        this.progress = 1;
        this._executeCallbacks('complete', this);
      }
      return this;
    }
    
    /**
     * Update animation options
     * @param {Object} newOptions - New options to apply
     */
    updateOptions(newOptions) {
      this.options = { ...this.options, ...newOptions };
      
      // If we have an active animation, update its timing properties
      if (this.animation && this.state !== 'idle') {
        this.animation.updatePlaybackRate(1 / (this.options.duration / this.animation.effect.getTiming().duration));
      }
      
      return this;
    }
    
    /**
     * Clone this animation for another element
     * @param {HTMLElement} newElement - New element to animate
     * @return {Animation} New animation instance
     */
    clone(newElement) {
      return new Animation({
        ...this.options,
        element: newElement,
        keyframes: [...this.keyframes]
      });
    }
    
    /**
     * Reverse the animation
     */
    reverse() {
      if (this.animation) {
        this.animation.reverse();
      } else {
        // Manually reverse keyframes if animation hasn't started
        this.keyframes = [...this.keyframes].reverse();
      }
      return this;
    }
  }
  
  /**
   * Sequence class for chaining animations
   */
  class AnimationSequence {
    /**
     * Create a new animation sequence
     * @param {Object} options - Animation sequence options
     */
    constructor(options = {}) {
      this.id = 'seq_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      this.steps = [];
      this.currentStep = -1;
      this.options = { ...options };
      this.state = 'idle';
      this._callbacks = {
        start: [],
        complete: [],
        stepComplete: [],
        cancel: []
      };
      
      // Register callbacks if provided
      if (typeof this.options.onStart === 'function') this.onStart(this.options.onStart);
      if (typeof this.options.onComplete === 'function') this.onComplete(this.options.onComplete);
      if (typeof this.options.onStepComplete === 'function') this.onStepComplete(this.options.onStepComplete);
      if (typeof this.options.onCancel === 'function') this.onCancel(this.options.onCancel);
      
      // Add sequence to registry
      sequences.set(this.id, this);
    }
    
    /**
     * Add animation to the sequence
     * @param {Animation|Object} animation - Animation instance or configuration
     * @param {number} delay - Delay after previous animation (ms)
     */
    add(animation, delay = 0) {
      if (!(animation instanceof Animation)) {
        animation = new Animation(animation);
      }
      
      this.steps.push({
        animation,
        delay
      });
      
      return this;
    }
    
    /**
     * Add a delay step to the sequence
     * @param {number} duration - Duration of the delay in ms
     */
    delay(duration) {
      this.steps.push({
        isDelay: true,
        duration
      });
      
      return this;
    }
    
    /**
     * Register start callback
     * @param {Function} callback - Function to call on sequence start
     */
    onStart(callback) {
      this._callbacks.start.push(callback);
      return this;
    }
    
    /**
     * Register complete callback
     * @param {Function} callback - Function to call on sequence complete
     */
    onComplete(callback) {
      this._callbacks.complete.push(callback);
      return this;
    }
    
    /**
     * Register step complete callback
     * @param {Function} callback - Function to call when a step completes
     */
    onStepComplete(callback) {
      this._callbacks.stepComplete.push(callback);
      return this;
    }
    
    /**
     * Register cancel callback
     * @param {Function} callback - Function to call on sequence cancel
     */
    onCancel(callback) {
      this._callbacks.cancel.push(callback);
      return this;
    }
    
    /**
     * Execute callbacks of a specific type
     * @param {string} type - Type of callback to execute
     * @param {...any} args - Arguments to pass to callbacks
     */
    _executeCallbacks(type, ...args) {
      if (this._callbacks[type] && this._callbacks[type].length > 0) {
        this._callbacks[type].forEach(callback => callback(...args));
      }
    }
    
    /**
     * Start the sequence
     */
    play() {
      if (this.state === 'running') return this;
      
      if (this.steps.length === 0) {
        console.warn('Cannot play sequence: No steps defined');
        return this;
      }
      
      this.state = 'running';
      this.currentStep = -1;
      this._executeCallbacks('start', this);
      this._playNextStep();
      
      return this;
    }
    
    /**
     * Play the next step in the sequence
     */
    _playNextStep() {
      if (this.state !== 'running') return;
      
      this.currentStep++;
      
      if (this.currentStep >= this.steps.length) {
        this.state = 'finished';
        this._executeCallbacks('complete', this);
        return;
      }
      
      const step = this.steps[this.currentStep];
      
      if (step.isDelay) {
        // This is a delay step
        setTimeout(() => {
          this._executeCallbacks('stepComplete', this.currentStep, null, this);
          this._playNextStep();
        }, step.duration);
      } else {
        // This is an animation step
        const { animation, delay } = step;
        
        // Reset animation if it was already played
        if (animation.state === 'finished') {
          animation.cancel();
        }
        
        // Configure animation not to autoplay
        animation.options.autoplay = false;
        
        // Add completion callback
        animation.onComplete(anim => {
          this._executeCallbacks('stepComplete', this.currentStep, anim, this);
          setTimeout(() => this._playNextStep(), delay);
        });
        
        // Start the animation
        animation.play();
      }
    }
    
    /**
     * Cancel the sequence
     */
    cancel() {
      if (this.state !== 'running') return this;
      
      // Cancel current animation if there is one
      if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
        const step = this.steps[this.currentStep];
        if (!step.isDelay && step.animation) {
          step.animation.cancel();
        }
      }
      
      this.state = 'idle';
      this.currentStep = -1;
      this._executeCallbacks('cancel', this);
      
      return this;
    }
  }
  
  /**
   * Animation Group for running multiple animations in parallel
   */
  class AnimationGroup {
    /**
     * Create a new animation group
     * @param {Animation[]} animations - Initial animations to add to the group
     * @param {Object} options - Group options
     */
    constructor(animations = [], options = {}) {
      this.id = 'group_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      this.animations = [];
      this.options = { ...options };
      this.state = 'idle';
      this._callbacks = {
        start: [],
        complete: [],
        cancel: []
      };
      
      // Add initial animations
      animations.forEach(anim => this.add(anim));
      
      // Register callbacks if provided
      if (typeof this.options.onStart === 'function') this.onStart(this.options.onStart);
      if (typeof this.options.onComplete === 'function') this.onComplete(this.options.onComplete);
      if (typeof this.options.onCancel === 'function') this.onCancel(this.options.onCancel);
    }
    
    /**
     * Add animation to the group
     * @param {Animation|Object} animation - Animation instance or configuration
     */
    add(animation) {
      if (!(animation instanceof Animation)) {
        animation = new Animation(animation);
      }
      
      this.animations.push(animation);
      return this;
    }
    
    /**
     * Register start callback
     * @param {Function} callback - Function to call on group start
     */
    onStart(callback) {
      this._callbacks.start.push(callback);
      return this;
    }
    
    /**
     * Register complete callback
     * @param {Function} callback - Function to call on group complete
     */
    onComplete(callback) {
      this._callbacks.complete.push(callback);
      return this;
    }
    
    /**
     * Register cancel callback
     * @param {Function} callback - Function to call on group cancel
     */
    onCancel(callback) {
      this._callbacks.cancel.push(callback);
      return this;
    }
    
    /**
     * Execute callbacks of a specific type
     * @param {string} type - Type of callback to execute
     * @param {...any} args - Arguments to pass to callbacks
     */
    _executeCallbacks(type, ...args) {
      if (this._callbacks[type] && this._callbacks[type].length > 0) {
        this._callbacks[type].forEach(callback => callback(...args));
      }
    }
    
    /**
     * Start all animations in the group
     */
    play() {
      if (this.state === 'running') return this;
      
      if (this.animations.length === 0) {
        console.warn('Cannot play group: No animations defined');
        return this;
      }
      
      this.state = 'running';
      this._executeCallbacks('start', this);
      
      // Track completion
      let completedCount = 0;
      
      // Set up completion tracking
      const onComplete = () => {
        completedCount++;
        if (completedCount === this.animations.length) {
          this.state = 'finished';
          this._executeCallbacks('complete', this);
        }
      };
      
      // Play all animations
      this.animations.forEach(animation => {
        animation.onComplete(onComplete);
        animation.play();
      });
      
      return this;
    }
    
    /**
     * Cancel all animations in the group
     */
    cancel() {
      if (this.state !== 'running') return this;
      
      this.animations.forEach(animation => animation.cancel());
      
      this.state = 'idle';
      this._executeCallbacks('cancel', this);
      
      return this;
    }
    
    /**
     * Pause all animations in the group
     */
    pause() {
      if (this.state !== 'running') return this;
      
      this.animations.forEach(animation => animation.pause());
      this.state = 'paused';
      
      return this;
    }
    
    /**
     * Resume all animations in the group
     */
    resume() {
      if (this.state !== 'paused') return this;
      
      this.animations.forEach(animation => animation.play());
      this.state = 'running';
      
      return this;
    }
  }
  
  /**
   * Predefined animation presets
   */
  const presets = {
    // Fades
    fadeIn: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { opacity: 0 },
          { opacity: 1 }
        ],
        ...customOptions
      });
    },
    
    fadeOut: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { opacity: 1 },
          { opacity: 0 }
        ],
        ...customOptions
      });
    },
    
    // Slides
    slideInRight: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'translateX(100%)', opacity: 0 },
          { transform: 'translateX(0)', opacity: 1 }
        ],
        easing: 'snappy',
        ...customOptions
      });
    },
    
    slideInLeft: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'translateX(-100%)', opacity: 0 },
          { transform: 'translateX(0)', opacity: 1 }
        ],
        easing: 'snappy',
        ...customOptions
      });
    },
    
    slideInUp: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'translateY(30px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ],
        easing: 'smooth',
        ...customOptions
      });
    },
    
    slideInDown: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'translateY(-30px)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ],
        easing: 'smooth',
        ...customOptions
      });
    },
    
    // Scale animations
    zoomIn: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'scale(0.8)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ],
        easing: 'smooth',
        ...customOptions
      });
    },
    
    zoomOut: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.8)', opacity: 0 }
        ],
        easing: 'smooth',
        ...customOptions
      });
    },
    
    // Attention seekers
    pulse: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'scale(1)' },
          { transform: 'scale(1.05)' },
          { transform: 'scale(1)' }
        ],
        easing: 'elastic',
        ...customOptions
      });
    },
    
    shake: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(0)' }
        ],
        duration: 500,
        ...customOptions
      });
    },
    
    bounce: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-15px)' },
          { transform: 'translateY(0)', offset: 0.4 },
          { transform: 'translateY(-8px)' },
          { transform: 'translateY(0)' }
        ],
        easing: 'bounce',
        duration: 800,
        ...customOptions
      });
    },
    
    // Rotations
    rotateIn: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'rotate(-90deg)', opacity: 0 },
          { transform: 'rotate(0)', opacity: 1 }
        ],
        easing: 'snappy',
        ...customOptions
      });
    },
    
    flipX: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { transform: 'perspective(400px) rotateX(90deg)', opacity: 0 },
          { transform: 'perspective(400px) rotateX(0)', opacity: 1, offset: 0.4 },
          { transform: 'perspective(400px) rotateX(10deg)', offset: 0.6 },
          { transform: 'perspective(400px) rotateX(-5deg)', offset: 0.8 },
          { transform: 'perspective(400px) rotateX(0)', opacity: 1 }
        ],
        easing: 'snappy',
        duration: 800,
        ...customOptions
      });
    },
    
    // New luxury animations
    luxuryReveal: (element, customOptions = {}) => {
      return new Animation({
        element,
        keyframes: [
          { opacity: 0, transform: 'scale(0.97) translateY(10px)' },
          { opacity: 0.5, transform: 'scale(0.98) translateY(5px)', offset: 0.3 },
          { opacity: 1, transform: 'scale(1) translateY(0)' }
        ],
        easing: 'elegant',
        duration: 1000,
        ...customOptions
      });
    },
    
    highlight: (element, customOptions = {}) => {
      // Get current background color
      const computedStyle = window.getComputedStyle(element);
      const originalBg = computedStyle.backgroundColor;
      
      return new Animation({
        element,
        keyframes: [
          { backgroundColor: originalBg },
          { backgroundColor: 'rgba(255, 255, 0, 0.3)' },
          { backgroundColor: originalBg }
        ],
        duration: 1500,
        ...customOptions
      });
    },
    
    typewriter: (element, customOptions = {}) => {
      // This is special - we need to handle the content differently
      const text = element.textContent;
      const reduce = customOptions.respectReducedMotion !== false && prefersReducedMotion();
      if (reduce) {
        return new Animation({
          element,
          keyframes: [{ opacity: 1 }, { opacity: 1 }],
          ...customOptions,
          autoplay: false
        });
      }
      element.textContent = '';
      element.style.width = 'fit-content';
      element.style.whiteSpace = 'pre';
      
      const options = {
        duration: text.length * 100,
        easing: 'linear',
        ...customOptions
      };
      
      // Create a different kind of animation that manipulates content
      const animation = new Animation({
        element,
        keyframes: [
          { opacity: 1 }, // Dummy keyframe
          { opacity: 1 }  // The typing effect is handled via callback
        ],
        ...options
      });
      
      // Handle the typing animation
      let lastCharIndex = 0;
      animation.onUpdate((progress) => {
        const targetIndex = Math.floor(text.length * progress);
        if (targetIndex > lastCharIndex) {
          element.textContent = text.substring(0, targetIndex);
          lastCharIndex = targetIndex;
        }
      });
      
      return animation;
    },
    
    letterSpacing: (element, customOptions = {}) => {
      // Get current letter spacing
      const computedStyle = window.getComputedStyle(element);
      const originalSpacing = computedStyle.letterSpacing === 'normal' ? '0px' : computedStyle.letterSpacing;
      
      return new Animation({
        element,
        keyframes: [
          { letterSpacing: originalSpacing },
          { letterSpacing: '0.2em' },
          { letterSpacing: originalSpacing }
        ],
        easing: 'smooth',
        duration: 800,
        ...customOptions
      });
    }
  };
  
  /**
   * Set up scroll-triggered animations
   */
  const initScrollAnimations = () => {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported in this browser. Scroll animations disabled.');
      return;
    }
    
    const elements = document.querySelectorAll('[data-animation]');
    if (!elements.length) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const animationName = element.getAttribute('data-animation');
          const delay = parseInt(element.getAttribute('data-animation-delay') || 0, 10);
          const duration = parseInt(element.getAttribute('data-animation-duration') || 0, 10);
          const easing = element.getAttribute('data-animation-easing');
          const iterations = element.getAttribute('data-animation-iterations');
          
          // Collect all animation options from data attributes
          const options = { delay, autoplay: true };
          if (duration) options.duration = duration;
          if (easing) options.easing = easing;
          if (iterations) options.iterations = iterations === 'infinite' ? Infinity : parseInt(iterations, 10);
          
          // Apply the animation if it exists
          if (presets[animationName] && typeof presets[animationName] === 'function') {
            presets[animationName](element, options);
          }
          
          // Only animate once by default unless data-animation-repeat is set
          if (!element.hasAttribute('data-animation-repeat')) {
            observer.unobserve(element);
          }
        }
      });
    }, {
      threshold: [0.15],
      rootMargin: '0px 0px -10% 0px'
    });
    
    elements.forEach(element => {
      observer.observe(element);
    });
    
    return observer;
  };
  
  /**
   * Setup staggered animations for a group of elements
   * @param {NodeList|Array} elements - Elements to animate
   * @param {string|Function} animation - Animation name or function
   * @param {Object} options - Animation options
   */
  const staggerElements = (elements, animation, options = {}) => {
    if (!elements || !elements.length) return null;
    
    const staggerDelay = options.staggerDelay || 100;
    const group = new AnimationGroup();
    const animationFunc = typeof animation === 'string' ? presets[animation] : animation;
    
    if (!animationFunc) {
      console.error(`Animation "${animation}" not found`);
      return null;
    }
    
    Array.from(elements).forEach((element, index) => {
      const elementOptions = {
        ...options,
        delay: (options.delay || 0) + (index * staggerDelay),
        autoplay: false
      };
      
      const anim = animationFunc(element, elementOptions);
      group.add(anim);
    });
    
    return group;
  };
  
  /**
   * Generate CSS for all animations to be used without JS
   * @return {string} CSS styles for animations
   */
  const generateCSS = () => {
    let css = `/* Animations Framework - Generated CSS */\n\n`;
    
    // Helper to convert Web Animations keyframes to CSS format
    const keyframesToCSS = (name, keyframes) => {
      let css = `@keyframes ${name} {\n`;
      
      keyframes.forEach((keyframe, index) => {
        const percentage = keyframe.offset !== undefined 
          ? Math.round(keyframe.offset * 100) 
          : (index === 0 ? 0 : index === keyframes.length - 1 ? 100 : Math.round((index / (keyframes.length - 1)) * 100));
        
        css += `  ${percentage}% {\n`;
        
        Object.keys(keyframe).forEach(property => {
          if (property !== 'offset' && property !== 'easing' && property !== 'composite') {
            // Convert camelCase to kebab-case
            const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
            css += `    ${kebabProperty}: ${keyframe[property]};\n`;
          }
        });
        
        css += `  }\n`;
      });
      
      css += `}\n\n`;
      return css;
    };
    
    // Generate keyframes and animation classes for all presets
    Object.keys(presets).forEach(presetName => {
      // Create a dummy element to extract keyframes
      const dummyEl = document.createElement('div');
      document.body.appendChild(dummyEl);
      
      // Get the keyframes
      const animation = presets[presetName](dummyEl, { autoplay: false });
      const keyframes = animation.keyframes;
      
      // Remove the dummy element
      document.body.removeChild(dummyEl);
      
      // Generate keyframe CSS
      css += keyframesToCSS(`ani-${presetName}`, keyframes);
      
      // Generate the class
      css += `.ani-${presetName} {\n`;
      css += `  animation-name: ani-${presetName};\n`;
      css += `  animation-duration: ${animation.options.duration}ms;\n`;
      css += `  animation-timing-function: ${animation.options.easing};\n`;
      css += `  animation-fill-mode: ${animation.options.fillMode};\n`;
      css += `  animation-iteration-count: ${animation.options.iterations === Infinity ? 'infinite' : animation.options.iterations};\n`;
      css += `}\n\n`;
    });
    
    // Add utility classes
    css += `/* Utility classes */\n`;
    css += `.ani-delay-100 { animation-delay: 100ms; }\n`;
    css += `.ani-delay-300 { animation-delay: 300ms; }\n`;
    css += `.ani-delay-500 { animation-delay: 500ms; }\n`;
    css += `.ani-delay-1000 { animation-delay: 1000ms; }\n\n`;
    
    css += `.ani-duration-fast { animation-duration: 300ms; }\n`;
    css += `.ani-duration-normal { animation-duration: 500ms; }\n`;
    css += `.ani-duration-slow { animation-duration: 1000ms; }\n\n`;
    
    // Add support for reduced motion
    css += `/* Respect user preferences */\n`;
    css += `@media (prefers-reduced-motion: reduce) {\n`;
    css += `  .ani-respect-motion-preferences {\n`;
    css += `    animation: none !important;\n`;
    css += `    transition: none !important;\n`;
    css += `  }\n`;
    css += `}\n`;
    
    return css;
  };
  
  /**
   * Add CSS to the page
   */
  const injectCSS = () => {
    const css = generateCSS();
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  };
  
  // Initialize scroll animations when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initScrollAnimations();
    });
  } else {
    initScrollAnimations();
  }
  
  // Export the public API
  window.animationFramework = {
    // Core classes
    Animation,
    AnimationSequence,
    AnimationGroup,
    
    // Utilities
    create: options => new Animation(options),
    createSequence: options => new AnimationSequence(options),
    createGroup: (animations, options) => new AnimationGroup(animations, options),
    stagger: staggerElements,
    
    // Presets
    presets,
    easings,
    
    // Registry access
    get: id => animations.get(id) || sequences.get(id),
    getAll: () => ({
      animations: Array.from(animations.values()),
      sequences: Array.from(sequences.values())
    }),
    
    // Initialization and helpers
    initScrollAnimations,
    prefersReducedMotion,
    generateCSS,
    injectCSS
  };
  
  // Add a global event listener for animation debugging
  if (location.search.includes('debug-animations')) {
    window.addEventListener('keydown', (e) => {
      // Ctrl+Shift+A to log all animations
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        console.log('--- Animation Framework Debug ---');
        console.log('Active animations:', animations.size);
        console.log('Active sequences:', sequences.size);
        console.table(Array.from(animations.entries()).map(([id, anim]) => ({
          id,
          state: anim.state,
          progress: anim.progress,
          element: anim.element.tagName + (anim.element.id ? `#${anim.element.id}` : '')
        })));
      }
    });
  }
})();