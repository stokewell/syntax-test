#!/usr/bin/env node
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

import { applyShipPlan, createFilesystemShipPlan } from '../consumer/lib/ship-files.mjs';
import { ConsumerShipError, formatShipPlan } from '../consumer/lib/ship.mjs';

function parseArguments(argv) {
  const options = { directory: '.', write: false, clean: false, yes: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--write') options.write = true;
    else if (argument === '--clean') options.clean = true;
    else if (argument === '--yes' || argument === '-y') options.yes = true;
    else if (argument === '--directory' || argument === '-d') options.directory = argv[++index];
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new ConsumerShipError(`Unknown prepare:ship option: ${argument}`);
  }
  if (options.clean && !options.write) {
    throw new ConsumerShipError(
      '--clean requires --write because cleanup is never performed during preview.',
    );
  }
  return options;
}

function printHelp() {
  console.log(`Syntax Consumer Mode Ship preparation

Usage:
  npm run prepare:ship
  npm run prepare:ship -- --directory path/to/project
  npm run prepare:ship -- --write
  npm run prepare:ship -- --write --clean --yes

Options:
  -d, --directory <path>  Consumer project directory (default: current directory)
      --write             Apply release files after preview
      --clean             Also remove listed prototype-only paths
  -y, --yes               Skip the final confirmation prompt
  -h, --help              Show this help

The default command is preview-only and never changes files.
`);
}

async function confirmWrite(options, summary) {
  if (options.yes) return true;
  if (!process.stdin.isTTY) {
    throw new ConsumerShipError(
      'Use --yes to approve Ship preparation in a noninteractive environment.',
    );
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log(`\n${summary}\n`);
    const answer = (
      await rl.question(
        options.clean
          ? 'Write release files and remove the listed prototype-only paths? (y/N): '
          : 'Write the proposed release files? (y/N): ',
      )
    )
      .trim()
      .toLowerCase();
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const root = path.resolve(options.directory);
  const state = await createFilesystemShipPlan(root);
  const summary = formatShipPlan(state.plan);
  console.log(`Ship preparation preview\n------------------------\n${summary}`);

  if (state.plan.blocking.length > 0) {
    process.exitCode = 1;
    return;
  }
  if (!options.write) {
    console.log('\nPreview complete. No files were changed.');
    return;
  }

  if (!(await confirmWrite(options, summary))) {
    console.log('Ship preparation cancelled. No files were changed.');
    return;
  }

  const result = await applyShipPlan({ root, plan: state.plan, clean: options.clean });
  console.log(`Prepared ${result.written.length} release files.`);
  if (result.removed.length > 0) console.log(`Removed: ${result.removed.join(', ')}.`);
  console.log('Run npm test, then deploy and verify the live URL.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
