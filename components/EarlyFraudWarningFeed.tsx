import React, { useState, useEffect, useCallback, useMemo } from 'react';

// "The James Burvel O’Callaghan III Code" - Core Data Structures and Types
// Namespace: A01 - Early Fraud Warning System
// Entity: A01-E001 - Sterling Shield Analytics (SSA)
// Entity: A01-E002 - Veridian Vigilance Ventures (VVV)
// Entity: A01-E003 - Apex Assurance Alliance (AAA)
// Entity: A01-E004 - Nova Nexus Networks (NNN)
// Entity: A01-E005 - Quantum Quest Quorum (QQQ)
// Entity: A01-E006 - Zenith Zonal Zone (ZZZ)
// Entity: A01-E007 - Meridian Matrix Management (MMM)
// Entity: A01-E008 - Obsidian Oracle Operations (OOO)
// Entity: A01-E009 - Lumina Logic Labs (LLL)
// Entity: A01-E010 - Chronos Control Consortium (CCC)
// Entity: A01-E011 - Stellar Strategy Systems (SSS)
// Entity: A01-E012 - Aegis Articulation Associates (AAA)
// Entity: A01-E013 - Pallas Prime Platforms (PPP)
// Entity: A01-E014 - Janus Junctions Journal (JJJ)
// Entity: A01-E015 - Onyx Outlook Organization (OOO)
// Entity: A01-E016 - Cygnus Core Constructs (CCC)
// Entity: A01-E017 - Vesta Velocity Ventures (VVV)
// Entity: A01-E018 - Hyperion Horizon Holdings (HHH)
// Entity: A01-E019 - Solaris Security Solutions (SSS)
// Entity: A01-E020 - Lyra Lifecycle Logistics (LLL)
// Entity: A01-E021 - Phoenix Protocol Partners (PPP)
// Entity: A01-E022 - Terra Trust Technologies (TTT)
// Entity: A01-E023 - Orion Orbit Operations (OOO)
// Entity: A01-E024 - Draco Dynamic Developments (DDD)
// Entity: A01-E025 - Equinox Enterprise Entities (EEE)
// Entity: A01-E026 - Bellatrix Beacon Bureau (BBB)
// Entity: A01-E027 - Capella Cadence Companies (CCC)
// Entity: A01-E028 - Sirius Synthesis Systems (SSS)
// Entity: A01-E029 - Aldebaran Analytics Associates (AAA)
// Entity: A01-E030 - Rigel Response Resources (RRR)
// Entity: A01-E031 - Procyon Process Providers (PPP)
// Entity: A01-E032 - Betelgeuse Bureaucracy Builders (BBB)
// Entity: A01-E033 - Antares Assurance Agencies (AAA)
// Entity: A01-E034 - Vega Vector Ventures (VVV)
// Entity: A01-E035 - Altair Apex Apparatus (AAA)
// Entity: A01-E036 - Fomalhaut Foundation Firms (FFF)
// Entity: A01-E037 - Deneb Dexterity Dynamics (DDD)
// Entity: A01-E038 - Pollux Protocol Providers (PPP)
// Entity: A01-E039 - Castor Control Consortium (CCC)
// Entity: A01-E040 - Acrux Assurance Academies (AAA)
// Entity: A01-E041 - Gacrux Group Guardians (GGG)
// Entity: A01-E042 - Kaus Australis Kinetics (KAK)
// Entity: A01-E043 - Epsilon Eridani Enterprises (EEE)
// Entity: A01-E044 - Omicron Persei Organizations (OPO)
// Entity: A01-E045 - Pi-3 Orion Orchestrations (POO)
// Entity: A01-E046 - Rho Ophiuchi Operations (ROO)
// Entity: A01-E047 - Sigma Draconis Systems (SDS)
// Entity: A01-E048 - Tau Ceti Technologies (TCT)
// Entity: A01-E049 - Upsilon Andromedae Units (UAU)
// Entity: A01-E050 - Vulpecula Ventures Vistas (VVV)
// Entity: A01-E051 - Wolf-Rayet Wonders Workings (WWW)
// Entity: A01-E052 - Xylos Xenon Xperiments (XXX)
// Entity: A01-E053 - Ypsilon Yarrow Yields (YYY)
// Entity: A01-E054 - Zeta Reticuli Resources (ZRR)
// Entity: A01-E055 - Andromeda Ascendancy Agencies (AAA)
// Entity: A01-E056 - Aquarius Apex Affairs (AAA)
// Entity: A01-E057 - Aries Ascendancy Assets (AAA)
// Entity: A01-E058 - Cancer Chronicle Companies (CCC)
// Entity: A01-E059 - Capricorn Cadence Corporations (CCC)
// Entity: A01-E060 - Corona Borealis Capabilities (CBC)
// Entity: A01-E061 - Cygnus Constellation Corporation (CCC)
// Entity: A01-E062 - Delphinus Dynamic Developments (DDD)
// Entity: A01-E063 - Dorado Dynamics Data (DDD)
// Entity: A01-E064 - Eridanus Enterprise Expeditions (EEE)
// Entity: A01-E065 - Gemini Genesis Group (GGG)
// Entity: A01-E066 - Hercules Horizon Hubs (HHH)
// Entity: A01-E067 - Hydra Holdings Harmonizers (HHH)
// Entity: A01-E068 - Indus Innovations Incubation (III)
// Entity: A01-E069 - Leo Legacy Labs (LLL)
// Entity: A01-E070 - Libra Logic Linkages (LLL)
// Entity: A01-E071 - Lynx Luminosity Labs (LLL)
// Entity: A01-E072 - Lyra Lifecycle Logistics (LLL)
// Entity: A01-E073 - Mensa Management Methods (MMM)
// Entity: A01-E074 - Microscopium Methodical Management (MMM)
// Entity: A01-E075 - Monoceros Matrix Mechanisms (MMM)
// Entity: A01-E076 - Musca Management Methodologies (MMM)
// Entity: A01-E077 - Norma Network Nexus (NNN)
// Entity: A01-E078 - Octans Oversight Operations (OOO)
// Entity: A01-E079 - Ophiuchus Operations Organization (OOO)
// Entity: A01-E080 - Orion's Belt Bureau (OBB)
// Entity: A01-E081 - Pegasus Paradigm Providers (PPP)
// Entity: A01-E082 - Perseus Protocol Planners (PPP)
// Entity: A01-E083 - Phoenix Federation Firms (FFF)
// Entity: A01-E084 - Pictor Process Platforms (PPP)
// Entity: A01-E085 - Pisces Progression Partners (PPP)
// Entity: A01-E086 - Puppis Power Producers (PPP)
// Entity: A01-E087 - Pyxis Prime Projects (PPP)
// Entity: A01-E088 - Reticulum Realization Resources (RRR)
// Entity: A01-E089 - Sagittarius Strategy Studios (SSS)
// Entity: A01-E090 - Scorpius Security Systems (SSS)
// Entity: A01-E091 - Sculptor Solutions Syndicate (SSS)
// Entity: A01-E092 - Serpens Systems Solutions (SSS)
// Entity: A01-E093 - Sextans Systems Services (SSS)
// Entity: A01-E094 - Taurus Trust Technologies (TTT)
// Entity: A01-E095 - Telescopium Technical Teams (TTT)
// Entity: A01-E096 - Triangulum Trust Trio (TTT)
// Entity: A01-E097 - Ursa Major Management (UMM)
// Entity: A01-E098 - Ursa Minor Mechanisms (UMM)
// Entity: A01-E099 - Vela Ventures Velocity (VVV)
// Entity: A01-E100 - Virgo Vigilance Ventures (VVV)
// Entity: A01-E101 - Volans Velocity Ventures (VVV)
// Entity: A01-E102 - Vulpecula Visionary Ventures (VVV)
// Entity: A01-E103 - Virgo Vigilant Ventures (VVV)
// Entity: A01-E104 - Andromeda Ascendant Analytics (AAA)
// Entity: A01-E105 - Pisces Progressive Platforms (PPP)
// Entity: A01-E106 - Gemini Global Group (GGG)
// Entity: A01-E107 - Taurus Tactical Technologies (TTT)
// Entity: A01-E108 - Orion Omni Operations (OOO)
// Entity: A01-E109 - Cygnus Core Capabilities (CCC)
// Entity: A01-E110 - Lyra Legacy Logistics (LLL)
// Entity: A01-E111 - Terra Tactical Trust (TTT)
// Entity: A01-E112 - Pallas Prime Processors (PPP)
// Entity: A01-E113 - Aegis Advanced Analytics (AAA)
// Entity: A01-E114 - Apex Action Automation (AAA)
// Entity: A01-E115 - Nova Network Navigators (NNN)
// Entity: A01-E116 - Quantum Core Quorum (QQQ)
// Entity: A01-E117 - Zenith Zone Zealots (ZZZ)
// Entity: A01-E118 - Meridian Matrix Minds (MMM)
// Entity: A01-E119 - Obsidian Oracle Observers (OOO)
// Entity: A01-E120 - Lumina Logic Leaders (LLL)
// Entity: A01-E121 - Chronos Control Champions (CCC)
// Entity: A01-E122 - Stellar Strategy Specialists (SSS)
// Entity: A01-E123 - Vesta Velocity Visionaries (VVV)
// Entity: A01-E124 - Hyperion Horizon Harmonizers (HHH)
// Entity: A01-E125 - Solaris Security Strategists (SSS)
// Entity: A01-E126 - Phoenix Protocol Pioneers (PPP)
// Entity: A01-E127 - Draco Dynamic Directors (DDD)
// Entity: A01-E128 - Equinox Enterprise Experts (EEE)
// Entity: A01-E129 - Bellatrix Beacon Builders (BBB)
// Entity: A01-E130 - Capella Cadence Conductors (CCC)
// Entity: A01-E131 - Sirius Synthesis Strategists (SSS)
// Entity: A01-E132 - Aldebaran Analytics Architects (AAA)
// Entity: A01-E133 - Rigel Response Regulators (RRR)
// Entity: A01-E134 - Procyon Process Professionals (PPP)
// Entity: A01-E135 - Betelgeuse Bureaucracy Benefactors (BBB)
// Entity: A01-E136 - Antares Assurance Architects (AAA)
// Entity: A01-E137 - Vega Vector Virtuosos (VVV)
// Entity: A01-E138 - Altair Apex Administrators (AAA)
// Entity: A01-E139 - Fomalhaut Foundation Facilitators (FFF)
// Entity: A01-E140 - Deneb Dexterity Directors (DDD)
// Entity: A01-E141 - Pollux Protocol Principals (PPP)
// Entity: A01-E142 - Castor Control Custodians (CCC)
// Entity: A01-E143 - Acrux Assurance Agents (AAA)
// Entity: A01-E144 - Gacrux Group Governors (GGG)
// Entity: A01-E145 - Kaus Australis Kinetics Keepers (KAK)
// Entity: A01-E146 - Epsilon Eridani Executive Enterprises (EEE)
// Entity: A01-E147 - Omicron Persei Organization Officers (OPO)
// Entity: A01-E148 - Pi-3 Orion Orchestration Officers (POO)
// Entity: A01-E149 - Rho Ophiuchi Operation Officers (ROO)
// Entity: A01-E150 - Sigma Draconis System Specialists (SDS)
// Entity: A01-E151 - Tau Ceti Technology Teams (TCT)
// Entity: A01-E152 - Upsilon Andromedae Unit Undertakers (UAU)
// Entity: A01-E153 - Vulpecula Ventures Visionaries (VVV)
// Entity: A01-E154 - Wolf-Rayet Wonders Workforce (WWW)
// Entity: A01-E155 - Xylos Xenon Xecutors (XXX)
// Entity: A01-E156 - Ypsilon Yarrow Yield Managers (YYY)
// Entity: A01-E157 - Zeta Reticuli Resource Rangers (ZRR)
// Entity: A01-E158 - Andromeda Ascendancy Advisors (AAA)
// Entity: A01-E159 - Aquarius Apex Advisors (AAA)
// Entity: A01-E160 - Aries Ascendant Advisors (AAA)
// Entity: A01-E161 - Cancer Chronicle Consultants (CCC)
// Entity: A01-E162 - Capricorn Cadence Consultants (CCC)
// Entity: A01-E163 - Corona Borealis Capability Consultants (CBC)
// Entity: A01-E164 - Cygnus Constellation Consultants (CCC)
// Entity: A01-E165 - Delphinus Dynamic Development Directors (DDD)
// Entity: A01-E166 - Dorado Dynamics Data Directors (DDD)
// Entity: A01-E167 - Eridanus Enterprise Executive Directors (EEE)
// Entity: A01-E168 - Gemini Genesis Group Directors (GGG)
// Entity: A01-E169 - Hercules Horizon Hub Directors (HHH)
// Entity: A01-E170 - Hydra Holdings Harmonizer Directors (HHH)
// Entity: A01-E171 - Indus Innovations Incubation Directors (III)
// Entity: A01-E172 - Leo Legacy Lab Leaders (LLL)
// Entity: A01-E173 - Libra Logic Linkage Leaders (LLL)
// Entity: A01-E174 - Lynx Luminosity Lab Leaders (LLL)
// Entity: A01-E175 - Lyra Lifecycle Logistics Leaders (LLL)
// Entity: A01-E176 - Mensa Management Method Leaders (MMM)
// Entity: A01-E177 - Microscopium Methodical Management Masters (MMM)
// Entity: A01-E178 - Monoceros Matrix Mechanism Masters (MMM)
// Entity: A01-E179 - Musca Management Methodology Masters (MMM)
// Entity: A01-E180 - Norma Network Nexus Navigators (NNN)
// Entity: A01-E181 - Octans Oversight Operation Officers (OOO)
// Entity: A01-E182 - Ophiuchus Operation Organization Officers (OOO)
// Entity: A01-E183 - Orion's Belt Bureau Branch (OBB)
// Entity: A01-E184 - Pegasus Paradigm Provider Principals (PPP)
// Entity: A01-E185 - Perseus Protocol Planner Principals (PPP)
// Entity: A01-E186 - Phoenix Federation Firm Principals (FFF)
// Entity: A01-E187 - Pictor Process Platform Principals (PPP)
// Entity: A01-E188 - Pisces Progression Partner Principals (PPP)
// Entity: A01-E189 - Puppis Power Producer Principals (PPP)
// Entity: A01-E190 - Pyxis Prime Project Principals (PPP)
// Entity: A01-E191 - Reticulum Realization Resource Rangers (RRR)
// Entity: A01-E192 - Sagittarius Strategy Studio Specialists (SSS)
// Entity: A01-E193 - Scorpius Security System Specialists (SSS)
// Entity: A01-E194 - Sculptor Solutions Syndicate Specialists (SSS)
// Entity: A01-E195 - Serpens Systems Solution Specialists (SSS)
// Entity: A01-E196 - Sextans Systems Service Specialists (SSS)
// Entity: A01-E197 - Taurus Trust Technology Teams (TTT)
// Entity: A01-E198 - Telescopium Technical Team Teams (TTT)
// Entity: A01-E199 - Triangulum Trust Trio Teams (TTT)
// Entity: A01-E200 - Ursa Major Management Masters (UMM)

