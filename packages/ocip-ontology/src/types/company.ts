/**
 * @fileoverview TypeScript interfaces and types for the 'Company' entity.
 * This file defines the canonical data structure for representing a company
 * within the OCIP (Open Core Integration Protocol) ecosystem. It covers
 * legal, financial, operational, and technological aspects of a company.
 *
 * @license
 * Copyright (c) 2024, Autonomous Principal Software Architect & Systems Integrator
 * All rights reserved.
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { BaseEntity, OcipId, Timestamp, CurrencyCode, CountryCode } from './base';
import { PersonId } from './person';

/**
 * A unique identifier for a Company entity, prefixed with 'comp'.
 * @pattern ^comp_[a-zA-Z0-9]{24}$
 */
export type CompanyId = OcipId<'comp'>;

/**
 * The legal structure or type of the company.
 */
export enum CompanyType {
    SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
    PARTNERSHIP = 'PARTNERSHIP',
    LLC = 'LLC',
    S_CORPORATION = 'S_CORPORATION',
    C_CORPORATION = 'C_CORPORATION',
    NON_PROFIT = 'NON_PROFIT',
    PUBLIC_COMPANY = 'PUBLIC_COMPANY',
    GOVERNMENT_AGENCY = 'GOVERNMENT_AGENCY',
    OTHER = 'OTHER',
}

/**
 * Standard industry classifications. Using a subset of NAICS for broad applicability.
 */
export enum IndustryClassification {
    TECH_SOFTWARE = 'TECH_SOFTWARE',
    TECH_HARDWARE = 'TECH_HARDWARE',
    FINANCE_BANKING = 'FINANCE_BANKING',
    FINANCE_INSURANCE = 'FINANCE_INSURANCE',
    HEALTHCARE_PROVIDERS = 'HEALTHCARE_PROVIDERS',
    HEALTHCARE_BIOTECH = 'HEALTHCARE_BIOTECH',
    RETAIL_ECOMMERCE = 'RETAIL_ECOMMERCE',
    RETAIL_BRICK_MORTAR = 'RETAIL_BRICK_MORTAR',
    MANUFACTURING_AUTOMOTIVE = 'MANUFACTURING_AUTOMOTIVE',
    MANUFACTURING_ELECTRONICS = 'MANUFACTURING_ELECTRONICS',
    ENERGY_OIL_GAS = 'ENERGY_OIL_GAS',
    ENERGY_RENEWABLE = 'ENERGY_RENEWABLE',
    MEDIA_ENTERTAINMENT = 'MEDIA_ENTERTAINMENT',
    TELECOMMUNICATIONS = 'TELECOMMUNICATIONS',
    GOVERNMENT_DEFENSE = 'GOVERNMENT_DEFENSE',
    EDUCATION = 'EDUCATION',
    CONSULTING = 'CONSULTING',
    OTHER = 'OTHER',
}

/**
 * Represents a physical address.
 */
export interface Address {
    street1: string;
    street2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: CountryCode;
}

/**
 * Contact information for a company.
 */
export interface ContactInfo {
    primaryEmail?: string;
    supportEmail?: string;
    salesEmail?: string;
    primaryPhone?: string;
    websiteUrl?: string;
    socialLinks?: {
        linkedin?: string;
        twitter?: string;
        github?: string;
    };
}

/**
 * The stage of venture capital funding a company is in.
 */
export enum FundingStage {
    PRE_SEED = 'PRE_SEED',
    SEED = 'SEED',
    SERIES_A = 'SERIES_A',
    SERIES_B = 'SERIES_B',
    SERIES_C = 'SERIES_C',
    SERIES_D_PLUS = 'SERIES_D_PLUS',
    IPO = 'IPO',
    POST_IPO = 'POST_IPO',
    ACQUIRED = 'ACQUIRED',
    BOOTSTRAPPED = 'BOOTSTRAPPED',
}

/**
 * Represents a single funding round.
 */
export interface FundingRound {
    id: OcipId<'frnd'>;
    stage: FundingStage;
    amount: number;
    currency: CurrencyCode;
    date: Timestamp;
    leadInvestors: string[]; // Names or IDs of lead investors
    valuation?: number; // Post-money valuation
}

/**
 * Financial profile of a company.
 */
export interface Financials {
    annualRecurringRevenue?: number;
    lastFiscalYearRevenue?: number;
    currency: CurrencyCode;
    valuation?: number;
    valuationDate?: Timestamp;
    totalFunding?: number;
    fundingRounds?: FundingRound[];
    stockSymbol?: string; // If public
    exchange?: string; // e.g., 'NASDAQ', 'NYSE'
}

/**
 * Roles within a company's team.
 */
export enum TeamMemberRole {
    FOUNDER = 'FOUNDER',
    CEO = 'CEO',
    CTO = 'CTO',
    CFO = 'CFO',
    COO = 'COO',
    CPO = 'CPO', // Chief Product Officer
    CRO = 'CRO', // Chief Revenue Officer
    CMO = 'CMO', // Chief Marketing Officer
    ENGINEER = 'ENGINEER',
    PRODUCT_MANAGER = 'PRODUCT_MANAGER',
    DESIGNER = 'DESIGNER',
    DATA_SCIENTIST = 'DATA_SCIENTIST',
    SALES = 'SALES',
    MARKETING = 'MARKETING',
    HR = 'HR',
    LEGAL = 'LEGAL',
    ADVISOR = 'ADVISOR',
    BOARD_MEMBER = 'BOARD_MEMBER',
}

/**
 * A member of the company's team.
 */
export interface TeamMember {
    personId: PersonId;
    roles: TeamMemberRole[];
    title: string;
    startDate: Timestamp;
    endDate?: Timestamp; // If they have left the company
    isKeyExecutive: boolean;
}

