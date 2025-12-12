import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../../domain/entities/Report';
import { ReportType } from '../../domain/enums/ReportType';
import { SarReportGenerator } from './report-generators/SarReportGenerator';
import { BaselThreeReportGenerator } from './report-generators/BaselThreeReportGenerator';
import { ReportGenerator } from './report-generators/ReportGenerator';
import { ReportGenerationOptions } from '../../domain/interfaces/ReportGenerationOptions';
import { Logger } from '@nestjs/common';

@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger(ReportGenerationService.name);

  private reportGenerators: { [key in ReportType]?: ReportGenerator } = {};

  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private sarReportGenerator: SarReportGenerator,
    private baselThreeReportGenerator: BaselThreeReportGenerator,
  ) {
    this.reportGenerators[ReportType.SAR] = sarReportGenerator;
    this.reportGenerators[ReportType.BASEL_III] = baselThreeReportGenerator;
  }

  async generateReport(
    reportType: ReportType,
    options: ReportGenerationOptions,
  ): Promise<Report> {
    this.logger.log(`Generating report of type: ${reportType}`);

    const generator = this.reportGenerators[reportType];

    if (!generator) {
      this.logger.error(`No report generator found for type: ${reportType}`);
      throw new Error(`Report type ${reportType} is not supported.`);
    }

    try {
      const reportData = await generator.generate(options);

      const report = this.reportRepository.create({
        type: reportType,
        data: reportData,
        generatedAt: new Date(),
        options: options, // Store the options used for generation
      });

      const savedReport = await this.reportRepository.save(report);
      this.logger.log(`Report generated and saved with ID: ${savedReport.id}`);
      return savedReport;
    } catch (error) {
      this.logger.error(
        `Error generating report of type ${reportType}: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to generate report of type ${reportType}: ${error.message}`,
      );
    }
  }

  async getReportById(id: string): Promise<Report | undefined> {
    try {
      const report = await this.reportRepository.findOne({ where: { id } });
      if (!report) {
        this.logger.warn(`Report with ID ${id} not found.`);
      }
      return report;
    } catch (error) {
      this.logger.error(`Error retrieving report with ID ${id}: ${error.message}`, error.stack);
      throw new Error(`Failed to retrieve report with ID ${id}: ${error.message}`);
    }
  }

  // Example method to list reports (can be expanded with pagination, filtering, etc.)
  async listReports(): Promise<Report[]> {
    try {
      return await this.reportRepository.find();
    } catch (error) {
      this.logger.error(`Error listing reports: ${error.message}`, error.stack);
      throw new Error(`Failed to list reports: ${error.message}`);
    }
  }

  // Method to add a new report generator (for extensibility)
  addReportGenerator(reportType: ReportType, generator: ReportGenerator): void {
    if (this.reportGenerators[reportType]) {
      this.logger.warn(`Overwriting existing report generator for type: ${reportType}`);
    }
    this.reportGenerators[reportType] = generator;
    this.logger.log(`Added report generator for type: ${reportType}`);
  }

  // Method to remove a report generator (for maintenance/cleanup)
  removeReportGenerator(reportType: ReportType): void {
    if (!this.reportGenerators[reportType]) {
      this.logger.warn(`No report generator found for type: ${reportType} to remove.`);
      return;
    }
    delete this.reportGenerators[reportType];
    this.logger.log(`Removed report generator for type: ${reportType}`);
  }
}