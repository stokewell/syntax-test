#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';

import {
  CONSUMER_SCHEMA_VERSION,
  SCHEMA_URL,
  SYNTAX_VERSION,
  getRecipe,
} from '../consumer/index.mjs';
import { SETUP_FEATURE_IDS } from '../consumer/lib/features.mjs';
import {
  ConsumerSetupError,
  applySetupPlan,
  createSetupPlan,
  formatSetupSummary,
} from '../consumer/lib/setup.mjs';

function parseArguments(argv) {
  const options = { output: '.', config: null, yes: false, dryRun: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--yes' || argument === '-y') options.yes = true;
    else if (argument === '--dry-run') options.dryRun = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else if (argument === '--output' || argument === '-o') options.output = argv[++index];
    else if (argument === '--config' || argument === '-c') options.config = argv[++index];
    else throw new ConsumerSetupError(`Unknown setup option: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Syntax Consumer Mode setup

Usage:
  npm run setup
  npm run setup -- --config path/to/config.json --output . --yes
  npm run setup -- --config path/to/config.json --dry-run

Options:
  -c, --config <path>  Use a complete syntax.project.json-compatible configuration
  -o, --output <path>  Target directory (default: current directory)
  -y, --yes            Accept the displayed write plan without another prompt
      --dry-run         Validate and display the plan without writing files
  -h, --help            Show this help
`);
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'syntax-project';
}

function nullableUrl(value) {
  const normalized = value.trim();
  return normalized === '' || /^not yet$/i.test(normalized) ? null : normalized;
}

async function askText(rl, label, fallback = '') {
  const suffix = fallback ? ` (${fallback})` : '';
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  return answer || fallback;
}

async function askChoice(rl, label, choices, fallback) {
  const answer = (await rl.question(`${label} [${choices.join('/')}] (${fallback}): `)).trim();
  const normalized = answer || fallback;
  if (!choices.includes(normalized)) {
    console.log(`Choose one of: ${choices.join(', ')}.`);
    return askChoice(rl, label, choices, fallback);
  }
  return normalized;
}

async function askYesNo(rl, label, fallback = false) {
  const answer = (await rl.question(`${label} (${fallback ? 'Y/n' : 'y/N'}): `))
    .trim()
    .toLowerCase();
  if (answer === '') return fallback;
  if (['y', 'yes'].includes(answer)) return true;
  if (['n', 'no'].includes(answer)) return false;
  console.log('Enter yes or no.');
  return askYesNo(rl, label, fallback);
}

async function askFeatures(rl) {
  const answer = (
    await rl.question(
      `Optional features, comma separated [${SETUP_FEATURE_IDS.join(', ')}] (theme): `,
    )
  ).trim();
  const values = (answer || 'theme')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const unsupported = values.filter((value) => !SETUP_FEATURE_IDS.includes(value));
  if (unsupported.length > 0) {
    console.log(`Unsupported features: ${unsupported.join(', ')}.`);
    return askFeatures(rl);
  }
  return [...new Set(values)];
}

async function askPortfolioData(rl, projectDescription) {
  const role = await askText(rl, 'Role or professional title', 'Independent designer and builder');
  const intro = await askText(rl, 'Intro paragraph', projectDescription);
  const countText = await askText(rl, 'Number of projects (1-6)', '3');
  const count = Number.parseInt(countText, 10);
  if (!Number.isInteger(count) || count < 1 || count > 6) {
    console.log('Project count must be between 1 and 6.');
    return askPortfolioData(rl, projectDescription);
  }

  const projects = [];
  for (let index = 0; index < count; index += 1) {
    console.log(`\nProject ${index + 1}`);
    const title = await askText(rl, 'Title');
    const status = await askText(rl, 'Status', 'Selected work');
    const description = await askText(rl, 'Description');
    const url = await askText(rl, 'Destination', '#');
    const tags = (await askText(rl, 'Tags, comma separated', ''))
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 5);
    projects.push({ title, status, description, url, tags });
  }

  return { role, intro, projects, dataBacked: false };
}