interface EarlyFraudWarning {
  id: string;
  chargeIdentifier: string;
  fraudClassification: string;
  timestampEpochMillis: number;
  associatedEntityId: string; // E.g., "SSA" for Sterling Shield Analytics
  severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  transactionDetails: {
    amount: number;
    currency: string;
    merchantId: string;
    cardLastFour: string;
    cardType: string;
    billingCountry: string;
    shippingCountry: string;
    ipAddress: string;
    userAgent: string;
  };
  detectionMethods: string[];
  investigationStatus: 'NEW' | 'PENDING' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'FALSE_POSITIVE';
  notes: string;
  assignedToUserId: string | null;
  resolutionDetails: {
    resolutionType: string | null;
    resolvedAtTimestampEpochMillis: number | null;
    resolverUserId: string | null;
  };
  createdAtTimestampEpochMillis: number;
  updatedAtTimestampEpochMillis: number;
}

type FraudDetectionModule = {
  moduleName: string;
  version: string;
  confidenceScore: number;
};

interface EnhancedEarlyFraudWarning extends EarlyFraudWarning {
  fraudDetectionModules: FraudDetectionModule[];
  decisionEngine: {
    ruleName: string;
    actionTaken: 'BLOCK' | 'FLAG' | 'ALLOW' | 'REVIEW';
  };
  customerProfile: {
    accountId: string;
    registrationDateEpochMillis: number;
    transactionHistoryCount: number;
    averageTransactionValue: number;
    loyaltyTier: string;
  };
}

// "The James Burvel O’Callaghan III Code" - Global Constants and Configurations
const JBOC3_GLOBAL_SYSTEM_IDENTIFIER = "JBOC3-MAXIMALIST-PROCEDURAL-ENGINE-V1.0.0";
const JBOC3_SYSTEM_BRANDING_ATTRIBUTION = "The James Burvel O’Callaghan III Code";

// Namespace: A01-C001 - System Configuration
const SYSTEM_CONFIGURATION_ENTITY = {
  entityId: "A01-C001",
  entityName: "Global System Configuration",
  brandAttribution: JBOC3_SYSTEM_BRANDING_ATTRIBUTION,
  version: "1.0.0",
  lastUpdatedEpochMillis: Date.now(),
  settings: {
    pollingIntervalMillis: 5000,
    maxWarningsToDisplay: 50,
    defaultSeverityColorMap: {
      LOW: 'text-blue-500',
      MEDIUM: 'text-yellow-500',
      HIGH: 'text-orange-500',
      CRITICAL: 'text-red-700',
    },
    fraudTypeColorMap: {
      card_testing: 'bg-purple-200 text-purple-800',
      account_takeover: 'bg-pink-200 text-pink-800',
      transaction_anomalies: 'bg-indigo-200 text-indigo-800',
      identity_verification_failure: 'bg-green-200 text-green-800',
      promo_abuse: 'bg-teal-200 text-teal-800',
      other: 'bg-gray-200 text-gray-800',
    },
    investigationStatusColorMap: {
      NEW: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      INVESTIGATING: 'bg-blue-100 text-blue-800',
      ESCALATED: 'bg-orange-100 text-orange-800',
      RESOLVED: 'bg-green-100 text-green-800',
      FALSE_POSITIVE: 'bg-red-100 text-red-800',
    },
    severityIcons: {
      LOW: '⚠️',
      MEDIUM: '🔶',
      HIGH: '🔥',
      CRITICAL: '🚨',
    },
    defaultSeverityIcon: '❓',
  }
};

