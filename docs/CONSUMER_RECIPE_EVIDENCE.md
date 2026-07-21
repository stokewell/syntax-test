# Consumer Mode recipe evidence

Issue #7 records evidence through the generated preview report rather than committing duplicate framework bundles.

Run:

```bash
npm run consumer:previews
```

The command prints and writes `consumer/previews/metrics.json` with:

- generated file count;
- Syntax framework CSS bytes;
- project-owned CSS bytes;
- optional project-owned JavaScript bytes;
- number of overridden Syntax tokens;
- recipe and visual direction.

## Current interpretation

The two recipes share the same generated Syntax CSS. Their identity remains concentrated in `site.css`, recipe content, and local assets. Optional theme behavior is the only JavaScript generated in the Phase 1A fixtures.

Portfolio fixtures intentionally cover both ends of the supported range: one project and six projects.

## Customization timing

Reliable customization time was not captured while building the deterministic fixtures. The next real project created through `npm run setup` should start a timer before recipe generation and stop when the first recognizable browser preview is complete. Until that trial, the report records customization time as `null` rather than presenting an estimate as measured evidence.