/**
 * Describes the composition and size of the company's team.
 */
export interface TeamComposition {
    headcount?: number;
    headcountRange?: [number, number]; // e.g., [51, 200]
    keyPersonnel: TeamMember[];
}

/**
 * Categories for technologies in a company's stack.
 */
export enum TechnologyCategory {
    CLOUD_PROVIDER = 'CLOUD_PROVIDER',
    AI_MODEL_PROVIDER = 'AI_MODEL_PROVIDER',
    VECTOR_DATABASE = 'VECTOR_DATABASE',
    DATABASE = 'DATABASE',
    ORCHESTRATION = 'ORCHESTRATION',
    OBSERVABILITY = 'OBSERVABILITY',
    CI_CD = 'CI_CD',
    CRM = 'CRM',
    ERP = 'ERP',
    COMMUNICATIONS = 'COMMUNICATIONS',
    SECURITY = 'SECURITY',
    FRONTEND_FRAMEWORK = 'FRONTEND_FRAMEWORK',
    BACKEND_FRAMEWORK = 'BACKEND_FRAMEWORK',
    PROGRAMMING_LANGUAGE = 'PROGRAMMING_LANGUAGE',
}

/**
 * A specific technology used by the company.
 */
export interface TechnologyStackItem {
    name: string; // e.g., 'Amazon Web Services', 'OpenAI GPT-4'
    category: TechnologyCategory;
    vendor?: string; // e.g., 'Amazon', 'OpenAI'
    usageDescription?: string; // e.g., 'Primary cloud infrastructure', 'For content generation'
    isCore: boolean; // Is this technology critical to the company's main product?
}

/**
 * The collection of technologies a company uses.
 */
export interface TechnologyStack {
    stack: TechnologyStackItem[];
    primaryCloud?: string; // e.g., 'AWS', 'GCP', 'Azure'
    primaryAIVendor?: string; // e.g., 'OpenAI', 'Anthropic', 'Google'
}

/**
 * Common compliance and security standards.
 */
export enum ComplianceStandard {
    SOC2_TYPE1 = 'SOC2_TYPE1',
    SOC2_TYPE2 = 'SOC2_TYPE2',
    ISO_27001 = 'ISO_27001',
    HIPAA = 'HIPAA',
    GDPR = 'GDPR',
    CCPA = 'CCPA',
    PCI_DSS = 'PCI_DSS',
    FEDRAMP_LOW = 'FEDRAMP_LOW',
    FEDRAMP_MODERATE = 'FEDRAMP_MODERATE',
    FEDRAMP_HIGH = 'FEDRAMP_HIGH',
}

/**
 * Represents a company's adherence to a compliance standard.
 */
export interface ComplianceAttestation {
    standard: ComplianceStandard;
    attestationDate: Timestamp;
    expiryDate?: Timestamp;
    auditor: string;
    reportUrl?: string; // Link to public trust report if available
}

/**
 * The primary entity representing a company in the OCIP ecosystem.
 * This is a comprehensive model capturing legal, financial, team, and tech stack details.
 */
export interface Company extends BaseEntity {
    /**
     * The unique identifier for the Company.
     */
    id: CompanyId;

    /**
     * The legal name of the company.
     */
    legalName: string;

    /**
     * The common or trading name of the company.
     */
    displayName: string;

    /**
     * A brief, one-sentence description of the company.
     */
    tagline?: string;

    /**
     * A more detailed description of the company's mission and business.
     */
    description?: string;

    /**
     * The year the company was founded.
     */
    foundedYear: number;

    /**
     * The legal type of the company entity.
     */
    companyType: CompanyType;

    /**
     * The primary industry the company operates in.
     */
    industry: IndustryClassification;

    /**
     * The company's headquarters address.
     */
    headquarters?: Address;

    /**
     * General contact information for the company.
     */
    contactInfo?: ContactInfo;

    /**
     * Financial profile, including funding and revenue.
     */
    financials?: Financials;

    /**
     * Information about the company's team and leadership.
     */
    team?: TeamComposition;

    /**
     * The technology stack used by the company.
     */
    techStack?: TechnologyStack;

    /**
     * Compliance and security attestations.
     */
    compliance?: ComplianceAttestation[];

    /**
     * A list of parent or subsidiary companies.
     */
    corporateStructure?: {
        parentId?: CompanyId;
        subsidiaries?: CompanyId[];
    };

    /**
     * Key-value pairs for custom metadata.
     */
    metadata?: Record<string, any>;
}

/**
 * Represents an event related to a Company entity.
 * These events are published to the shared event bus.
 */
export type CompanyEvent =
    | {
          eventType: 'COMPANY_CREATED';
          payload: { companyId: CompanyId; company: Company };
      }
    | {
          eventType: 'COMPANY_UPDATED';
          payload: { companyId: CompanyId; changes: Partial<Company> };
      }
    | {
          eventType: 'COMPANY_DELETED';
          payload: { companyId: CompanyId };
      }
    | {
          eventType: 'COMPANY_FUNDING_ROUND_ADDED';
          payload: { companyId: CompanyId; fundingRound: FundingRound };
      }
    | {
          eventType: 'COMPANY_TEAM_MEMBER_JOINED';
          payload: { companyId: CompanyId; teamMember: TeamMember };
      }
    | {
          eventType: 'COMPANY_TEAM_MEMBER_LEFT';
          payload: { companyId: CompanyId; personId: PersonId };
      }
    | {
          eventType: 'COMPANY_ACQUIRED';
          payload: { acquiredCompanyId: CompanyId; acquiringCompanyId: CompanyId; acquisitionDetails: Record<string, any> };
      };