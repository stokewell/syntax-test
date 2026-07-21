import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { foundationRecipe } from '../consumer/fixtures/foundation.recipe.mjs';
import { generateProject } from '../consumer/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'consumer/fixtures/foundation.config.json');
const outputDirectory = path.join(root, 'consumer/fixtures/expected/foundation');
const config = JSON.parse(await readFile(configPath, 'utf8'));

await rm(outputDirectory, { recursive: true, force: true });
const result = await generateProject({ config, recipe: foundationRecipe, outputDirectory });

console.log(`Generated ${result.files.length} Consumer Mode fixture files.`);