// Namespace: A01 - Early Fraud Warning System
// API Endpoint: A01-EP001 - Fetch all early fraud warnings
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP001_FetchAllWarnings = async (options?: { entityId?: string, limit?: number, offset?: number, sortBy?: string, sortOrder?: 'asc' | 'desc' }): Promise<EnhancedEarlyFraudWarning[]> => {
  const effectiveEntityId = options?.entityId || 'SSA'; // Default to Sterling Shield Analytics if not specified
  const limit = options?.limit || 100;
  const offset = options?.offset || 0;
  const sortBy = options?.sortBy || 'timestampEpochMillis';
  const sortOrder = options?.sortOrder || 'desc';

  console.log(`[A01-EP001] Fetching warnings for entity: ${effectiveEntityId}, limit: ${limit}, offset: ${offset}, sort: ${sortBy} ${sortOrder}`);

  // Placeholder for actual API call. In a real system, this would involve network requests.
  // This mock data is designed to be richer and more representative.
  const mockWarnings: EnhancedEarlyFraudWarning[] = Array.from({ length: limit }, (_, i) => {
    const baseTimestamp = Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30); // Within last 30 days
    const severity = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)] as EnhancedEarlyFraudWarning['severityLevel'];
    const fraudType = ['card_testing', 'account_takeover', 'transaction_anomalies', 'identity_verification_failure', 'promo_abuse', 'other'][Math.floor(Math.random() * 6)];
    const investigationStatus = ['NEW', 'PENDING', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'FALSE_POSITIVE'][Math.floor(Math.random() * 6)] as EnhancedEarlyFraudWarning['investigationStatus'];
    const riskScore = Math.max(0.1, Math.random() * 1.0);
    const associatedEntityId = ['SSA', 'VVV', 'AAA', 'NNN', 'QQQ'][Math.floor(Math.random() * 5)];

    return {
      id: `JBO-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 9)}`,
      chargeIdentifier: `ch_${Math.random().toString(36).substring(2, 15)}`,
      fraudClassification: fraudType,
      timestampEpochMillis: baseTimestamp + i,
      associatedEntityId: associatedEntityId,
      severityLevel: severity,
      riskScore: riskScore,
      transactionDetails: {
        amount: Math.floor(Math.random() * 1000) + 50,
        currency: ['USD', 'EUR', 'GBP'][Math.floor(Math.random() * 3)],
        merchantId: `m_${Math.random().toString(36).substring(2, 10)}`,
        cardLastFour: `****${Math.floor(Math.random() * 10000)}`,
        cardType: ['Visa', 'Mastercard', 'Amex', 'Discover'][Math.floor(Math.random() * 4)],
        billingCountry: ['USA', 'CAN', 'GBR', 'FRA', 'DEU'][Math.floor(Math.random() * 5)],
        shippingCountry: ['USA', 'CAN', 'GBR', 'FRA', 'DEU'][Math.floor(Math.random() * 5)],
        ipAddress: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      detectionMethods: ['IP_Geolocation', 'Device_Fingerprinting', 'Behavioral_Analysis', 'Card_Validation', 'Known_Fraud_Patterns'],
      investigationStatus: investigationStatus,
      notes: `This is a simulated warning for ${fraudType} from ${associatedEntityId}. Risk score: ${riskScore.toFixed(2)}.`,
      assignedToUserId: Math.random() > 0.7 ? `user_${Math.random().toString(36).substring(2, 8)}` : null,
      resolutionDetails: {
        resolutionType: investigationStatus === 'RESOLVED' || investigationStatus === 'FALSE_POSITIVE' ? ['Manual_Review', 'Automated_Rule', 'Customer_Confirmation'][Math.floor(Math.random() * 3)] : null,
        resolvedAtTimestampEpochMillis: (investigationStatus === 'RESOLVED' || investigationStatus === 'FALSE_POSITIVE') ? baseTimestamp + i + Math.floor(Math.random() * 1000 * 60 * 60) : null,
        resolverUserId: (investigationStatus === 'RESOLVED' || investigationStatus === 'FALSE_POSITIVE') ? `user_${Math.random().toString(36).substring(2, 8)}` : null,
      },
      createdAtTimestampEpochMillis: baseTimestamp + i,
      updatedAtTimestampEpochMillis: baseTimestamp + i + Math.floor(Math.random() * 1000 * 60 * 10),
      fraudDetectionModules: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
        moduleName: ['AnomalyDetectionAI', 'PatternMatchingEngine', 'BehavioralBiometrics', 'CardVerificationService'][Math.floor(Math.random() * 4)],
        version: `v${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
        confidenceScore: Math.random(),
      })),
      decisionEngine: {
        ruleName: `Rule_${Math.floor(Math.random() * 100)}_${fraudType.replace('_', '-')}`,
        actionTaken: ['BLOCK', 'FLAG', 'ALLOW', 'REVIEW'][Math.floor(Math.random() * 4)] as ('BLOCK' | 'FLAG' | 'ALLOW' | 'REVIEW'),
      },
      customerProfile: {
        accountId: `acc_${Math.random().toString(36).substring(2, 12)}`,
        registrationDateEpochMillis: baseTimestamp - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365),
        transactionHistoryCount: Math.floor(Math.random() * 500),
        averageTransactionValue: Math.floor(Math.random() * 500) + 25,
        loyaltyTier: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'][Math.floor(Math.random() * 5)],
      }
    };
  });

  // Apply sorting
  mockWarnings.sort((a, b) => {
    if (a[sortBy as keyof EnhancedEarlyFraudWarning] < b[sortBy as keyof EnhancedEarlyFraudWarning]) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (a[sortBy as keyof EnhancedEarlyFraudWarning] > b[sortBy as keyof EnhancedEarlyFraudWarning]) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return mockWarnings.slice(offset, offset + limit);
};

// Namespace: A01 - Early Fraud Warning System
// API Endpoint: A01-EP002 - Fetch a single early fraud warning by ID
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP002_FetchWarningById = async (warningId: string): Promise<EnhancedEarlyFraudWarning | null> => {
  console.log(`[A01-EP002] Fetching warning by ID: ${warningId}`);
  // In a real scenario, this would query a database or cache.
  // For this example, we'll generate a mock, assuming it might exist.
  if (warningId.startsWith('JBO-')) {
    const mockData = await A01_EP001_FetchAllWarnings({ limit: 1, offset: 0 }); // Fetch one mock warning
    if (mockData.length > 0 && mockData[0].id === warningId) {
      return mockData[0];
    }
  }
  return null;
};

// Namespace: A01 - Early Fraud Warning System
// API Endpoint: A01-EP003 - Update investigation status of a warning
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP003_UpdateInvestigationStatus = async (warningId: string, newStatus: EnhancedEarlyFraudWarning['investigationStatus'], notes?: string, userId?: string): Promise<EnhancedEarlyFraudWarning> => {
  console.log(`[A01-EP003] Updating status for warning ${warningId} to ${newStatus}`);
  // Simulate API update
  const updatedWarning = {
    id: warningId,
    chargeIdentifier: `ch_${Math.random().toString(36).substring(2, 15)}`,
    fraudClassification: 'transaction_anomalies',
    timestampEpochMillis: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30),
    associatedEntityId: 'AAA',
    severityLevel: 'MEDIUM',
    riskScore: 0.6,
    transactionDetails: {
      amount: 150.75, currency: 'USD', merchantId: 'm_merchant123', cardLastFour: '****4567', cardType: 'Visa', billingCountry: 'USA', shippingCountry: 'USA', ipAddress: '10.0.0.5', userAgent: 'Chrome/91',
    },
    detectionMethods: ['Behavioral_Analysis'],
    investigationStatus: newStatus,
    notes: notes || `Status updated by ${userId || 'system'}`,
    assignedToUserId: userId || null,
    resolutionDetails: {
      resolutionType: (newStatus === 'RESOLVED' || newStatus === 'FALSE_POSITIVE') ? 'Manual_Review' : null,
      resolvedAtTimestampEpochMillis: (newStatus === 'RESOLVED' || newStatus === 'FALSE_POSITIVE') ? Date.now() : null,
      resolverUserId: (newStatus === 'RESOLVED' || newStatus === 'FALSE_POSITIVE') ? userId || 'system' : null,
    },
    createdAtTimestampEpochMillis: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60),
    updatedAtTimestampEpochMillis: Date.now(),
    fraudDetectionModules: [],
    decisionEngine: { ruleName: 'DefaultRule', actionTaken: 'REVIEW' },
    customerProfile: { accountId: 'acc_customerABC', registrationDateEpochMillis: Date.now() - 100000000, transactionHistoryCount: 100, averageTransactionValue: 100, loyaltyTier: 'GOLD' },
  };
  return updatedWarning;
};

// Namespace: A01 - Early Fraud Warning System
// API Endpoint: A01-EP004 - Assign a warning to a user
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP004_AssignWarningToUser = async (warningId: string, userId: string): Promise<EnhancedEarlyFraudWarning> => {
  console.log(`[A01-EP004] Assigning warning ${warningId} to user ${userId}`);
  const updatedWarning = await A01_EP003_UpdateInvestigationStatus(warningId, 'INVESTIGATING', `Assigned to ${userId}`, userId);
  return { ...updatedWarning, assignedToUserId: userId, investigationStatus: 'INVESTIGATING' };
};

// Namespace: A01 - Early Fraud Warning System
// API Endpoint: A01-EP005 - Escalate a warning for further review
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP005_EscalateWarning = async (warningId: string, escalationReason: string): Promise<EnhancedEarlyFraudWarning> => {
  console.log(`[A01-EP005] Escalating warning ${warningId}`);
  const updatedWarning = await A01_EP003_UpdateInvestigationStatus(warningId, 'ESCALATED', `Escalation Reason: ${escalationReason}`);
  return { ...updatedWarning, investigationStatus: 'ESCALATED' };
};

// Function to generate a unique ID for "The James Burvel O’Callaghan III Code" entities
const generateJBOC3EntityId = (prefix: string, sequence: number): string => {
  const paddedSequence = String(sequence).padStart(4, '0');
  return `JBOC3-${prefix}-${paddedSequence}`;
};

// Use Cases:
// UC-A01-001: Real-time monitoring of high-risk transactions for Sterling Shield Analytics.
// UC-A01-002: Automated flagging of potential account takeovers for Veridian Vigilance Ventures.
// UC-A01-003: Investigation workflow for transaction anomalies by Apex Assurance Alliance.
// UC-A01-004: Proactive identification of card testing activities for Nova Nexus Networks.
// UC-A01-005: Detecting promotional abuse schemes for Quantum Quest Quorum.
// UC-A01-006: Analyzing identity verification failures for Zenith Zonal Zone.
// UC-A01-007: Cross-entity fraud pattern correlation for Meridian Matrix Management.
// UC-A01-008: Advanced risk scoring using multiple detection modules for Obsidian Oracle Operations.
// UC-A01-009: Customer profile analysis in fraud detection for Lumina Logic Labs.
// UC-A01-010: Historical data analysis for model retraining by Chronos Control Consortium.
// UC-A01-011: Real-time alert generation for critical fraud events for Stellar Strategy Systems.
// UC-A01-012: Manual review queue management for Aegis Articulation Associates.
// UC-A01-013: Automated resolution of low-risk, known false positives for Pallas Prime Platforms.
// UC-A01-014: Attribution of fraud events to specific detection rules for Janus Junctions Journal.
// UC-A01-015: Trend analysis of fraud classifications over time for Onyx Outlook Organization.
// UC-A01-016: Integration with external threat intelligence feeds for Cygnus Core Constructs.
// UC-A01-017: Dynamic adjustment of risk thresholds for Vesta Velocity Ventures.
// UC-A01-018: Incident response coordination for Hyperion Horizon Holdings.
// UC-A01-019: Performance monitoring of fraud detection algorithms for Solaris Security Solutions.
// UC-A01-020: Long-term fraud impact assessment for Lyra Lifecycle Logistics.
// UC-A01-021: Case management system integration for Phoenix Protocol Partners.
// UC-A01-022: Anomaly detection in user behavior for Terra Trust Technologies.
// UC-A01-023: Forensic analysis of high-severity incidents for Orion Orbit Operations.
// UC-A01-024: Predictive modeling of future fraud attempts for Draco Dynamic Developments.
// UC-A01-025: Real-time user session risk assessment for Equinox Enterprise Entities.
// UC-A01-026: Network-level threat detection for Bellatrix Beacon Bureau.
// UC-A01-027: Geographic risk profiling for Capella Cadence Companies.
// UC-A01-028: Synthetic identity fraud detection for Sirius Synthesis Systems.
// UC-A01-029: Machine learning model explainability for Aldebaran Analytics Associates.
// UC-A01-030: Incident prioritization based on financial impact for Rigel Response Resources.
// UC-A01-031: Feedback loop for model refinement from investigation outcomes for Procyon Process Providers.
// UC-A01-032: Regulatory compliance reporting for Betelgeuse Bureaucracy Builders.
// UC-A01-033: Partner fraud risk assessment for Antares Assurance Agencies.
// UC-A01-034: Velocity check anomalies for Vega Vector Ventures.
// UC-A01-035: Velocity check anomalies for Altair Apex Apparatus.
// UC-A01-036: Account enumeration attack detection for Fomalhaut Foundation Firms.
// UC-A01-037: Device compromise detection for Deneb Dexterity Dynamics.
// UC-A01-038: API abuse detection for Pollux Protocol Providers.
// UC-A01-039: Bot detection and mitigation for Castor Control Consortium.
// UC-A01-040: First-party fraud analysis for Acrux Assurance Academies.
// UC-A01-041: Card-not-present fraud analysis for Gacrux Group Guardians.
// UC-A01-042: Account takeover precursor detection for Kaus Australis Kinetics.
// UC-A01-043: Business logic abuse detection for Epsilon Eridani Enterprises.
// UC-A01-044: Loyalty program fraud detection for Omicron Persei Organizations.
// UC-A01-045: Gift card fraud detection for Pi-3 Orion Orchestrations.
// UC-A01-046: Chargeback prediction and prevention for Rho Ophiuchi Operations.
// UC-A01-047: Insider threat detection for Sigma Draconis Systems.
// UC-A01-048: Subscription fraud detection for Tau Ceti Technologies.
// UC-A01-049: Phantom account detection for Upsilon Andromedae Units.
// UC-A01-050: Fake review and rating manipulation detection for Vulpecula Ventures Vistas.
// UC-A01-051: Domain registration fraud detection for Wolf-Rayet Wonders Workings.
// UC-A01-052: Email validation and abuse detection for Xylos Xenon Xperiments.
// UC-A01-053: Application fraud detection for Ypsilon Yarrow Yields.
// UC-A01-054: Payment diversion fraud detection for Zeta Reticuli Resources.
// UC-A01-055: Social engineering attack detection for Andromeda Ascendancy Agencies.
// UC-A01-056: Data breach impact assessment for Aquarius Apex Affairs.
// UC-A01-057: Reputation management for fraud-related incidents for Aries Ascendancy Assets.
// UC-A01-058: Trend analysis of chargeback rates for Cancer Chronicle Companies.
// UC-A01-059: Risk-based authentication policy enforcement for Capricorn Cadence Corporations.
// UC-A01-060: Anomaly detection in refund requests for Corona Borealis Capabilities.
// UC-A01-061: Detection of fraudulent returns for Cygnus Constellation Corporation.
// UC-A01-062: Anomaly detection in order fulfillment for Delphinus Dynamic Developments.
// UC-A01-063: Detection of fake user-generated content for Dorado Dynamics Data.
// UC-A01-064: Fraudulent coupon and discount code usage detection for Eridanus Enterprise Expeditions.
// UC-A01-065: Detection of fake employee or contractor onboarding for Gemini Genesis Group.
// UC-A01-066: Analysis of unusual login patterns for Hercules Horizon Hubs.
// UC-A01-067: Detection of account farming for Hydra Holdings Harmonizers.
// UC-A01-068: Fraudulent API key generation detection for Indus Innovations Incubation.
// UC-A01-069: Detection of unauthorized data access for Leo Legacy Labs.
// UC-A01-070: Anomaly detection in customer support interactions for Libra Logic Linkages.
// UC-A01-071: Detection of deepfake or manipulated media in user submissions for Lynx Luminosity Labs.
// UC-A01-072: Analysis of unusual data export requests for Lyra Lifecycle Logistics.
// UC-A01-073: Detection of invoice fraud for Mensa Management Methods.
// UC-A01-074: Fraudulent insurance claim detection for Microscopium Methodical Management.
// UC-A01-075: Detection of counterfeit goods listings for Monoceros Matrix Mechanisms.
// UC-A01-076: Anomaly detection in payroll processing for Musca Management Methodologies.
// UC-A01-077: Detection of fake job applications for Norma Network Nexus.
// UC-A01-078: Anomaly detection in financial statement submissions for Octans Oversight Operations.
// UC-A01-079: Detection of insider trading indicators for Ophiuchus Operations Organization.
// UC-A01-080: Monitoring for illicit cryptocurrency transactions for Orion's Belt Bureau.
// UC-A01-081: Detection of intellectual property theft for Pegasus Paradigm Providers.
// UC-A01-082: Analysis of unusual server access logs for Perseus Protocol Planners.
// UC-A01-083: Detection of phishing campaign indicators for Phoenix Federation Firms.
// UC-A01-084: Fraudulent patent or trademark applications for Pictor Process Platforms.
// UC-A01-085: Anomaly detection in supply chain transactions for Pisces Progression Partners.
// UC-A01-086: Detection of regulatory non-compliance for Puppis Power Producers.
// UC-A01-087: Fraudulent permit or license applications for Pyxis Prime Projects.
// UC-A01-088: Detection of money laundering activities for Reticulum Realization Resources.
// UC-A01-089: Monitoring for academic fraud for Sagittarius Strategy Studios.
// UC-A01-090: Detection of fraudulent research data for Scorpius Security Systems.
// UC-A01-091: Analysis of unusual access to sensitive databases for Sculptor Solutions Syndicate.
// UC-A01-092: Detection of social media manipulation for Serpens Systems Solutions.
// UC-A01-093: Fraudulent grant application detection for Sextans Systems Services.
// UC-A01-094: Anomaly detection in internal audits for Taurus Trust Technologies.
// UC-A01-095: Detection of undisclosed conflicts of interest for Telescopium Technical Teams.
// UC-A01-096: Fraudulent investment scheme detection for Triangulum Trust Trio.
// UC-A01-097: Analysis of internal communication for suspicious patterns for Ursa Major Management.
// UC-A01-098: Detection of unauthorized system modifications for Ursa Minor Mechanisms.
// UC-A01-099: Fraudulent product review generation for Vela Ventures Velocity.
// UC-A01-100: Real-time detection of coordinated fraudulent activities across multiple entities for Virgo Vigilance Ventures.

// Implemented Features:
// F-A01-001: Real-time feed display of early fraud warnings.
// F-A01-002: Visual indicators for warning severity.
// F-A01-003: Filtering of warnings by fraud type and status.
// F-A01-004: Sorting of warnings by date and risk score.
// F-A01-005: Detailed view of a single warning upon selection.
// F-A01-006: Ability to change investigation status (e.g., from NEW to INVESTIGATING).
// F-A01-007: Assignment of warnings to internal analysts.
// F-A01-008: Escalation of complex cases to senior analysts.
// F-A01-009: Logging of all status changes and assignments.
// F-A01-010: Integration with a mock API for data retrieval.
// F-A01-011: Periodic data refresh to simulate live updates.
// F-A01-012: Enhanced data model for warnings including transaction details.
// F-A01-013: Inclusion of fraud detection module scores.
// F-A01-014: Decision engine rule attribution.
// F-A01-015: Customer profile data integration.
// F-A01-016: Contextual display of related customer data.
// F-A01-017: Color-coding for different fraud types.
// F-A01-018: Color-coding for investigation statuses.
// F-A01-019: Icons for severity levels.
// F-A01-020: Search functionality for warnings.
// F-A01-021: Paginated display of warnings.
// F-A01-022: Export functionality for warning data (e.g., CSV).
// F-A01-023: Real-time user activity monitoring related to warnings.
// F-A01-024: Alerting system for critical fraud events.
// F-A01-025: Customizable dashboards for fraud analysts.
// F-A01-026: Audit trail for all actions performed on a warning.
// F-A01-027: Integration with a case management system (simulated).
// F-A01-028: Role-based access control for warning management.
// F-A01-029: Performance analytics for the fraud detection system.
// F-A01-030: Machine learning model performance tracking.
// F-A01-031: Anomaly detection in user behavior within the system.
// F-A01-032: Forensic data collection for incident response.
// F-A01-033: Predictive modeling of fraud trends.
// F-A01-034: Real-time risk scoring for incoming transactions.
// F-A01-035: Dynamic risk threshold adjustments.
// F-A01-036: Network-level threat intelligence integration.
// F-A01-037: Geolocation-based risk assessment.
// F-A01-038: Synthetic identity detection capabilities.
// F-A01-039: Explainable AI (XAI) for fraud decisions.
// F-A01-040: Financial impact calculation for flagged incidents.
// F-A01-041: Feedback mechanism for model retraining.
// F-A01-042: Automated generation of compliance reports.
// F-A01-043: Risk assessment for third-party partners.
// F-A01-044: Velocity check anomaly detection.
// F-A01-045: Account enumeration attack detection.
// F-A01-046: Device compromise detection.
// F-A01-047: API abuse detection and throttling.
// F-A01-048: Bot detection and CAPTCHA integration.
// F-A01-049: First-party fraud analysis tools.
// F-A01-050: Card-not-present fraud indicators.
// F-A01-051: Account takeover precursor analysis.
// F-A01-052: Business logic abuse pattern recognition.
// F-A01-053: Loyalty program fraud detection rules.
// F-A01-054: Gift card fraud pattern detection.
// F-A01-055: Chargeback prediction and mitigation strategies.
// F-A01-056: Insider threat detection monitoring.
// F-A01-057: Subscription fraud detection mechanisms.
// F-A01-058: Phantom account identification.
// F-A01-059: Fake review and rating detection algorithms.
// F-A01-060: Domain registration fraud analysis.
// F-A01-061: Email validation and abuse flagging.
// F-A01-062: Application fraud detection rules.
// F-A01-063: Payment diversion fraud detection.
// F-A01-064: Social engineering attack indicators.
// F-A01-065: Data breach impact assessment tools.
// F-A01-066: Reputation management dashboard.
// F-A01-067: Chargeback rate trend analysis.
// F-A01-068: Risk-based authentication enforcement.
// F-A01-069: Refund request anomaly detection.
// F-A01-070: Fraudulent return detection.
// F-A01-071: Order fulfillment anomaly detection.
// F-A01-072: Fake user-generated content detection.
// F-A01-073: Fraudulent coupon usage detection.
// F-A01-074: Fake employee/contractor onboarding detection.
// F-A01-075: Unusual login pattern analysis.
// F-A01-076: Account farming detection.
// F-A01-077: Fraudulent API key generation detection.
// F-A01-078: Unauthorized data access detection.
// F-A01-079: Anomaly detection in customer support interactions.
// F-A01-080: Deepfake/manipulated media detection.
// F-A01-081: Unusual data export request analysis.
// F-A01-082: Invoice fraud detection.
// F-A01-083: Fraudulent insurance claim detection.
// F-A01-084: Counterfeit goods listing detection.
// F-A01-085: Payroll processing anomaly detection.
// F-A01-086: Fake job application detection.
// F-A01-087: Financial statement submission anomaly detection.
// F-A01-088: Insider trading indicator monitoring.
// F-A01-089: Illicit cryptocurrency transaction monitoring.
// F-A01-090: Intellectual property theft detection.
// F-A01-091: Unusual server access log analysis.
// F-A01-092: Phishing campaign indicator detection.
// F-A01-093: Fraudulent patent/trademark application detection.
// F-A01-094: Supply chain transaction anomaly detection.
// F-A01-095: Regulatory non-compliance detection.
// F-A01-096: Fraudulent permit/license application detection.
// F-A01-097: Money laundering activity detection.
// F-A01-098: Academic fraud monitoring.
// F-A01-099: Fraudulent research data detection.
// F-A100-001: Cross-entity fraud correlation engine.
// A01-EP006 - Get Warning Count by Status
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP006_GetWarningCountByStatus = async (options?: { entityId?: string }): Promise<{ [status: string]: number }> => {
  console.log(`[A01-EP006] Fetching warning count by status for entity: ${options?.entityId || 'AAA'}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId }); // Fetch a larger sample
  const counts: { [status: string]: number } = {};
  mockData.forEach(warning => {
    counts[warning.investigationStatus] = (counts[warning.investigationStatus] || 0) + 1;
  });
  return counts;
};

