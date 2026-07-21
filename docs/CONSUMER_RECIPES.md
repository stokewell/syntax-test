# Syntax Consumer Mode recipes

## Purpose

Recipes are development-time project generators. They copy a semantic starting structure and a project-owned composition layer while using the same Syntax framework bundle.

Recipes are not runtime packages. No recipe JavaScript or CSS is added to `dist/syntax.css` or `dist/syntax.js`.

## Public recipes

### Blank

A minimal project shell containing:

- semantic metadata and root content;
- a header, hero, actions, and footer;
- one project-owned `site.css` file;
- optional project-owned theme behavior;
- a manifest, README, and project brief.

Blank is intended for experiments whose page structure is not known yet.

### Portfolio

A personal-work site containing:

- an introduction and primary actions;
- one to six statically rendered project cards;
- local generated artwork when project images are not supplied;
- an about section and current-focus note;
- a closing call to action;
- an optional `content/projects.json` mirror.

The optional data mirror does not introduce a client-side renderer. Project HTML remains complete when JavaScript is disabled.

## Visual directions

### Editorial

- serif-led hierarchy;
- wide reading rhythm;
- restrained borders and nearly square cards;
- little or no elevation;
- left-aligned composition.

### Product

- sans-led hierarchy;
- centered or compact hero treatment;
- rounded raised cards;
- stronger surface separation;
- interface-oriented spacing.

Directions generate different project-owned CSS while sharing byte-identical `syntax.css` output.

## Recipe contract

A public recipe declares:

```js
{
  (id, version, label, description, visualDirections, compatibleFeatures, validateConfig, files); // or createFiles
}
```

The generator verifies that:

- the recipe matches the selected manifest identifier and version;
- the visual direction is supported;
- every selected feature is compatible;
- recipe data passes recipe-specific validation;
- exactly one static file list or dynamic file factory exists;
- all produced paths are unique and remain inside the target directory.

## Preview fixtures

Generate all public recipe previews with:

```bash
npm run consumer:previews
```

Outputs are written to the gitignored `consumer/previews/` directory:

- `blank-editorial/`
- `blank-product/`
- `portfolio-editorial/`
- `portfolio-product/`

The generated previews are used by Playwright for desktop, mobile, accessibility, dark-theme, reduced-motion, image-loading, and no-JavaScript validation.

## Ownership

Generated `index.html`, `site.css`, optional `site.js`, content, and assets become project-owned immediately. The framework bundle is generated from Syntax source at setup time, but the copied output belongs to the project and is not silently replaced.
