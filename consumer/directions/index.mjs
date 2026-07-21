import { createAccentPalette } from '../lib/color.mjs';

function direction(id, label, description, variables) {
  return Object.freeze({
    id,
    label,
    description,
    variables: Object.freeze(variables),
  });
}

const directions = Object.freeze({
  editorial: direction(
    'editorial',
    'Editorial',
    'Serif-led, spacious, restrained, and content-first.',
    {
      headingFont: 'var(--font-heading)',
      bodyFont: 'var(--font-body)',
      maxWidth: '76rem',
      displaySize: 'clamp(3.5rem, 9vw, 7.5rem)',
      headingTracking: '-0.045em',
      sectionSpace: 'clamp(5rem, 10vw, 9rem)',
      cardRadius: '0.125rem',
      cardShadow: 'none',
      cardBackground: 'transparent',
      cardBorder: 'var(--color-border-strong)',
      cardPadding: 'clamp(1.25rem, 3vw, 2rem)',
      cardMinimum: '21rem',
      heroAlign: 'left',
      heroJustify: 'flex-start',
      labelTransform: 'uppercase',
      labelTracking: '0.14em',
      artRadius: '0',
    },
  ),
  product: direction('product', 'Product', 'Sans-led, compact, polished, and interface-oriented.', {
    headingFont: 'var(--font-body)',
    bodyFont: 'var(--font-body)',
    maxWidth: '80rem',
    displaySize: 'clamp(3.25rem, 8vw, 7rem)',
    headingTracking: '-0.06em',
    sectionSpace: 'clamp(4.5rem, 8vw, 7rem)',
    cardRadius: 'var(--radius-xl)',
    cardShadow: 'var(--shadow-md)',
    cardBackground: 'var(--color-surface-raised)',
    cardBorder: 'var(--color-border)',
    cardPadding: 'clamp(1.25rem, 3vw, 2rem)',
    cardMinimum: '18rem',
    heroAlign: 'center',
    heroJustify: 'center',
    labelTransform: 'none',
    labelTracking: '0.02em',
    artRadius: 'calc(var(--radius-xl) - 0.25rem)',
  }),
  technical: direction(
    'technical',
    'Technical',
    'Dense, systematic, precise, and documentation-oriented.',
    {
      headingFont: 'var(--font-mono)',
      bodyFont: 'var(--font-body)',
      maxWidth: '88rem',
      displaySize: 'clamp(2.8rem, 7vw, 6rem)',
      headingTracking: '-0.035em',
      sectionSpace: 'clamp(3.5rem, 7vw, 6rem)',
      cardRadius: 'var(--radius-sm)',
      cardShadow: 'none',
      cardBackground: 'var(--color-surface-raised)',
      cardBorder: 'var(--color-border-strong)',
      cardPadding: 'clamp(1rem, 2.5vw, 1.5rem)',
      cardMinimum: '17rem',
      heroAlign: 'left',
      heroJustify: 'flex-start',
      labelTransform: 'uppercase',
      labelTracking: '0.1em',
      artRadius: 'var(--radius-sm)',
    },
  ),
  playful: direction(
    'playful',
    'Playful',
    'Bold, friendly, rounded, and energetic without becoming chaotic.',
    {
      headingFont: 'var(--font-body)',
      bodyFont: 'var(--font-body)',
      maxWidth: '82rem',
      displaySize: 'clamp(3.5rem, 9vw, 8rem)',
      headingTracking: '-0.07em',
      sectionSpace: 'clamp(4.5rem, 9vw, 8rem)',
      cardRadius: '2rem',
      cardShadow: 'var(--shadow-lg)',
      cardBackground: 'var(--color-surface-raised)',
      cardBorder: 'var(--color-border)',
      cardPadding: 'clamp(1.5rem, 4vw, 2.5rem)',
      cardMinimum: '18rem',
      heroAlign: 'center',
      heroJustify: 'center',
      labelTransform: 'none',
      labelTracking: '0.01em',
      artRadius: '1.5rem',
    },
  ),
  minimal: direction('minimal', 'Minimal', 'Quiet, exact, low-chrome, and deliberately spacious.', {
    headingFont: 'var(--font-body)',
    bodyFont: 'var(--font-body)',
    maxWidth: '68rem',
    displaySize: 'clamp(3rem, 8vw, 6.5rem)',
    headingTracking: '-0.055em',
    sectionSpace: 'clamp(6rem, 12vw, 11rem)',
    cardRadius: '0',
    cardShadow: 'none',
    cardBackground: 'transparent',
    cardBorder: 'var(--color-border)',
    cardPadding: 'clamp(1rem, 2vw, 1.5rem)',
    cardMinimum: '19rem',
    heroAlign: 'left',
    heroJustify: 'flex-start',
    labelTransform: 'none',
    labelTracking: '0',
    artRadius: '0',
  }),
  cinematic: direction(
    'cinematic',
    'Cinematic',
    'Large-scale, atmospheric, dramatic, and image-forward.',
    {
      headingFont: 'var(--font-heading)',
      bodyFont: 'var(--font-body)',
      maxWidth: '92rem',
      displaySize: 'clamp(4rem, 11vw, 9.5rem)',
      headingTracking: '-0.065em',
      sectionSpace: 'clamp(6rem, 12vw, 11rem)',
      cardRadius: 'var(--radius-lg)',
      cardShadow: 'var(--shadow-xl)',
      cardBackground: 'var(--color-surface-raised)',
      cardBorder: 'transparent',
      cardPadding: 'clamp(1.5rem, 4vw, 3rem)',
      cardMinimum: '22rem',
      heroAlign: 'left',
      heroJustify: 'flex-start',
      labelTransform: 'uppercase',
      labelTracking: '0.18em',
      artRadius: 'var(--radius-lg)',
    },
  ),
  'retro-interface': direction(
    'retro-interface',
    'Retro Interface',
    'Monospaced, panel-based, high-contrast, and intentionally machine-like.',
    {
      headingFont: 'var(--font-mono)',
      bodyFont: 'var(--font-mono)',
      maxWidth: '86rem',
      displaySize: 'clamp(2.8rem, 7vw, 6.25rem)',
      headingTracking: '-0.025em',
      sectionSpace: 'clamp(3.5rem, 7vw, 6rem)',
      cardRadius: '0.25rem',
      cardShadow: '0 0 0 1px var(--color-border-strong), 0.5rem 0.5rem 0 var(--color-border)',
      cardBackground: 'var(--color-surface-raised)',
      cardBorder: 'var(--color-border-strong)',
      cardPadding: 'clamp(1rem, 2.5vw, 1.75rem)',
      cardMinimum: '18rem',
      heroAlign: 'left',
      heroJustify: 'flex-start',
      labelTransform: 'uppercase',
      labelTracking: '0.12em',
      artRadius: '0.125rem',
    },
  ),
});