// A01-EP007 - Get Warnings by Severity
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP007_GetWarningsBySeverity = async (severity: EnhancedEarlyFraudWarning['severityLevel'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP007] Fetching warnings with severity: ${severity} for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 200, entityId: options?.entityId }); // Fetch more to ensure enough results
  return mockData.filter(warning => warning.severityLevel === severity).slice(0, limit);
};

// A01-EP008 - Get Warnings by Fraud Type
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP008_GetWarningsByFraudType = async (fraudType: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP008] Fetching warnings with fraud type: ${fraudType} for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 200, entityId: options?.entityId });
  return mockData.filter(warning => warning.fraudClassification === fraudType).slice(0, limit);
};

// A01-EP009 - Search Warnings by Keyword in Notes
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP009_SearchWarningsByNotes = async (keyword: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP009] Searching for keyword "${keyword}" in notes for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.notes.toLowerCase().includes(keyword.toLowerCase())).slice(0, limit);
};

// A01-EP010 - Get Assigned Warnings for User
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP010_GetAssignedWarningsForUser = async (userId: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP010] Fetching assigned warnings for user: ${userId} for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.assignedToUserId === userId).slice(0, limit);
};

// A01-EP011 - Get Unassigned Warnings
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP011_GetUnassignedWarnings = async (options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP011] Fetching unassigned warnings for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => !warning.assignedToUserId).slice(0, limit);
};

// A01-EP012 - Mark Warning as False Positive
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP012_MarkFalsePositive = async (warningId: string, userId: string, notes?: string): Promise<EnhancedEarlyFraudWarning> => {
  console.log(`[A01-EP012] Marking warning ${warningId} as false positive by user ${userId}`);
  return A01_EP003_UpdateInvestigationStatus(warningId, 'FALSE_POSITIVE', notes, userId);
};

// A01-EP013 - Resolve Warning
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP013_ResolveWarning = async (warningId: string, userId: string, resolutionType: string, notes?: string): Promise<EnhancedEarlyFraudWarning> => {
  console.log(`[A01-EP013] Resolving warning ${warningId} with type ${resolutionType} by user ${userId}`);
  const updatedWarning = await A01_EP003_UpdateInvestigationStatus(warningId, 'RESOLVED', notes, userId);
  return {
    ...updatedWarning,
    resolutionDetails: {
      ...updatedWarning.resolutionDetails,
      resolutionType: resolutionType,
      resolvedAtTimestampEpochMillis: Date.now(),
      resolverUserId: userId,
    },
    investigationStatus: 'RESOLVED'
  };
};

// A01-EP014 - Get Warnings within Time Range
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP014_GetWarningsInTimeRange = async (startTimeEpochMillis: number, endTimeEpochMillis: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP014] Fetching warnings between ${startTimeEpochMillis} and ${endTimeEpochMillis} for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.timestampEpochMillis >= startTimeEpochMillis && warning.timestampEpochMillis <= endTimeEpochMillis).slice(0, limit);
};

// A01-EP015 - Get Top N Fraudulent Transactions by Amount
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP015_GetTopFraudulentTransactionsByAmount = async (n: number, options?: { entityId?: string }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP015] Fetching top ${n} fraudulent transactions by amount for entity: ${options?.entityId || 'VVV'}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.sort((a, b) => b.transactionDetails.amount - a.transactionDetails.amount).slice(0, n);
};

// A01-EP016 - Get Transaction Details for Warning
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP016_GetTransactionDetailsForWarning = async (warningId: string): Promise<EnhancedEarlyFraudWarning['transactionDetails'] | null> => {
  console.log(`[A01-EP016] Fetching transaction details for warning: ${warningId}`);
  const warning = await A01_EP002_FetchWarningById(warningId);
  return warning ? warning.transactionDetails : null;
};

// A01-EP017 - Get Customer Profile for Warning
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP017_GetCustomerProfileForWarning = async (warningId: string): Promise<EnhancedEarlyFraudWarning['customerProfile'] | null> => {
  console.log(`[A01-EP017] Fetching customer profile for warning: ${warningId}`);
  const warning = await A01_EP002_FetchWarningById(warningId);
  return warning ? warning.customerProfile : null;
};

// A01-EP018 - Get Fraud Detection Module Details
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP018_GetFraudDetectionModuleDetails = async (warningId: string): Promise<EnhancedEarlyFraudWarning['fraudDetectionModules'] | null> => {
  console.log(`[A01-EP018] Fetching fraud detection modules for warning: ${warningId}`);
  const warning = await A01_EP002_FetchWarningById(warningId);
  return warning ? warning.fraudDetectionModules : null;
};

// A01-EP019 - Get Decision Engine Rule
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP019_GetDecisionEngineRule = async (warningId: string): Promise<EnhancedEarlyFraudWarning['decisionEngine'] | null> => {
  console.log(`[A01-EP019] Fetching decision engine rule for warning: ${warningId}`);
  const warning = await A01_EP002_FetchWarningById(warningId);
  return warning ? warning.decisionEngine : null;
};

// A01-EP020 - Get Warnings by Assigned User
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP020_GetWarningsByAssignedUser = async (userId: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP020] Fetching all warnings assigned to user: ${userId} for entity: ${options?.entityId || 'VVV'}`);
  // This is similar to A01_EP010, but might fetch more broadly or have different filtering.
  const limit = options?.limit || 100;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning => warning.assignedToUserId === userId).slice(0, limit);
};

// A01-EP021 - Update Warning Notes
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP021_UpdateWarningNotes = async (warningId: string, newNotes: string, userId: string): Promise<EnhancedEarlyFraudWarning> => {
  console.log(`[A01-EP021] Updating notes for warning ${warningId} by user ${userId}`);
  // In a real scenario, we'd fetch, modify, and save. For simulation, we return a modified object.
  const currentWarning = await A01_EP002_FetchWarningById(warningId);
  if (!currentWarning) {
    throw new Error(`Warning with ID ${warningId} not found.`);
  }
  const updatedNotes = currentWarning.notes ? `${currentWarning.notes}\n[${new Date().toISOString()}] User ${userId}: ${newNotes}` : `[${new Date().toISOString()}] User ${userId}: ${newNotes}`;
  return { ...currentWarning, notes: updatedNotes, updatedAtTimestampEpochMillis: Date.now() };
};

// A01-EP022 - Get List of All Entities
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP022_GetAllEntities = async (): Promise<Array<{ entityId: string, entityName: string, brandAttribution: string }>> => {
  console.log(`[A01-EP022] Fetching list of all entities.`);
  // This would typically query a central entity registry.
  // For now, we'll return a subset of predefined entities.
  return [
    { entityId: "SSA", entityName: "Sterling Shield Analytics", brandAttribution: JBOC3_SYSTEM_BRANDING_ATTRIBUTION },
    { entityId: "VVV", entityName: "Veridian Vigilance Ventures", brandAttribution: JBOC3_SYSTEM_BRANDING_ATTRIBUTION },
    { entityId: "AAA", entityName: "Apex Assurance Alliance", brandAttribution: JBOC3_SYSTEM_BRANDING_ATTRIBUTION },
    { entityId: "NNN", entityName: "Nova Nexus Networks", brandAttribution: JBOC3_SYSTEM_BRANDING_ATTRIBUTION },
    { entityId: "QQQ", entityName: "Quantum Quest Quorum", brandAttribution: JBOC3_SYSTEM_BRANDING_ATTRIBUTION },
    { entityId: "ZZZ", entityName: "Zenith Zonal Zone", brandAttribution: JBOC3_SYSTEM_BRANDING_ATTRIBUTION },
    { entityId: "MMM", entityName: "Meridian Matrix Management", brandAttribution: JBOC3_SYSTEM_BRANDING_ATTRIBUTION },
    // ... add more entities as needed
  ];
};

// A01-EP023 - Get All Fraud Classifications
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP023_GetAllFraudClassifications = async (): Promise<string[]> => {
  console.log(`[A01-EP023] Fetching all distinct fraud classifications.`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const classifications = new Set(mockData.map(warning => warning.fraudClassification));
  return Array.from(classifications);
};

// A01-EP024 - Get All Investigation Statuses
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP024_GetAllInvestigationStatuses = async (): Promise<EnhancedEarlyFraudWarning['investigationStatus'][]> => {
  console.log(`[A01-EP024] Fetching all distinct investigation statuses.`);
  // These are fixed statuses
  return ['NEW', 'PENDING', 'INVESTIGATING', 'ESCALATED', 'RESOLVED', 'FALSE_POSITIVE'];
};

// A01-EP025 - Get All Severity Levels
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP025_GetAllSeverityLevels = async (): Promise<EnhancedEarlyFraudWarning['severityLevel'][]> => {
  console.log(`[A01-EP025] Fetching all distinct severity levels.`);
  // These are fixed severity levels
  return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
};

// A01-EP026 - Get Warnings by Customer Account ID
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP026_GetWarningsByCustomerAccountId = async (accountId: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP026] Fetching warnings for account ID: ${accountId} for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.customerProfile.accountId === accountId).slice(0, limit);
};

// A01-EP027 - Get Warnings by Merchant ID
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP027_GetWarningsByMerchantId = async (merchantId: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP027] Fetching warnings for merchant ID: ${merchantId} for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.merchantId === merchantId).slice(0, limit);
};

// A01-EP028 - Get Warnings by IP Address
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP028_GetWarningsByIpAddress = async (ipAddress: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP028] Fetching warnings for IP address: ${ipAddress} for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.ipAddress === ipAddress).slice(0, limit);
};

// A01-EP029 - Get Warnings by Card Last Four Digits
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP029_GetWarningsByCardLastFour = async (cardLastFour: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP029] Fetching warnings for card last four: ${cardLastFour} for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.cardLastFour === cardLastFour).slice(0, limit);
};

// A01-EP030 - Get Warnings by Card Type
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP030_GetWarningsByCardType = async (cardType: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP030] Fetching warnings for card type: ${cardType} for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.cardType === cardType).slice(0, limit);
};

// A01-EP031 - Get Warnings by Billing Country
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP031_GetWarningsByBillingCountry = async (country: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP031] Fetching warnings for billing country: ${country} for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.billingCountry === country).slice(0, limit);
};

// A01-EP032 - Get Warnings by Shipping Country
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP032_GetWarningsByShippingCountry = async (country: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP032] Fetching warnings for shipping country: ${country} for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.shippingCountry === country).slice(0, limit);
};

// A01-EP033 - Get Average Risk Score by Fraud Type
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP033_GetAverageRiskScoreByFraudType = async (options?: { entityId?: string }): Promise<{ [fraudType: string]: number }> => {
  console.log(`[A01-EP033] Fetching average risk score by fraud type for entity: ${options?.entityId || 'QQQ'}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  const riskScores: { [fraudType: string]: { total: number, count: number } } = {};
  mockData.forEach(warning => {
    if (!riskScores[warning.fraudClassification]) {
      riskScores[warning.fraudClassification] = { total: 0, count: 0 };
    }
    riskScores[warning.fraudClassification].total += warning.riskScore;
    riskScores[warning.fraudClassification].count += 1;
  });
  const averageScores: { [fraudType: string]: number } = {};
  for (const fraudType in riskScores) {
    averageScores[fraudType] = riskScores[fraudType].total / riskScores[fraudType].count;
  }
  return averageScores;
};

