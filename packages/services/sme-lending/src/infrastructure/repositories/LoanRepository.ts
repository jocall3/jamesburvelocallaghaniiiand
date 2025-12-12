import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplicationEntity } from '../entities/LoanApplication.entity';
import { LoanStatusEntity } from '../entities/LoanStatus.entity';
import { CreateLoanApplicationDto } from '../../domain/dto/CreateLoanApplication.dto';
import { UpdateLoanStatusDto } from '../../domain/dto/UpdateLoanStatus.dto';
import { LoanApplication } from '../../domain/models/LoanApplication';
import { LoanStatus } from '../../domain/models/LoanStatus';

@Injectable()
export class LoanRepository {
  constructor(
    @InjectRepository(LoanApplicationEntity)
    private readonly loanApplicationRepository: Repository<LoanApplicationEntity>,
    @InjectRepository(LoanStatusEntity)
    private readonly loanStatusRepository: Repository<LoanStatusEntity>,
  ) {}

  async createLoanApplication(
    createLoanApplicationDto: CreateLoanApplicationDto,
  ): Promise<LoanApplication> {
    const loanApplicationEntity =
      this.loanApplicationRepository.create(createLoanApplicationDto);
    const savedLoanApplicationEntity =
      await this.loanApplicationRepository.save(loanApplicationEntity);
    return this.mapToLoanApplication(savedLoanApplicationEntity);
  }

  async getLoanApplicationById(id: string): Promise<LoanApplication | null> {
    const loanApplicationEntity = await this.loanApplicationRepository.findOne({
      where: { id },
    });
    return loanApplicationEntity
      ? this.mapToLoanApplication(loanApplicationEntity)
      : null;
  }

  async getAllLoanApplications(): Promise<LoanApplication[]> {
    const loanApplicationEntities = await this.loanApplicationRepository.find();
    return loanApplicationEntities.map((entity) =>
      this.mapToLoanApplication(entity),
    );
  }

  async updateLoanApplication(
    id: string,
    updateLoanApplicationDto: Partial<CreateLoanApplicationDto>,
  ): Promise<LoanApplication | null> {
    await this.loanApplicationRepository.update(id, updateLoanApplicationDto);
    const updatedLoanApplicationEntity =
      await this.loanApplicationRepository.findOne({ where: { id } });
    return updatedLoanApplicationEntity
      ? this.mapToLoanApplication(updatedLoanApplicationEntity)
      : null;
  }

  async deleteLoanApplication(id: string): Promise<void> {
    await this.loanApplicationRepository.delete(id);
  }

  async createLoanStatus(
    createLoanStatusDto: UpdateLoanStatusDto,
  ): Promise<LoanStatus> {
    const loanStatusEntity =
      this.loanStatusRepository.create(createLoanStatusDto);
    const savedLoanStatusEntity = await this.loanStatusRepository.save(
      loanStatusEntity,
    );
    return this.mapToLoanStatus(savedLoanStatusEntity);
  }

  async getLoanStatusByLoanApplicationId(
    loanApplicationId: string,
  ): Promise<LoanStatus | null> {
    const loanStatusEntity = await this.loanStatusRepository.findOne({
      where: { loanApplicationId },
    });
    return loanStatusEntity ? this.mapToLoanStatus(loanStatusEntity) : null;
  }

  async updateLoanStatus(
    loanApplicationId: string,
    updateLoanStatusDto: UpdateLoanStatusDto,
  ): Promise<LoanStatus | null> {
    await this.loanStatusRepository.update(
      { loanApplicationId },
      updateLoanStatusDto,
    );
    const updatedLoanStatusEntity = await this.loanStatusRepository.findOne({
      where: { loanApplicationId },
    });
    return updatedLoanStatusEntity
      ? this.mapToLoanStatus(updatedLoanStatusEntity)
      : null;
  }

  private mapToLoanApplication(
    entity: LoanApplicationEntity,
  ): LoanApplication {
    return {
      id: entity.id,
      applicantName: entity.applicantName,
      loanAmount: entity.loanAmount,
      loanPurpose: entity.loanPurpose,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      applicantEmail: entity.applicantEmail,
      applicantPhoneNumber: entity.applicantPhoneNumber,
      applicantAddress: entity.applicantAddress,
      applicantIncome: entity.applicantIncome,
      applicantCreditScore: entity.applicantCreditScore,
    };
  }

  private mapToLoanStatus(entity: LoanStatusEntity): LoanStatus {
    return {
      id: entity.id,
      loanApplicationId: entity.loanApplicationId,
      status: entity.status,
      comments: entity.comments,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async findLoanApplicationsByCriteria(criteria: Partial<LoanApplication>): Promise<LoanApplication[]> {
    const loanApplicationEntities = await this.loanApplicationRepository.find({
        where: criteria,
    });

    return loanApplicationEntities.map(entity => this.mapToLoanApplication(entity));
  }

  async findLoanStatusesByCriteria(criteria: Partial<LoanStatus>): Promise<LoanStatus[]> {
    const loanStatusEntities = await this.loanStatusRepository.find({
        where: criteria,
    });

    return loanStatusEntities.map(entity => this.mapToLoanStatus(entity));
  }

  async countLoanApplications(): Promise<number> {
    return this.loanApplicationRepository.count();
  }

  async countLoanStatuses(): Promise<number> {
    return this.loanStatusRepository.count();
  }

  async paginateLoanApplications(page: number, limit: number): Promise<LoanApplication[]> {
    const skip = (page - 1) * limit;
    const loanApplicationEntities = await this.loanApplicationRepository.find({
      skip,
      take: limit,
    });

    return loanApplicationEntities.map(entity => this.mapToLoanApplication(entity));
  }
}