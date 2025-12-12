import { Transaction } from '../types';
import { ComplianceRule } from '../types';
import { RuleResult } from '../types';

export class ComplianceEngine {
  private rules: ComplianceRule[];

  constructor(rules: ComplianceRule[]) {
    this.rules = rules;
  }

  public async evaluateTransaction(transaction: Transaction): Promise<RuleResult[]> {
    const results: RuleResult[] = [];

    for (const rule of this.rules) {
      try {
        const result = await rule.execute(transaction);
        if (result.isViolated) {
          results.push({
            ruleId: rule.id,
            description: rule.description,
            isViolated: true,
            details: result.details,
          });
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
        results.push({
          ruleId: rule.id,
          description: rule.description,
          isViolated: true,
          details: `Error executing rule: ${error}`,
        });
      }
    }
    return results;
  }

  public addRule(rule: ComplianceRule): void {
    this.rules.push(rule);
  }

  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  public getRules(): ComplianceRule[] {
    return this.rules;
  }
}