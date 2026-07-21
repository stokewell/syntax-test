# Syntax Consumer Mode

This directory contains development-time scaffolding infrastructure. It is not part of the browser runtime or the Syntax production bundle.

## Current public surface

```js
import {
  createProjectFileSet,
  generateProject,
  getRecipe,
  getSetupRecipe,
  listRecipes,
} from './consumer/index.mjs';
```

`createProjectFileSet` validates and canonicalizes a project configuration, validates the selected recipe contract, and returns a deterministic in-memory file map.

`generateProject` performs collision preflight and writes that map to a target directory. Existing destination files are never silently replaced.

## Public recipes

- `blank` v1
- `portfolio` v1
- `product` v1
- `app` v1

The public direction set now includes Editorial, Product, Technical, Playful, Minimal, Cinematic, and Retro Interface. Each recipe declares only the directions and optional features it supports.

Setup can add theme preference, mobile navigation, responsive-image enhancement, and native dialog behavior without loading unselected modules.

See [`docs/CONSUMER_RECIPES.md`](../docs/CONSUMER_RECIPES.md) for recipe contracts and preview instructions.

## Setup

```bash
npm run setup
npm run setup -- --config project.config.json --dry-run
npm run setup -- --config project.config.json --output . --yes
```

Setup displays a complete write plan, recognizes known template entry files, blocks project-owned collisions, and rolls back the transaction if generation or residue validation fails.

See [`docs/CONSUMER_SETUP.md`](../docs/CONSUMER_SETUP.md).

## Fixtures and previews

The committed foundation fixture continues to prove exact deterministic output:

```bash
npm run consumer:fixtures
```

Public recipe previews are generated on demand for all four recipe types:

```bash
npm run consumer:previews
```

Preview output is gitignored because each project contains a complete Syntax CSS bundle. The browser suite regenerates those previews before checking desktop, mobile, theme, reduced-motion, and accessibility behavior.
