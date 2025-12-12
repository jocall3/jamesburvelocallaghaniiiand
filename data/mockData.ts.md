// Citibankdemobusinessinc.data.mockData

/**
 * @description This module is responsible for generating mock data for testing and development purposes.
 * It simulates various data structures and types to allow for comprehensive testing of the Citibankdemobusinessinc ecosystem.
 * All data generation is internal and dependency-free.
 */

// Internal generative-data functions

/**
 * Generates a random integer within a specified range.
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A random integer.
 */
function generateRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random floating-point number within a specified range.
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A random floating-point number.
 */
function generateRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

/**
 * Generates a random string of a specified length.
 * @param length - The desired length of the string.
 * @returns A random string.
 */
function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Generates a random boolean value.
 * @returns A random boolean.
 */
function generateRandomBoolean(): boolean {
    return Math.random() < 0.5;
}

/**
 * Generates a random date within a specified range.
 * @param start - The start date.
 * @param end - The end date.
 * @returns A random date.
 */
function generateRandomDate(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
}

/**
 * Generates a mock user profile.
 * @returns A mock user object.
 */
function generateMockUserProfile(): any {
    return {
        userId: generateRandomString(10),
        username: generateRandomString(8),
        email: `${generateRandomString(6)}@example.com`,
        firstName: generateRandomString(5),
        lastName: generateRandomString(7),
        age: generateRandomInt(18, 99),
        isActive: generateRandomBoolean(),
        createdAt: generateRandomDate(new Date(2020, 0, 1), new Date()),
        lastLogin: generateRandomDate(new Date(2023, 0, 1), new Date()),
    };
}

/**
 * Generates a mock transaction record.
 * @returns A mock transaction object.
 */
function generateMockTransaction(): any {
    return {
        transactionId: generateRandomString(12),
        accountId: generateRandomString(15),
        amount: parseFloat(generateRandomFloat(-10000, 10000).toFixed(2)),
        currency: ['USD', 'EUR', 'GBP'][generateRandomInt(0, 2)],
        type: ['DEBIT', 'CREDIT'][generateRandomInt(0, 1)],
        description: `Transaction for ${generateRandomString(15)}`,
        timestamp: generateRandomDate(new Date(2023, 0, 1), new Date()),
        status: ['PENDING', 'COMPLETED', 'FAILED'][generateRandomInt(0, 2)],
    };
}

/**
 * Generates a mock financial product.
 * @returns A mock financial product object.
 */
function generateMockFinancialProduct(): any {
    const productTypes = ['SAVINGS_ACCOUNT', 'CHECKING_ACCOUNT', 'LOAN', 'CREDIT_CARD', 'INVESTMENT'];
    const type = productTypes[generateRandomInt(0, productTypes.length - 1)];
    let interestRate = null;
    let creditLimit = null;

    if (type === 'LOAN' || type === 'CREDIT_CARD') {
        interestRate = generateRandomFloat(3, 25);
    }
    if (type === 'CREDIT_CARD') {
        creditLimit = generateRandomInt(1000, 50000);
    }

    return {
        productId: generateRandomString(8),
        productName: `${type.replace('_', ' ')} - ${generateRandomString(10)}`,
        productType: type,
        description: `A ${type.toLowerCase()} product with competitive rates.`,
        interestRate: interestRate,
        creditLimit: creditLimit,
        createdAt: generateRandomDate(new Date(2021, 0, 1), new Date()),
        isActive: generateRandomBoolean(),
    };
}

/**
 * Generates a mock market data point.
 * @returns A mock market data object.
 */
function generateMockMarketData(): any {
    const symbols = ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'FB'];
    return {
        symbol: symbols[generateRandomInt(0, symbols.length - 1)],
        price: parseFloat(generateRandomFloat(10, 2000).toFixed(2)),
        timestamp: generateRandomDate(new Date(2023, 0, 1), new Date()),
        volume: generateRandomInt(100000, 10000000),
        change: parseFloat(generateRandomFloat(-100, 100).toFixed(2)),
        changePercent: parseFloat(generateRandomFloat(-5, 5).toFixed(2)),
    };
}

/**
 * Generates a mock regulatory compliance record.
 * @returns A mock regulatory compliance object.
 */
function generateMockRegulatoryCompliance(): any {
    const regulations = ['GDPR', 'CCPA', 'KYC', 'AML', 'SOX'];
    return {
        complianceId: generateRandomString(10),
        regulation: regulations[generateRandomInt(0, regulations.length - 1)],
        status: ['COMPLIANT', 'NON_COMPLIANT', 'PENDING_REVIEW'][generateRandomInt(0, 2)],
        lastChecked: generateRandomDate(new Date(2022, 0, 1), new Date()),
        nextReview: generateRandomDate(new Date(), new Date(2025, 0, 1)),
        details: `Compliance status for ${regulations[generateRandomInt(0, regulations.length - 1)]}.`,
    };
}