async function collectInteractiveConfig(rl) {
  console.log('Syntax Consumer Mode\n');
  const name = await askText(rl, 'Project name');
  const slug = await askText(rl, 'Project slug', slugify(name));
  const description = await askText(rl, 'One-sentence description');
  const author = await askText(rl, 'Author or studio');
  const canonicalUrl = nullableUrl(await askText(rl, 'Canonical URL or “not yet”', 'not yet'));
  const repositoryUrl = nullableUrl(await askText(rl, 'Repository URL or “not yet”', 'not yet'));
  const recipeId = await askChoice(rl, 'Recipe', ['blank', 'portfolio'], 'blank');
  const visualDirection = await askChoice(
    rl,
    'Visual direction',
    ['editorial', 'product'],
    'editorial',
  );
  const accentColor = (await askText(rl, 'Accent color', '#067474')).toUpperCase();
  const primaryLabel = await askText(rl, 'Primary action label', 'Explore');
  const primaryDestination = await askText(rl, 'Primary action destination', '#main-content');
  const includeSecondary = await askYesNo(rl, 'Add a secondary action?', false);
  const secondaryAction = includeSecondary
    ? {
        label: await askText(rl, 'Secondary action label'),
        destination: await askText(rl, 'Secondary action destination'),
      }
    : null;
  const features = await askFeatures(rl);
  const deployment = await askChoice(
    rl,
    'Deployment',
    ['none', 'github-pages-root'],
    'github-pages-root',
  );

  let data;
  if (recipeId === 'portfolio') data = await askPortfolioData(rl, description);
  else {
    data = {
      eyebrow: await askText(rl, 'Hero eyebrow', 'Independent project'),
      note: await askText(
        rl,
        'Supporting note',
        'A focused starting point with room for the idea to become itself.',
      ),
    };
  }

  return {
    $schema: SCHEMA_URL,
    schemaVersion: CONSUMER_SCHEMA_VERSION,
    syntaxVersion: SYNTAX_VERSION,
    project: {
      name,
      slug,
      description,
      author,
      canonicalUrl,
      repositoryUrl,
      primaryAction: { label: primaryLabel, destination: primaryDestination },
      secondaryAction,
    },
    recipe: { id: recipeId, version: 1, data },
    visualDirection,
    accentColor,
    features,
    mode: 'prototype',
    deployment,
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  let rl;
  try {
    let config;
    if (options.config) {
      config = JSON.parse(await readFile(path.resolve(options.config), 'utf8'));
    } else {
      if (!process.stdin.isTTY) {
        throw new ConsumerSetupError(
          'Interactive setup requires a TTY. Use --config for CI or agents.',
        );
      }
      rl = createInterface({ input: process.stdin, output: process.stdout });
      config = await collectInteractiveConfig(rl);
    }

    const recipe = getRecipe(config.recipe.id);
    const plan = await createSetupPlan({
      config,
      recipe,
      outputDirectory: path.resolve(options.output),
    });

    console.log(`\nSetup summary\n-------------\n${formatSetupSummary(plan)}\n`);
    if (plan.blockingCollisions.length > 0) {
      throw new ConsumerSetupError(
        `Resolve blocking collisions before setup: ${plan.blockingCollisions.join(', ')}`,
      );
    }
    if (options.dryRun) {
      console.log('Dry run complete. No files were written.');
      return;
    }

    let confirmed = options.yes;
    if (!confirmed) {
      if (!rl) {
        if (!process.stdin.isTTY) {
          throw new ConsumerSetupError('Use --yes to approve a noninteractive setup plan.');
        }
        rl = createInterface({ input: process.stdin, output: process.stdout });
      }
      confirmed = await askYesNo(rl, 'Write this project now?', false);
    }
    if (!confirmed) {
      console.log('Setup cancelled. No files were written.');
      return;
    }

    const result = await applySetupPlan(plan);
    console.log(`Generated ${result.files.length} files in ${result.outputDirectory}.`);
    if (result.replaced.length > 0) {
      console.log(`Replaced template files: ${result.replaced.join(', ')}.`);
    }
    console.log('Run npm install, then npm run serve and npm test.');
  } finally {
    rl?.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
