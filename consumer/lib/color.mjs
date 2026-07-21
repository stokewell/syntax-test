function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function parseHexColor(value) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) {
    throw new TypeError(`Expected a six-digit hexadecimal color, received ${String(value)}.`);
  }

  return {
    red: Number.parseInt(value.slice(1, 3), 16),
    green: Number.parseInt(value.slice(3, 5), 16),
    blue: Number.parseInt(value.slice(5, 7), 16),
  };
}

export function toHexColor({ red, green, blue }) {
  return `#${[red, green, blue]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

export function toRgbChannels(value) {
  const { red, green, blue } = parseHexColor(value);
  return `${red}, ${green}, ${blue}`;
}

export function mixHexColors(source, target, amount) {
  const left = parseHexColor(source);
  const right = parseHexColor(target);
  const ratio = Math.max(0, Math.min(1, amount));

  return toHexColor({
    red: left.red + (right.red - left.red) * ratio,
    green: left.green + (right.green - left.green) * ratio,
    blue: left.blue + (right.blue - left.blue) * ratio,
  });
}

function linearize(channel) {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(value) {
  const { red, green, blue } = parseHexColor(value);
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}

export function contrastRatio(left, right) {
  const lighter = Math.max(relativeLuminance(left), relativeLuminance(right));
  const darker = Math.min(relativeLuminance(left), relativeLuminance(right));
  return (lighter + 0.05) / (darker + 0.05);
}

export function ensureContrast(color, background, target = 4.5) {
  if (contrastRatio(color, background) >= target) return color.toUpperCase();

  const toward = relativeLuminance(background) > 0.5 ? '#000000' : '#FFFFFF';
  for (let step = 1; step <= 20; step += 1) {
    const candidate = mixHexColors(color, toward, step / 20);
    if (contrastRatio(candidate, background) >= target) return candidate;
  }

  return toward;
}

export function chooseReadableText(background) {
  return contrastRatio('#111111', background) >= contrastRatio('#FFFFFF', background)
    ? '#111111'
    : '#FFFFFF';
}

export function createAccentPalette(accentColor) {
  const light = ensureContrast(accentColor, '#FBFAF8');
  const dark = ensureContrast(accentColor, '#181716');

  return Object.freeze({
    light,
    lightRgb: toRgbChannels(light),
    onLight: chooseReadableText(light),
    dark,
    darkRgb: toRgbChannels(dark),
    onDark: chooseReadableText(dark),
  });
}
