/**
 * core/utils/math_utils.ts
 *
 * SHARED MATHEMATICAL PRIMITIVES FOR AI ECOSYSTEM
 * -----------------------------------------------
 * This module provides high-performance, type-safe mathematical utilities
 * required across the 75-application suite. It focuses on statistical
 * analysis, probabilistic modeling (Gaussian), Monte Carlo simulations,
 * and vector arithmetic suitable for embedding operations.
 *
 * @module Core/Utils/Math
 * @license MIT
 * @version 1.0.0
 */

/**
 * Standard numerical precision constants for floating point comparisons.
 */
export const EPSILON = 1e-9;

/**
 * Collection of basic statistical functions.
 */
export class Statistics {
  /**
   * Calculates the arithmetic mean of a dataset.
   * @param data Array of numbers
   */
  static mean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Calculates the median of a dataset.
   * @param data Array of numbers
   */
  static median(data: number[]): number {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculates the variance of a dataset.
   * @param data Array of numbers
   * @param population Whether to calculate population variance (true) or sample variance (false)
   */
  static variance(data: number[], population: boolean = false): number {
    if (data.length === 0) return 0;
    if (!population && data.length === 1) return 0;
    const m = Statistics.mean(data);
    const sumSquaredDiffs = data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0);
    return sumSquaredDiffs / (data.length - (population ? 0 : 1));
  }

  /**
   * Calculates the standard deviation.
   * @param data Array of numbers
   * @param population Whether to calculate population std dev (true) or sample std dev (false)
   */
  static stdDev(data: number[], population: boolean = false): number {
    return Math.sqrt(Statistics.variance(data, population));
  }

  /**
   * Calculates a specific percentile from the dataset.
   * Uses linear interpolation between closest ranks.
   * @param data Array of numbers
   * @param p Percentile (0 to 100)
   */
  static percentile(data: number[], p: number): number {
    if (data.length === 0) return 0;
    if (p <= 0) return Math.min(...data);
    if (p >= 100) return Math.max(...data);

    const sorted = [...data].sort((a, b) => a - b);
    const rank = (p / 100) * (sorted.length - 1);
    const lowerIndex = Math.floor(rank);
    const upperIndex = Math.ceil(rank);
    const weight = rank - lowerIndex;

    return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
  }

  /**
   * Calculates the Gini coefficient (inequality metric).
   * Useful for load balancing analysis or token distribution.
   */
  static giniCoefficient(data: number[]): number {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (i + 1) * sorted[i];
      den += sorted[i];
    }
    if (den === 0) return 0;
    return (2 * num) / (n * den) - (n + 1) / n;
  }
}

/**
 * Vector mathematics utilities, primarily for embedding operations
 * and similarity search simulations.
 */
export class VectorMath {
  /**
   * Calculates the dot product of two vectors.
   */
  static dot(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /**
   * Calculates the Euclidean magnitude (L2 norm) of a vector.
   */
  static magnitude(v: number[]): number {
    return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * Calculates Cosine Similarity between two vectors.
   * Range: [-1, 1]
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    const dotProd = VectorMath.dot(a, b);
    const magA = VectorMath.magnitude(a);
    const magB = VectorMath.magnitude(b);
    if (magA === 0 || magB === 0) return 0;
    return dotProd / (magA * magB);
  }

  /**
   * Normalizes a vector to unit length (L2).
   */
  static normalize(v: number[]): number[] {
    const mag = VectorMath.magnitude(v);
    if (mag === 0) return v.map(() => 0);
    return v.map((val) => val / mag);
  }

  /**
   * Adds two vectors.
   */
  static add(a: number[], b: number[]): number[] {
    if (a.length !== b.length) throw new Error("Vector dimension mismatch");
    return a.map((val, i) => val + b[i]);
  }

  /**
   * Subtracts vector b from vector a.
   */
  static subtract(a: number[], b: number[]): number[] {
    if (a.length !== b.length) throw new Error("Vector dimension mismatch");
    return a.map((val, i) => val - b[i]);
  }

  /**
   * Multiplies a vector by a scalar.
   */
  static scale(v: number[], s: number): number[] {
    return v.map((val) => val * s);
  }
}

/**
 * Probability distribution utilities.
 * Focuses on Gaussian (Normal) distribution for modeling latency,
 * cost, and error rates in AI systems.
 */
export class Gaussian {
  constructor(public mean: number, public stdDev: number) {
    if (stdDev < 0) throw new Error("Standard deviation must be non-negative");
  }

  /**
   * Probability Density Function (PDF).
   * Returns the likelihood of a random variable taking value x.
   */
  pdf(x: number): number {
    if (this.stdDev === 0) return x === this.mean ? Infinity : 0;
    const m = this.stdDev * Math.sqrt(2 * Math.PI);
    const e = Math.exp(-Math.pow(x - this.mean, 2) / (2 * Math.pow(this.stdDev, 2)));
    return e / m;
  }

  /**
   * Cumulative Distribution Function (CDF).
   * Returns the probability that a random variable is <= x.
   * Uses the error function (erf) approximation.
   */
  cdf(x: number): number {
    if (this.stdDev === 0) return x >= this.mean ? 1 : 0;
    return 0.5 * (1 + this.erf((x - this.mean) / (this.stdDev * Math.sqrt(2))));
  }

