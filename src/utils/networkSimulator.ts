type AsyncFunction<T> = (...args: any[]) => Promise<T>;

const DEFAULT_MIN_LATENCY = 100; // milliseconds
const DEFAULT_MAX_LATENCY = 800; // milliseconds

/**
 * Generates a random delay duration within a specified range.
 * @param min - The minimum delay in milliseconds.
 * @param max - The maximum delay in milliseconds.
 * @returns A random delay duration.
 */
function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Creates a Promise that resolves after a random delay, simulating network latency.
 * @param minLatency - Optional minimum latency in milliseconds (defaults to DEFAULT_MIN_LATENCY).
 * @param maxLatency - Optional maximum latency in milliseconds (defaults to DEFAULT_MAX_LATENCY).
 * @returns A Promise that resolves after the simulated delay.
 */
export function delay(
  minLatency: number = DEFAULT_MIN_LATENCY,
  maxLatency: number = DEFAULT_MAX_LATENCY
): Promise<void> {
  const delayAmount = getRandomDelay(minLatency, maxLatency);
  return new Promise(resolve => setTimeout(resolve, delayAmount));
}

/**
 * Wraps an asynchronous function (or a function returning a Promise) to introduce
 * artificial network latency before its execution.
 * @param asyncFn - The asynchronous function to wrap.
 * @param minLatency - Optional minimum latency in milliseconds (defaults to DEFAULT_MIN_LATENCY).
 * @param maxLatency - Optional maximum latency in milliseconds (defaults to DEFAULT_MAX_LATENCY).
 * @returns A new asynchronous function that, when called, will first wait for a
 *          randomized duration before executing the original `asyncFn`.
 */
export function simulateNetworkLatency<T>(
  asyncFn: AsyncFunction<T>,
  minLatency: number = DEFAULT_MIN_LATENCY,
  maxLatency: number = DEFAULT_MAX_LATENCY
): AsyncFunction<T> {
  return async (...args: any[]): Promise<T> => {
    await delay(minLatency, maxLatency);
    return asyncFn(...args);
  };
}