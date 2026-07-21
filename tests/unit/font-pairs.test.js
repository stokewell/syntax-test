import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { describe, expect, test } from 'vitest';

async function loadPairs() {
  const source = await readFile(new URL('../../js/config/font-pairs.js', import.meta.url), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.SyntaxFontPairs;
}

describe('font-pair configuration', () => {
  test('contains a stable editorial default', async () => {
    const pairs = await loadPairs();
    expect(pairs.editorial.heading).toBe('EB Garamond');
    expect(pairs.editorial.body).toBe('Plus Jakarta Sans');
  });

  test('defines all data required by the runtime loader', async () => {
    const pairs = await loadPairs();
    for (const pair of Object.values(pairs)) {
      expect(pair.label).toBeTruthy();
      expect(pair.headingWeights).toMatch(/wght/);
      expect(pair.bodyWeights).toMatch(/wght/);
      expect(pair.headingFallback).toBeTruthy();
      expect(pair.bodyFallback).toBeTruthy();
    }
  });
});
