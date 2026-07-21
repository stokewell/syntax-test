import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_FILES = Object.freeze(['index.html', 'site.webmanifest', 'package.json']);
const RULES = Object.freeze([
  ['demo-redirect', ['./demo/', 'demo/index.html']],
  ['syntax-showcase-title', ['Syntax — Typography', 'Syntax - Typography', 'Syntax — Showcase']],
  ['template-package-name', ['syntax-typography-starter']],
  ['template-pages-url', ['stokewell.github.io/syntax']],
  ['template-repository-url', ['github.com/stokewell/syntax']],
  ['placeholder-domain', ['https://example.com/', 'http://example.com/']],
  ['placeholder-copy', ['Your Name', 'Project Name', 'TODO: replace', 'Lorem ipsum']],
]);

export function scanPublicContent(files) {
  const findings = [];
  for (const [relativePath, content] of Object.entries(files)) {
    if (!PUBLIC_FILES.includes(relativePath)) continue;
    for (const [rule, needles] of RULES) {
      if (needles.some((needle) => content.includes(needle)))
        findings.push({ file: relativePath, rule });
    }
  }
  return findings.sort((left, right) =>
    left.file === right.file
      ? left.rule.localeCompare(right.rule)
      : left.file.localeCompare(right.file),
  );
}

export async function scanTemplateResidue(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const files = {};

  for (const relativePath of PUBLIC_FILES) {
    try {
      files[relativePath] = await readFile(path.join(root, relativePath), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  return scanPublicContent(files);
}

export function assertNoTemplateResidue(files) {
  const findings = scanPublicContent(files);
  if (findings.length === 0) return;

  const details = findings.map(({ file, rule }) => `${file}: ${rule}`).join(', ');
  throw new Error(`Generated public files contain template residue: ${details}`);
}