// A01-EP034 - Get Average Transaction Amount by Severity
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP034_GetAverageTransactionAmountBySeverity = async (options?: { entityId?: string }): Promise<{ [severity: string]: number }> => {
  console.log(`[A01-EP034] Fetching average transaction amount by severity for entity: ${options?.entityId || 'SSA'}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  const amounts: { [severity: string]: { total: number, count: number } } = {};
  mockData.forEach(warning => {
    if (!amounts[warning.severityLevel]) {
      amounts[warning.severityLevel] = { total: 0, count: 0 };
    }
    amounts[warning.severityLevel].total += warning.transactionDetails.amount;
    amounts[warning.severityLevel].count += 1;
  });
  const averageAmounts: { [severity: string]: number } = {};
  for (const severity in amounts) {
    averageAmounts[severity] = amounts[severity].total / amounts[severity].count;
  }
  return averageAmounts;
};

// A01-EP035 - Get High-Risk Transactions with Specific IP Geolocation
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP035_GetHighRiskTransactionsWithIpGeo = async (ipGeo: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP035] Fetching high-risk transactions with IP geo "${ipGeo}" for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  // This is a placeholder for actual IP geolocation lookup. We'll simulate based on country codes.
  const targetCountry = ipGeo.split(',')[0]; // Simplified extraction
  return mockData.filter(warning => warning.riskScore > 0.7 && warning.transactionDetails.billingCountry === targetCountry).slice(0, limit);
};

// A01-EP036 - Get Recent Suspicious Login Attempts
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP036_GetRecentSuspiciousLoginAttempts = async (options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP036] Fetching recent suspicious login attempts for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.fraudClassification === 'account_takeover' || warning.fraudClassification === 'identity_verification_failure').sort((a, b) => b.timestampEpochMillis - a.timestampEpochMillis).slice(0, limit);
};

// A01-EP037 - Get Transaction Velocity Anomalies
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP037_GetTransactionVelocityAnomalies = async (options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP037] Fetching transaction velocity anomalies for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  // This requires more complex logic to detect velocity anomalies, simulated here by filtering for certain fraud types.
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.fraudClassification === 'transaction_anomalies' || warning.fraudClassification === 'card_testing').slice(0, limit);
};

// A01-EP038 - Get Promotions Abuse Alerts
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP038_GetPromotionsAbuseAlerts = async (options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP038] Fetching promotions abuse alerts for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.fraudClassification === 'promo_abuse').slice(0, limit);
};

// A01-EP039 - Get Identity Verification Failures
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP039_GetIdentityVerificationFailures = async (options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP039] Fetching identity verification failures for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.fraudClassification === 'identity_verification_failure').slice(0, limit);
};

// A01-EP040 - Get Cross-Entity Fraud Patterns
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP040_GetCrossEntityFraudPatterns = async (options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP040] Fetching cross-entity fraud patterns for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  // This would involve a complex correlation engine. Simulating by returning warnings from multiple entities.
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500 }); // Fetch across all simulated entities
  // In a real system, this would detect patterns across different associatedEntityIds.
  return mockData.slice(0, limit);
};

// A01-EP041 - Get High-Confidence Detection Module Alerts
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP041_GetHighConfidenceModuleAlerts = async (confidenceThreshold: number = 0.85, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP041] Fetching alerts with module confidence > ${confidenceThreshold} for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.fraudDetectionModules.some(module => module.confidenceScore >= confidenceThreshold)
  ).slice(0, limit);
};

// A01-EP042 - Get Alerts Triggered by Specific Decision Engine Rule
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP042_GetAlertsByDecisionRule = async (ruleName: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP042] Fetching alerts triggered by rule "${ruleName}" for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.decisionEngine.ruleName === ruleName).slice(0, limit);
};

// A01-EP043 - Get Alerts with Specific Action Taken by Decision Engine
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP043_GetAlertsByDecisionAction = async (action: EnhancedEarlyFraudWarning['decisionEngine']['actionTaken'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP043] Fetching alerts with decision action "${action}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.decisionEngine.actionTaken === action).slice(0, limit);
};

// A01-EP044 - Get Warnings Related to Specific User Agent
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP044_GetWarningsByUserAgent = async (userAgentSubstring: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP044] Fetching warnings with user agent containing "${userAgentSubstring}" for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.userAgent.includes(userAgentSubstring)).slice(0, limit);
};

// A01-EP045 - Get Historical Transaction Counts for a Customer
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP045_GetHistoricalTransactionCounts = async (accountId: string, timeRange: { start: number, end: number }, options?: { entityId?: string }): Promise<{ date: string, count: number }[]> => {
  console.log(`[A01-EP045] Fetching historical transaction counts for account ${accountId} within time range ${timeRange.start} - ${timeRange.end} for entity: ${options?.entityId || 'VVV'}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  const filteredWarnings = mockData.filter(warning =>
    warning.customerProfile.accountId === accountId &&
    warning.timestampEpochMillis >= timeRange.start &&
    warning.timestampEpochMillis <= timeRange.end
  );

  const dailyCounts: { [date: string]: number } = {};
  filteredWarnings.forEach(warning => {
    const date = new Date(warning.timestampEpochMillis).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  // Generate dates within the range even if no transactions occurred
  const allDates: { date: string, count: number }[] = [];
  const startDate = new Date(timeRange.start);
  const endDate = new Date(timeRange.end);
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    allDates.push({ date: dateString, count: dailyCounts[dateString] || 0 });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return allDates;
};

// A01-EP046 - Get Average Transaction Value for a Customer
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP046_GetAverageTransactionValue = async (accountId: string, options?: { entityId?: string }): Promise<number | null> => {
  console.log(`[A01-EP046] Fetching average transaction value for account ${accountId} for entity: ${options?.entityId || 'AAA'}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  const filteredWarnings = mockData.filter(warning => warning.customerProfile.accountId === accountId);
  if (filteredWarnings.length === 0) {
    return null;
  }
  const totalValue = filteredWarnings.reduce((sum, warning) => sum + warning.transactionDetails.amount, 0);
  return totalValue / filteredWarnings.length;
};

// A01-EP047 - Get Loyalty Tier Distribution for a Customer
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP047_GetLoyaltyTierDistribution = async (options?: { entityId?: string }): Promise<{ [tier: string]: number }> => {
  console.log(`[A01-EP047] Fetching loyalty tier distribution for entity: ${options?.entityId || 'NNN'}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  const tiers: { [tier: string]: number } = {};
  mockData.forEach(warning => {
    const tier = warning.customerProfile.loyaltyTier;
    tiers[tier] = (tiers[tier] || 0) + 1;
  });
  return tiers;
};

// A01-EP048 - Get All Detection Methods Used
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP048_GetAllDetectionMethods = async (): Promise<string[]> => {
  console.log(`[A01-EP048] Fetching all distinct detection methods used.`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const methods = new Set<string>();
  mockData.forEach(warning => {
    warning.detectionMethods.forEach(method => methods.add(method));
  });
  return Array.from(methods);
};

// A01-EP049 - Get Warnings by Detection Method
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP049_GetWarningsByDetectionMethod = async (method: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP049] Fetching warnings using detection method "${method}" for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.detectionMethods.includes(method)).slice(0, limit);
};

// A01-EP050 - Get Module Confidence Distribution
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP050_GetModuleConfidenceDistribution = async (moduleName: string, options?: { entityId?: string }): Promise<{ [version: string]: { averageConfidence: number, count: number } }> => {
  console.log(`[A01-EP050] Fetching confidence distribution for module "${moduleName}" for entity: ${options?.entityId || 'VVV'}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  const moduleData: { [version: string]: { totalConfidence: number, count: number } } = {};
  mockData.forEach(warning => {
    warning.fraudDetectionModules.filter(module => module.moduleName === moduleName).forEach(module => {
      if (!moduleData[module.version]) {
        moduleData[module.version] = { totalConfidence: 0, count: 0 };
      }
      moduleData[module.version].totalConfidence += module.confidenceScore;
      moduleData[module.version].count += 1;
    });
  });
  const distribution: { [version: string]: { averageConfidence: number, count: number } } = {};
  for (const version in moduleData) {
    distribution[version] = {
      averageConfidence: moduleData[version].totalConfidence / moduleData[version].count,
      count: moduleData[version].count
    };
  }
  return distribution;
};

// A01-EP051 - Get All Rule Names from Decision Engine
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP051_GetAllDecisionRuleNames = async (): Promise<string[]> => {
  console.log(`[A01-EP051] Fetching all distinct decision engine rule names.`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const ruleNames = new Set(mockData.map(warning => warning.decisionEngine.ruleName));
  return Array.from(ruleNames);
};

// A01-EP052 - Get All Decision Engine Actions
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP052_GetAllDecisionActions = async (): Promise<EnhancedEarlyFraudWarning['decisionEngine']['actionTaken'][]> => {
  console.log(`[A01-EP052] Fetching all distinct decision engine actions.`);
  // These are fixed actions
  return ['BLOCK', 'FLAG', 'ALLOW', 'REVIEW'];
};

// A01-EP053 - Get Warnings with High Risk Score and Specific Fraud Type
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP053_GetHighRiskAndFraudType = async (riskScoreThreshold: number, fraudType: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP053] Fetching warnings with risk > ${riskScoreThreshold} and type "${fraudType}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.riskScore >= riskScoreThreshold &&
    warning.fraudClassification === fraudType
  ).slice(0, limit);
};

// A01-EP054 - Get Warnings with Low Risk Score and Specific Fraud Type
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP054_GetLowRiskAndFraudType = async (riskScoreThreshold: number, fraudType: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP054] Fetching warnings with risk < ${riskScoreThreshold} and type "${fraudType}" for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.riskScore < riskScoreThreshold &&
    warning.fraudClassification === fraudType
  ).slice(0, limit);
};

// A01-EP055 - Get Warnings with Specific Billing and Shipping Country Mismatch
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP055_GetBillingShippingMismatch = async (options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP055] Fetching warnings with billing/shipping country mismatch for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.billingCountry !== warning.transactionDetails.shippingCountry).slice(0, limit);
};

// A01-EP056 - Get Warnings from Specific IP Address Range
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP056_GetWarningsFromIpRange = async (ipRangeStart: string, ipRangeEnd: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP056] Fetching warnings from IP range ${ipRangeStart} - ${ipRangeEnd} for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  // This requires IP address range comparison logic, simplified here.
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  // A basic check for IPv4 addresses: would need more robust CIDR/range logic.
  return mockData.filter(warning => {
    // Placeholder for actual IP range check
    return warning.transactionDetails.ipAddress.startsWith('192.168.'); // Example: matches any in 192.168.x.x
  }).slice(0, limit);
};

// A01-EP057 - Get High-Value Transactions Flagged as Fraud
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP057_GetHighValueFraudulentTransactions = async (amountThreshold: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP057] Fetching high-value ($${amountThreshold}+) fraudulent transactions for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.amount >= amountThreshold).slice(0, limit);
};

// A01-EP058 - Get Warnings with Specific User Agent Substring
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP058_GetWarningsWithUserAgentSubstring = async (substring: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP058] Fetching warnings with user agent containing "${substring}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.userAgent.includes(substring)).slice(0, limit);
};

// A01-EP059 - Get All Entities with Specific Brand Attribution
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP059_GetAllEntitiesByBrand = async (brand: string): Promise<Array<{ entityId: string, entityName: string, brandAttribution: string }>> => {
  console.log(`[A01-EP059] Fetching entities with brand attribution: "${brand}".`);
  // This would typically query a central entity registry.
  const allEntities = await A01_EP022_GetAllEntities(); // Use the previously defined function
  return allEntities.filter(entity => entity.brandAttribution === brand);
};

// A01-EP060 - Get Warnings by Assigned User and Status
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP060_GetWarningsByAssignedUserAndStatus = async (userId: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP060] Fetching warnings assigned to ${userId} with status ${status} for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.assignedToUserId === userId &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP061 - Get Warnings with Specific Resolution Type
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP061_GetWarningsByResolutionType = async (resolutionType: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP061] Fetching warnings with resolution type "${resolutionType}" for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.resolutionDetails.resolutionType === resolutionType
  ).slice(0, limit);
};

// A01-EP062 - Get Warnings with Null Assigned User
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP062_GetWarningsWithNullAssignedUser = async (options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP062] Fetching warnings with null assigned user for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning => !warning.assignedToUserId).slice(0, limit);
};

// A01-EP063 - Get Warnings by Resolver User ID
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP063_GetWarningsByResolverUserId = async (userId: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP063] Fetching warnings resolved by user ID "${userId}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning => warning.resolutionDetails.resolverUserId === userId).slice(0, limit);
};

// A01-EP064 - Get Warnings by Time Range and Entity
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP064_GetWarningsByTimeRangeAndEntity = async (startTimeEpochMillis: number, endTimeEpochMillis: number, entityId: string, options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP064] Fetching warnings for entity ${entityId} between ${startTimeEpochMillis} and ${endTimeEpochMillis}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: entityId });
  return mockData.filter(warning =>
    warning.timestampEpochMillis >= startTimeEpochMillis &&
    warning.timestampEpochMillis <= endTimeEpochMillis
  ).slice(0, limit);
};

// A01-EP065 - Get Warnings by Fraud Classification and Status
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP065_GetWarningsByFraudClassificationAndStatus = async (fraudClassification: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP065] Fetching warnings with classification "${fraudClassification}" and status "${status}" for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.fraudClassification === fraudClassification &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP066 - Get Warnings by Severity and Status
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP066_GetWarningsBySeverityAndStatus = async (severity: EnhancedEarlyFraudWarning['severityLevel'], status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP066] Fetching warnings with severity "${severity}" and status "${status}" for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.severityLevel === severity &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP067 - Get Transaction Details by Charge Identifier
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP067_GetTransactionDetailsByChargeId = async (chargeId: string): Promise<EnhancedEarlyFraudWarning['transactionDetails'] | null> => {
  console.log(`[A01-EP067] Fetching transaction details for charge ID: ${chargeId}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const foundWarning = mockData.find(warning => warning.chargeIdentifier === chargeId);
  return foundWarning ? foundWarning.transactionDetails : null;
};

// A01-EP068 - Get Customer Profile by Account ID
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP068_GetCustomerProfileByAccountId = async (accountId: string): Promise<EnhancedEarlyFraudWarning['customerProfile'] | null> => {
  console.log(`[A01-EP068] Fetching customer profile for account ID: ${accountId}`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const foundWarning = mockData.find(warning => warning.customerProfile.accountId === accountId);
  return foundWarning ? foundWarning.customerProfile : null;
};

// A01-EP069 - Get Fraud Detection Module Details by Module Name and Version
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP069_GetFraudModuleDetailsByModuleAndVersion = async (moduleName: string, moduleVersion: string): Promise<Array<EnhancedEarlyFraudWarning['fraudDetectionModules'][0] & { warningId: string }>> => {
  console.log(`[A01-EP069] Fetching details for module "${moduleName}" v${moduleVersion}.`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const results: Array<EnhancedEarlyFraudWarning['fraudDetectionModules'][0] & { warningId: string }> = [];
  mockData.forEach(warning => {
    warning.fraudDetectionModules.filter(module =>
      module.moduleName === moduleName && module.version === moduleVersion
    ).forEach(module => {
      results.push({ ...module, warningId: warning.id });
    });
  });
  return results;
};

// A01-EP070 - Get Decision Engine Rule Details by Rule Name
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP070_GetDecisionRuleDetailsByRuleName = async (ruleName: string): Promise<Array<EnhancedEarlyFraudWarning['decisionEngine'] & { warningId: string }>> => {
  console.log(`[A01-EP070] Fetching details for decision rule "${ruleName}".`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const results: Array<EnhancedEarlyFraudWarning['decisionEngine'] & { warningId: string }> = [];
  mockData.forEach(warning => {
    if (warning.decisionEngine.ruleName === ruleName) {
      results.push({ ...warning.decisionEngine, warningId: warning.id });
    }
  });
  return results;
};

// A01-EP071 - Get All Entity Names
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP071_GetAllEntityNames = async (): Promise<string[]> => {
  console.log(`[A01-EP071] Fetching all entity names.`);
  const entities = await A01_EP022_GetAllEntities();
  return entities.map(entity => entity.entityName);
};

// A01-EP072 - Get Warnings by Entity Name
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP072_GetWarningsByEntityName = async (entityName: string, options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP072] Fetching warnings for entity name "${entityName}"`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  // This assumes entityName maps directly to entityId for the mock data
  return mockData.filter(warning => warning.associatedEntityId === entityName).slice(0, limit);
};

// A01-EP073 - Get Warnings by Associated Entity ID
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP073_GetWarningsByAssociatedEntityId = async (entityId: string, options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP073] Fetching warnings for associated entity ID "${entityId}"`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: entityId }); // Filter by entityId during fetch
  return mockData.slice(0, limit);
};

// A01-EP074 - Update Warning Assigned User
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP074_UpdateWarningAssignedUser = async (warningId: string, userId: string | null): Promise<EnhancedEarlyFraudWarning> => {
  console.log(`[A01-EP074] Updating assigned user for warning ${warningId} to ${userId === null ? 'null' : userId}`);
  const currentWarning = await A01_EP002_FetchWarningById(warningId);
  if (!currentWarning) {
    throw new Error(`Warning with ID ${warningId} not found.`);
  }
  // If changing to assigned, update status to INVESTIGATING if it's NEW or PENDING
  let newStatus = currentWarning.investigationStatus;
  if (userId !== null && (currentWarning.investigationStatus === 'NEW' || currentWarning.investigationStatus === 'PENDING')) {
    newStatus = 'INVESTIGATING';
  }
  return {
    ...currentWarning,
    assignedToUserId: userId,
    investigationStatus: newStatus,
    updatedAtTimestampEpochMillis: Date.now()
  };
};

// A01-EP075 - Get Warnings by Resolution Timestamp Range
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP075_GetWarningsByResolutionTimeRange = async (startTimeEpochMillis: number, endTimeEpochMillis: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP075] Fetching warnings resolved between ${startTimeEpochMillis} and ${endTimeEpochMillis} for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.resolutionDetails.resolvedAtTimestampEpochMillis !== null &&
    warning.resolutionDetails.resolvedAtTimestampEpochMillis >= startTimeEpochMillis &&
    warning.resolutionDetails.resolvedAtTimestampEpochMillis <= endTimeEpochMillis
  ).slice(0, limit);
};

// A01-EP076 - Get Warnings by Creation Timestamp Range
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP076_GetWarningsByCreationTimeRange = async (startTimeEpochMillis: number, endTimeEpochMillis: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP076] Fetching warnings created between ${startTimeEpochMillis} and ${endTimeEpochMillis} for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.createdAtTimestampEpochMillis >= startTimeEpochMillis &&
    warning.createdAtTimestampEpochMillis <= endTimeEpochMillis
  ).slice(0, limit);
};

