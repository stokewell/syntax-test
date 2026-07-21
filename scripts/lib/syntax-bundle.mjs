import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const SYNTAX_JS_FILES = Object.freeze([
  'js/config/font-pairs.js',
  'js/utilities/theme-toggle.js',
  'js/utilities/font-switcher.js',
  'js/components/navigation.js',
  'js/components/modal.js',
  'js/components/web-components.js',
  'js/utilities/micro-animations.js',
  'js/main.js',
]);

export async function readSyntaxVersion(root = defaultRoot) {
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  return packageJson.version;
}

export async function bundleCssFile(file, seen = new Set()) {
  const absolute = path.resolve(file);
  if (seen.has(absolute)) return '';
  seen.add(absolute);

  const source = await readFile(absolute, 'utf8');
  const directory = path.dirname(absolute);
  const importPattern = /@import\s+url\(['"](.+?)['"]\);/g;
  let result = '';
  let cursor = 0;

  for (const match of source.matchAll(importPattern)) {
    result += source.slice(cursor, match.index);
    result += `\n/* ${match[1]} */\n`;
    result += await bundleCssFile(path.resolve(directory, match[1]), seen);
    cursor = match.index + match[0].length;
  }

  return result + source.slice(cursor);
}

export async function createSyntaxCssBundle({ root = defaultRoot } = {}) {
  const version = await readSyntaxVersion(root);
  const css = await bundleCssFile(path.join(root, 'css/style.css'));
  return `/* Syntax v${version} | MIT License */\n${css}`;
}

export async function createSyntaxJsBundle({ root = defaultRoot, files = SYNTAX_JS_FILES } = {}) {
  const version = await readSyntaxVersion(root);
  const parts = await Promise.all(
    files.map(async (file) => `\n/* ${file} */\n${await readFile(path.join(root, file), 'utf8')}`),
  );
  return `/* Syntax v${version} | MIT License */\n${parts.join('\n')}`;
}
