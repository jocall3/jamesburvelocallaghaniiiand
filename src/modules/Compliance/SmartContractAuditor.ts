interface Vulnerability {
  name: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  line?: number;
  codeSnippet?: string;
  recommendation?: string;
}

interface ComplianceIssue {
  name: string;
  description: string;
  severity: 'Warning' | 'Info';
  line?: number;
  codeSnippet?: string;
  recommendation?: string;
}

interface AuditReport {
  contractName: string;
  vulnerabilities: Vulnerability[];
  complianceIssues: ComplianceIssue[];
  summary: string;
}

class SmartContractAuditor {
  private contractCode: string;
  private lines: string[];
  private vulnerabilities: Vulnerability[] = [];
  private complianceIssues: ComplianceIssue[] = [];

  constructor(contractCode: string) {
    this.contractCode = contractCode;
    this.lines = contractCode.split('\n');
    this.vulnerabilities = [];
    this.complianceIssues = [];
  }

  /**
   * Analyzes the smart contract code for known security vulnerabilities and compliance issues.
   * @returns An audit report detailing findings.
   */
  public auditContract(): AuditReport {
    this.vulnerabilities = [];
    this.complianceIssues = [];

    // Extract contract name (simple approach)
    const contractNameMatch = this.contractCode.match(/contract\s+(\w+)\s*{/);
    const contractName = contractNameMatch ? contractNameMatch[1] : 'UnknownContract';

    // Run all vulnerability checks
    this.vulnerabilities.push(...this.checkReentrancy());
    this.vulnerabilities.push(...this.checkAccessControl());
    this.vulnerabilities.push(...this.checkIntegerOverflowUnderflow());
    this.vulnerabilities.push(...this.checkTimestampDependency());
    this.vulnerabilities.push(...this.checkUncheckedReturnValues());
    this.vulnerabilities.push(...this.checkHardcodedGasLimits());
    this.vulnerabilities.push(...this.checkDelegatecall());
    this.vulnerabilities.push(...this.checkTxOriginUsage());

    // Run all compliance checks
    this.complianceIssues.push(...this.checkSolidityVersionPragma());
    this.complianceIssues.push(...this.checkEventLogging());

    const summary = this.generateSummary();

    return {
      contractName,
      vulnerabilities: this.vulnerabilities,
      complianceIssues: this.complianceIssues,
      summary,
    };
  }

  /**
   * Generates a summary of the audit findings.
   */
  private generateSummary(): string {
    const totalVulnerabilities = this.vulnerabilities.length;
    const criticalVulnerabilities = this.vulnerabilities.filter(v => v.severity === 'Critical').length;
    const highVulnerabilities = this.vulnerabilities.filter(v => v.severity === 'High').length;
    const mediumVulnerabilities = this.vulnerabilities.filter(v => v.severity === 'Medium').length;
    const lowVulnerabilities = this.vulnerabilities.filter(v => v.severity === 'Low').length;
    const informationalVulnerabilities = this.vulnerabilities.filter(v => v.severity === 'Informational').length;

    const totalComplianceIssues = this.complianceIssues.length;
    const warningComplianceIssues = this.complianceIssues.filter(c => c.severity === 'Warning').length;
    const infoComplianceIssues = this.complianceIssues.filter(c => c.severity === 'Info').length;


    let summary = `Audit Report Summary for ${this.contractName}:\n`;
    summary += `------------------------------------------------\n`;
    summary += `Total Vulnerabilities Found: ${totalVulnerabilities}\n`;
    summary += `  Critical: ${criticalVulnerabilities}\n`;
    summary += `  High: ${highVulnerabilities}\n`;
    summary += `  Medium: ${mediumVulnerabilities}\n`;
    summary += `  Low: ${lowVulnerabilities}\n`;
    summary += `  Informational: ${informationalVulnerabilities}\n`;
    summary += `Total Compliance Issues Found: ${totalComplianceIssues}\n`;
    summary += `  Warnings: ${warningComplianceIssues}\n`;
    summary += `  Information: ${infoComplianceIssues}\n`;

    if (totalVulnerabilities === 0 && totalComplianceIssues === 0) {
      summary += '\nNo significant security vulnerabilities or compliance issues detected with basic static analysis.';
    } else {
      summary += '\nPlease review the detailed findings below.';
    }

    return summary;
  }

  /**
   * Checks for reentrancy vulnerabilities.
   * A common pattern involves external calls before state updates.
   */
  private checkReentrancy(): Vulnerability[] {
    const findings: Vulnerability[] = [];
    const stateChangingKeywords = ['balance', 'mapping', 'array', 'amount', 'value']; // Keywords indicating state
    const externalCallPattern = /(\.\s*call\s*\{.*\}\s*\(\s*\)|transfer\s*\(\s*\)|\s*\.send\s*\(\s*\))/; // Simple pattern for external calls

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (externalCallPattern.test(line)) {
        // Look for state changes before or after the external call within the same function scope
        // This is a very simplified check. A proper check would require AST/CFG analysis.
        const previousLines = this.lines.slice(Math.max(0, i - 5), i); // Look at 5 lines before
        const subsequentLines = this.lines.slice(i + 1, Math.min(this.lines.length, i + 5)); // Look at 5 lines after

        const stateChangeNearCall = [...previousLines, ...subsequentLines].some(
          l => stateChangingKeywords.some(keyword => l.includes(keyword))
        );

        if (stateChangeNearCall) {
          findings.push({
            name: 'Potential Reentrancy Vulnerability',
            description: 'External call detected near state-modifying operations. Ensure a "Checks-Effects-Interactions" pattern is followed.',
            severity: 'High',
            line: i + 1,
            codeSnippet: this.lines.slice(Math.max(0, i - 2), Math.min(this.lines.length, i + 3)).join('\n'),
            recommendation: 'Implement a "Checks-Effects-Interactions" pattern: first perform all checks, then apply all state changes, and finally interact with other contracts. Consider using a reentrancy guard.',
          });
        }
      }
    }
    return findings;
  }