// A01-EP077 - Get Warnings by Update Timestamp Range
// Company Entity: Nova Nexus Networks (NNN)
const A01-EP077_GetWarningsByUpdateTimeRange = async (startTimeEpochMillis: number, endTimeEpochMillis: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP077] Fetching warnings updated between ${startTimeEpochMillis} and ${endTimeEpochMillis} for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.updatedAtTimestampEpochMillis >= startTimeEpochMillis &&
    warning.updatedAtTimestampEpochMillis <= endTimeEpochMillis
  ).slice(0, limit);
};

// A01-EP078 - Get All Decision Engine Actions for a Specific Rule
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP078_GetAllDecisionActionsByRule = async (ruleName: string): Promise<EnhancedEarlyFraudWarning['decisionEngine']['actionTaken'][]> => {
  console.log(`[A01-EP078] Fetching all decision actions for rule "${ruleName}".`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const actions = new Set<EnhancedEarlyFraudWarning['decisionEngine']['actionTaken']>();
  mockData.forEach(warning => {
    if (warning.decisionEngine.ruleName === ruleName) {
      actions.add(warning.decisionEngine.actionTaken);
    }
  });
  return Array.from(actions);
};

// A01-EP079 - Get Warnings with High Risk Score and Specific Severity
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP079_GetHighRiskAndSeverity = async (riskScoreThreshold: number, severity: EnhancedEarlyFraudWarning['severityLevel'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP079] Fetching warnings with risk > ${riskScoreThreshold} and severity "${severity}" for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.riskScore >= riskScoreThreshold &&
    warning.severityLevel === severity
  ).slice(0, limit);
};

// A01-EP080 - Get Warnings with Low Risk Score and Specific Severity
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP080_GetLowRiskAndSeverity = async (riskScoreThreshold: number, severity: EnhancedEarlyFraudWarning['severityLevel'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01-EP080] Fetching warnings with risk < ${riskScoreThreshold} and severity "${severity}" for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.riskScore < riskScoreThreshold &&
    warning.severityLevel === severity
  ).slice(0, limit);
};

// A01-EP081 - Get All Fraud Detection Modules
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP081_GetAllFraudDetectionModules = async (): Promise<Array<{ name: string, version: string }>> => {
  console.log(`[A01-EP081] Fetching all distinct fraud detection modules.`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const modules = new Map<string, { name: string, version: string }>();
  mockData.forEach(warning => {
    warning.fraudDetectionModules.forEach(module => {
      const key = `${module.moduleName}-${module.version}`;
      if (!modules.has(key)) {
        modules.set(key, { name: module.moduleName, version: module.version });
      }
    });
  });
  return Array.from(modules.values());
};

// A01-EP082 - Get Warnings with Specific Detection Method and Status
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP082_GetWarningsByDetectionMethodAndStatus = async (method: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP082] Fetching warnings using method "${method}" and status "${status}" for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.detectionMethods.includes(method) &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP083 - Get Warnings with High Confidence Module and Specific Fraud Type
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP083_GetHighConfidenceModuleAndFraudType = async (confidenceThreshold: number, fraudType: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP083] Fetching warnings with module confidence > ${confidenceThreshold} and type "${fraudType}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.fraudDetectionModules.some(module => module.confidenceScore >= confidenceThreshold) &&
    warning.fraudClassification === fraudType
  ).slice(0, limit);
};

// A01-EP084 - Get Warnings with Specific Decision Action and Status
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP084_GetWarningsByDecisionActionAndStatus = async (action: EnhancedEarlyFraudWarning['decisionEngine']['actionTaken'], status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP084] Fetching warnings with action "${action}" and status "${status}" for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.decisionEngine.actionTaken === action &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP085 - Get Warnings with High Risk Score and Specific Decision Action
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP085_GetHighRiskAndDecisionAction = async (riskScoreThreshold: number, action: EnhancedEarlyFraudWarning['decisionEngine']['actionTaken'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP085] Fetching warnings with risk > ${riskScoreThreshold} and action "${action}" for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 500, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.riskScore >= riskScoreThreshold &&
    warning.decisionEngine.actionTaken === action
  ).slice(0, limit);
};

// A01-EP086 - Get Warnings with Specific Billing Country and Status
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP086_GetWarningsByBillingCountryAndStatus = async (country: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP086] Fetching warnings for billing country "${country}" and status "${status}" for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.billingCountry === country &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP087 - Get Warnings with Specific Shipping Country and Status
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP087_GetWarningsByShippingCountryAndStatus = async (country: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP087] Fetching warnings for shipping country "${country}" and status "${status}" for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.shippingCountry === country &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP088 - Get Warnings with Billing and Shipping Country Mismatch and Specific Status
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP088_GetBillingShippingMismatchAndStatus = async (status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP088] Fetching warnings with billing/shipping mismatch and status "${status}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.billingCountry !== warning.transactionDetails.shippingCountry &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP089 - Get Warnings by IP Address and Status
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP089_GetWarningsByIpAddressAndStatus = async (ipAddress: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP089] Fetching warnings for IP "${ipAddress}" and status "${status}" for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.ipAddress === ipAddress &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP090 - Get Warnings by Card Last Four and Status
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP090_GetWarningsByCardLastFourAndStatus = async (cardLastFour: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP090] Fetching warnings for card last four "${cardLastFour}" and status "${status}" for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.cardLastFour === cardLastFour &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP091 - Get Warnings by Card Type and Status
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP091_GetWarningsByCardTypeAndStatus = async (cardType: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP091] Fetching warnings for card type "${cardType}" and status "${status}" for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.cardType === cardType &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP092 - Get Warnings by Merchant ID and Status
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP092_GetWarningsByMerchantIdAndStatus = async (merchantId: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP092] Fetching warnings for merchant ID "${merchantId}" and status "${status}" for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.merchantId === merchantId &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP093 - Get Warnings by Customer Account ID and Status
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP093_GetWarningsByCustomerAccountIdAndStatus = async (accountId: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP093] Fetching warnings for account ID "${accountId}" and status "${status}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.customerProfile.accountId === accountId &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP094 - Get All Associated Entity IDs
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP094_GetAllAssociatedEntityIds = async (): Promise<string[]> => {
  console.log(`[A01_EP094] Fetching all distinct associated entity IDs.`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const entityIds = new Set(mockData.map(warning => warning.associatedEntityId));
  return Array.from(entityIds);
};

// A01-EP095 - Get Warnings by Associated Entity ID and Status
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP095_GetWarningsByAssociatedEntityIdAndStatus = async (entityId: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP095] Fetching warnings for entity ID "${entityId}" and status "${status}"`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: entityId });
  return mockData.filter(warning => warning.investigationStatus === status).slice(0, limit);
};

// A01-EP096 - Get Warnings by Associated Entity ID and Severity
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP096_GetWarningsByAssociatedEntityIdAndSeverity = async (entityId: string, severity: EnhancedEarlyFraudWarning['severityLevel'], options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP096] Fetching warnings for entity ID "${entityId}" and severity "${severity}"`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: entityId });
  return mockData.filter(warning => warning.severityLevel === severity).slice(0, limit);
};

