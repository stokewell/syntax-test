export const CONSUMER_SCHEMA_VERSION = 1;
export const CONSUMER_GENERATOR_VERSION = '0.2.0';
export const SYNTAX_VERSION = '1.2.0';
export const SCHEMA_URL =
  'https://raw.githubusercontent.com/stokewell/syntax/main/consumer/schema/syntax-project.schema.json';

export const RECIPE_IDS = Object.freeze(['blank', 'portfolio', 'product', 'app']);
export const VISUAL_DIRECTIONS = Object.freeze([
  'editorial',
  'product',
  'technical',
  'playful',
  'minimal',
  'cinematic',
  'retro-interface',
]);
export const FEATURE_IDS = Object.freeze([
  'theme',
  'font-chooser',
  'mobile-navigation',
  'dialog',
  'tabs',
  'accordion',
  'responsive-image',
  'custom-card',
  'motion',
  'forms',
]);
export const PROJECT_MODES = Object.freeze(['prototype', 'ship']);
export const DEPLOYMENT_IDS = Object.freeze(['none', 'github-pages-root', 'github-pages-actions']);