  /**
   * Inverse Cumulative Distribution Function (Percentile Point Function).
   * Returns x such that P(X <= x) = p.
   * Uses the Acklam's algorithm or rational approximation for probit.
   * Simplified approximation here for performance.
   */
  ppf(p: number): number {
    if (p < 0 || p > 1) throw new Error("Probability must be between 0 and 1");
    if (this.stdDev === 0) return this.mean;
    
    // Rational approximation for inverse error function
    const a1 = -39.69683028665376;
    const a2 = 220.9460984245205;
    const a3 = -275.9285104469687;
    const a4 = 138.3577518672690;
    const a5 = -30.66479806614716;
    const a6 = 2.506628277459239;

    const b1 = -54.47609879822406;
    const b2 = 161.5858368580409;
    const b3 = -155.6989798598866;
    const b4 = 66.80131188771972;
    const b5 = -13.28068155288572;

    const c1 = -0.007784894002430293;
    const c2 = -0.3223964580411365;
    const c3 = -2.400758277161838;
    const c4 = -2.549732539343734;
    const c5 = 4.374664141464968;
    const c6 = 2.938163982698783;

    const d1 = 0.007784695709041462;
    const d2 = 0.3224671290700398;
    const d3 = 2.445134137142996;
    const d4 = 3.754408661907416;

    const p_low = 0.02425;
    const p_high = 1 - p_low;

    let q: number, r: number;

    if (p < p_low) {
        q = Math.sqrt(-2 * Math.log(p));
        r = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p <= p_high) {
        q = p - 0.5;
        r = q * q;
        r = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
            (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    } else {
        q = Math.sqrt(-2 * Math.log(1 - p));
        r = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }

    return this.mean + this.stdDev * r;
  }

  /**
   * Generates a random sample from the distribution using Box-Muller transform.
   */
  sample(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return this.mean + z * this.stdDev;
  }

  /**
   * Approximation of the error function.
   * Maximum error: 1.5e-7
   */
  private erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
    return sign * y;
  }
}

/**
 * Configuration for Monte Carlo simulations.
 */
export interface MonteCarloConfig {
  iterations: number;
  warmupIterations?: number;
  confidenceLevel?: number; // 0.95, 0.99 etc.
}

/**
 * Result of a Monte Carlo simulation.
 */
export interface MonteCarloResult {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p05: number;
  p95: number;
  p99: number;
  iterations: number;
  samples: number[]; // Optional: keep all samples if memory permits
}

/**
 * Engine for running Monte Carlo simulations.
 * Useful for estimating token costs, latency budgets, or agent success rates.
 */
export class MonteCarlo {
  /**
   * Runs a simulation.
   * @param generator Function that returns a single trial result (number)
   * @param config Simulation configuration
   */
  static run(generator: () => number, config: MonteCarloConfig): MonteCarloResult {
    const { iterations, warmupIterations = 0 } = config;
    const samples: number[] = [];

    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
      generator();
    }

    // Execution
    for (let i = 0; i < iterations; i++) {
      samples.push(generator());
    }

    // Analysis
    const mean = Statistics.mean(samples);
    const median = Statistics.median(samples);
    const stdDev = Statistics.stdDev(samples);
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const p05 = Statistics.percentile(samples, 5);
    const p95 = Statistics.percentile(samples, 95);
    const p99 = Statistics.percentile(samples, 99);

    return {
      mean,
      median,
      stdDev,
      min,
      max,
      p05,
      p95,
      p99,
      iterations,
      samples,
    };
  }
}

/**
 * Activation functions and probability utilities for neural simulation.
 */
export class Activation {
  /**
   * Sigmoid activation function.
   * Maps (-inf, inf) -> (0, 1)
   */
  static sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Softmax function.
   * Converts a vector of raw scores (logits) into probabilities.
   */
  static softmax(logits: number[]): number[] {
    const maxLogit = Math.max(...logits); // Numerical stability
    const exps = logits.map((l) => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sumExps);
  }

  /**
   * ReLU (Rectified Linear Unit).
   */
  static relu(x: number): number {
    return Math.max(0, x);
  }
}

/**
 * Information Theory metrics.
 * Useful for drift detection in model outputs.
 */
export class InfoTheory {
  /**
   * Kullback-Leibler Divergence (Relative Entropy).
   * Measures how one probability distribution P diverges from a second expected probability distribution Q.
   * D_KL(P || Q)
   */
  static klDivergence(p: number[], q: number[]): number {
    if (p.length !== q.length) throw new Error("Distribution length mismatch");
    let sum = 0;
    for (let i = 0; i < p.length; i++) {
      // Avoid log(0) and division by zero with epsilon
      const pi = Math.max(p[i], EPSILON);
      const qi = Math.max(q[i], EPSILON);
      sum += pi * Math.log(pi / qi);
    }
    return sum;
  }

  /**
   * Jensen-Shannon Divergence.
   * Symmetrized and smoothed version of KL divergence.
   */
  static jsDivergence(p: number[], q: number[]): number {
    if (p.length !== q.length) throw new Error("Distribution length mismatch");
    const m = p.map((val, i) => 0.5 * (val + q[i]));
    return 0.5 * InfoTheory.klDivergence(p, m) + 0.5 * InfoTheory.klDivergence(q, m);
  }
}

/**
 * Simple Exponential Moving Average for streaming metrics.
 */
export class ExponentialMovingAverage {
  private _value: number | null = null;
  private readonly alpha: number;

  /**
   * @param windowSize Roughly the number of samples to average over.
   */
  constructor(windowSize: number) {
    this.alpha = 2 / (windowSize + 1);
  }

  update(newValue: number): number {
    if (this._value === null) {
      this._value = newValue;
    } else {
      this._value = this.alpha * newValue + (1 - this.alpha) * this._value;
    }
    return this._value;
  }

  get value(): number {
    return this._value ?? 0;
  }
}