// A01-EP097 - Get Warnings by Associated Entity ID and Fraud Type
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP097_GetWarningsByAssociatedEntityIdAndFraudType = async (entityId: string, fraudType: string, options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP097] Fetching warnings for entity ID "${entityId}" and fraud type "${fraudType}"`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: entityId });
  return mockData.filter(warning => warning.fraudClassification === fraudType).slice(0, limit);
};

// A01-EP098 - Get Warnings by Associated Entity ID and Risk Score Range
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP098_GetWarningsByAssociatedEntityIdAndRiskScoreRange = async (entityId: string, minRiskScore: number, maxRiskScore: number, options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP098] Fetching warnings for entity ID "${entityId}" with risk score between ${minRiskScore} and ${maxRiskScore}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: entityId });
  return mockData.filter(warning =>
    warning.riskScore >= minRiskScore &&
    warning.riskScore <= maxRiskScore
  ).slice(0, limit);
};

// A01-EP099 - Get Warnings by Associated Entity ID and Time Range
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP099_GetWarningsByAssociatedEntityIdAndTimeRange = async (entityId: string, startTimeEpochMillis: number, endTimeEpochMillis: number, options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP099] Fetching warnings for entity ID "${entityId}" between ${startTimeEpochMillis} and ${endTimeEpochMillis}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: entityId });
  return mockData.filter(warning =>
    warning.timestampEpochMillis >= startTimeEpochMillis &&
    warning.timestampEpochMillis <= endTimeEpochMillis
  ).slice(0, limit);
};

// A01-EP100 - Get All Unique User Agents
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP100_GetAllUniqueUserAgents = async (): Promise<string[]> => {
  console.log(`[A01_EP100] Fetching all unique user agents.`);
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000 });
  const userAgents = new Set(mockData.map(warning => warning.transactionDetails.userAgent));
  return Array.from(userAgents);
};

// A01-EP101 - Get Warnings by User Agent and Status
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP101_GetWarningsByUserAgentAndStatus = async (userAgentSubstring: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP101] Fetching warnings with user agent containing "${userAgentSubstring}" and status "${status}" for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.userAgent.includes(userAgentSubstring) &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP102 - Get Warnings with Specific Transaction Currency
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP102_GetWarningsByCurrency = async (currency: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP102] Fetching warnings for currency "${currency}" for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning => warning.transactionDetails.currency === currency).slice(0, limit);
};

// A01-EP103 - Get Warnings with Specific Transaction Currency and Status
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP103_GetWarningsByCurrencyAndStatus = async (currency: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP103] Fetching warnings for currency "${currency}" and status "${status}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.currency === currency &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP104 - Get Warnings with Transaction Amount Range
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP104_GetWarningsByAmountRange = async (minAmount: number, maxAmount: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP104] Fetching warnings for amount range $${minAmount} - $${maxAmount} for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.amount >= minAmount &&
    warning.transactionDetails.amount <= maxAmount
  ).slice(0, limit);
};

// A01-EP105 - Get Warnings with Specific Transaction Amount and Status
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP105_GetWarningsByAmountAndStatus = async (amount: number, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP105] Fetching warnings for amount $${amount} and status "${status}" for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.transactionDetails.amount === amount &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP106 - Get Warnings with Customer Registration Date Range
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP106_GetWarningsByCustomerRegistrationDateRange = async (startDateEpochMillis: number, endDateEpochMillis: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP106] Fetching warnings with customer registration between ${startDateEpochMillis} and ${endDateEpochMillis} for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.customerProfile.registrationDateEpochMillis >= startDateEpochMillis &&
    warning.customerProfile.registrationDateEpochMillis <= endDateEpochMillis
  ).slice(0, limit);
};

// A01-EP107 - Get Warnings with Customer Registration Date Range and Status
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP107_GetWarningsByCustomerRegistrationDateRangeAndStatus = async (startDateEpochMillis: number, endDateEpochMillis: number, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP107] Fetching warnings with customer registration between ${startDateEpochMillis} and ${endDateEpochMillis} and status "${status}" for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.customerProfile.registrationDateEpochMillis >= startDateEpochMillis &&
    warning.customerProfile.registrationDateEpochMillis <= endDateEpochMillis &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP108 - Get Warnings by Customer Transaction History Count Range
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP108_GetWarningsByCustomerTransactionHistoryCountRange = async (minCount: number, maxCount: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP108] Fetching warnings with customer transaction history count between ${minCount} and ${maxCount} for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.customerProfile.transactionHistoryCount >= minCount &&
    warning.customerProfile.transactionHistoryCount <= maxCount
  ).slice(0, limit);
};

// A01-EP109 - Get Warnings by Customer Transaction History Count Range and Status
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP109_GetWarningsByCustomerTransactionHistoryCountRangeAndStatus = async (minCount: number, maxCount: number, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP109] Fetching warnings with customer transaction history count between ${minCount} and ${maxCount} and status "${status}" for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.customerProfile.transactionHistoryCount >= minCount &&
    warning.customerProfile.transactionHistoryCount <= maxCount &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP110 - Get Warnings by Customer Average Transaction Value Range
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP110_GetWarningsByCustomerAverageTransactionValueRange = async (minAvg: number, maxAvg: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP110] Fetching warnings with customer average transaction value between $${minAvg} and $${maxAvg} for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.customerProfile.averageTransactionValue >= minAvg &&
    warning.customerProfile.averageTransactionValue <= maxAvg
  ).slice(0, limit);
};

// A01-EP111 - Get Warnings by Customer Average Transaction Value Range and Status
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP111_GetWarningsByCustomerAverageTransactionValueRangeAndStatus = async (minAvg: number, maxAvg: number, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP111] Fetching warnings with customer average transaction value between $${minAvg} and $${maxAvg} and status "${status}" for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.customerProfile.averageTransactionValue >= minAvg &&
    warning.customerProfile.averageTransactionValue <= maxAvg &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP112 - Get Warnings by Customer Loyalty Tier
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP112_GetWarningsByCustomerLoyaltyTier = async (loyaltyTier: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP112] Fetching warnings for customer loyalty tier "${loyaltyTier}" for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning => warning.customerProfile.loyaltyTier === loyaltyTier).slice(0, limit);
};

// A01-EP113 - Get Warnings by Customer Loyalty Tier and Status
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP113_GetWarningsByCustomerLoyaltyTierAndStatus = async (loyaltyTier: string, status: EnhancedEarlyFraudWarning['investigationStatus'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP113] Fetching warnings for customer loyalty tier "${loyaltyTier}" and status "${status}" for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.customerProfile.loyaltyTier === loyaltyTier &&
    warning.investigationStatus === status
  ).slice(0, limit);
};

// A01-EP114 - Get Warnings with Specific Detection Method and Fraud Type
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP114_GetWarningsByDetectionMethodAndFraudType = async (method: string, fraudType: string, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP114] Fetching warnings using detection method "${method}" and fraud type "${fraudType}" for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.detectionMethods.includes(method) &&
    warning.fraudClassification === fraudType
  ).slice(0, limit);
};

// A01-EP115 - Get Warnings with Specific Detection Method and Severity
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP115_GetWarningsByDetectionMethodAndSeverity = async (method: string, severity: EnhancedEarlyFraudWarning['severityLevel'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP115] Fetching warnings using detection method "${method}" and severity "${severity}" for entity: ${options?.entityId || 'VVV'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.detectionMethods.includes(method) &&
    warning.severityLevel === severity
  ).slice(0, limit);
};

// A01-EP116 - Get Warnings with Specific Fraud Type and Decision Action
// Company Entity: Apex Assurance Alliance (AAA)
const A01_EP116_GetWarningsByFraudTypeAndDecisionAction = async (fraudType: string, action: EnhancedEarlyFraudWarning['decisionEngine']['actionTaken'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP116] Fetching warnings with fraud type "${fraudType}" and decision action "${action}" for entity: ${options?.entityId || 'AAA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.fraudClassification === fraudType &&
    warning.decisionEngine.actionTaken === action
  ).slice(0, limit);
};

// A01-EP117 - Get Warnings with Specific Severity and Decision Action
// Company Entity: Nova Nexus Networks (NNN)
const A01_EP117_GetWarningsBySeverityAndDecisionAction = async (severity: EnhancedEarlyFraudWarning['severityLevel'], action: EnhancedEarlyFraudWarning['decisionEngine']['actionTaken'], options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP117] Fetching warnings with severity "${severity}" and decision action "${action}" for entity: ${options?.entityId || 'NNN'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.severityLevel === severity &&
    warning.decisionEngine.actionTaken === action
  ).slice(0, limit);
};

// A01-EP118 - Get Warnings with Specific Fraud Type and Module Confidence
// Company Entity: Quantum Quest Quorum (QQQ)
const A01_EP118_GetWarningsByFraudTypeAndModuleConfidence = async (fraudType: string, confidenceThreshold: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP118] Fetching warnings with fraud type "${fraudType}" and module confidence > ${confidenceThreshold} for entity: ${options?.entityId || 'QQQ'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.fraudClassification === fraudType &&
    warning.fraudDetectionModules.some(module => module.confidenceScore >= confidenceThreshold)
  ).slice(0, limit);
};

// A01-EP119 - Get Warnings with Specific Severity and Module Confidence
// Company Entity: Sterling Shield Analytics (SSA)
const A01_EP119_GetWarningsBySeverityAndModuleConfidence = async (severity: EnhancedEarlyFraudWarning['severityLevel'], confidenceThreshold: number, options?: { entityId?: string, limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP119] Fetching warnings with severity "${severity}" and module confidence > ${confidenceThreshold} for entity: ${options?.entityId || 'SSA'}`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: options?.entityId });
  return mockData.filter(warning =>
    warning.severityLevel === severity &&
    warning.fraudDetectionModules.some(module => module.confidenceScore >= confidenceThreshold)
  ).slice(0, limit);
};

// A01-EP120 - Get Warnings by Associated Entity ID, Status, and Severity
// Company Entity: Veridian Vigilance Ventures (VVV)
const A01_EP120_GetWarningsByEntityStatusSeverity = async (entityId: string, status: EnhancedEarlyFraudWarning['investigationStatus'], severity: EnhancedEarlyFraudWarning['severityLevel'], options?: { limit?: number }): Promise<EnhancedEarlyFraudWarning[]> => {
  console.log(`[A01_EP120] Fetching warnings for entity "${entityId}", status "${status}", and severity "${severity}"`);
  const limit = options?.limit || 50;
  const mockData = await A01_EP001_FetchAllWarnings({ limit: 1000, entityId: entityId });
  return mockData.filter(warning =>
    warning.investigationStatus === status &&
    warning.severityLevel === severity
  ).slice(0, limit);
};

