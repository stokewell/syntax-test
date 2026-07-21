/** Canonical font-pair configuration for Syntax. */
(function (global) {
  'use strict';

  const pairs = Object.freeze({
    editorial: Object.freeze({
      label: 'Editorial',
      heading: 'EB Garamond',
      body: 'Plus Jakarta Sans',
      headingWeights: 'ital,wght@0,400;0,700;1,400',
      bodyWeights: 'wght@400;500;600;700',
      headingFallback: 'Georgia, serif',
      bodyFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    contemporary: Object.freeze({
      label: 'Contemporary',
      heading: 'DM Serif Display',
      body: 'Inter',
      headingWeights: 'ital,wght@0,400',
      bodyWeights: 'wght@400;500;600;700',
      headingFallback: 'Georgia, serif',
      bodyFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    scholarly: Object.freeze({
      label: 'Scholarly',
      heading: 'Merriweather',
      body: 'Work Sans',
      headingWeights: 'wght@400;700',
      bodyWeights: 'wght@400;500;600;700',
      headingFallback: 'Georgia, serif',
      bodyFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    literary: Object.freeze({
      label: 'Literary',
      heading: 'Lora',
      body: 'Source Sans 3',
      headingWeights: 'wght@400;600;700',
      bodyWeights: 'wght@400;500;600;700',
      headingFallback: 'Georgia, serif',
      bodyFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    bookish: Object.freeze({
      label: 'Bookish',
      heading: 'Vollkorn',
      body: 'Noto Sans',
      headingWeights: 'wght@400;600;700',
      bodyWeights: 'wght@400;500;600;700',
      headingFallback: 'Georgia, serif',
      bodyFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    modernSans: Object.freeze({
      label: 'Modern Sans',
      heading: 'Outfit',
      body: 'Inter',
      headingWeights: 'wght@500;600;700;800',
      bodyWeights: 'wght@400;500;600;700',
      headingFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      bodyFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    classic: Object.freeze({
      label: 'Classic',
      heading: 'Cormorant Garamond',
      body: 'Work Sans',
      headingWeights: 'wght@500;600;700',
      bodyWeights: 'wght@400;500;600;700',
      headingFallback: 'Georgia, serif',
      bodyFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
    geometric: Object.freeze({
      label: 'Geometric',
      heading: 'Montserrat',
      body: 'Roboto',
      headingWeights: 'wght@500;600;700;800',
      bodyWeights: 'wght@400;500;700',
      headingFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      bodyFallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }),
  });

  global.SyntaxFontPairs = pairs;
})(window);
