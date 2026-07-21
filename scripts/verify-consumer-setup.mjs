import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getRecipe } from '../consumer/index.mjs';
import { scanTemplateResidue } from '../consumer/lib/residue.mjs';
import { applySetupPlan, createSetupPlan } from '../consumer/lib/setup.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, 'consumer/fixtures/configs/setup-portfolio.json');
const output = path.join(root, 'consumer/setup-smoke');
const config = JSON.parse(await readFile(fixture, 'utf8'));

await rm(output, { recursive: true, force: true });
const plan = await createSetupPlan({
  config,
  recipe: getRecipe(config.recipe.id),
  outputDirectory: output,
});
await applySetupPlan(plan);

const findings = await scanTemplateResidue(output);
if (findings.length > 0) throw new Error(`Template residue: ${JSON.stringify(findings)}`);

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['scripts/prepare-ship.mjs'], {
    cwd: output,
    stdio: 'inherit',
  });
  child.on('error', reject);
  child.on('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`Generated consumer Ship preview exited with code ${code}.`));
  });
});

const playwrightCli = require.resolve('@playwright/test/cli');
await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [playwrightCli, 'test'], {
    cwd: output,
    stdio: 'inherit',
    env: { ...process.env, CI: process.env.CI || 'true' },
  });
  child.on('error', reject);
  child.on('exit', (code) => {
    if (code === 0) resolve();
    else reject(new Error(`Generated consumer Playwright suite exited with code ${code}.`));
  });
});

await rm(output, { recursive: true, force: true });
console.log('Generated consumer setup project passed its Ship preview and test suite.');
