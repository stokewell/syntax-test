# Syntax Consumer Mode Plan

## Purpose

Consumer Mode turns Syntax from a capable template into a repeatable rapid-prototyping system.

Its job is to remove recurring setup decisions while preserving the qualities that make Syntax useful:

- zero runtime dependencies by default;
- semantic HTML and progressive enhancement;
- project-owned visual identity;
- optional JavaScript rather than mandatory application machinery;
- strong accessibility and quality gates;
- no unused recipe or setup code in the shipped site.

Consumer Mode is primarily a **development-time scaffold and maintenance tool**. It should not become a client-side framework.

## Product promise

A user should be able to move from a one-paragraph idea to a coherent, tested, deployable starting site in minutes without every Syntax project looking the same.

The system should solve repeated structural decisions and leave project personality in project-owned HTML, CSS, content, and assets.

## Primary user

The first user is a solo builder producing many independent ideas, experiments, games, tools, portfolios, and small product sites.

The workflow needs to support:

1. getting an idea visible quickly;
2. changing direction without fighting the framework;
3. retaining a consistent design system while each project develops its own identity;
4. hardening a successful prototype for deployment;
5. learning from repeated project overrides and feeding proven patterns back into Syntax.

## Scope

Consumer Mode includes:

- an interactive setup command;
- project recipes;
- coordinated visual directions;
- optional feature selection;
- project metadata generation;
- a persistent project manifest;
- prototype and ship modes;
- consumer-focused tests;
- deployment setup;
- a framework-usage audit.

Consumer Mode does not include in its first release:

- a visual page builder;
- a runtime component registry;
- a plugin marketplace;
- a CMS;
- mandatory AI services;
- automatic rewriting of arbitrary user code;
- a complex package-update system.

## Command model

### First implementation

The first implementation lives inside the Syntax template:

```bash
npm run setup
```

This avoids publishing infrastructure while the workflow is still being proven.

### Public package goal

After the setup flow succeeds across multiple real projects:

```bash
npm create syntax@latest
```

The package should call the same tested setup engine rather than maintaining a second implementation.

### Follow-up commands

```bash
npm run syntax:audit
npm run syntax:add -- dialog
npm run syntax:add -- project-grid
npm run prepare:ship
```

Later, after safe update semantics are proven:

```bash
npm run syntax:update
```

## Setup flow

The setup should ask only questions that materially change generated output.

### Step 1: Project identity

Required fields:

- project name;
- short description;
- author or organization;
- canonical URL or a clear `not yet` value;
- repository URL, when available;
- primary action label and destination;
- optional secondary action.

Generated from these answers:

- document title;
- meta description;
- canonical URL;
- Open Graph metadata;
- manifest;
- footer identity;
- package name and description;
- README summary;
- basic JSON-LD structured data;
- `robots.txt`;
- `sitemap.xml` when a canonical URL exists.

The setup must fail visibly when template metadata such as `Syntax`, `stokewell.github.io/syntax`, or placeholder copy remains in the consumer entry page.

### Step 2: Recipe

Consumer Mode v1 ships four recipes:

1. **Blank** — minimal semantic page with design tokens and no opinionated content sections.
2. **Portfolio** — introduction, selected work, about, and closing call to action.
3. **Product** — hero, value proposition, features, proof or screenshots, how it works, and final call to action.
4. **App** — product shell, app introduction, primary interaction region, supporting explanation, and status/help surfaces.

Recipes are source templates, not runtime modules. Selecting one copies semantic markup and project-owned CSS into the consumer project. Unselected recipes add no shipped code.

A later release may add:

- game or interactive project;
- editorial/content site;
- documentation site;
- gallery or catalog.

New recipes should be added only after repeated real-world demand.

### Step 3: Visual direction

Consumer Mode v1 offers a small set of coordinated directions:

- Editorial;
- Product;
- Technical;
- Playful;
- Minimal;
- Cinematic;
- Retro Interface.

A direction selects a coherent token preset:

- font pairing;
- type scale emphasis;
- content width;
- spacing density;
- radius scale;
- shadow strength;
- surface treatment;
- motion level;
- navigation treatment.

