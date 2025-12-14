import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a single company within a financial portfolio.
 */
export interface PortfolioCompany {
  id: string; // Unique identifier for the company
  name: string;
  industry: string;
  location: string; // Primary operational location (e.g., ISO 3166-1 alpha-2 country code or city)
  marketCap?: number; // Optional: for weighting impacts
  // Add other relevant financial identifiers or data points as needed
  // e.g., 'ticker', 'isin', 'revenue', 'assets'
}

/**
 * Represents a financial portfolio composed of multiple companies.
 */
export interface FinancialPortfolio {
  id: string;
  name: string;
  companies: PortfolioCompany[];
}

/**
 * Options for customizing the environmental assessment.
 */
export interface EnvironmentalAssessmentOptions {
  includeCarbonFootprint?: boolean;
  includeClimateRisk?: boolean;
  includeWaterStress?: boolean;
  includeBiodiversityImpact?: boolean;
  includeRegulatoryCompliance?: boolean;
  climateScenario?: ClimateScenario; // Specific climate scenario to model
  targetRegulation?: EnvironmentalRegulation; // Specific regulation to simulate
  weightingStrategy?: 'equal' | 'marketCap' | 'revenue'; // How to aggregate company impacts
}

/**
 * Defines a climate change scenario (e.g., IPCC pathways).
 */
export enum ClimateScenario {
  RCP2_6 = 'RCP2.6 (Low Emissions)', // Representative Concentration Pathway 2.6
  RCP4_5 = 'RCP4.5 (Intermediate Emissions)',
  RCP8_5 = 'RCP8.5 (High Emissions)',
  SSP1_2_6 = 'SSP1-2.6 (Sustainability, Low Challenges)', // Shared Socioeconomic Pathway
  SSP2_4_5 = 'SSP2-4.5 (Middle of the Road)',
  SSP5_8_5 = 'SSP5-8.5 (Fossil-fueled Development)',
}

/**
 * Defines a specific environmental regulation to simulate.
 */
export interface EnvironmentalRegulation {
  id: string;
  name: string;
  jurisdiction: string; // e.g., 'EU', 'USA', 'California'
  type: 'carbonTax' | 'emissionCap' | 'waterUsageLimit' | 'wasteReductionMandate';
  details: Record<string, any>; // Specific parameters of the regulation
}

/**
 * Detailed carbon footprint metrics.
 */
export interface CarbonFootprintDetails {
  scope1Emissions_tCO2e: number; // Direct emissions
  scope2Emissions_tCO2e: number; // Indirect emissions from purchased energy
  scope3Emissions_tCO2e: number; // Other indirect emissions (supply chain, product use, etc.)
  totalEmissions_tCO2e: number;
  intensity_tCO2e_per_revenue?: number; // Emissions per unit of revenue
  lastReportedYear: number;
}

/**
 * Assessment of climate-related physical and transition risks.
 */
export interface ClimateRiskDetails {
  physicalRiskScore: number; // e.g., 0-100, higher is worse
  transitionRiskScore: number; // e.g., 0-100, higher is worse
  physicalRiskExposure: string[]; // e.g., ['flood', 'heatwave', 'drought']
  transitionRiskFactors: string[]; // e.g., ['carbonTaxExposure', 'strandedAssetRisk']
  scenarioModeled: ClimateScenario;
  financialImpactEstimate_USD?: number; // Estimated financial impact
}

/**
 * Assessment of water stress and usage.
 */
export interface WaterStressDetails {
  waterWithdrawal_m3: number;
  waterDischarge_m3: number;
  waterRecycled_m3: number;
  waterStressScore: number; // e.g., 0-100, higher is worse
  highStressRegions: string[]; // Regions where operations face high water stress
}

/**
 * Assessment of biodiversity impact.
 */
export interface BiodiversityImpactDetails {
  habitatLossScore: number; // e.g., 0-100
  pollutionImpactScore: number; // e.g., 0-100
  conservationEfforts: string[]; // e.g., ['land_restoration', 'sustainable_sourcing']
  sensitiveEcosystemExposure: string[]; // e.g., ['rainforest_proximity', 'coral_reef_impact']
}

/**
 * Assessment of compliance with specific environmental regulations.
 */
export interface RegulatoryComplianceDetails {
  regulationId: string;
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
  estimatedComplianceCost_USD?: number;
  potentialFines_USD?: number;
  gapsIdentified: string[];
}

/**
 * Consolidated environmental report for a single company.
 */
