import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function copySource(source, destination, transform = (content) => content) {
  return {
    path: destination,
    render: async () => transform(await readFile(path.join(root, source), 'utf8')),
  };
}

export function createShipToolingFiles() {
  return [
    copySource('scripts/prepare-ship.mjs', 'scripts/prepare-ship.mjs', (content) =>
      content.replaceAll('../consumer/lib/', './syntax-ship/'),
    ),
    copySource('consumer/lib/ship.mjs', 'scripts/syntax-ship/ship.mjs'),
    copySource('consumer/lib/ship-files.mjs', 'scripts/syntax-ship/ship-files.mjs'),
    copySource('consumer/lib/path-safety.mjs', 'scripts/syntax-ship/path-safety.mjs'),
    copySource('consumer/lib/residue.mjs', 'scripts/syntax-ship/residue.mjs'),
  ];
}
