/**
 * Clamps a value to be within a range.
 * @param min The minimum value that we will clamp to
 * @param value The value to clamp
 * @param max The maximum value that we will clamp to
 * @returns The number nearest to value that is between min and max, inclusive
 */
export function clamp(min: number, value: number, max: number) {
  return Math.max(Math.min(value, max), min);
}