export interface CompanyEnvironmentalReport {
  company: PortfolioCompany;
  carbonFootprint?: CarbonFootprintDetails;
  climateRisk?: ClimateRiskDetails;
  waterStress?: WaterStressDetails;
  biodiversityImpact?: BiodiversityImpactDetails;
  regulatoryCompliance?: RegulatoryComplianceDetails[];
  overallESGScore?: number; // A synthesized score for the company
}

/**
 * The comprehensive environmental impact report for the entire portfolio.
 */
export interface EnvironmentalImpactReport {
  reportId: string;
  portfolio: FinancialPortfolio;
  timestamp: Date;
  options: EnvironmentalAssessmentOptions;
  companyReports: CompanyEnvironmentalReport[];
  portfolioSummary: {
    totalPortfolioCarbonFootprint_tCO2e?: number;
    averagePortfolioClimateRiskScore?: number;
    averagePortfolioWaterStressScore?: number;
    averagePortfolioBiodiversityImpactScore?: number;
    overallPortfolioESGScore?: number;
    regulatoryComplianceOverview?: {
      compliantCount: number;
      atRiskCount: number;
      nonCompliantCount: number;
      regulationsAssessed: string[];
    };
    keyRisksIdentified: string[];
    keyOpportunitiesIdentified: string[];
  };
}

/**
 * Interface for an environmental data provider, abstracting data fetching.
 * This allows for different adapters (e.g., for specific ESG data vendors, internal data lakes).
 */
export interface EnvironmentalDataProvider {
  getCompanyEnvironmentalData(companyId: string, industry: string, location: string): Promise<any>;
  getClimateRiskData(companyId: string, scenario: ClimateScenario): Promise<any>;
  getWaterStressData(companyId: string): Promise<any>;
  getBiodiversityImpactData(companyId: string): Promise<any>;
  getRegulatoryImpactData(companyId: string, regulation: EnvironmentalRegulation): Promise<any>;
}

/**
 * Mock implementation of EnvironmentalDataProvider for demonstration purposes.
 * In a real system, this would connect to external APIs or internal databases.
 */
class MockEnvironmentalDataProvider implements EnvironmentalDataProvider {
  async getCompanyEnvironmentalData(companyId: string, industry: string, location: string): Promise<any> {
    // Simulate fetching data based on company attributes
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    const baseEmissions = industry.includes('heavy manufacturing') ? 500000 : industry.includes('tech') ? 5000 : 50000;
    const baseWater = industry.includes('agriculture') ? 1000000 : industry.includes('tech') ? 50000 : 200000;

    return {
      companyId,
      industry,
      location,
      emissions: {
        scope1: baseEmissions * (0.6 + Math.random() * 0.4),
        scope2: baseEmissions * (0.2 + Math.random() * 0.2),
        scope3: baseEmissions * (0.1 + Math.random() * 0.1),
        year: 2023,
      },
      water: {
        withdrawal: baseWater * (0.8 + Math.random() * 0.2),
        discharge: baseWater * (0.5 + Math.random() * 0.2),
        recycled: baseWater * (0.1 + Math.random() * 0.1),
      },
      biodiversity: {
        habitatLossFactor: Math.random() * 0.5, // 0-1
        pollutionFactor: Math.random() * 0.7, // 0-1
        conservationPrograms: Math.random() > 0.5 ? ['local_restoration'] : [],
      },
    };
  }

  async getClimateRiskData(companyId: string, scenario: ClimateScenario): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const basePhysicalRisk = scenario === ClimateScenario.RCP8_5 ? 70 : scenario === ClimateScenario.RCP2_6 ? 30 : 50;
    const baseTransitionRisk = scenario === ClimateScenario.RCP2_6 ? 80 : scenario === ClimateScenario.RCP8_5 ? 20 : 50;

