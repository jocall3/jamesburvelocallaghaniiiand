/**
 * @module governance/ComplianceChecker
 * @description A module for running automated compliance checks against predefined rule sets.
 * This is a core component of the shared kernel, ensuring that various parts of the system
 * can be validated against a consistent set of governance and compliance rules.
 */

/**
 * Defines the severity level of a compliance rule.
 */
export enum RuleSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFORMATIONAL = 'informational',
}

/**
 * Defines the category of a compliance rule for better organization and filtering.
 */
export enum RuleCategory {
  SECURITY = 'security',
  DATA_PRIVACY = 'data-privacy',
  ACCESSIBILITY = 'accessibility',
  PERFORMANCE = 'performance',
  LEGAL = 'legal',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  CUSTOM = 'custom',
}

/**
 * The result of a single rule check function.
 * Can be a simple boolean or an object with more details for richer reporting.
 */
export type CheckFunctionResult = boolean | {
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
};

/**
 * Represents a single compliance rule.
 * @template T The type of the context object that the rule will be checked against.
 */
export interface ComplianceRule<T> {
  /** A unique identifier for the rule (e.g., 'SEC-001'). */
  id: string;
  /** A human-readable name for the rule. */
  name: string;
  /** A detailed description of the rule's purpose and what it checks for. */
  description: string;
  /** The severity of the rule if it fails. */
  severity: RuleSeverity;
  /** The category the rule belongs to. */
  category: RuleCategory;
  /**
   * The function that performs the actual compliance check.
   * @param context The data/context object to be evaluated.
   * @returns A promise resolving to a boolean or a detailed result object.
   */
  check: (context: T) => Promise<CheckFunctionResult>;
}

/**
 * A collection of compliance rules, typically indexed by their ID for efficient lookup.
 * @template T The type of the context object.
 */
export type RuleSet<T> = Map<string, ComplianceRule<T>>;

/**
 * The result of a single compliance check against a rule.
 */
export interface ComplianceCheckResult {
  /** The ID of the rule that was checked. */
  ruleId: string;
  /** The name of the rule. */
  ruleName: string;
  /** The severity of the rule. */
  severity: RuleSeverity;
  /** The category of the rule. */
  category: RuleCategory;
  /** Indicates whether the check passed or failed. */
  passed: boolean;
  /** An optional message providing more details, especially on failure. */
  message?: string;
  /** The timestamp of when the check was performed. */
  timestamp: Date;
  /** Optional structured data for more context on the result. */
  details?: Record<string, unknown>;
}

/**
 * Defines the overall status of a compliance report.
 */
export enum OverallStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non-compliant',
  ERROR = 'error',
}

/**
 * A comprehensive report generated after running a set of compliance checks.
 */
export interface ComplianceReport {
  /** A summary of the check results. */
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    checksBySeverity: Record<RuleSeverity, { passed: number; failed: number }>;
  };
  /** The overall compliance status based on the results. */
  overallStatus: OverallStatus;
  /** An array of individual check results. */
  results: ComplianceCheckResult[];
  /** The timestamp of when the report was generated. */
  generatedAt: Date;
  /** Any errors that occurred during the execution of the checks. */
  errors: { ruleId: string; error: string }[];
}

/**
 * A class responsible for running compliance checks against a given context.
 * @template T The type of the context object that the rules will be checked against.
 */
export class ComplianceChecker<T> {
  private readonly ruleSet: RuleSet<T>;

  /**
   * Creates an instance of ComplianceChecker.
   * @param rules An array of ComplianceRule objects to form the rule set.
   */
  constructor(rules: ComplianceRule<T>[]) {
    this.ruleSet = new Map(rules.map(rule => [rule.id, rule]));
  }

  /**
   * Runs all compliance checks in the rule set against the provided context.
   * @param context The data/context object to be evaluated.
   * @returns A promise that resolves to a comprehensive ComplianceReport.
   */
  public async runChecks(context: T): Promise<ComplianceReport> {
    const generatedAt = new Date();
    const results: ComplianceCheckResult[] = [];
    const errors: { ruleId: string; error: string }[] = [];

    const checkPromises = Array.from(this.ruleSet.values()).map(async (rule) => {
      try {
        const checkResult = await rule.check(context);
        const passed = typeof checkResult === 'boolean' ? checkResult : checkResult.passed;
        const message = typeof checkResult === 'object' ? checkResult.message : undefined;
        const details = typeof checkResult === 'object' ? checkResult.details : undefined;

        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          category: rule.category,
          passed,
          message: message || (passed ? 'Compliance check passed.' : 'Compliance check failed.'),
          timestamp: new Date(),
          details,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          ruleId: rule.id,
          error: errorMessage,
        });
        // A check that errors out is considered a failure for reporting purposes.
        results.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            category: rule.category,
            passed: false,
            message: `An error occurred while executing the check: ${errorMessage}`,
            timestamp: new Date(),
        });
      }
    });

    await Promise.all(checkPromises);

    return this.generateReport(results, errors, generatedAt);
  }

  /**
   * Generates the final compliance report from the individual check results.
   * @param results The array of individual check results.
   * @param errors The array of errors encountered during checks.
   * @param generatedAt The timestamp when the report generation started.
   * @returns A complete ComplianceReport object.
   */
  private generateReport(
    results: ComplianceCheckResult[],
    errors: { ruleId: string; error: string }[],
    generatedAt: Date
  ): ComplianceReport {
    const summary = {
      totalChecks: this.ruleSet.size,
      passed: 0,
      failed: 0,
      checksBySeverity: {
        [RuleSeverity.CRITICAL]: { passed: 0, failed: 0 },
        [RuleSeverity.HIGH]: { passed: 0, failed: 0 },
        [RuleSeverity.MEDIUM]: { passed: 0, failed: 0 },
        [RuleSeverity.LOW]: { passed: 0, failed: 0 },
        [RuleSeverity.INFORMATIONAL]: { passed: 0, failed: 0 },
      },
    };

    for (const result of results) {
      if (result.passed) {
        summary.passed++;
        summary.checksBySeverity[result.severity].passed++;
      } else {
        summary.failed++;
        summary.checksBySeverity[result.severity].failed++;
      }
    }

    let overallStatus: OverallStatus;
    if (errors.length > 0 && summary.failed === errors.length && summary.passed === 0) {
        overallStatus = OverallStatus.ERROR;
    } else if (summary.failed > 0) {
        overallStatus = OverallStatus.NON_COMPLIANT;
    } else {
        overallStatus = OverallStatus.COMPLIANT;
    }

    // Sort results for consistency: failed critical first, then by severity
    results.sort((a, b) => {
        if (a.passed !== b.passed) {
            return a.passed ? 1 : -1; // failures first
        }
        const severityOrder = [
            RuleSeverity.CRITICAL,
            RuleSeverity.HIGH,
            RuleSeverity.MEDIUM,
            RuleSeverity.LOW,
            RuleSeverity.INFORMATIONAL,
        ];
        return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
    });

    return {
      summary,
      overallStatus,
      results,
      generatedAt,
      errors,
    };
  }

  /**
   * Retrieves a specific rule by its ID.
   * @param ruleId The ID of the rule to retrieve.
   * @returns The ComplianceRule object or undefined if not found.
   */
  public getRule(ruleId: string): ComplianceRule<T> | undefined {
    return this.ruleSet.get(ruleId);
  }

  /**
   * Returns the total number of rules in the checker's rule set.
   * @returns The number of rules.
   */
  public get ruleCount(): number {
    return this.ruleSet.size;
  }
}