// lib/rulesEngine.ts

import { Rule } from './rules';

interface Rule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
  executionTime: number;
  failureThreshold: number;
  errorHandling: string;
}

class RulesEngine {
  private rules: Rule[] = [];

  constructor(rules: Rule[] = []) {
    this.rules = rules;
  }

  /**
   * Adds a new rule to the engine.
   * @param rule The rule to add.
   */
  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  /**
   * Executes a rule.
   * @param rule The rule to execute.
   * @param args An array of arguments for the rule.
   * @returns A boolean indicating success or failure.
   */
  executeRule(rule: Rule, args: any): boolean {
    if (!rule) {
      return false;
    }

    for (const arg of args) {
      if (!rule.condition.includes(arg)) {
        return false;
      }
    }

    return true;
  }

  /**
   *  Analyzes a rule's condition and action.
   * @param rule The rule to analyze.
   * @returns A string describing the rule's analysis.
   */
  analyzeRule(rule: Rule): string {
    return `Rule ID: ${rule.id}, Name: ${rule.name}, Description: ${rule.description}, Condition: ${rule.condition}, Action: ${rule.action}, Priority: ${rule.priority}, ExecutionTime: ${rule.executionTime}, FailureThreshold: ${rule.failureThreshold}, ErrorHandling: ${rule.errorHandling}`;
  }

  /**
   *  Executes a rule.
   * @param rule The rule to execute.
   * @param args An array of arguments for the rule.
   * @returns A boolean indicating success or failure.
   */
  runRule(rule: Rule, args: any): boolean {
    if (!rule) {
      return false;
    }

    for (const arg of args) {
      if (!rule.condition.includes(arg)) {
        return false;
      }
    }

    return true;
  }
}

export { RulesEngine };