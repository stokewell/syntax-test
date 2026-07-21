# Component Lab

[`/lab/`](https://stokewell.github.io/syntax/lab/) is the exhaustive public proving ground for Syntax. The overview page stays concise; the lab demonstrates the full supported surface without adding demo code to the production bundle.

## Coverage

- Responsive Image with ratio, lazy loading, alt text, and caption slot
- Custom Card with plain, image, shadow, clickable, keyboard, content, and footer states
- Toggle Switch in default, checked, disabled, and live-output states
- Tabs Container with arrow-key, Home, and End navigation
- Standard buttons, alerts, cards, image cards, accordions, and modal dialog
- Blog, portfolio, magazine, and dashboard layouts
- Heading hierarchy, inline elements, blockquote, keyboard input, lists, definition lists
- Long-heading, justified-copy, multilingual, RTL, and deeply nested list stress tests
- Fade, slide, pulse, shake, sequence, stagger, typewriter, letter-spacing, luxury reveal, and scroll-triggered motion
- All supported font pairings through the shared font configuration

## Scope rule

The lab may contain presentation helpers and interaction wiring in `lab/lab.css` and `lab/lab.js`. Those files are never included in `dist/syntax.css` or `dist/syntax.js`.

A capability belongs in framework source only when it is reusable outside the lab. The lab must consume that capability through the same public API a user would use.

## Accessibility contract

The lab validates open Shadow DOM as part of the accessibility tree. Custom elements must provide valid alternative text, avoid nested interactive controls, and keep ARIA relationships within the same DOM scope. Lazy media tests scroll each asset into view before checking its decoded dimensions.

## Validation

Run the complete lint, formatting, unit, build, desktop/mobile browser, image-loading, interaction, reduced-motion, and accessibility checks with:

```bash
npm run check
```
