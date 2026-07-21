# Syntax stabilization checklist

This checklist records the ordered scope of the v1.1 stabilization work.

## 1. Public demo integrity

- [x] Add an intentional repository-root entry page
- [x] Replace legacy Typography-First and Base metadata
- [x] Use canonical Syntax URLs and branding
- [x] Load the scripts required by visible controls
- [x] Remove forced page-top scrolling and stale cache-busting query strings
- [x] Update the web manifest

## 2. Accessibility baseline

- [x] Improve primary action contrast
- [x] Replace global focus-outline removal with visible `:focus-visible` styles
- [x] Use buttons for font choices and mobile submenu controls
- [x] Add dialog semantics, focus trapping, Escape close, and focus restoration
- [x] Add keyboard behavior to tabs and clickable custom cards
- [x] Add reduced-motion handling
- [x] Add axe-core browser checks

## 3. JavaScript correctness

- [x] Separate applying a theme from persisting a manual preference
- [x] Support explicit system, light, and dark preferences
- [x] Capture dialog trigger focus before moving focus
- [x] Preserve tab panel content across renders
- [x] Observe responsive-image source attributes consistently
- [x] Make `main.js` the actual initialization entrypoint

## 4. CSS architecture

- [x] Remove duplicate header and navigation definitions from `controls.css`
- [x] Keep one canonical navigation stylesheet
- [x] Replace ordinal tokens with semantic roles
- [x] Include layout variants in the production CSS bundle

## 5. Typography system

- [x] Create one canonical named font-pair configuration
- [x] Generate font controls from that configuration
- [x] Limit loaded font weights
- [x] Animate the specimen instead of the entire document

## 6. Product definition

- [x] Position Syntax as a typography-first website starter and lightweight design system
- [x] Separate core primitives from optional extras
- [x] Rewrite the README and style guide around the supported surface
- [x] Replace the broad feature wishlist with an ordered roadmap

## 7. Build, testing, and delivery

- [x] Add a distributable CSS and JavaScript build
- [x] Add ESLint and Stylelint
- [x] Add Prettier configuration and formatting commands
- [x] Add Vitest unit tests
- [x] Add Playwright desktop/mobile interaction tests
- [x] Add axe-core accessibility checks
- [x] Add GitHub Actions CI and build artifact upload
- [x] Add a changelog and generated-artifact ignore rules

## Release gate

Before merging, GitHub Actions should pass dependency installation, linting, unit tests, production build, Playwright interaction tests, and axe-core checks. Manual keyboard and screen-reader spot checks remain recommended before tagging v1.1.0.
