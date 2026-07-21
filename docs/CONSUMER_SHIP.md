# Consumer Mode Ship preparation

Ship mode is the private-v1 release boundary for a generated Syntax project. It validates production readiness and prepares release files without introducing a runtime dependency on Consumer Mode. After this workflow is proven, framework development pauses for real-project testing.

Generated consumer projects include the development-only Ship command and its small supporting modules, so the workflow remains available after the project leaves the Syntax repository.

## Preview first

```bash
npm run prepare:ship
```

The default command is read-only. It reports blocking findings, proposed release files, deployment output, and prototype-only paths eligible for optional cleanup.

Common blocking findings include:

- missing project metadata or canonical URL;
- canonical or web-manifest disagreement;
- empty links, example domains, placeholder copy, or missing image alternatives;
- remaining public Syntax template residue.

## Write release files

```bash
npm run prepare:ship -- --write
```

Interactive use requires confirmation. Agents and CI must provide explicit approval:

```bash
npm run prepare:ship -- --write --yes
```

Ship preparation writes only release-managed files:

- `syntax.project.json`, updated to `mode: "ship"`;
- `sitemap.xml`;
- `robots.txt`;
- `structured-data.json`;
- `release-report.json`;
- `RELEASE_CHECKLIST.md`;
- `CNAME` when the canonical host is a custom domain;
- `.nojekyll` or `.github/workflows/pages.yml`, according to deployment mode.

Project-owned `index.html`, `site.css`, and `site.js` are never rewritten.

## Optional prototype cleanup

```bash
npm run prepare:ship -- --write --clean
```

Cleanup is separate and opt-in. It removes only paths listed in the preview, currently inherited `demo/` and `lab/` directories. No cleanup occurs during preview or a normal `--write` run.

## Safety guarantees

- Every operation is previewed before execution.
- Writes and removals use a local transaction directory and roll back on failure.
- Existing release-managed files are backed up during the transaction.
- A completed project can run Ship preparation again safely.
- Consumer Mode tooling remains development-only and does not become a browser dependency.

After preparation, run the project test suite, deploy, and verify the live canonical URL.
