/**
 * Smart color generator for rose-based color schemes
 * Generates variations of rose colors with proper contrast and accessibility
 */

// Base rose color in OKLCH format
const BASE_ROSE = {
  l: 0.637, // lightness
  c: 0.237, // chroma
  h: 25.331, // hue (rose)
};

/**
 * Generate a rose color variation
 * @param index - Color index (0-based)
 * @param total - Total number of colors needed
 * @param isDark - Whether to generate for dark mode
 */
export function generateRoseColor(
  index: number,
  total = 5,
  isDark = false
): string {
  const { l, c, h } = BASE_ROSE;

  // Create variations by adjusting lightness and slightly shifting hue
  const lightnessVariation = isDark ? 0.1 : 0.15;
  const hueVariation = 15; // degrees

  // Calculate variations
  const lightnessStep = (lightnessVariation * 2) / (total - 1);
  const hueStep = (hueVariation * 2) / (total - 1);

  // Generate new values
  const newLightness = isDark
    ? Math.max(0.3, l - lightnessVariation + lightnessStep * index)
    : Math.min(0.85, l - lightnessVariation + lightnessStep * index);

  const newHue = h - hueVariation + hueStep * index;
  const newChroma = Math.max(0.1, c - 0.05 * Math.abs(index - total / 2));

  return `oklch(${newLightness.toFixed(3)} ${newChroma.toFixed(3)} ${newHue.toFixed(3)})`;
}

/**
 * Generate a complete rose color palette
 * @param count - Number of colors to generate
 * @param isDark - Whether to generate for dark mode
 */
export function generateRosePalette(count = 5, isDark = false): string[] {
  return Array.from({ length: count }, (_, index) =>
    generateRoseColor(index, count, isDark)
  );
}

/**
 * Get a specific rose color for chart usage with proper order status mapping
 * @param type - Color type identifier
 * @param isDark - Whether to use dark mode colors
 */
export function getRoseChartColor(type: string, isDark = false): string {
  const colorMap: Record<string, number> = {
    // Chart types
    primary: 0,
    secondary: 1,
    tertiary: 2,
    quaternary: 3,
    quinary: 4,
    revenue: 0,
    orders: 1,
    customers: 2,
    // Order status enum mapping (exact database values)
    Pending: 3, // Amber/warning color
    Confirmed: 1, // Blue/processing color
    Shipped: 2, // Purple/in-transit color
    Delivered: 0, // Green/success color
    Cancelled: 4, // Red/error color
  };

  const index = colorMap[type] ?? 0;
  return generateRoseColor(index, 5, isDark);
}

/**
 * Generate CSS custom properties for rose colors
 * @param isDark - Whether to generate for dark mode
 */
export function generateRoseColorProperties(
  isDark = false
): Record<string, string> {
  const palette = generateRosePalette(5, isDark);

  return {
    "--chart-1": palette[0],
    "--chart-2": palette[1],
    "--chart-3": palette[2],
    "--chart-4": palette[3],
    "--chart-5": palette[4],
    "--rose-primary": palette[0],
    "--rose-secondary": palette[1],
    "--rose-tertiary": palette[2],
    "--rose-quaternary": palette[3],
    "--rose-quinary": palette[4],
  };
}