export const PUBLIC_VISUAL_DIRECTIONS = Object.freeze(Object.keys(directions));

export function getVisualDirection(id) {
  const selected = directions[id];
  if (!selected) throw new Error(`Unsupported public visual direction: ${String(id)}.`);
  return selected;
}

export function renderDirectionVariables({ visualDirection, accentColor }) {
  const selected = getVisualDirection(visualDirection);
  const palette = createAccentPalette(accentColor);
  const variables = selected.variables;

  return `:root {
  --color-primary: ${palette.light};
  --color-primary-rgb: ${palette.lightRgb};
  --color-on-primary: ${palette.onLight};
  --consumer-font-heading: ${variables.headingFont};
  --consumer-font-body: ${variables.bodyFont};
  --consumer-max-width: ${variables.maxWidth};
  --consumer-display-size: ${variables.displaySize};
  --consumer-heading-tracking: ${variables.headingTracking};
  --consumer-section-space: ${variables.sectionSpace};
  --consumer-card-radius: ${variables.cardRadius};
  --consumer-card-shadow: ${variables.cardShadow};
  --consumer-card-background: ${variables.cardBackground};
  --consumer-card-border: ${variables.cardBorder};
  --consumer-card-padding: ${variables.cardPadding};
  --consumer-card-minimum: ${variables.cardMinimum};
  --consumer-hero-align: ${variables.heroAlign};
  --consumer-hero-justify: ${variables.heroJustify};
  --consumer-label-transform: ${variables.labelTransform};
  --consumer-label-tracking: ${variables.labelTracking};
  --consumer-art-radius: ${variables.artRadius};
}

[data-theme='dark'] {
  --color-primary: ${palette.dark};
  --color-primary-rgb: ${palette.darkRgb};
  --color-on-primary: ${palette.onDark};
}`;
}
