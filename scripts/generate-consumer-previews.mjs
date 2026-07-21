import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateProject, getRecipe } from '../consumer/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const previewRoot = path.join(root, 'consumer/previews');
const configurations = [
  'blank-editorial',
  'blank-product',
  'portfolio-editorial',
  'portfolio-product',
  'product-technical',
  'app-retro-interface',
];
const syntaxTokenPattern =
  /--(?:color-primary|color-primary-rgb|color-on-primary|font-heading|font-body|radius-[a-z]+|shadow-[a-z]+)\s*:/g;

async function readConfiguration(name) {
  const file = path.join(root, 'consumer/fixtures/configs', `${name}.json`);
  return JSON.parse(await readFile(file, 'utf8'));
}

async function fileSize(file) {
  try {
    return (await stat(file)).size;
  } catch {
    return 0;
  }
}

await rm(previewRoot, { recursive: true, force: true });
const report = [];

for (const name of configurations) {
  const config = await readConfiguration(name);
  const recipe = getRecipe(config.recipe.id);
  const outputDirectory = path.join(previewRoot, name);
  const result = await generateProject({ config, recipe, outputDirectory });
  const siteCssPath = path.join(outputDirectory, 'site.css');
  const siteCss = await readFile(siteCssPath, 'utf8');

  report.push({
    name,
    recipe: config.recipe.id,
    visualDirection: config.visualDirection,
    generatedFileCount: result.files.length,
    frameworkCssBytes: await fileSize(path.join(outputDirectory, 'syntax.css')),
    projectCssBytes: await fileSize(siteCssPath),
    projectJsBytes: await fileSize(path.join(outputDirectory, 'site.js')),
    overriddenSyntaxTokens: new Set(siteCss.match(syntaxTokenPattern) ?? []).size,
    customizationTimeMinutes: null,
    customizationTimeNote:
      'Not measured in generated fixtures; the next real setup trial should start a timer before editing.',
  });
}

await writeFile(path.join(previewRoot, 'metrics.json'), `${JSON.stringify(report, null, 2)}\n`);

for (const entry of report) {
  console.log(
    `${entry.name}: ${entry.generatedFileCount} files; framework CSS ${entry.frameworkCssBytes} bytes; project CSS ${entry.projectCssBytes} bytes; project JS ${entry.projectJsBytes} bytes; ${entry.overriddenSyntaxTokens} Syntax token overrides.`,
  );
}
