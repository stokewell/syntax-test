# Syntax Consumer Mode setup

Consumer Mode turns a fresh Syntax template into a personalized, tested prototype while keeping setup tooling out of the browser bundle.

## Interactive setup

```bash
npm install
npm run setup
```

The command asks only questions that change generated output. It shows the complete plan and waits for confirmation before writing.

## Agent and CI setup

```bash
npm run setup -- --config project.config.json --output . --yes
npm run setup -- --config project.config.json --dry-run
```

A noninteractive write requires `--yes`. Entering `not yet` for a canonical or repository URL records an explicit `null`.

## Safety

Setup renders and validates the complete project first. It recognizes a small set of replaceable Syntax template entry files, blocks every other collision, and restores replaced files if a later write or residue check fails. An existing `syntax.project.json` always blocks setup in v1.

## Generated project

A configured project receives personalized metadata, a manifest, package information, `README.md`, `PROJECT_BRIEF.md`, project-owned CSS, selected optional behavior, consumer Playwright and axe tests, a small CI workflow, and a public template-residue scanner.

Root GitHub Pages setup also adds `.nojekyll` and publishing instructions.

```bash
npm install
npm run serve
npm test
npm run scan:residue
```

Only selected optional behavior is included in `site.js`.
