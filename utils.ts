/**
 * A simple utility for conditionally joining class names together.
 * @param classes A list of strings, which can include falsey values.
 * @returns A single string of space-separated class names.
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Creates a seeded random number generator (LCG).
 * This is essential for creating a reproducible simulation.
 * @param seed The initial seed value.
 * @returns A function that returns a pseudo-random number between 0 and 1.
 */
export function createSeededRandom(seed: number) {
  let state = seed;
  return function() {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}