  /**
   * Checks for weak access control in critical functions.
   * Looks for sensitive keywords in public/external functions without modifiers like `onlyOwner`.
   */
  private checkAccessControl(): Vulnerability[] {
    const findings: Vulnerability[] = [];
    const sensitiveKeywords = ['withdraw', 'transferOwner', 'destroy', 'mint', 'burn', 'approve'];
    const functionSignaturePattern = /(function\s+\w+\s*\(.*\)\s+(?:public|external)\s*(?!view|pure))/g; // Public/external non-view/pure functions

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const funcMatch = line.match(functionSignaturePattern);
      if (funcMatch) {
        const functionName = funcMatch[0].split(' ')[1].split('(')[0];
        // Check if sensitive keyword is in the function body or name
        const isSensitive = sensitiveKeywords.some(keyword => functionName.toLowerCase().includes(keyword.toLowerCase()));

        if (isSensitive) {
          // Simplified: check if 'onlyOwner' or similar access control modifier is present on the same line.
          // A robust check would involve deeper parsing.
          if (!line.includes('onlyOwner') && !line.includes('onlyAdmin') && !line.includes('restricted')) {
            findings.push({
              name: 'Weak Access Control',
              description: `Sensitive function '${functionName}' is declared as public/external without clear access control modifiers.`,
              severity: 'High',
              line: i + 1,
              codeSnippet: this.lines.slice(i, Math.min(this.lines.length, i + 3)).join('\n'),
              recommendation: `Apply appropriate access control modifiers (e.g., \`onlyOwner\`, \`onlyRole\`) to sensitive functions to restrict their execution to authorized entities.`,
            });
          }
        }
      }
    }
    return findings;
  }

  /**
   * Checks for integer overflow/underflow vulnerabilities.
   * In Solidity versions < 0.8.0, arithmetic operations can overflow/underflow silently.
   */
  private checkIntegerOverflowUnderflow(): Vulnerability[] {
    const findings: Vulnerability[] = [];
    const arithmeticOperators = ['+', '-', '*', '/']; // Basic arithmetic operators
    const pragmaSolidityVersionMatch = this.contractCode.match(/pragma\s+solidity\s+[\'^~]?(\d+\.\d+\.\d+);/);
    let isSafeSolidityVersion = false;

    if (pragmaSolidityVersionMatch && pragmaSolidityVersionMatch[1]) {
      const versionParts = pragmaSolidityVersionMatch[1].split('.').map(Number);
      if (versionParts[0] > 0 || (versionParts[0] === 0 && versionParts[1] >= 8)) {
        isSafeSolidityVersion = true; // Solidity >= 0.8.0 has built-in overflow/underflow checks
      }
    }

    if (!isSafeSolidityVersion) {
      for (let i = 0; i < this.lines.length; i++) {
        const line = this.lines[i];
        if (arithmeticOperators.some(op => line.includes(op)) && !line.includes('SafeMath')) {
          // This is a very broad check. A true vulnerability requires context.
          // Here, we flag any arithmetic operation in older Solidity versions without SafeMath.
          findings.push({
            name: 'Potential Integer Overflow/Underflow',
            description: 'Arithmetic operation detected in a Solidity version older than 0.8.0 without explicit SafeMath or similar libraries. Operations can overflow/underflow silently, leading to incorrect calculations or state corruption.',
            severity: 'High',
            line: i + 1,
            codeSnippet: this.lines.slice(i, Math.min(this.lines.length, i + 1)).join('\n'),
            recommendation: 'Upgrade to Solidity 0.8.0 or later, or use a SafeMath library for all arithmetic operations to prevent overflow and underflow vulnerabilities.',
          });
        }
      }
    }
    return findings;
  }

  /**
   * Checks for block.timestamp dependency in critical logic.
   * `block.timestamp` can be manipulated by miners within a certain range.
   */
  private checkTimestampDependency(): Vulnerability[] {
    const findings: Vulnerability[] = [];
    const sensitiveLogicKeywords = ['require(', 'if (', 'send(', 'transfer(', 'call.value('];

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (line.includes('block.timestamp') && sensitiveLogicKeywords.some(keyword => line.includes(keyword))) {
        findings.push({
          name: 'Timestamp Dependency Vulnerability',
          description: 'The contract relies on `block.timestamp` for critical operations, which can be manipulated by miners to a limited extent. This might affect time-sensitive functions like lotteries or withdrawals.',
          severity: 'Medium',
          line: i + 1,
          codeSnippet: this.lines.slice(i, Math.min(this.lines.length, i + 2)).join('\n'),
          recommendation: 'Avoid using `block.timestamp` for critical security-sensitive operations. If absolute precision is not required, use `block.number` to estimate time or allow for a certain margin of error.',
        });
      }
    }
    return findings;
  }

  /**
   * Checks for unchecked return values of low-level calls.
   * Low-level calls like `call()`, `send()`, `delegatecall()` return a boolean indicating success.
   * Ignoring this can lead to unexpected behavior if the call fails.
   */
  private checkUncheckedReturnValues(): Vulnerability[] {
    const findings: Vulnerability[] = [];
    const lowLevelCallPatterns = [
      /(\.call\s*\{.*\}\s*\(.*\))/,
      /(\.send\s*\(.*\))/,
      /(\.delegatecall\s*\(.*\))/,
      /(\.staticcall\s*\(.*\))/,
    ];

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      for (const pattern of lowLevelCallPatterns) {
        if (pattern.test(line)) {
          // Check if the return value is immediately used in a require/if, or assigned to a boolean.
          // This is a simplified check for direct assignment or conditional use.
          const isReturnValueChecked = line.includes('bool success =') || line.includes('require(') || line.includes('if (');
          if (!isReturnValueChecked) {
            findings.push({
              name: 'Unchecked Return Value from Low-Level Call',
              description: `A low-level call (${pattern.source}) is made, but its return value is not checked. If the call fails, the contract might proceed with an incorrect state.`,
              severity: 'Medium',
              line: i + 1,
              codeSnippet: this.lines.slice(i, Math.min(this.lines.length, i + 1)).join('\n'),
              recommendation: 'Always check the boolean return value of low-level calls to ensure the operation succeeded. Use `require(success, "Call failed");` or `if (!success) { revert("Call failed"); }`.',
            });
          }
        }
      }
    }
    return findings;
  }

  /**
   * Checks for hardcoded gas limits in external calls.
   * If `call()` is used with a hardcoded gas limit, it might fail if the gas cost of the called function changes.
   */
  private checkHardcodedGasLimits(): Vulnerability[] {
    const findings: Vulnerability[] = [];
    const hardcodedGasPattern = /\.call\s*\{\s*gas:\s*\d+\s*\}/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (hardcodedGasPattern.test(line)) {
        findings.push({
          name: 'Hardcoded Gas Limit in External Call',
          description: 'An external call uses a hardcoded gas limit. Changes in the gas cost of the called function (e.g., due to upgrades or network changes) could cause this call to fail.',
          severity: 'Low',
          line: i + 1,
          codeSnippet: this.lines.slice(i, Math.min(this.lines.length, i + 1)).join('\n'),
          recommendation: 'Avoid hardcoding gas limits for external calls. If a gas limit is necessary, consider dynamic calculation or ensure the limit is sufficiently high and can be updated easily.',
        });
      }
    }
    return findings;
  }

  /**
   * Checks for `delegatecall` usage.
   * `delegatecall` is powerful but dangerous if not used correctly, as it executes code in the context of the calling contract.
   */
  private checkDelegatecall(): Vulnerability[] {
    const findings: Vulnerability[] = [];
    const delegatecallPattern = /(\.delegatecall\s*\(.*\))/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (delegatecallPattern.test(line)) {
        findings.push({
          name: 'Delegatecall Usage Detected',
          description: 'The `delegatecall` instruction is used. This is a very powerful and dangerous operation if not handled correctly, as it executes code from another contract in the context of the current contract, including storage and balance. This can lead to unexpected state changes or complete takeover if the called contract is malicious or vulnerable.',
          severity: 'Critical',
          line: i + 1,
          codeSnippet: this.lines.slice(i, Math.min(this.lines.length, i + 1)).join('\n'),
          recommendation: 'Thoroughly review all `delegatecall` usages. Ensure that the target contract is trusted, immutable, and fully audited. Implement robust input validation and access control for any function that uses `delegatecall`. Consider using libraries that abstract away the complexities and risks.',
        });
      }
    }
    return findings;
  }

  /**
   * Checks for `tx.origin` usage.
   * Using `tx.origin` for authorization can lead to phishing attacks.
   */
  private checkTxOriginUsage(): Vulnerability[] {
    const findings: Vulnerability[] = [];
    const txOriginPattern = /tx\.origin/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (txOriginPattern.test(line)) {
        findings.push({
          name: 'Usage of tx.origin for Authorization',
          description: 'The contract uses `tx.origin` for authorization or critical decision making. This is vulnerable to phishing attacks where a malicious contract can trick an authorized user into performing actions.',
          severity: 'High',
          line: i + 1,
          codeSnippet: this.lines.slice(i, Math.min(this.lines.length, i + 1)).join('\n'),
          recommendation: 'Always use `msg.sender` for authorization and identity checks. `msg.sender` refers to the immediate caller, whereas `tx.origin` refers to the original initiator of the transaction.',
        });
      }
    }
    return findings;
  }

  /**
   * Compliance check: Ensure a Solidity version pragma is specified.
   */
  private checkSolidityVersionPragma(): ComplianceIssue[] {
    const findings: ComplianceIssue[] = [];
    if (!this.contractCode.includes('pragma solidity')) {
      findings.push({
        name: 'Missing Solidity Version Pragma',
        description: 'The contract does not specify a Solidity version pragma. This can lead to unexpected compilation behavior with different compiler versions.',
        severity: 'Warning',
        line: 1, // Assumes pragma should be at the top
        codeSnippet: this.lines.slice(0, Math.min(this.lines.length, 1)).join('\n'),
        recommendation: 'Add a Solidity version pragma (e.g., `pragma solidity ^0.8.0;`) to explicitly define the compatible compiler versions for your contract.',
      });
    } else {
      const floatingPragmaMatch = this.contractCode.match(/pragma\s+solidity\s+[\^~][\d\.]+;/);
      if (floatingPragmaMatch) {
        findings.push({
          name: 'Floating Solidity Version Pragma',
          description: 'A floating Solidity version pragma (e.g., `^0.8.0`) is used. While flexible, this could allow the contract to be compiled with newer compiler versions that might introduce breaking changes or unexpected behavior.',
          severity: 'Info',
          line: this.lines.findIndex(line => line.includes('pragma solidity')) + 1,
          codeSnippet: floatingPragmaMatch[0],
          recommendation: 'For production deployments, consider pinning the exact compiler version (e.g., `pragma solidity 0.8.0;`) to ensure consistent compilation results and prevent unintended behavior due to compiler updates.',
        });
      }
    }
    return findings;
  }

  /**
   * Compliance check: Encourage event logging for state changes.
   */
  private checkEventLogging(): ComplianceIssue[] {
    const findings: ComplianceIssue[] = [];
    const stateChangingKeywords = ['=', 'transfer(', 'mint(', 'burn(', 'approve(']; // Basic state change indicators

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (stateChangingKeywords.some(keyword => line.includes(keyword))) {
        // Look for an 'emit' statement in the vicinity of a state change
        // This is a very loose check; true detection requires AST/CFG.
        const relevantLines = this.lines.slice(Math.max(0, i - 2), Math.min(this.lines.length, i + 3));
        if (!relevantLines.some(l => l.includes('emit '))) {
          findings.push({
            name: 'Missing Event Emission for State Change',
            description: 'A state-changing operation is detected without an explicit event being emitted. Events are crucial for off-chain applications to track contract activity and data.',
            severity: 'Info',
            line: i + 1,
            codeSnippet: this.lines.slice(i, Math.min(this.lines.length, i + 1)).join('\n'),
            recommendation: 'Emit an event after every significant state-changing operation. This provides transparent and easily verifiable logs for off-chain clients and monitoring tools.',
          });
        }
      }
    }
    return findings;
  }

  // Future checks could include:
  // - Denial of Service (DoS) from unexpected reverts or loops
  // - Front-running vulnerabilities
  // - Short address attack (older ERC20 contracts)
  // - Visibility issues (functions accidentally public)
  // - Constructor naming issues (older Solidity)
  // - Floating pragma (compliance/best practice)
  // - Self-destruct checks (if not intended)
  // - ERC standards compliance (e.g., ERC-20, ERC-721)
}