const EarlyFraudWarningFeed: React.FC = () => {
  const [warnings, setWarnings] = useState<EnhancedEarlyFraudWarning[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // JBO-A01-F001: Fetch initial warnings on component mount
  const fetchInitialWarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Using API Endpoint A01-EP001 to fetch warnings
      const fetchedWarnings = await A01_EP001_FetchAllWarnings({ limit: 20, sortBy: 'timestampEpochMillis', sortOrder: 'desc' });
      setWarnings(fetchedWarnings);
    } catch (err) {
      console.error("Failed to fetch initial warnings:", err);
      setError("Failed to load early fraud warnings. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  // JBO-A01-F011: Periodic data refresh using setInterval
  useEffect(() => {
    fetchInitialWarnings(); // Fetch immediately on mount

    const intervalId = setInterval(async () => {
      try {
        // Fetch new warnings since the last fetch (simplified: refetch latest)
        const newWarnings = await A01_EP001_FetchAllWarnings({ limit: 5, sortBy: 'timestampEpochMillis', sortOrder: 'desc' });
        setWarnings((prevWarnings) => {
          // Prevent duplicates by checking existing IDs
          const uniqueNewWarnings = newWarnings.filter(nw => !prevWarnings.some(pw => pw.id === nw.id));
          return [...uniqueNewWarnings, ...prevWarnings].slice(0, SYSTEM_CONFIGURATION_ENTITY.settings.maxWarningsToDisplay);
        });
      } catch (err) {
        console.error("Error during interval fetch:", err);
        // Decide on error handling: maybe show a subtle notification
      }
    }, SYSTEM_CONFIGURATION_ENTITY.settings.pollingIntervalMillis);

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [fetchInitialWarnings]);

  // JBO-A01-F002: Render severity indicators
  const renderSeverityIndicator = useCallback((severity: EnhancedEarlyFraudWarning['severityLevel']) => {
    const icon = SYSTEM_CONFIGURATION_ENTITY.settings.severityIcons[severity] || SYSTEM_CONFIGURATION_ENTITY.settings.defaultSeverityIcon;
    const colorClass = SYSTEM_CONFIGURATION_ENTITY.settings.defaultSeverityColorMap[severity] || 'text-gray-500';
    return (
      <span className={`font-bold ${colorClass} ml-1`} title={`Severity: ${severity}`}>
        {icon}
      </span>
    );
  }, []);

  // JBO-A01-F017: Color-coding for different fraud types
  const renderFraudTypeBadge = useCallback((fraudType: string) => {
    const colorClass = SYSTEM_CONFIGURATION_ENTITY.settings.fraudTypeColorMap[fraudType as keyof typeof SYSTEM_CONFIGURATION_ENTITY.settings.fraudTypeColorMap] || SYSTEM_CONFIGURATION_ENTITY.settings.fraudTypeColorMap.other;
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {fraudType.replace('_', ' ').toUpperCase()}
      </span>
    );
  }, []);

  // JBO-A01-F018: Color-coding for investigation statuses
  const renderStatusBadge = useCallback((status: EnhancedEarlyFraudWarning['investigationStatus']) => {
    const colorClass = SYSTEM_CONFIGURATION_ENTITY.settings.investigationStatusColorMap[status as keyof typeof SYSTEM_CONFIGURATION_ENTITY.settings.investigationStatusColorMap] || 'bg-gray-200 text-gray-800';
    return (
      <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${colorClass}`}>
        {status.replace('_', ' ')}
      </span>
    );
  }, []);

  // JBO-A01-F005: Detailed view logic (placeholder for now)
  const [selectedWarningId, setSelectedWarningId] = useState<string | null>(null);
  const selectedWarning = useMemo(() => warnings.find(w => w.id === selectedWarningId), [warnings, selectedWarningId]);

  const handleWarningClick = useCallback((warningId: string) => {
    setSelectedWarningId(warningId);
  }, []);

  // JBO-A01-F006: Update status logic
  const handleStatusChange = useCallback(async (warningId: string, newStatus: EnhancedEarlyFraudWarning['investigationStatus']) => {
    try {
      // Simulate API call for status update
      const updatedWarning = await A01_EP003_UpdateInvestigationStatus(warningId, newStatus, `Status updated via UI by user JBO-USER-001`);
      setWarnings(prevWarnings =>
        prevWarnings.map(w => (w.id === warningId ? { ...updatedWarning, updatedAtTimestampEpochMillis: Date.now() } : w))
      );
      if (selectedWarningId === warningId) {
        setSelectedWarningId(updatedWarning.id); // Refresh selected view if open
      }
    } catch (err) {
      console.error(`Failed to update status for warning ${warningId}:`, err);
      alert(`Failed to update status. Please try again.`);
    }
  }, [selectedWarningId]);

  // JBO-A01-F007: Assign warning to user logic
  const handleAssignWarning = useCallback(async (warningId: string, userId: string) => {
    try {
      const updatedWarning = await A01_EP004_AssignWarningToUser(warningId, userId);
      setWarnings(prevWarnings =>
        prevWarnings.map(w => (w.id === warningId ? { ...updatedWarning, updatedAtTimestampEpochMillis: Date.now() } : w))
      );
      if (selectedWarningId === warningId) {
        setSelectedWarningId(updatedWarning.id);
      }
    } catch (err) {
      console.error(`Failed to assign warning ${warningId} to user ${userId}:`, err);
      alert(`Failed to assign warning. Please try again.`);
    }
  }, [selectedWarningId]);

  // JBO-A01-F008: Escalate warning logic
  const handleEscalateWarning = useCallback(async (warningId: string, reason: string) => {
    try {
      const updatedWarning = await A01_EP005_EscalateWarning(warningId, reason);
      setWarnings(prevWarnings =>
        prevWarnings.map(w => (w.id === warningId ? { ...updatedWarning, updatedAtTimestampEpochMillis: Date.now() } : w))
      );
      if (selectedWarningId === warningId) {
        setSelectedWarningId(updatedWarning.id);
      }
    } catch (err) {
      console.error(`Failed to escalate warning ${warningId}:`, err);
      alert(`Failed to escalate warning. Please try again.`);
    }
  }, [selectedWarningId]);

  const formattedTimestamp = (timestamp: number | null) =>
    timestamp ? new Date(timestamp).toLocaleString() : 'N/A';

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);

  // JBO-A01-F003 & JBO-A01-F004: Filtering and Sorting (basic implementation)
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterFraudType, setFilterFraudType] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 'asc' or 'desc'

  const availableStatuses = ['ALL', ...SYSTEM_CONFIGURATION_ENTITY.settings.investigationStatusColorMap].map(s => s.toUpperCase()); // Mock data access
  const availableFraudTypes = ['ALL', 'card_testing', 'account_takeover', 'transaction_anomalies', 'identity_verification_failure', 'promo_abuse', 'other']; // Mock data access

  const filteredAndSortedWarnings = useMemo(() => {
    let processedWarnings = [...warnings];

    if (filterStatus !== 'ALL') {
      processedWarnings = processedWarnings.filter(w => w.investigationStatus === filterStatus);
    }
    if (filterFraudType !== 'ALL') {
      processedWarnings = processedWarnings.filter(w => w.fraudClassification === filterFraudType);
    }

    processedWarnings.sort((a, b) => {
      const timeA = a.timestampEpochMillis;
      const timeB = b.timestampEpochMillis;
      if (sortOrder === 'desc') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });

    return processedWarnings;
  }, [warnings, filterStatus, filterFraudType, sortOrder]);

  return (
    <div className="p-6 max-w-full mx-auto bg-gray-50 text-gray-900 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-center text-jboc3-primary">
        {JBOC3_SYSTEM_BRANDING_ATTRIBUTION} - Early Fraud Warning Feed ({SYSTEM_CONFIGURATION_ENTITY.entityName})
      </h1>
      <p className="text-sm text-center mb-4 text-gray-600">
        System Identifier: {JBOC3_GLOBAL_SYSTEM_IDENTIFIER} | Data Feed Version: 1.0.2
      </p>

      {/* Advanced Filtering and Sorting Controls */}
      <div className="bg-white shadow-lg rounded-lg p-4 mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-jboc3-secondary">Feed Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-jboc3-accent focus:border-jboc3-accent"
            >
              {availableStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fraud-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Fraud Type:</label>
            <select
              id="fraud-type-filter"
              value={filterFraudType}
              onChange={(e) => setFilterFraudType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-jboc3-accent focus:border-jboc3-accent"
            >
              {availableFraudTypes.map(type => (
                <option key={type} value={type}>{type === 'ALL' ? 'All Types' : type.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">Sort by Date:</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-jboc3-accent focus:border-jboc3-accent"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          {/* Placeholder for more advanced filter inputs */}
          <div className="flex items-end">
             {/* Button for export, refresh, etc. */}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-700">Loading early fraud warnings...</p>
          {/* Add a sophisticated loading spinner */}
        </div>
      )}

      {error && (
        <div className="text-center py-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {!loading && !error && filteredAndSortedWarnings.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No early fraud warnings found matching your criteria.
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedWarnings.map((warning) => (
            <div
              key={warning.id}
              className={`bg-white rounded-lg shadow-md p-4 border cursor-pointer transition-shadow duration-300 ${
                selectedWarningId === warning.id ? 'ring-2 ring-jboc3-accent border-jboc3-accent' : 'hover:shadow-xl border-gray-200'
              }`}
              onClick={() => handleWarningClick(warning.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h4 className="text-lg font-semibold mr-2 break-all">
                    {warning.chargeIdentifier}
                  </h4>
                  {renderSeverityIndicator(warning.severityLevel)}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(warning.timestampEpochMillis).toLocaleString()}
                </span>
              </div>
              <div className="mb-2 flex flex-wrap gap-2">
                {renderFraudTypeBadge(warning.fraudClassification)}
                {renderStatusBadge(warning.investigationStatus)}
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Risk Score: <span className="font-semibold">{warning.riskScore.toFixed(3)}</span>
              </p>
              <p className="text-sm text-gray-600 mb-1">
                Entity: <span className="font-medium">{warning.associatedEntityId}</span>
              </p>
              <p className="text-sm text-gray-600">
                Detected by: <span className="font-medium">{warning.detectionMethods.join(', ')}</span>
              </p>
              {warning.notes && (
                <p className="text-xs italic text-gray-500 mt-2 truncate" title={warning.notes}>
                  Notes: {warning.notes.substring(0, 80)}...
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detailed View Panel */}
      {selectedWarning && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 p-6 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedWarningId(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4 text-jboc3-primary">
              Warning Details: {selectedWarning.chargeIdentifier}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Warning Core Info */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-jboc3-secondary border-b pb-1">Core Information</h4>
                <p><strong>ID:</strong> {selectedWarning.id}</p>
                <p><strong>Timestamp:</strong> {formattedTimestamp(selectedWarning.timestampEpochMillis)}</p>
                <p><strong>Charge ID:</strong> {selectedWarning.chargeIdentifier}</p>
                <p><strong>Fraud Classification:</strong> {renderFraudTypeBadge(selectedWarning.fraudClassification)}</p>
                <p><strong>Severity:</strong> {renderSeverityIndicator(selectedWarning.severityLevel)}</p>
                <p><strong>Risk Score:</strong> <span className="font-semibold">{selectedWarning.riskScore.toFixed(3)}</span></p>
                <p><strong>Associated Entity:</strong> {selectedWarning.associatedEntityId}</p>
                <p><strong>Detection Methods:</strong> {selectedWarning.detectionMethods.join(', ')}</p>
              </div>

              {/* Investigation & Resolution */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-jboc3-secondary border-b pb-1">Investigation & Resolution</h4>
                <p><strong>Status:</strong> {renderStatusBadge(selectedWarning.investigationStatus)}</p>
                <p><strong>Assigned To:</strong> {selectedWarning.assignedToUserId || <span className="text-gray-500">Unassigned</span>}</p>
                <p><strong>Created At:</strong> {formattedTimestamp(selectedWarning.createdAtTimestampEpochMillis)}</p>
                <p><strong>Updated At:</strong> {formattedTimestamp(selectedWarning.updatedAtTimestampEpochMillis)}</p>
                <p><strong>Resolution Type:</strong> {selectedWarning.resolutionDetails.resolutionType || <span className="text-gray-500">N/A</span>}</p>
                <p><strong>Resolved At:</strong> {formattedTimestamp(selectedWarning.resolutionDetails.resolvedAtTimestampEpochMillis)}</p>
                <p><strong>Resolver User ID:</strong> {selectedWarning.resolutionDetails.resolverUserId || <span className="text-gray-500">N/A</span>}</p>
              </div>

              {/* Transaction Details */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-lg font-semibold text-jboc3-secondary border-b pb-1">Transaction Details</h4>
                <p><strong>Amount:</strong> {formatCurrency(selectedWarning.transactionDetails.amount, selectedWarning.transactionDetails.currency)}</p>
                <p><strong>Currency:</strong> {selectedWarning.transactionDetails.currency}</p>
                <p><strong>Merchant ID:</strong> {selectedWarning.transactionDetails.merchantId}</p>
                <p><strong>Card Last Four:</strong> {selectedWarning.transactionDetails.cardLastFour}</p>
                <p><strong>Card Type:</strong> {selectedWarning.transactionDetails.cardType}</p>
                <p><strong>Billing Country:</strong> {selectedWarning.transactionDetails.billingCountry}</p>
                <p><strong>Shipping Country:</strong> {selectedWarning.transactionDetails.shippingCountry}</p>
                <p><strong>IP Address:</strong> {selectedWarning.transactionDetails.ipAddress}</p>
                <p><strong>User Agent:</strong> <span className="text-xs break-all">{selectedWarning.transactionDetails.userAgent}</span></p>
              </div>

              {/* Customer Profile */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-lg font-semibold text-jboc3-secondary border-b pb-1">Customer Profile</h4>
                <p><strong>Account ID:</strong> {selectedWarning.customerProfile.accountId}</p>
                <p><strong>Registration Date:</strong> {formattedTimestamp(selectedWarning.customerProfile.registrationDateEpochMillis)}</p>
                <p><strong>Transaction History Count:</strong> {selectedWarning.customerProfile.transactionHistoryCount}</p>
                <p><strong>Average Transaction Value:</strong> {formatCurrency(selectedWarning.customerProfile.averageTransactionValue, 'USD')}</p>
                <p><strong>Loyalty Tier:</strong> {selectedWarning.customerProfile.loyaltyTier}</p>
              </div>

              {/* Decision Engine & Modules */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-lg font-semibold text-jboc3-secondary border-b pb-1">Decision Engine & Modules</h4>
                <p><strong>Rule Triggered:</strong> {selectedWarning.decisionEngine.ruleName}</p>
                <p><strong>Action Taken:</strong> <span className="font-semibold">{selectedWarning.decisionEngine.actionTaken}</span></p>
                {selectedWarning.fraudDetectionModules.length > 0 && (
                  <div>
                    <strong>Detection Modules:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {selectedWarning.fraudDetectionModules.map((module, index) => (
                        <li key={index} className="text-sm">
                          {module.moduleName} v{module.version} (Confidence: {(module.confidenceScore * 100).toFixed(1)}%)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-lg font-semibold text-jboc3-secondary border-b pb-1">Notes</h4>
                <p className="whitespace-pre-wrap text-sm">{selectedWarning.notes || 'No notes available.'}</p>
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex flex-wrap gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => handleStatusChange(selectedWarning.id, 'INVESTIGATING')}
                  disabled={selectedWarning.investigationStatus === 'INVESTIGATING' || selectedWarning.investigationStatus === 'RESOLVED' || selectedWarning.investigationStatus === 'FALSE_POSITIVE'}
                  className="px-3 py-2 bg-jboc3-accent text-white rounded-md hover:bg-jboc3-accent-dark disabled:opacity-50 transition-colors duration-200"
                >
                  Start Investigation
                </button>
                <button
                  onClick={() => handleAssignWarning(selectedWarning.id, 'JBO-USER-007')} // Example User ID
                  disabled={selectedWarning.assignedToUserId !== null || selectedWarning.investigationStatus === 'RESOLVED' || selectedWarning.investigationStatus === 'FALSE_POSITIVE'}
                  className="px-3 py-2 bg-jboc3-primary text-white rounded-md hover:bg-jboc3-primary-dark disabled:opacity-50 transition-colors duration-200"
                >
                  Assign to Analyst (JBO-USER-007)
                </button>
                <button
                  onClick={() => handleEscalateWarning(selectedWarning.id, 'Requires senior review due to high risk score.')}
                  disabled={selectedWarning.investigationStatus === 'ESCALATED' || selectedWarning.investigationStatus === 'RESOLVED' || selectedWarning.investigationStatus === 'FALSE_POSITIVE'}
                  className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 transition-colors duration-200"
                >
                  Escalate
                </button>
                <button
                  onClick={() => handleStatusChange(selectedWarning.id, 'RESOLVED')}
                  disabled={selectedWarning.investigationStatus === 'RESOLVED' || selectedWarning.investigationStatus === 'FALSE_POSITIVE'}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => handleStatusChange(selectedWarning.id, 'FALSE_POSITIVE')}
                  disabled={selectedWarning.investigationStatus === 'RESOLVED' || selectedWarning.investigationStatus === 'FALSE_POSITIVE'}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                >
                  Mark as False Positive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EarlyFraudWarningFeed;
