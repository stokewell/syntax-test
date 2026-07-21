import { Buffer } from 'node:buffer';

import { scanPublicContent } from './residue.mjs';

export class ConsumerShipError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConsumerShipError';
    this.details = details;
  }
}

const PLACEHOLDER_PATTERNS = Object.freeze([
  ['empty-link', /(?:href|action)=["']#["']/i],
  ['example-domain', /https?:\/\/(?:www\.)?example\.(?:com|org|net)/i],
  ['placeholder-copy', /\b(?:lorem ipsum|todo:|replace me|coming soon)\b/i],
]);

function sortStrings(values) {
  return [...values].sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
}

function normalizeFileMap(files) {
  if (files instanceof Map) return new Map(files);
  if (!files || typeof files !== 'object' || Array.isArray(files)) {
    throw new ConsumerShipError('Ship planning requires a file map or plain file object.');
  }
  return new Map(Object.entries(files));
}

function readJson(files, file) {
  const source = files.get(file);
  if (typeof source !== 'string') {
    throw new ConsumerShipError(`Required ship file is missing: ${file}.`, { file });
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new ConsumerShipError(`Invalid JSON in ${file}: ${error.message}`, { file });
  }
}

function canonicalBase(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function inspectImages(html) {
  const findings = [];
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=["'][^"']*["']/i.test(match[0])) findings.push('missing-image-alt');
  }
  return findings;
}

function inspectPlaceholders(files) {
  const findings = [];
  for (const [file, content] of files) {
    if (typeof content !== 'string' || !/\.(?:html?|md|json|xml|txt)$/i.test(file)) continue;
    for (const [rule, pattern] of PLACEHOLDER_PATTERNS) {
      if (pattern.test(content)) findings.push({ file, rule });
    }
    if (/\.html?$/i.test(file)) {
      for (const rule of inspectImages(content)) findings.push({ file, rule });
    }
  }
  return findings;
}

function renderPagesWorkflow() {
  return `name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
`;
}

function deploymentOutputs(config) {
  if (config.deployment === 'github-pages-actions') {
    return new Map([['.github/workflows/pages.yml', renderPagesWorkflow()]]);
  }
  if (config.deployment === 'github-pages-root') return new Map([['.nojekyll', '']]);
  return new Map();
}

function releaseFiles(config, manifest, files) {
  const base = canonicalBase(config.project.canonicalUrl);
  const host = new URL(base).hostname;
  const customDomain = !host.endsWith('.github.io') ? host : null;
  const syntaxCssBytes = Buffer.byteLength(files.get('syntax.css') ?? '', 'utf8');
  const projectCssBytes = Buffer.byteLength(files.get('site.css') ?? '', 'utf8');
  const projectJsBytes = Buffer.byteLength(files.get('site.js') ?? '', 'utf8');
  const shippedManifest = {
    ...manifest,
    mode: 'ship',
    generated: {
      ...manifest.generated,
      files: sortStrings(
        new Set([
          ...(manifest.generated?.files ?? []),
          'RELEASE_CHECKLIST.md',
          'release-report.json',
          'robots.txt',
          'sitemap.xml',
          'structured-data.json',
          ...(customDomain ? ['CNAME'] : []),
        ]),
      ),
    },
  };
  const report = {
    syntaxVersion: config.syntaxVersion,
    recipe: config.recipe.id,
    visualDirection: config.visualDirection,
    selectedFeatures: [...config.features],
    deployment: config.deployment,
    canonicalUrl: base,
    sizes: { syntaxCssBytes, projectCssBytes, projectJsBytes },
  };

  const release = new Map([
    ['syntax.project.json', `${JSON.stringify(shippedManifest, null, 2)}\n`],
    [
      'sitemap.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}</loc></url>\n</urlset>\n`,
    ],
    ['robots.txt', `User-agent: *\nAllow: /\nSitemap: ${base}sitemap.xml\n`],
    [
      'structured-data.json',
      `${JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: config.project.name,
          description: config.project.description,
          url: base,
          author: { '@type': 'Person', name: config.project.author },
        },
        null,
        2,
      )}\n`,
    ],
    ['release-report.json', `${JSON.stringify(report, null, 2)}\n`],
    [
      'RELEASE_CHECKLIST.md',
      `# ${config.project.name} release checklist\n\n- [ ] Review production copy and links\n- [ ] Confirm desktop, mobile, keyboard, dark, and reduced-motion checks\n- [ ] Confirm canonical URL: ${base}\n- [ ] Confirm deployment mode: ${config.deployment}\n- [ ] Review Syntax CSS size: ${syntaxCssBytes} bytes\n- [ ] Review project CSS size: ${projectCssBytes} bytes\n- [ ] Review project JavaScript size: ${projectJsBytes} bytes\n- [ ] Publish and verify the live URL\n`,
    ],
  ]);
  if (customDomain) release.set('CNAME', `${customDomain}\n`);
  return release;
}

function uniqueSortedFindings(findings) {
  return [
    ...new Map(findings.map((finding) => [`${finding.file}:${finding.rule}`, finding])).values(),
  ].sort((left, right) => `${left.file}:${left.rule}`.localeCompare(`${right.file}:${right.rule}`));
}

export function createShipPlan({ config, files }) {
  const normalizedFiles = normalizeFileMap(files);
  const manifest = readJson(normalizedFiles, 'syntax.project.json');
  const webManifest = readJson(normalizedFiles, 'site.webmanifest');
  const blocking = [];

  if (!config?.project?.canonicalUrl)
    blocking.push({ file: 'syntax.project.json', rule: 'missing-canonical-url' });
  if (!config?.project?.name || !config?.project?.description || !config?.project?.author) {
    blocking.push({ file: 'syntax.project.json', rule: 'missing-project-metadata' });
  }

  blocking.push(...scanPublicContent(Object.fromEntries(normalizedFiles)));
  blocking.push(...inspectPlaceholders(normalizedFiles));

  if (config.project.canonicalUrl) {
    const base = canonicalBase(config.project.canonicalUrl);
    const index = normalizedFiles.get('index.html') ?? '';
    if (!index.includes(`href="${base}"`) && !index.includes(`href='${base}'`)) {
      blocking.push({ file: 'index.html', rule: 'canonical-mismatch' });
    }
  }
  if (webManifest.name !== config.project.name) {
    blocking.push({ file: 'site.webmanifest', rule: 'manifest-name-mismatch' });
  }

  const normalizedBlocking = uniqueSortedFindings(blocking);
  const proposedFiles =
    normalizedBlocking.length === 0 ? releaseFiles(config, manifest, normalizedFiles) : new Map();
  return Object.freeze({
    blocking: Object.freeze(normalizedBlocking),
    proposedFiles,
    deploymentOutputs: normalizedBlocking.length === 0 ? deploymentOutputs(config) : new Map(),
    removals: Object.freeze(
      ['demo/', 'lab/'].filter((directory) =>
        [...normalizedFiles.keys()].some((file) => file.startsWith(directory)),
      ),
    ),
  });
}

export function formatShipPlan(plan) {
  const lines = [];
  if (plan.blocking.length > 0) {
    lines.push('Blocking findings:');
    for (const finding of plan.blocking) lines.push(`- ${finding.file}: ${finding.rule}`);
  } else {
    lines.push('Proposed release files:');
    for (const file of plan.proposedFiles.keys()) lines.push(`- ${file}`);
    for (const file of plan.deploymentOutputs.keys()) lines.push(`- ${file}`);
    if (plan.removals.length > 0) {
      lines.push('Prototype-only paths eligible for optional removal:');
      for (const file of plan.removals) lines.push(`- ${file}`);
    }
  }
  return lines.join('\n');
}