/**
 * Generates a mock risk assessment report.
 * @returns A mock risk assessment object.
 */
function generateMockRiskAssessment(): any {
    const riskTypes = ['OPERATIONAL', 'FINANCIAL', 'CYBERSECURITY', 'REPUTATIONAL', 'COMPLIANCE'];
    return {
        riskId: generateRandomString(10),
        riskType: riskTypes[generateRandomInt(0, riskTypes.length - 1)],
        severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][generateRandomInt(0, 3)],
        description: `Assessment of ${riskTypes[generateRandomInt(0, riskTypes.length - 1)]} risk.`,
        mitigationPlan: `Implement measures to reduce ${riskTypes[generateRandomInt(0, riskTypes.length - 1)]} risk.`,
        assessedAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
        nextAssessment: generateRandomDate(new Date(), new Date(2024, 0, 1)),
    };
}

/**
 * Generates a mock audit log entry.
 * @returns A mock audit log object.
 */
function generateMockAuditLog(): any {
    const actions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'TRANSACTION'];
    return {
        logId: generateRandomString(15),
        userId: generateRandomString(10),
        action: actions[generateRandomInt(0, actions.length - 1)],
        target: generateRandomString(20),
        timestamp: generateRandomDate(new Date(2023, 0, 1), new Date()),
        details: `User performed ${actions[generateRandomInt(0, actions.length - 1)]} on ${generateRandomString(20)}.`,
        ipAddress: `${generateRandomInt(1, 255)}.${generateRandomInt(1, 255)}.${generateRandomInt(1, 255)}.${generateRandomInt(1, 255)}`,
    };
}

/**
 * Generates a mock customer persona.
 * @returns A mock customer persona object.
 */
function generateMockCustomerPersona(): any {
    const demographics = ['Young Professional', 'Retiree', 'Student', 'Small Business Owner', 'Family'];
    return {
        personaId: generateRandomString(8),
        name: `Persona ${generateRandomString(5)}`,
        demographic: demographics[generateRandomInt(0, demographics.length - 1)],
        ageRange: `${generateRandomInt(18, 30)} - ${generateRandomInt(31, 65)}`,
        incomeRange: `$${generateRandomInt(30000, 150000)} - $${generateRandomInt(150001, 500000)}`,
        needs: [generateRandomString(10), generateRandomString(12)],
        painPoints: [generateRandomString(15), generateRandomString(18)],
        technologyAdoption: ['Early Adopter', 'Early Majority', 'Late Majority', 'Laggard'][generateRandomInt(0, 3)],
    };
}

/**
 * Generates a mock partnership proposal.
 * @returns A mock partnership proposal object.
 */
function generateMockPartnershipProposal(): any {
    const industries = ['FinTech', 'E-commerce', 'SaaS', 'Healthcare', 'Education'];
    return {
        proposalId: generateRandomString(10),
        partnerName: `Partner ${generateRandomString(7)}`,
        industry: industries[generateRandomInt(0, industries.length - 1)],
        proposedValue: `Synergistic growth through ${generateRandomString(20)}`,
        mutualBenefits: [generateRandomString(15), generateRandomString(18)],
        status: ['PENDING', 'ACCEPTED', 'REJECTED', 'IN_NEGOTIATION'][generateRandomInt(0, 3)],
        submittedAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
    };
}

/**
 * Generates a mock sustainability metric.
 * @returns A mock sustainability metric object.
 */
function generateMockSustainabilityMetric(): any {
    const metricTypes = ['CARBON_FOOTPRINT', 'WATER_USAGE', 'WASTE_REDUCTION', 'ENERGY_EFFICIENCY', 'SOCIAL_IMPACT'];
    return {
        metricId: generateRandomString(8),
        metricType: metricTypes[generateRandomInt(0, metricTypes.length - 1)],
        value: generateRandomFloat(0, 10000),
        unit: ['kg CO2e', 'liters', 'kg', 'kWh', 'score'][generateRandomInt(0, 4)],
        period: `${generateRandomInt(2020, 2023)}-${generateRandomInt(1, 12)}`,
        reportedAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
    };
}

/**
 * Generates a mock workforce planning data point.
 * @returns A mock workforce planning object.
 */
function generateMockWorkforcePlanning(): any {
    const roles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'Sales Representative', 'Customer Support'];
    return {
        planningId: generateRandomString(10),
        role: roles[generateRandomInt(0, roles.length - 1)],
        department: generateRandomString(10),
        currentHeadcount: generateRandomInt(5, 100),
        projectedHeadcount: generateRandomInt(5, 150),
        skillGap: generateRandomString(20),
        hiringTargetDate: generateRandomDate(new Date(), new Date(2025, 0, 1)),
    };
}