    return {
      companyId,
      physicalRiskScore: basePhysicalRisk + Math.floor(Math.random() * 20 - 10),
      transitionRiskScore: baseTransitionRisk + Math.floor(Math.random() * 20 - 10),
      physicalRiskExposure: Math.random() > 0.7 ? ['flood', 'heatwave'] : ['drought'],
      transitionRiskFactors: Math.random() > 0.6 ? ['carbonTaxExposure'] : ['regulatory_change'],
      scenarioModeled: scenario,
    };
  }

  async getWaterStressData(companyId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const waterStressScore = Math.floor(Math.random() * 100);
    const highStressRegions = waterStressScore > 70 ? ['California', 'Middle East'] : [];
    return { companyId, waterStressScore, highStressRegions };
  }

  async getBiodiversityImpactData(companyId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const habitatLossScore = Math.floor(Math.random() * 100);
    const pollutionImpactScore = Math.floor(Math.random() * 100);
    return { companyId, habitatLossScore, pollutionImpactScore };
  }

  async getRegulatoryImpactData(companyId: string, regulation: EnvironmentalRegulation): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const complianceStatus = Math.random() > 0.8 ? 'non_compliant' : Math.random() > 0.5 ? 'at_risk' : 'compliant';
    const estimatedCost = complianceStatus !== 'compliant' ? Math.floor(Math.random() * 1000000) : 0;
    const potentialFines = complianceStatus === 'non_compliant' ? Math.floor(Math.random() * 5000000) : 0;
    const gaps = complianceStatus !== 'compliant' ? ['data_reporting', 'emission_reduction_target'] : [];
    return { companyId, regulationId: regulation.id, complianceStatus, estimatedComplianceCost_USD: estimatedCost, potentialFines_USD: potentialFines, gapsIdentified: gaps };
  }
}

/**
 * Service for performing environmental modeling and impact assessments for financial portfolios.
 * This service integrates various environmental data points to provide a holistic view of a portfolio's
 * sustainability profile and associated risks/opportunities.
 */
export class EnvironmentalModelingService {
  private dataProvider: EnvironmentalDataProvider;

  constructor(dataProvider: EnvironmentalDataProvider = new MockEnvironmentalDataProvider()) {
    this.dataProvider = dataProvider;
  }

  /**
   * Performs a comprehensive environmental impact assessment for a given financial portfolio.
   * @param portfolio The financial portfolio to assess.
   * @param options Options to customize the assessment.
   * @returns A promise resolving to an EnvironmentalImpactReport.
   */
  public async assessPortfolioEnvironmentalImpact(
    portfolio: FinancialPortfolio,
    options: EnvironmentalAssessmentOptions = {}
  ): Promise<EnvironmentalImpactReport> {
    const defaultOptions: EnvironmentalAssessmentOptions = {
      includeCarbonFootprint: true,
      includeClimateRisk: true,
      includeWaterStress: true,
      includeBiodiversityImpact: true,
      includeRegulatoryCompliance: false, // Default to false as it requires specific regulation input
      climateScenario: ClimateScenario.SSP2_4_5,
      weightingStrategy: 'marketCap',
      ...options,
    };

    const companyReports: CompanyEnvironmentalReport[] = await Promise.all(
      portfolio.companies.map(async (company) => {
        const companyData = await this.dataProvider.getCompanyEnvironmentalData(company.id, company.industry, company.location);
        const report: CompanyEnvironmentalReport = { company };

        if (defaultOptions.includeCarbonFootprint) {
          report.carbonFootprint = this._calculateCarbonFootprint(companyData);
        }
        if (defaultOptions.includeClimateRisk && defaultOptions.climateScenario) {
          const climateRiskRaw = await this.dataProvider.getClimateRiskData(company.id, defaultOptions.climateScenario);
          report.climateRisk = this._modelClimateRisk(climateRiskRaw, defaultOptions.climateScenario);
        }
        if (defaultOptions.includeWaterStress) {
          const waterStressRaw = await this.dataProvider.getWaterStressData(company.id);
          report.waterStress = this._evaluateWaterStress(waterStressRaw);
        }
        if (defaultOptions.includeBiodiversityImpact) {
          const biodiversityRaw = await this.dataProvider.getBiodiversityImpactData(company.id);
          report.biodiversityImpact = this._assessBiodiversityImpact(biodiversityRaw);
        }
        if (defaultOptions.includeRegulatoryCompliance && defaultOptions.targetRegulation) {
          const regComplianceRaw = await this.dataProvider.getRegulatoryImpactData(company.id, defaultOptions.targetRegulation);
          report.regulatoryCompliance = [this._simulateRegulatoryCompliance(regComplianceRaw, defaultOptions.targetRegulation)];
        }

        // Calculate a simple overall ESG score for the company
        report.overallESGScore = this._aggregateCompanyESGScore(report);

        return report;
      })
    );

    const portfolioSummary = this._generatePortfolioSummary(companyReports, defaultOptions.weightingStrategy);

    return {
      reportId: uuidv4(),
      portfolio,
      timestamp: new Date(),
      options: defaultOptions,
      companyReports,
      portfolioSummary,
    };
  }

