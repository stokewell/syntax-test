export {
  CONSUMER_GENERATOR_VERSION,
  CONSUMER_SCHEMA_VERSION,
  DEPLOYMENT_IDS,
  FEATURE_IDS,
  PROJECT_MODES,
  RECIPE_IDS,
  SCHEMA_URL,
  SYNTAX_VERSION,
  VISUAL_DIRECTIONS,
} from './lib/constants.mjs';
export {
  ConsumerGenerationError,
  createProjectFileSet,
  generateProject,
  readGeneratedProject,
  stableStringify,
} from './lib/generator.mjs';
export { ConsumerPathError, assertSafeRelativePath, resolveInside } from './lib/path-safety.mjs';
export { ConsumerConfigError, validateAndNormalizeConfig } from './lib/validation.mjs';
export { SETUP_FEATURE_IDS, selectedSetupFeatures } from './lib/features.mjs';
export { assertNoTemplateResidue, scanPublicContent, scanTemplateResidue } from './lib/residue.mjs';
export {
  ConsumerSetupError,
  applySetupPlan,
  createSetupPlan,
  formatSetupSummary,
} from './lib/setup.mjs';
export { ConsumerShipError, createShipPlan, formatShipPlan } from './lib/ship.mjs';
export { applyShipPlan, createFilesystemShipPlan, readShipProject } from './lib/ship-files.mjs';
export {
  PUBLIC_VISUAL_DIRECTIONS,
  getVisualDirection,
  renderDirectionVariables,
} from './directions/index.mjs';
export {
  PUBLIC_RECIPE_IDS,
  appRecipe,
  blankRecipe,
  getRecipe,
  listRecipes,
  portfolioRecipe,
  productRecipe,
} from './recipes/index.mjs';
export { getSetupRecipe, listSetupRecipes } from './recipes/setup.mjs';
