# JavaScript Organization

This directory contains all JavaScript files for the Typography-First framework, organized into a modular structure for maintainability and reduced code complexity.

## Directory Structure

- `/js/main.js` - Main entry point and initialization
- `/js/utilities/` - Core utility functions and features
  - `theme-toggle.js` - Theme toggling functionality
  - `font-switcher.js` - Font pairing selection and management
  - `lazy-loader.js` - Lazy loading for images and heavy content
  - `micro-animations.js` - Lightweight animation framework
- `/js/components/` - UI components and widgets
  - `web-components.js` - Custom elements using the Web Components API
  - `modal.js` - Modal dialogs and popovers
  - `navigation.js` - Mobile and desktop navigation system
- `/js/development/` - Debugging and development tools (not used in production)

## Usage

Import scripts in the following order to ensure proper functionality:

1. Main JS file first
2. Utilities next
3. Components last

```html
<!-- Main Framework JS -->
<script src="../js/main.js" defer></script>

<!-- Utilities -->
<script src="../js/utilities/theme-toggle.js" defer></script>
<script src="../js/utilities/font-switcher.js" defer></script>
<script src="../js/utilities/lazy-loader.js" defer></script>
<script src="../js/utilities/micro-animations.js" defer></script>

<!-- Components -->
<script src="../js/components/web-components.js" defer></script>
<script src="../js/components/modal.js" defer></script>
<script src="../js/components/navigation.js" defer></script>
```

## Development Best Practices

- Each file should focus on a single responsibility
- Follow the IIFE pattern for all modules to avoid global namespace pollution
- Use descriptive variable and function names
- Include JSDoc comments for all functions
- Use `requestAnimationFrame` for animations and transitions
- Store user preferences in localStorage when needed
- Ensure accessibility with proper ARIA attributes and keyboard support