  /**
   * Calculates carbon footprint details from raw company environmental data.
   * @param rawData Raw environmental data for a company.
   * @returns CarbonFootprintDetails.
   */
  private _calculateCarbonFootprint(rawData: any): CarbonFootprintDetails {
    const scope1 = rawData.emissions.scope1 || 0;
    const scope2 = rawData.emissions.scope2 || 0;
    const scope3 = rawData.emissions.scope3 || 0;
    const total = scope1 + scope2 + scope3;
    // Assuming revenue data is available in rawData or company object for intensity
    const revenue = rawData.revenue || 1; // Avoid division by zero
    return {
      scope1Emissions_tCO2e: scope1,
      scope2Emissions_tCO2e: scope2,
      scope3Emissions_tCO2e: scope3,
      totalEmissions_tCO2e: total,
      intensity_tCO2e_per_revenue: total / revenue,
      lastReportedYear: rawData.emissions.year,
    };
  }

  /**
   * Models climate risk based on raw data and a specified scenario.
   * @param rawData Raw climate risk data.
   * @param scenario The climate scenario used for modeling.
   * @returns ClimateRiskDetails.
   */
  private _modelClimateRisk(rawData: any, scenario: ClimateScenario): ClimateRiskDetails {
    return {
      physicalRiskScore: rawData.physicalRiskScore,
      transitionRiskScore: rawData.transitionRiskScore,
      physicalRiskExposure: rawData.physicalRiskExposure,
      transitionRiskFactors: rawData.transitionRiskFactors,
      scenarioModeled: scenario,
      financialImpactEstimate_USD: rawData.financialImpactEstimate_USD, // Placeholder
    };
  }

  /**
   * Evaluates water stress from raw water data.
   * @param rawData Raw water usage and stress data.
   * @returns WaterStressDetails.
   */
  private _evaluateWaterStress(rawData: any): WaterStressDetails {
    return {
      waterWithdrawal_m3: rawData.waterWithdrawal || 0,
      waterDischarge_m3: rawData.waterDischarge || 0,
      waterRecycled_m3: rawData.waterRecycled || 0,
      waterStressScore: rawData.waterStressScore,
      highStressRegions: rawData.highStressRegions,
    };
  }

  /**
   * Assesses biodiversity impact from raw data.
   * @param rawData Raw biodiversity impact data.
   * @returns BiodiversityImpactDetails.
   */
  private _assessBiodiversityImpact(rawData: any): BiodiversityImpactDetails {
    return {
      habitatLossScore: Math.round(rawData.habitatLossFactor * 100),
      pollutionImpactScore: Math.round(rawData.pollutionFactor * 100),
      conservationEfforts: rawData.conservationPrograms,
      sensitiveEcosystemExposure: rawData.sensitiveEcosystemExposure || [], // Placeholder
    };
  }

  /**
   * Simulates regulatory compliance based on raw data and a specific regulation.
   * @param rawData Raw regulatory compliance data.
   * @param regulation The environmental regulation being simulated.
   * @returns RegulatoryComplianceDetails.
   */
  private _simulateRegulatoryCompliance(rawData: any, regulation: EnvironmentalRegulation): RegulatoryComplianceDetails {
    return {
      regulationId: regulation.id,
      complianceStatus: rawData.complianceStatus,
      estimatedComplianceCost_USD: rawData.estimatedComplianceCost_USD,
      potentialFines_USD: rawData.potentialFines_USD,
      gapsIdentified: rawData.gapsIdentified,
    };
  }

