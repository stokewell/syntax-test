# Syntax

[Overview](https://stokewell.github.io/syntax/) · [Component Lab](https://stokewell.github.io/syntax/lab/) · [Use this template](https://github.com/stokewell/syntax/generate) · [Report an issue](https://github.com/stokewell/syntax/issues)

Syntax is a **typography-first website starter and lightweight design system for handcrafted content sites**. It provides expressive type, practical layout primitives, accessible components, explicit theming, and zero runtime dependencies.

Syntax grew from the earlier [Base](https://github.com/stokewell/base) project. The framework keeps a dependable production core while the dedicated Component Lab provides an exhaustive public proving ground for the broader supported surface.

## What is in core

- Semantic HTML and a modern CSS foundation
- Design tokens for color, spacing, typography, shape, elevation, motion, and layering
- Responsive containers, grids, utilities, and editorial layouts
- Buttons, cards, forms, alerts, navigation, dialogs, tabs, and accordions
- Explicit `system`, `light`, and `dark` theme preferences
- Eight curated font pairings backed by one canonical configuration
- Native custom elements for responsive images, cards, toggles, and tabs
- A dependency-free micro-animation API with reduced-motion support
- Keyboard behavior and resilient focus management
- A build that produces `dist/syntax.css` and `dist/syntax.js`

## Overview and Component Lab

The public surfaces have separate jobs:

- [`/demo/`](https://stokewell.github.io/syntax/demo/) is the polished product overview and quick-start showcase.
- [`/lab/`](https://stokewell.github.io/syntax/lab/) is the exhaustive component, layout, media, typography, accessibility, and motion test surface.

The lab consumes the same public framework files users receive. Its own `lab/lab.css` and `lab/lab.js` are demonstration-only and are never included in the production bundle. See [docs/COMPONENT_LAB.md](docs/COMPONENT_LAB.md) for the coverage contract.

## Optional modules

The CSS foundation does not require JavaScript. Font previews, custom elements, navigation behavior, dialogs, and animation utilities can be loaded only when a project needs them. Syntax remains a starter and design system rather than an application framework.

## Quick start

### Use the repository as a template

Select **Use this template** on GitHub, then clone your new repository.

### Install development tools

```bash
npm install
npx playwright install chromium
```

### Run checks and build

```bash
npm run check
```

The production bundle is generated in `dist/`:

```html
<link rel="stylesheet" href="dist/syntax.css" />
<script src="dist/syntax.js" defer></script>
```

During development, the modular source files can be loaded directly:

```html
<link rel="stylesheet" href="css/style.css" />

<script src="js/config/font-pairs.js" defer></script>
<script src="js/utilities/theme-toggle.js" defer></script>
<script src="js/utilities/font-switcher.js" defer></script>
<script src="js/components/navigation.js" defer></script>
<script src="js/components/modal.js" defer></script>
<script src="js/components/web-components.js" defer></script>
<script src="js/utilities/micro-animations.js" defer></script>
<script src="js/main.js" defer></script>
```

## Project structure

```text
syntax/
├── css/
│   ├── tokens.css
│   ├── reset.css
│   ├── base.css
│   ├── themes.css
│   ├── layouts.css
│   ├── style.css
│   └── components/
├── js/
│   ├── config/font-pairs.js
│   ├── components/
│   ├── utilities/
│   └── main.js
├── demo/
│   ├── index.html
│   └── demo.css
├── lab/
│   ├── index.html
│   ├── lab.css
│   └── lab.js
├── scripts/build.mjs
├── tests/
└── docs/
    ├── STYLE_GUIDE.md
    └── COMPONENT_LAB.md
```

## Design tokens

Customize Syntax through semantic variables rather than component-specific overrides:

```css
:root {
  --color-primary: #067474;
  --color-on-primary: #fff;
  --font-heading: 'EB Garamond', Georgia, serif;
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --radius-lg: 1rem;
  --space-3: 1.5rem;
}
```

The light and dark themes redefine semantic roles such as `--color-bg`, `--color-surface`, `--color-text`, and `--color-border`. Components consume these roles rather than introducing isolated colors.

## Theme controller

Syntax stores an explicit preference instead of silently converting the system setting into a permanent override:

```js
SyntaxTheme.setPreference('system');
SyntaxTheme.setPreference('light');
SyntaxTheme.setPreference('dark');
```

## Font pairings

All pairings live in `js/config/font-pairs.js`. The selector UI, Google Fonts request, CSS variables, and saved preference derive from that single source.

```js
SyntaxFonts.applyPair('modernSans');
```

The current set includes Editorial, Contemporary, Scholarly, Literary, Bookish, Modern Sans, Classic, and Geometric pairings. Font files are requested only when a pairing is selected.

## Components

### Responsive image

```html
<responsive-image src="image.jpg" alt="Description" aspect-ratio="16:9" lazy>
  <span slot="caption">Optional caption</span>
</responsive-image>
```

### Custom card

```html
<custom-card title="Card title" image="image.jpg" shadow-level="2" clickable>
  <p>Card content.</p>
  <div slot="footer">Footer content</div>
</custom-card>
```

### Dialog

```html
<button data-modal-target="example-dialog">Open dialog</button>

<div
  id="example-dialog"
  class="modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  hidden
>
  <div class="modal-content">
    <button data-modal-close aria-label="Close dialog">×</button>
    <h2 id="dialog-title">Dialog title</h2>
    <p>Dialog content.</p>
  </div>
</div>
```

The controller traps focus, closes on Escape, and restores focus to the original trigger.

### Toggle switch

```html
<toggle-switch label="Email summaries" checked></toggle-switch>
```

### Tabs

```html
<tabs-container>
  <tab-item label="First" selected>First panel</tab-item>
  <tab-item label="Second">Second panel</tab-item>
</tabs-container>
```

The tabs component preserves its light-DOM content and supports Arrow keys, Home, and End.

## Motion API

The micro-animation utility exposes presets, groups, sequences, staggering, scroll-triggered attributes, and named easings:

```js
animationFramework.presets.luxuryReveal(element);
animationFramework.stagger(items, 'slideInUp', { staggerDelay: 90 }).play();
```

Every animation honors `prefers-reduced-motion` by default.

## Quality checks

- ESLint for framework, lab, build, and test JavaScript
- Stylelint for canonical and lab CSS
- Prettier formatting checks
- Vitest unit tests
- Playwright desktop and mobile smoke tests
- Component Lab coverage tests
- axe-core checks for serious and critical accessibility violations
- GitHub Actions on pushes and pull requests

Automated checks support, but do not replace, manual keyboard, screen-reader, and real-device testing.

## Browser support

Syntax targets current evergreen browsers. Progressive enhancement is preferred: core content remains usable without JavaScript, while dialogs, navigation, font previews, animations, and custom elements add behavior when JavaScript is available.

## Status

The current release is **v1.2 — Component Lab**. It restores the full demonstrable framework surface without adding lab-only code to the production bundle.

## License

MIT. See [LICENSE](LICENSE).