The output remains ordinary CSS custom properties. Directions do not create hidden styling APIs.

The user may then select or enter one accent color. Consumer Mode should derive safe light/dark semantic roles and validate contrast before writing them.

### Step 4: Optional capabilities

Feature selection controls which modules are loaded and which examples/tests are generated.

Initial options:

- theme switcher;
- font chooser;
- mobile navigation;
- dialogs;
- tabs;
- accordions;
- responsive-image custom element;
- custom-card element;
- motion utilities;
- form styles and validation patterns.

The complete framework source may remain available in prototype mode, but generated HTML must load only selected modules.

### Step 5: Operating mode

#### Prototype mode

Optimized for speed and inspection:

- loads modular Syntax source directly;
- keeps the Component Lab and overview available;
- keeps broad development documentation;
- includes placeholder sections and image slots where useful;
- includes broad framework checks;
- supports straightforward GitHub Pages previewing;
- prioritizes editability over minimum repository size.

#### Ship mode

`npm run prepare:ship` should:

- verify all required project metadata;
- remove or archive the Syntax overview and Component Lab from the consumer output;
- remove unused optional modules from generated entry points;
- build the production bundle;
- report bundle sizes;
- check for placeholder text and template URLs;
- check empty links and missing image alternatives;
- generate final sitemap and robots files;
- run consumer accessibility and mobile tests;
- create or validate custom-domain configuration;
- produce a human-readable release checklist.

Ship mode must be safe to rerun and must explain every destructive action before performing it.

## Project manifest

Every configured consumer project receives `syntax.project.json`.

Proposed v1 schema:

```json
{
  "$schema": "./schemas/syntax-project.schema.json",
  "syntaxVersion": "1.3.0",
  "mode": "prototype",
  "recipe": "portfolio",
  "visualDirection": "editorial",
  "accentColor": "#067474",
  "features": ["theme", "mobile-navigation", "responsive-image"],
  "deployment": "github-pages",
  "project": {
    "name": "Example Project",
    "description": "A concise project description.",
    "author": "Example Author",
    "canonicalUrl": "https://example.com",
    "repositoryUrl": "https://github.com/example/project"
  },
  "generated": {
    "recipeVersion": 1,
    "createdAt": "2026-07-18"
  }
}
```

The manifest provides:

- reproducible setup decisions;
- audit context;
- safe feature additions;
- deployment context;
- future migration information.

It must never become a second source of truth for authored page content.

## File architecture

Proposed repository additions:

```text
consumer/
├── setup/
│   ├── prompts.mjs
│   ├── configure.mjs
│   ├── write-project.mjs
│   └── validate-input.mjs
├── recipes/
│   ├── blank/
│   ├── portfolio/
│   ├── product/
│   └── app/
├── directions/
│   ├── editorial.json
│   ├── product.json
│   ├── technical.json
│   ├── playful.json
│   ├── minimal.json
│   ├── cinematic.json
│   └── retro-interface.json
├── features/
│   ├── theme.json
│   ├── mobile-navigation.json
│   ├── dialog.json
│   └── ...
├── templates/
│   ├── metadata/
│   ├── deployment/
│   └── tests/
└── schema/
    └── syntax-project.schema.json

scripts/
├── setup.mjs
├── syntax-audit.mjs
├── syntax-add.mjs
└── prepare-ship.mjs
```

Consumer tooling is excluded from `dist/syntax.css` and `dist/syntax.js`.

## Recipe contract

Every recipe contains:

- semantic `index.html` content;
- one project-owned stylesheet;
- optional project-owned JavaScript;
- a content example file where repeated data is useful;
- recipe-specific Playwright tests;
- a README fragment explaining the generated structure;
- declared compatible features;
- declared visual-direction hooks.

Recipes must:

- work without JavaScript unless interaction requires it;
- contain no remote placeholder images;
- pass accessibility checks before release;
- work in light and dark themes when theme support is selected;
- remain usable from 320 CSS pixels upward;
- avoid recipe-specific code in the Syntax core bundle.

