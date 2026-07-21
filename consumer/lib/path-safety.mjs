import path from 'node:path';

export class ConsumerPathError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConsumerPathError';
  }
}

export function assertSafeRelativePath(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ConsumerPathError('Generated file paths must be non-empty strings.');
  }
  if (value.includes('\\') || value.includes('\0')) {
    throw new ConsumerPathError(`Unsafe generated file path: ${value}`);
  }

  const normalized = path.posix.normalize(value);
  if (
    path.posix.isAbsolute(value) ||
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized !== value
  ) {
    throw new ConsumerPathError(`Unsafe generated file path: ${value}`);
  }

  return normalized;
}

export function resolveInside(rootDirectory, relativePath) {
  const safePath = assertSafeRelativePath(relativePath);
  const root = path.resolve(rootDirectory);
  const destination = path.resolve(root, ...safePath.split('/'));
  if (destination !== root && !destination.startsWith(`${root}${path.sep}`)) {
    throw new ConsumerPathError(`Generated path escapes the target directory: ${relativePath}`);
  }
  return destination;
}