  /**
   * Aggregates various environmental factors into a single ESG score for a company.
   * This is a simplified aggregation; a real system would use a more sophisticated model.
   * @param report The company's environmental report.
   * @returns An overall ESG score (e.g., 0-100).
   */
  private _aggregateCompanyESGScore(report: CompanyEnvironmentalReport): number {
    let score = 100; // Start with a perfect score
    let factors = 0;

    if (report.carbonFootprint) {
      // Penalize higher emissions, normalize to a 0-100 scale (e.g., 1M tCO2e = 0 score, 0 tCO2e = 100 score)
      const emissionPenalty = Math.min(report.carbonFootprint.totalEmissions_tCO2e / 1000000, 1) * 50; // Max 50 point penalty
      score -= emissionPenalty;
      factors++;
    }
    if (report.climateRisk) {
      // Penalize higher risk scores
      score -= (report.climateRisk.physicalRiskScore + report.climateRisk.transitionRiskScore) / 2 * 0.2; // Max 20 point penalty
      factors++;
    }
    if (report.waterStress) {
      score -= report.waterStress.waterStressScore * 0.2; // Max 20 point penalty
      factors++;
    }
    if (report.biodiversityImpact) {
      score -= (report.biodiversityImpact.habitatLossScore + report.biodiversityImpact.pollutionImpactScore) / 2 * 0.2; // Max 20 point penalty
      factors++;
    }
    if (report.regulatoryCompliance && report.regulatoryCompliance.some(rc => rc.complianceStatus !== 'compliant')) {
      score -= 15; // Flat penalty for any non-compliance
      factors++;
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generates a summary for the entire portfolio based on individual company reports.
   * @param companyReports An array of individual company environmental reports.
   * @param weightingStrategy How to weight company impacts (e.g., by market cap).
   * @returns A summary object for the portfolio.
   */
  private _generatePortfolioSummary(
    companyReports: CompanyEnvironmentalReport[],
    weightingStrategy: EnvironmentalAssessmentOptions['weightingStrategy']
  ): EnvironmentalImpactReport['portfolioSummary'] {
    let totalCarbonFootprint = 0;
    let totalClimateRiskScore = 0;
    let totalWaterStressScore = 0;
    let totalBiodiversityImpactScore = 0;
    let totalESGScore = 0;
    let totalWeight = 0;

    const regulatoryComplianceOverview = {
      compliantCount: 0,
      atRiskCount: 0,
      nonCompliantCount: 0,
      regulationsAssessed: new Set<string>(),
    };

    const keyRisksIdentified: Set<string> = new Set();
    const keyOpportunitiesIdentified: Set<string> = new Set(); // Placeholder for future expansion

    for (const report of companyReports) {
      const weight = weightingStrategy === 'marketCap' && report.company.marketCap ? report.company.marketCap : 1;
      totalWeight += weight;

      if (report.carbonFootprint) {
        totalCarbonFootprint += report.carbonFootprint.totalEmissions_tCO2e * weight;
      }
      if (report.climateRisk) {
        totalClimateRiskScore += ((report.climateRisk.physicalRiskScore + report.climateRisk.transitionRiskScore) / 2) * weight;
        report.climateRisk.physicalRiskExposure.forEach(risk => keyRisksIdentified.add(risk));
        report.climateRisk.transitionRiskFactors.forEach(risk => keyRisksIdentified.add(risk));
      }
      if (report.waterStress) {
        totalWaterStressScore += report.waterStress.waterStressScore * weight;
        report.waterStress.highStressRegions.forEach(region => keyRisksIdentified.add(`Water Stress in ${region}`));
      }
      if (report.biodiversityImpact) {
        totalBiodiversityImpactScore += ((report.biodiversityImpact.habitatLossScore + report.biodiversityImpact.pollutionImpactScore) / 2) * weight;
      }
      if (report.overallESGScore !== undefined) {
        totalESGScore += report.overallESGScore * weight;
      }
      if (report.regulatoryCompliance) {
        report.regulatoryCompliance.forEach(rc => {
          regulatoryComplianceOverview.regulationsAssessed.add(rc.regulationId);
          if (rc.complianceStatus === 'compliant') regulatoryComplianceOverview.compliantCount++;
          else if (rc.complianceStatus === 'at_risk') regulatoryComplianceOverview.atRiskCount++;
          else regulatoryComplianceOverview.nonCompliantCount++;
          rc.gapsIdentified.forEach(gap => keyRisksIdentified.add(`Regulatory Gap: ${gap}`));
        });
      }
    }

    const summary: EnvironmentalImpactReport['portfolioSummary'] = {
      keyRisksIdentified: Array.from(keyRisksIdentified),
      keyOpportunitiesIdentified: Array.from(keyOpportunitiesIdentified),
    };

    if (totalWeight > 0) {
      summary.totalPortfolioCarbonFootprint_tCO2e = totalCarbonFootprint;
      summary.averagePortfolioClimateRiskScore = totalClimateRiskScore / totalWeight;
      summary.averagePortfolioWaterStressScore = totalWaterStressScore / totalWeight;
      summary.averagePortfolioBiodiversityImpactScore = totalBiodiversityImpactScore / totalWeight;
      summary.overallPortfolioESGScore = totalESGScore / totalWeight;
    }

    summary.regulatoryComplianceOverview = {
      ...regulatoryComplianceOverview,
      regulationsAssessed: Array.from(regulatoryComplianceOverview.regulationsAssessed),
    };

    return summary;
  }
}