## Optional structured content

Recipes with repeated entries may offer a data-backed mode.

Example:

```js
export const projects = [
  {
    title: 'Example Project',
    status: 'Live product',
    description: 'A concise description.',
    image: './assets/project.svg',
    url: 'https://example.com',
    tags: ['Product design', 'Web development'],
  },
];
```

This is optional. Hand-authored static HTML remains a first-class and recommended path for small sites.

Consumer Mode must not require a client-side renderer merely to display static content. A build-time renderer is acceptable when selected explicitly.

## Project brief

Setup generates `PROJECT_BRIEF.md` containing:

- one-paragraph concept;
- intended audience;
- problem or opportunity;
- primary action;
- tone and visual direction;
- selected recipe and features;
- current scope;
- explicit non-goals;
- open questions.

This file is designed to guide both human work and AI coding agents.

AI-assisted brief expansion may be added later, but Consumer Mode v1 must work entirely offline and without an API key.

## Consumer-focused testing

Generated projects should test the consumer implementation rather than every internal Syntax demonstration.

Baseline checks:

- homepage loads;
- document title and description are project-specific;
- primary heading exists;
- primary action has a valid destination;
- internal navigation works;
- project images load;
- no horizontal overflow exists at desktop or mobile widths;
- selected theme behavior works;
- selected interactive features support keyboard operation;
- no serious or critical axe violations exist;
- no known template strings remain;
- sitemap, canonical URL, and manifest agree.

Prototype mode may retain framework regression tests. Ship mode should trim CI to consumer-relevant checks plus a pinned Syntax compatibility test.

## Deployment

Consumer Mode v1 supports:

- GitHub Pages from the repository root;
- GitHub Pages through Actions with a built `dist/` output;
- no deployment configuration.

The setup must explain the difference between source-based and Actions-based Pages deployment.

Later adapters may support Netlify, Cloudflare Pages, or Vercel, but deployment adapters must remain development-only templates.

## Syntax audit

`npm run syntax:audit` should produce a text and JSON report.

Initial report fields:

- Syntax version;
- recipe and visual direction;
- selected features;
- CSS and JavaScript files loaded by the entry page;
- framework bundle sizes;
- project-owned CSS and JavaScript sizes;
- overridden Syntax custom properties;
- known components used in HTML;
- unused selected modules;
- template strings still present;
- accessibility result summary;
- deployment readiness;
- largest project-owned stylesheets.

The audit should not claim perfect unused-code detection. It should clearly label heuristic findings.

## Framework feedback loop

A custom pattern should be promoted into Syntax only when:

1. it appears independently in at least three real projects;
2. the implementations share a stable semantic structure;
3. centralizing it would reduce meaningful duplication;
4. it can remain optional;
5. it passes the Component Lab and accessibility contract.

This prevents one project’s preferences from becoming permanent framework bloat.

## Versioning and ownership

- Syntax core follows semantic versioning.
- Recipes have their own integer recipe versions in the manifest.
- Consumer Mode should record which files it generated.
- Generated project files become project-owned immediately.
- Consumer Mode must not silently overwrite project-owned files after setup.
- Feature-add commands may create new files or make narrowly scoped changes after showing a preview.
- Automated migrations are deferred until ownership boundaries are proven.

## Implementation phases

### Phase 0 — Contract and fixtures

Deliverables:

- this plan;
- `syntax.project.json` schema;
- fixture projects for all four v1 recipes;
- tests that verify generated file trees;
- explicit generated-file ownership rules.

Exit criteria:

- each recipe can be represented as deterministic files from a configuration object;
- no setup code is included in `dist/`;
- fixture output passes formatting.

### Phase 1 — Local setup MVP

Deliverables:

- `npm run setup`;
- identity prompts;
- blank and portfolio recipes;
- Editorial, Product, Technical, and Minimal directions;
- theme, mobile navigation, responsive image, and dialog feature selection;
- manifest generation;
- `PROJECT_BRIEF.md` generation;
- GitHub Pages root deployment option;
- generated consumer smoke and axe tests.

