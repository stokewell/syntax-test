# Syntax roadmap

This roadmap is ordered. Core reliability and proven real-world demand come before ecosystem expansion.

**Current focus:** v1.3 Consumer Mode foundation.

## v1.1 — Stabilization

- [x] Correct public branding, metadata, canonical URLs, and root routing
- [x] Replace the accumulated demo script with a canonical showcase
- [x] Improve color contrast and focus-visible behavior
- [x] Add semantic font and theme controls
- [x] Repair dialog focus restoration and tab content preservation
- [x] Remove duplicate navigation CSS ownership
- [x] Add a production build, linting, tests, accessibility checks, and CI
- [x] Rewrite the README and style guide around the supported product surface

## v1.2 — Component Lab

- [x] Add a dedicated exhaustive proving ground separate from the overview
- [x] Restore media, Web Component, layout, typography, and motion coverage
- [x] Add desktop/mobile interaction, image-loading, reduced-motion, and axe tests
- [x] Preserve lab-only CSS and JavaScript outside the production bundle
- [x] Use the lab to harden Custom Card, Tabs, and reduced-motion semantics

## v1.3 — Consumer Mode foundation

- [x] Add the `syntax.project.json` schema and generated-file ownership contract
- [x] Add a deterministic configuration-to-files engine
- [x] Add Blank and Portfolio recipes
- [x] Add Editorial and Product visual directions
- [ ] Generate project metadata, manifest, README, and `PROJECT_BRIEF.md`
- [ ] Detect remaining Syntax template names, URLs, and placeholder copy
- [ ] Generate consumer-focused smoke and accessibility tests
- [ ] Add a local `npm run setup` command after deterministic generation is tested

See [`docs/CONSUMER_MODE_PLAN.md`](docs/CONSUMER_MODE_PLAN.md) for the complete product and implementation plan.

## v1.4 — Consumer Mode recipes and shipping

- [ ] Add Product and App recipes
- [ ] Add Technical, Playful, Minimal, Cinematic, and Retro Interface directions
- [ ] Add optional feature selection and selective module loading
- [ ] Add prototype and ship modes
- [ ] Add root-based and Actions-based GitHub Pages deployment
- [ ] Generate sitemap, robots, structured data, and a release checklist
- [ ] Trim downstream CI to consumer-relevant checks

## v1.5 — Audit and additive workflow

- [ ] Add `syntax:audit` text and JSON reports
- [ ] Add safe `syntax:add` commands for optional features and proven patterns
- [ ] Add optional structured-content files for repeated project data
- [ ] Compare framework and project-owned code across real projects
- [ ] Establish the evidence threshold for promoting patterns into Syntax core

## Later, after the local workflow is proven

- Publish `create-syntax` and support `npm create syntax@latest`
- Add visual regression snapshots
- Add manual VoiceOver and NVDA test notes
- Export design tokens as JSON
- Add RTL logical-property audits
- Publish stable `dist/` artifacts with tagged releases
- Add safe update tooling only after generated-file ownership is proven
- Consider optional AI-assisted brief and copy generation
- Consider additional deployment adapters and a recipe gallery

Consumer Mode is development tooling. Recipes and setup machinery must never enter the production CSS or JavaScript bundle.
