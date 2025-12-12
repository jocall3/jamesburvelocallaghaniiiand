import { Onfido, OnfidoApiError, OnfidoOptions } from '@onfido/api';
import {
  Applicant,
  Check,
  LiveVideo,
  LivePhoto,
  Report,
  SdkToken,
  Webhook,
} from '@onfido/api/dist/src/types';

import {
  IdentityVerificationProvider,
  ApplicantRequest,
  CheckRequest,
  IdentityVerificationResult,
  IdentityVerificationError,
  WebhookEvent,
} from '../../domain/ports/IdentityVerificationProvider';

export class OnfidoAdapter implements IdentityVerificationProvider {
  private readonly onfido: Onfido;

  constructor(options: OnfidoOptions) {
    this.onfido = new Onfido(options);
  }

  async createApplicant(applicantRequest: ApplicantRequest): Promise<Applicant> {
    try {
      return await this.onfido.applicant.create(applicantRequest);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create applicant');
    }
  }

  async findApplicant(applicantId: string): Promise<Applicant> {
    try {
      return await this.onfido.applicant.find(applicantId);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to find applicant');
    }
  }

  async updateApplicant(applicantId: string, applicantRequest: ApplicantRequest): Promise<Applicant> {
    try {
      return await this.onfido.applicant.update(applicantId, applicantRequest);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to update applicant');
    }
  }

  async createCheck(checkRequest: CheckRequest): Promise<Check> {
    try {
      return await this.onfido.check.create(checkRequest);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create check');
    }
  }

  async findCheck(checkId: string): Promise<Check> {
    try {
      return await this.onfido.check.find(checkId);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to find check');
    }
  }

  async listChecks(applicantId: string): Promise<Check[]> {
    try {
      const { checks } = await this.onfido.check.list(applicantId);
      return checks;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to list checks');
    }
  }

  async getReport(reportId: string): Promise<Report> {
    try {
      return await this.onfido.report.find(reportId);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get report');
    }
  }

  async listReports(checkId: string): Promise<Report[]> {
    try {
      const { reports } = await this.onfido.report.list(checkId);
      return reports;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to list reports');
    }
  }

  async getLiveVideo(liveVideoId: string): Promise<LiveVideo> {
    try {
      return await this.onfido.liveVideo.find(liveVideoId);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get live video');
    }
  }

  async getLivePhoto(livePhotoId: string): Promise<LivePhoto> {
    try {
      return await this.onfido.livePhoto.find(livePhotoId);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get live photo');
    }
  }

  async createSdkToken(): Promise<SdkToken> {
    try {
      return await this.onfido.sdkToken.generate();
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create SDK token');
    }
  }

  // Implement the webhook processing logic
  processWebhookEvent(payload: any, signature: string): WebhookEvent {
    try {
      const webhook = this.onfido.webhook.parse(payload, signature);
      return {
        id: webhook.id,
        event: webhook.event,
        resourceType: webhook.resource_type,
        resourceId: webhook.resource_id,
      };
    } catch (error: any) {
      throw new Error(`Failed to process webhook event: ${error.message}`);
    }
  }

  async getWebhook(webhookId: string): Promise<Webhook> {
    try {
      return await this.onfido.webhook.find(webhookId);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get webhook');
    }
  }

  // Example implementation of retrieving verification results.  Adapt based on Onfido's response structure.
  async getVerificationResult(checkId: string): Promise<IdentityVerificationResult> {
    try {
      const check = await this.findCheck(checkId);
      const reports = await this.listReports(checkId);

      // Example logic - adapt based on your specific requirements and Onfido's response structure
      const allReportsSuccessful = reports.every(report => report.result === 'clear');
      const verificationStatus = allReportsSuccessful ? 'clear' : 'consider'; // Or 'clear', 'consider', 'declined'

      return {
        status: verificationStatus,
        details: {
          checkResult: check.result,
          reportResults: reports.map(report => ({
            reportId: report.id,
            reportName: report.name,
            reportResult: report.result,
            reportSubResult: report.sub_result,
          })),
        },
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get verification result');
    }
  }

  private handleError(error: any, message: string): IdentityVerificationError {
    if (error instanceof OnfidoApiError) {
      console.error(`${message}: ${error.message}`, error.details);
      return {
        message: `${message}: ${error.message}`,
        code: error.statusCode?.toString() || '500',
        details: error.details,
      };
    } else {
      console.error(`${message}: ${error.message}`, error);
      return {
        message: `${message}: ${error.message}`,
        code: '500',
        details: { originalError: error },
      };
    }
  }
}