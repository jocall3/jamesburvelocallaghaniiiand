export interface Application {
  id: string;
  displayName: string;
  appId: string;
  createdDateTime: string;
  applicationType?: string;
  accountEnabled: boolean;
  applicationVisibility?: 'Visible' | 'Hidden';
  assignmentRequired: boolean;
  isAppProxy: boolean;
}

export interface RuleResult {
  ruleName: string;
  passed: boolean;
  message: string;
}

export interface ValidationResult {
  applicationId: string;
  displayName: string;
  compliant: boolean;
  results: RuleResult[];
}

export type ComplianceRule = (app: Application) => RuleResult;

// --- Compliance Rule Definitions ---

/**
 * Checks if 'Enterprise Application' types require user assignment.
 * This is a security best practice to control access.
 */
const enterpriseAppsMustRequireAssignment: ComplianceRule = (app) => {
  const ruleName = 'Enterprise Apps Must Require Assignment';
  if (app.applicationType === 'Enterprise Application') {
    if (app.assignmentRequired) {
      return {
        ruleName,
        passed: true,
        message: 'Enterprise application correctly requires user assignment.',
      };
    }
    return {
      ruleName,
      passed: false,
      message: 'FAIL: Enterprise application should require user assignment.',
    };
  }
  return {
    ruleName,
    passed: true,
    message: 'N/A: Rule applies only to Enterprise Applications.',
  };
};

/**
 * Ensures that every application has a defined applicationType.
 * A blank type may indicate an incomplete or misconfigured registration.
 */
const applicationTypeMustBeDefined: ComplianceRule = (app) => {
    const ruleName = 'Application Type Must Be Defined';
    const isDefined = app.applicationType && app.applicationType.trim() !== '';
    return {
        ruleName,
        passed: isDefined,
        message: isDefined
            ? 'Application type is defined.'
            : 'FAIL: Application type is missing. Please classify the application.',
    };
};

/**
 * Flags disabled applications for review. A disabled application cannot be used.
 */
const accountMustBeEnabled: ComplianceRule = (app) => {
    const ruleName = 'Application Account Must Be Enabled';
    return {
        ruleName,
        passed: app.accountEnabled,
        message: app.accountEnabled
            ? 'Application account is enabled.'
            : 'FAIL: Application account is disabled and cannot be used.',
    };
};

/**
 * Scans display names for keywords or patterns that suggest temporary, test,
 * or non-compliant applications.
 */
const noSuspiciousDisplayNames: ComplianceRule = (app) => {
    const ruleName = 'No Suspicious or Temporary Display Names';
    const lowerCaseName = app.displayName.toLowerCase();
    
    const suspiciousKeywords = ['test', 'temp', 'demo', 'poc', 'sample', 'billgates666', 'stupid'];
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    for (const keyword of suspiciousKeywords) {
        if (lowerCaseName.includes(keyword)) {
            return {
                ruleName,
                passed: false,
                message: `FAIL: Display name contains suspicious keyword: "${keyword}".`,
            };
        }
    }

    if (uuidRegex.test(lowerCaseName)) {
        return {
            ruleName,
            passed: false,
            message: 'FAIL: Display name appears to be a UUID, suggesting it is a temporary or system-generated app.',
        };
    }

    return {
        ruleName,
        passed: true,
        message: 'Display name passes checks for suspicious patterns.',
    };
};

/**
 * Flags newly created applications (e.g., within the last 30 days) for manual review.
 * This rule "fails" to draw attention to new apps, even though it's not a misconfiguration.
 */
const appCreatedWithinLast30Days: ComplianceRule = (app) => {
    const ruleName = 'Review Apps Created in Last 30 Days';
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const createdDate = new Date(app.createdDateTime);

        if (createdDate > thirtyDaysAgo) {
            return {
                ruleName,
                passed: false,
                message: `INFO: Application was created recently (${createdDate.toLocaleDateString()}) and should be reviewed.`,
            };
        }
    } catch (e) {
        // Handle potential invalid date strings
        return {
            ruleName,
            passed: false,
            message: `ERROR: Could not parse createdDateTime: ${app.createdDateTime}`
        };
    }

    return {
        ruleName,
        passed: true,
        message: 'Application is older than 30 days.',
    };
};

// --- Policy Engine ---

/**
 * The list of compliance rules to be executed against each application.
 * New rules can be added to this array to extend the policy engine.
 */
const complianceRules: ComplianceRule[] = [
    enterpriseAppsMustRequireAssignment,
    applicationTypeMustBeDefined,
    accountMustBeEnabled,
    noSuspiciousDisplayNames,
    appCreatedWithinLast30Days,
];

/**
 * The PolicyEngine class encapsulates the logic for validating applications.
 */
export class PolicyEngine {
  private rules: ComplianceRule[];

  /**
   * Initializes the PolicyEngine with a set of compliance rules.
   * @param rules An array of ComplianceRule functions.
   */
  constructor(rules: ComplianceRule[] = []) {
    this.rules = rules;
  }

  /**
   * Validates a single application against all registered compliance rules.
   * @param app The Application object to validate.
   * @returns A ValidationResult object summarizing the compliance status.
   */
  validate(app: Application): ValidationResult {
    if (!app) {
        throw new Error("Application to validate cannot be null or undefined.");
    }
    const results = this.rules.map(rule => rule(app));
    const isCompliant = results.every(result => result.passed);

    return {
      applicationId: app.id,
      displayName: app.displayName,
      compliant: isCompliant,
      results,
    };
  }

   /**
   * Validates a list of applications.
   * @param apps An array of Application objects.
   * @returns An array of ValidationResult objects.
   */
  validateAll(apps: Application[]): ValidationResult[] {
    return apps.map(app => this.validate(app));
  }
}

/**
 * A default instance of the PolicyEngine with the standard set of rules.
 */
export const defaultPolicyEngine = new PolicyEngine(complianceRules);

/**
 * A standalone function to validate a single application using the default engine.
 * This provides a simple interface for consumers who don't need to customize the rules.
 * @param app The application to validate.
 * @returns The validation result.
 */
export const validateApplication = (app: Application): ValidationResult => {
    return defaultPolicyEngine.validate(app);
};