/**
 * Generates a mock organizational structure element.
 * @returns A mock org structure object.
 */
function generateMockOrgStructure(): any {
    const levels = ['CEO', 'VP', 'Director', 'Manager', 'Team Lead', 'Individual Contributor'];
    return {
        elementId: generateRandomString(8),
        name: `${generateRandomString(5)} ${generateRandomString(7)}`,
        level: levels[generateRandomInt(0, levels.length - 1)],
        reportsTo: generateRandomString(8), // Can be another elementId or null for top-level
        department: generateRandomString(10),
        startDate: generateRandomDate(new Date(2018, 0, 1), new Date()),
    };
}

/**
 * Generates a mock board pack summary.
 * @returns A mock board pack object.
 */
function generateMockBoardPack(): any {
    return {
        packId: generateRandomString(10),
        title: `Board Pack - ${generateRandomDate(new Date(2023, 0, 1), new Date()).getFullYear()}-${generateRandomDate(new Date(2023, 0, 1), new Date()).getMonth() + 1}`,
        generatedAt: new Date(),
        sections: [
            { title: 'Financial Performance', summary: 'Key financial highlights and trends.' },
            { title: 'Strategic Initiatives', summary: 'Updates on ongoing strategic projects.' },
            { title: 'Risk & Compliance', summary: 'Overview of current risk landscape and compliance status.' },
            { title: 'Market Analysis', summary: 'Competitive landscape and market opportunities.' },
        ],
        distributionList: [generateRandomString(10), generateRandomString(10)],
    };
}

/**
 * Generates a mock open banking API endpoint configuration.
 * @returns A mock open banking config object.
 */
function generateMockOpenBankingConfig(): any {
    const protocols = ['OAuth2', 'OpenID Connect'];
    return {
        configId: generateRandomString(8),
        apiName: `Open Banking API ${generateRandomString(5)}`,
        version: `${generateRandomInt(1, 3)}.${generateRandomInt(0, 9)}`,
        protocol: protocols[generateRandomInt(0, protocols.length - 1)],
        baseUrl: `https://api.citibankdemobusinessinc.com/openbanking/${generateRandomString(5)}`,
        clientId: generateRandomString(20),
        clientSecret: generateRandomString(30),
        scopes: ['accounts', 'payments', 'transactions'],
        isActive: generateRandomBoolean(),
    };
}

/**
 * Generates a mock cross-branch orchestration task.
 * @returns A mock orchestration task object.
 */
function generateMockOrchestrationTask(): any {
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'];
    return {
        taskId: generateRandomString(12),
        workflowId: generateRandomString(10),
        branchSource: `Citibankdemobusinessinc.${generateRandomString(5)}`,
        branchTarget: `Citibankdemobusinessinc.${generateRandomString(5)}`,
        operation: `perform_${generateRandomString(8)}`,
        payload: { data: generateRandomString(50) },
        status: statuses[generateRandomInt(0, statuses.length - 1)],
        createdAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
        updatedAt: generateRandomDate(new Date(), new Date()),
    };
}

/**
 * Generates a mock internal event.
 * @returns A mock event object.
 */
function generateMockInternalEvent(): any {
    const eventTypes = ['USER_CREATED', 'TRANSACTION_PROCESSED', 'PRODUCT_UPDATED', 'RISK_DETECTED', 'COMPLIANCE_ALERT'];
    return {
        eventId: generateRandomString(15),
        eventType: eventTypes[generateRandomInt(0, eventTypes.length - 1)],
        timestamp: new Date(),
        payload: {
            message: `Event of type ${eventTypes[generateRandomInt(0, eventTypes.length - 1)]} occurred.`,
            details: {
                source: `Citibankdemobusinessinc.${generateRandomString(5)}`,
                relatedId: generateRandomString(10),
            },
        },
        priority: ['LOW', 'MEDIUM', 'HIGH'][generateRandomInt(0, 2)],
    };
}

/**
 * Generates a mock shared identity record.
 * @returns A mock identity object.
 */
function generateMockSharedIdentity(): any {
    return {
        identityId: generateRandomString(10),
        userId: generateRandomString(10),
        provider: ['Internal', 'Google', 'Microsoft', 'Apple'][generateRandomInt(0, 3)],
        providerId: generateRandomString(25),
        createdAt: generateRandomDate(new Date(2020, 0, 1), new Date()),
        lastUsed: generateRandomDate(new Date(2023, 0, 1), new Date()),
        isActive: generateRandomBoolean(),
    };
}

