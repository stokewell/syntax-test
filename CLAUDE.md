# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Build/Preview: Open `demo/index.html` or `demo/components.html` in a browser
- Lint: No specific linters configured (consider adding eslint/stylelint)
- Test: No automated tests configured

## Performance Optimizations

- Lazy loading of Google Fonts: Only loads selected font pairing on demand
- Optimized font weights: Loads only necessary weights for each font
- Font display swap: Prevents invisible text during font loading
- Optimized image loading with IntersectionObserver
- Modular CSS and JS structure for better maintainability and performance

## Code Style Guidelines

### CSS
- Use CSS variables from `tokens.css` for consistency
- Follow mobile-first approach in media queries
- Use class-based styling with semantic naming
- Maintain 8px baseline grid (`--baseline` variable)
- Organize imports in order: tokens → reset → base → components → layouts → themes
- Keep CSS modular with component-specific files in the `components` directory
- Support dark mode with theme variables and [data-theme="dark"] selectors
- Apply letter-spacing and word-spacing to specific text elements (p, li, blockquote) not globally
- Adjust spacing for specific font families using data-font attributes
- Use modern button styles with subtle shadows instead of borders
- Available font pairings include serif+sans-serif options and an all sans-serif pairing (Syne + Outfit)
- Use backdrop-filter for controls that overlay content (modals, floating controls)
- Implement subtle hover and active states for interactive elements
- Structure component demos with clear hierarchy and proper spacing
- Provide visual feedback for state changes in interactive components
- Use custom focus styles that maintain accessibility while matching design aesthetic
- Implement smooth animations for transitions between states using CSS variables for timing
- Create depth with subtle shadows and translucent overlays
- Design floating controls that remain accessible without obstructing content
- Prevent widows in important UI text with text-wrap: pretty and fallbacks
- Use scroll-padding-top for proper anchor link positioning with fixed headers
- Implement refined focus indicators that maintain accessibility without jarring outlines

### JavaScript
- Organize JS files into directories: utilities, components, and development
- Use IIFE pattern for module encapsulation
- Follow descriptive variable/function naming
- Include JSDoc comments for functions
- Store user preferences in localStorage when needed
- Use requestAnimationFrame for animations and transitions
- Ensure accessibility with proper ARIA attributes and keyboard support
- Use Web Components API for custom elements
- Support both light and dark themes
- Prevent bright flashes when loading images in dark mode
- Implement interactive UI controls with proper state management
- Use CSS class toggling for state-based styling (e.g., toggle-on/toggle-off)
- Create intuitive font selection UI with visual previews of actual fonts
- Ensure fixed UI controls do not interfere with page content
- Provide visual feedback for user interactions
- Use direct style manipulation with CSS variables for complex animations
- Implement reliable tab systems with smooth transitions and anchor link support
- Add modal components with focus trapping and keyboard navigation
- Force DOM reflows when needed to ensure animation consistency (void element.offsetWidth)
- Apply proper error handling for UI interactions
- Implement progressive enhancement with fallbacks for modern features
- Feature detection for modern CSS properties with JS fallbacks
- Enhanced navigation system with dropdown and direct anchor linking
- Support for widow prevention in text elements across browsers
- Proper hash-based navigation with fixed header offset handling

### HTML
- Use semantic HTML elements
- Include proper accessibility attributes (aria-* roles, labels)
- Add appropriate meta tags for SEO and Open Graph
- Follow BEM-like class naming convention
- Keep markup clean and minimal
- Use lazy-loading for images
- Include favicons and webmanifest
- Use flexbox for navigation components
- Use non-breaking spaces (&nbsp;) strategically to prevent widows
- Implement proper anchor link placement considering fixed headers
- Use screen-reader only text (sr-only) for improved accessibility
- Add descriptive aria-labels to SVG icons and interactive elements

### Web Components
- Extend BaseComponent for new custom elements
- Maintain shadow DOM encapsulation when appropriate
- Follow the naming convention with lowercase hyphenated names
- Ensure components are accessible with keyboard navigation and proper ARIA roles
- Handle both light and dark themes consistently
- Make interactive elements (like toggles) properly clickable
- Include proper event handling (stopPropagation, preventDefault as needed)
- Support proper focus handling

### Project Structure
- CSS organization:
  - Base files: tokens.css, reset.css, base.css
  - Component files in `/css/components/` directory
  - Layout system: layouts.css
  - Theme system: themes.css
  - Typography utilities: typography.css
  - Entry point: style.css
- JS organization:
  - Core utilities in `/js/utilities/` directory
  - UI components in `/js/components/` directory
  - Debug tools in `/js/development/` directory
  - Typography utilities: text-utils.js
  - Entry point: main.js
- Modern navigation system:
  - Flex-based layout
  - Animated link interactions
  - Mobile-friendly design
  - Accessible dropdowns with parent navigation
  - Split button/link pattern for dropdowns
  - Smooth hover and focus effects
  - Anchor link support with fixed header offsets
- Layout system supports: standard, blog, portfolio, magazine, dashboard
- Demo pages showcase all available components and layouts
- Key pages:
  - `demo/index.html`: Refined landing page with feature showcase, tabbed component demos, and enhanced typography controls
  - `demo/components.html`: Original components demo page (now superseded by new index.html)
- Include documentation files (CLAUDE.md, README.md, CREDITS.md)
- Font selection UI includes a modal with visual previews showing actual font samples
- Fixed position UI controls for theme and typography changes
- Enhanced tab system with smooth animations and anchor link navigation
- Modal system with backdrop blur, animations, and proper focus management
- Custom focus styles that maintain accessibility while fitting design aesthetic
- Advanced widow prevention system with modern CSS and JavaScript fallbacks
- Proper attributed third-party resources with documentation