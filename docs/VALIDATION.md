# Validation

## Completed before publishing the branch

- JavaScript syntax checked with Node 22 using `node --check`
- JSON configuration parsed successfully
- Canonical HTML pages parsed successfully
- Changed CSS files checked for balanced block braces
- Branch compared against `main` to verify the intended file set

## Automated by GitHub Actions

The pull request workflow installs development dependencies and Chromium, then runs:

```bash
npm run check
```

This covers:

- ESLint
- Stylelint
- Vitest
- production bundle generation
- Playwright desktop and mobile interaction tests
- axe-core serious and critical accessibility checks

## Manual release checks

Before tagging v1.1.0:

- Navigate the full demo with a keyboard only
- Spot-check VoiceOver and NVDA reading order and control names
- Verify light, dark, and system preference behavior
- Verify reduced-motion behavior
- Check the generated social preview metadata after a real preview image is added
