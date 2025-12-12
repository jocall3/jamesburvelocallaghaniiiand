import { Rule } from './Rule';
import { Fact } from './Fact';
import { Condition } from './Condition';
import { Action } from './Action';

export interface RuleEngineOptions {
  rules: Rule[];
}

export class RuleEngine {
  private rules: Rule[];

  constructor(options: RuleEngineOptions) {
    this.rules = options.rules;
  }

  public async execute(facts: Fact[]): Promise<Action[]> {
    const applicableActions: Action[] = [];

    for (const rule of this.rules) {
      if (await this.isRuleApplicable(rule, facts)) {
        applicableActions.push(...rule.actions);
      }
    }

    return applicableActions;
  }

  private async isRuleApplicable(rule: Rule, facts: Fact[]): Promise<boolean> {
    for (const condition of rule.conditions) {
      if (!(await this.evaluateCondition(condition, facts))) {
        return false;
      }
    }
    return true;
  }

  private async evaluateCondition(condition: Condition, facts: Fact[]): Promise<boolean> {
    const fact = facts.find(f => f.name === condition.fact);

    if (!fact) {
      // Fact not found, consider the condition as false.  Alternatively, could throw an error.
      return false;
    }

    switch (condition.operator) {
      case 'equals':
        return fact.value === condition.value;
      case 'notEquals':
        return fact.value !== condition.value;
      case 'greaterThan':
        return fact.value > condition.value;
      case 'lessThan':
        return fact.value < condition.value;
      case 'greaterThanOrEquals':
        return fact.value >= condition.value;
      case 'lessThanOrEquals':
        return fact.value <= condition.value;
      case 'contains':
        if (typeof fact.value === 'string' && typeof condition.value === 'string') {
          return fact.value.includes(condition.value);
        }
        return false; // Or throw an error if types are incompatible
      case 'notContains':
        if (typeof fact.value === 'string' && typeof condition.value === 'string') {
          return !fact.value.includes(condition.value);
        }
        return false; // Or throw an error if types are incompatible
      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(fact.value);
        }
        return false; // Or throw an error if types are incompatible
      case 'notIn':
        if (Array.isArray(condition.value)) {
          return !condition.value.includes(fact.value);
        }
        return false; // Or throw an error if types are incompatible
      default:
        // Unknown operator, consider the condition as false.  Alternatively, could throw an error.
        return false;
    }
  }

  public addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  public removeRule(rule: Rule): void {
    this.rules = this.rules.filter(r => r !== rule);
  }

  public updateRule(rule: Rule): void {
    const index = this.rules.findIndex(r => r.name === rule.name);
    if (index !== -1) {
      this.rules[index] = rule;
    }
  }

  public getRules(): Rule[] {
    return [...this.rules]; // Return a copy to prevent external modification
  }
}