/**
 * Generates a mock unified configuration setting.
 * @returns A mock configuration object.
 */
function generateMockUnifiedConfig(): any {
    return {
        configKey: `config_${generateRandomString(10)}`,
        configValue: JSON.stringify({ setting: generateRandomString(15), enabled: generateRandomBoolean() }),
        description: `Configuration for ${generateRandomString(15)}.`,
        updatedAt: new Date(),
        version: generateRandomInt(1, 10),
    };
}

/**
 * Generates a mock schema definition.
 * @returns A mock schema object.
 */
function generateMockSchema(): any {
    const types = ['string', 'number', 'boolean', 'object', 'array', 'date'];
    return {
        schemaId: `schema_${generateRandomString(8)}`,
        name: `Schema ${generateRandomString(6)}`,
        version: `${generateRandomInt(1, 5)}.${generateRandomInt(0, 9)}`,
        definition: {
            type: 'object',
            properties: {
                field1: { type: types[generateRandomInt(0, types.length - 1)] },
                field2: { type: types[generateRandomInt(0, types.length - 1)] },
                field3: { type: types[generateRandomInt(0, types.length - 1)] },
            },
            required: ['field1', 'field2'],
        },
        createdAt: generateRandomDate(new Date(2022, 0, 1), new Date()),
        updatedAt: new Date(),
    };
}

/**
 * Generates a mock common security primitive configuration.
 * @returns A mock security primitive object.
 */
function generateMockSecurityPrimitive(): any {
    const primitiveTypes = ['ENCRYPTION_KEY', 'ACCESS_TOKEN_SECRET', 'API_KEY', 'HMAC_SECRET'];
    return {
        primitiveId: generateRandomString(10),
        primitiveType: primitiveTypes[generateRandomInt(0, primitiveTypes.length - 1)],
        value: generateRandomString(64), // Typically a long, random string
        description: `Security primitive for ${primitiveTypes[generateRandomInt(0, primitiveTypes.length - 1)]}.`,
        createdAt: generateRandomDate(new Date(2021, 0, 1), new Date()),
        expiresAt: generateRandomDate(new Date(), new Date(2030, 0, 1)),
    };
}

/**
 * Generates a mock internal messaging queue entry.
 * @returns A mock message queue object.
 */
function generateMockMessageQueue(): any {
    const statuses = ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED'];
    return {
        messageId: generateRandomString(15),
        queueName: `queue_${generateRandomString(8)}`,
        payload: { data: generateRandomString(100) },
        status: statuses[generateRandomInt(0, statuses.length - 1)],
        createdAt: generateRandomDate(new Date(2023, 0, 1), new Date()),
        processedAt: generateRandomBoolean() ? generateRandomDate(new Date(), new Date()) : null,
    };
}

/**
 * Generates a mock deterministic build artifact.
 * @returns A mock build artifact object.
 */
function generateMockBuildArtifact(): any {
    return {
        buildId: generateRandomString(12),
        commitHash: generateRandomString(40),
        version: `${generateRandomInt(1, 10)}.${generateRandomInt(0, 20)}.${generateRandomInt(0, 50)}`,
        timestamp: new Date(),
        artifactUrl: `s3://citibankdemobusinessinc-builds/${generateRandomString(10)}.tar.gz`,
        status: ['SUCCESS', 'FAILURE', 'IN_PROGRESS'][generateRandomInt(0, 2)],
        buildLog: `Build log for ${generateRandomString(10)}...`,
    };
}

// Exported functions for external use (within the ecosystem)

export const mockData = {
    generateRandomInt,
    generateRandomFloat,
    generateRandomString,
    generateRandomBoolean,
    generateRandomDate,
    generateMockUserProfile,
    generateMockTransaction,
    generateMockFinancialProduct,
    generateMockMarketData,
    generateMockRegulatoryCompliance,
    generateMockRiskAssessment,
    generateMockAuditLog,
    generateMockCustomerPersona,
    generateMockPartnershipProposal,
    generateMockSustainabilityMetric,
    generateMockWorkforcePlanning,
    generateMockOrgStructure,
    generateMockBoardPack,
    generateMockOpenBankingConfig,
    generateMockOrchestrationTask,
    generateMockInternalEvent,
    generateMockSharedIdentity,
    generateMockUnifiedConfig,
    generateMockSchema,
    generateMockSecurityPrimitive,
    generateMockMessageQueue,
    generateMockBuildArtifact,
};

// Example of how to use these functions (for internal testing/demonstration)
// console.log("Mock User Profile:", mockData.generateMockUserProfile());
// console.log("Mock Transaction:", mockData.generateMockTransaction());
// console.log("Mock Financial Product:", mockData.generateMockFinancialProduct());