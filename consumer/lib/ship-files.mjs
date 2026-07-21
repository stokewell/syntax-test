import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { resolveInside } from './path-safety.mjs';
import { ConsumerShipError, createShipPlan } from './ship.mjs';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'test-results',
  'playwright-report',
]);

async function walk(directory, root, files) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    if (entry.isDirectory()) await walk(absolute, root, files);
    else if (entry.isFile()) {
      try {
        files.set(relative, await readFile(absolute, 'utf8'));
      } catch {
        // Binary assets are intentionally omitted from text-based release inspection.
      }
    }
  }
}

export async function readShipProject(directory) {
  const root = path.resolve(directory);
  const files = new Map();
  await walk(root, root, files);
  const source = files.get('syntax.project.json');
  if (!source) throw new ConsumerShipError('syntax.project.json is required before Ship mode.');
  let config;
  try {
    config = JSON.parse(source);
  } catch (error) {
    throw new ConsumerShipError(`Invalid syntax.project.json: ${error.message}`);
  }
  return { root, config, files };
}

export async function createFilesystemShipPlan(directory) {
  const project = await readShipProject(directory);
  return { ...project, plan: createShipPlan({ config: project.config, files: project.files }) };
}

async function pathExists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

export async function applyShipPlan({ root, plan, clean = false }) {
  if (plan.blocking.length > 0) {
    throw new ConsumerShipError('Ship preparation is blocked by unresolved findings.', {
      blocking: plan.blocking,
    });
  }

  const transactionRoot = path.join(root, '.syntax-ship-transaction');
  if (await pathExists(transactionRoot)) {
    throw new ConsumerShipError(
      'A previous Ship transaction directory still exists. Remove it after reviewing its contents.',
    );
  }

  const writes = new Map([...plan.proposedFiles, ...plan.deploymentOutputs]);
  const removals = clean ? plan.removals : [];
  const backedUp = [];
  const created = [];

  await mkdir(transactionRoot, { recursive: true });
  try {
    for (const [relative, content] of writes) {
      const target = resolveInside(root, relative);
      const backup = resolveInside(transactionRoot, relative);
      await mkdir(path.dirname(target), { recursive: true });
      if (await pathExists(target)) {
        await mkdir(path.dirname(backup), { recursive: true });
        await rename(target, backup);
        backedUp.push([target, backup]);
      } else created.push(target);
      await writeFile(target, content, 'utf8');
    }

    for (const relative of removals) {
      const target = resolveInside(root, relative);
      if (!(await pathExists(target))) continue;
      const backup = resolveInside(transactionRoot, `removed/${relative}`);
      await mkdir(path.dirname(backup), { recursive: true });
      await rename(target, backup);
      backedUp.push([target, backup]);
    }

    await rm(transactionRoot, { recursive: true, force: true });
    return Object.freeze({
      written: Object.freeze([...writes.keys()].sort()),
      removed: Object.freeze([...removals].sort()),
    });
  } catch (error) {
    for (const target of created.reverse()) await rm(target, { recursive: true, force: true });
    for (const [target, backup] of backedUp.reverse()) {
      await rm(target, { recursive: true, force: true });
      await mkdir(path.dirname(target), { recursive: true });
      await rename(backup, target);
    }
    await rm(transactionRoot, { recursive: true, force: true });
    throw new ConsumerShipError(`Ship transaction failed and was rolled back: ${error.message}`, {
      cause: error,
    });
  }
}
