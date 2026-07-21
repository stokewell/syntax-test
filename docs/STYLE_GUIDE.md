# Syntax style guide

This guide defines the visual and implementation rules for Syntax. The source of truth is the code in `css/tokens.css`, `css/themes.css`, and `js/config/font-pairs.js`.

## Product principle

Syntax is a typography-first website starter and lightweight design system. It should feel deliberate and expressive without becoming ornamental or difficult to maintain.

The core principles are:

1. **Typography is structural.** Type establishes hierarchy, pacing, and character.
2. **Semantic tokens precede component values.** Components consume roles such as `--color-surface`, not isolated hex codes.
3. **Progressive enhancement is the default.** Content and links remain useful without JavaScript.
4. **Accessibility claims require evidence.** Keyboard behavior, contrast, focus visibility, reduced motion, and automated checks are release criteria.
5. **Runtime stays dependency-free.** Development tools may be used to validate and package the source.

## Color system

### Light theme

| Role            | Token                    | Value     |
| --------------- | ------------------------ | --------- |
| Page background | `--color-bg`             | `#fbfaf8` |
| Surface         | `--color-surface`        | `#f3efea` |
| Primary text    | `--color-text`           | `#24211f` |
| Secondary text  | `--color-text-secondary` | `#625c57` |
| Primary action  | `--color-primary`        | `#087f7f` |
| Text on primary | `--color-on-primary`     | `#ffffff` |

The light-theme primary action and white foreground meet WCAG AA contrast for normal text. When changing either token, test the pair as a unit.

### Dark theme

Dark mode uses a lighter primary color with a dark `--color-on-primary` foreground. Do not assume white belongs on every saturated color.

### Rules

- Use semantic roles in components.
- Add a new token only when a recurring design decision cannot be represented by an existing role.
- Keep `-rgb` companion values only where alpha composition is required.
- Test normal text at 4.5:1 and large text or non-text UI at 3:1 minimum.

## Typography

The default pairing is EB Garamond for headings and Plus Jakarta Sans for body copy.

```css
:root {
  --font-heading: 'EB Garamond', Georgia, serif;
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --max-text-width: 68ch;
  --line-height-normal: 1.55;
}
```

Curated alternatives are named semantically in `js/config/font-pairs.js`: `editorial`, `contemporary`, `literary`, `modernSans`, `classic`, and `geometric`.

Do not add ordinal names such as `quinary` or duplicate the same pair across CSS, HTML, and JavaScript.

### Type rules

- Keep body copy within `--max-text-width`.
- Use `clamp()` for major display sizes.
- Avoid animating every text node when a font changes; animate the preview region only.
- Load only weights used by the design.
- Retain strong system fallbacks.

## Spacing

Syntax uses a 0.5rem baseline:

```css
--space-1: 0.5rem;
--space-2: 1rem;
--space-3: 1.5rem;
--space-4: 2rem;
--space-5: 2.5rem;
--space-6: 3rem;
--space-8: 4rem;
```

Prefer tokenized spacing. Use fluid `clamp()` values for page-level padding and large section gaps.

## Shape and elevation

- Small controls: `--radius-sm`
- Cards and panels: `--radius-lg`
- Major dialogs: `--radius-xl`
- Pills and circular buttons: `--radius-round`

Shadows should clarify elevation, not decorate every surface. A border plus `--shadow-sm` is usually enough for cards.

## Components

### Buttons

- Primary buttons use `--color-primary` and `--color-on-primary`.
- Secondary and outline buttons remain distinguishable without relying only on color.
- Every button has hover, active, focus-visible, disabled, and reduced-motion behavior.
- Do not use a generic clickable `<div>` when a button or link is appropriate.

### Navigation

There is one canonical header and mobile navigation implementation in `modern-header.css`. `controls.css` is reserved for display controls and the typography dialog.

Mobile submenu triggers must be buttons with `aria-expanded` and `aria-controls`.

### Dialogs

Dialogs must:

- use `role="dialog"` and `aria-modal="true"`
- have an accessible name
- record the trigger before moving focus
- trap focus while open
- close on Escape
- restore focus on close
- establish a positioning context for internal absolute controls

### Tabs

Tabs must use the tablist, tab, and tabpanel roles; expose selected state; support Arrow keys, Home, and End; and preserve panel content across re-renders.

### Custom elements

Custom elements should enhance semantic content rather than hide critical information. Prefer native controls inside Shadow DOM. Observed attributes must match all supported runtime properties.

## Focus treatment

Never globally remove focus outlines without a guaranteed replacement. Syntax uses `:focus-visible` so pointer interactions stay visually quiet while keyboard interactions remain obvious.

## Motion

Motion should explain state or preserve spatial context.

- Typical duration: 150–400ms
- Default easing: `--ease-out` for entrances, `--ease-in-out` for state changes
- Avoid large document-wide animations
- Honor `prefers-reduced-motion`
- Ensure final states are immediately applied when motion is reduced

## Responsive design

Prefer content-driven breakpoints. Existing layout utilities generally switch near 768px, but new components should break where their content requires it.

Use:

- fluid gutters
- `minmax()` grids
- horizontal scrolling for narrow tab lists
- minimum touch targets near 44×44px
- safe-area environment variables for fixed controls

## Documentation rules

- The canonical demo must match the current product name, URLs, tokens, and installation path.
- Examples must be executable, not aspirational pseudocode.
- Claims such as “WCAG AA” should be qualified by tested scope.
- Old prototypes belong in an archive branch or release, not beside the canonical demo.