Exit criteria:

- a new repository can become a personalized, previewable site in under five minutes after dependency installation;
- no Syntax template branding remains in the generated root page;
- generated blank and portfolio projects pass their complete checks;
- rerunning setup refuses to overwrite a configured project without explicit confirmation.

### Phase 2 — Recipe and shipping expansion

Deliverables:

- Product and App recipes;
- Playful, Cinematic, and Retro Interface directions;
- remaining feature toggles;
- `prepare:ship`;
- Actions-based GitHub Pages deployment;
- sitemap, robots, structured data, and release checklist generation;
- consumer CI trimming.

Exit criteria:

- all four recipes pass desktop, mobile, dark, and reduced-motion checks;
- ship mode produces a deployable site with no demo or lab dependency;
- selected optional modules are the only optional modules loaded by the entry page.

### Phase 3 — Audit and additive commands

Deliverables:

- `syntax:audit` text and JSON reports;
- `syntax:add` for selected features and patterns;
- optional structured-content files for portfolio and product recipes;
- documented feedback process for candidate framework patterns.

Exit criteria:

- audit output is stable enough to compare across projects;
- additive commands never overwrite project-owned files silently;
- at least three real projects have produced useful audit reports.

### Phase 4 — Public scaffolding package

Deliverables:

- `create-syntax` package;
- `npm create syntax@latest`;
- release automation;
- version compatibility checks;
- installation documentation.

Exit criteria:

- package output matches the in-repository setup engine;
- installation works in an empty directory and an empty Git repository;
- no duplicate recipe implementation exists.

### Phase 5 — Later, evidence-based capabilities

Candidates:

- AI-assisted brief and copy generation;
- safe Syntax updates;
- additional deployment adapters;
- recipe gallery;
- community recipes;
- project comparison reports.

These are not part of Consumer Mode v1.

## Consumer Mode v1 definition

Consumer Mode v1 is complete when it includes:

- `npm run setup`;
- Blank, Portfolio, Product, and App recipes;
- seven coordinated visual directions;
- project identity and metadata generation;
- optional feature selection;
- `syntax.project.json`;
- `PROJECT_BRIEF.md`;
- prototype and ship modes;
- GitHub Pages deployment;
- consumer-specific tests;
- `syntax:audit`;
- documentation for generated-file ownership.

The public `npm create` package may follow as a separate release after the in-template workflow is proven.

## Success metrics

The implementation should be evaluated across real projects using:

- time from repository creation to first coherent browser preview;
- time from prototype to deployable build;
- number of manual template-cleanup edits;
- percentage of project CSS declarations using Syntax tokens;
- project-owned CSS and JavaScript size relative to framework code;
- number of framework overrides;
- accessibility failures found before deployment;
- unused optional modules loaded;
- repeated custom patterns across projects;
- user-reported friction during setup and revision.

Initial targets:

- first coherent preview within five minutes after installation;
- zero remaining template metadata after setup;
- zero serious or critical axe violations in generated recipes;
- no unselected optional JavaScript loaded;
- no Consumer Mode tooling in production bundles;
- project-specific styling concentrated in one or two clearly owned files for a basic prototype.

## First implementation slice

The first coding PR should contain only:

1. the manifest schema;
2. deterministic configuration-to-files engine;
3. noninteractive test configuration;
4. Blank recipe;
5. Portfolio recipe based on lessons from `justingarbett`;
6. Editorial and Product visual directions;
7. metadata replacement and template-residue validation;
8. generated smoke/accessibility tests.

Interactive prompts should be added after deterministic generation is fully tested. This keeps the core logic testable and prevents prompt handling from becoming the architecture.

## Decision log

- Consumer Mode is promoted because the Justin Garbett portfolio demonstrated real downstream demand.
- Recipes are copied source, not runtime packages.
- Generated files become project-owned.
- AI is an optional later layer, not a v1 dependency.
- The full Component Lab remains a framework development surface, not a required production artifact.
- Update automation is deferred until safe ownership and migration boundaries are demonstrated.
