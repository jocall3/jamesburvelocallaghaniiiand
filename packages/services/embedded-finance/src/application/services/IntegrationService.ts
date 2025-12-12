import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration } from '../../domain/entities/Integration';
import { CreateIntegrationDto } from '../dto/CreateIntegrationDto';
import { UpdateIntegrationDto } from '../dto/UpdateIntegrationDto';
import { IntegrationNotFoundException } from '../../domain/exceptions/IntegrationNotFoundException';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    @InjectRepository(Integration)
    private integrationRepository: Repository<Integration>,
  ) {}

  async createIntegration(createIntegrationDto: CreateIntegrationDto): Promise<Integration> {
    const integration = this.integrationRepository.create(createIntegrationDto);
    return this.integrationRepository.save(integration);
  }

  async getAllIntegrations(): Promise<Integration[]> {
    return this.integrationRepository.find();
  }

  async getIntegrationById(id: string): Promise<Integration> {
    const integration = await this.integrationRepository.findOne({ where: { id } });
    if (!integration) {
      this.logger.warn(`Integration with id ${id} not found`);
      throw new IntegrationNotFoundException(`Integration with id ${id} not found`);
    }
    return integration;
  }

  async updateIntegration(id: string, updateIntegrationDto: UpdateIntegrationDto): Promise<Integration> {
    const integration = await this.getIntegrationById(id); // Ensure integration exists
    this.integrationRepository.merge(integration, updateIntegrationDto);
    return this.integrationRepository.save(integration);
  }

  async deleteIntegration(id: string): Promise<void> {
    const integration = await this.getIntegrationById(id); // Ensure integration exists
    await this.integrationRepository.remove(integration);
  }

  async findIntegrationsByPartnerId(partnerId: string): Promise<Integration[]> {
    return this.integrationRepository.find({ where: { partnerId } });
  }

  // Example of a more complex query (can be expanded upon)
  async findActiveIntegrations(): Promise<Integration[]> {
    return this.integrationRepository.find({ where: { isActive: true } });
  }

  // Example of adding pagination
  async getIntegrationsPaginated(page: number = 1, limit: number = 10): Promise<[Integration[], number]> {
    const skip = (page - 1) * limit;
    return this.integrationRepository.findAndCount({
      skip,
      take: limit,
    });
  }

  // Example of searching integrations by name
  async searchIntegrationsByName(name: string): Promise<Integration[]> {
    return this.integrationRepository.find({
      where: {
        name: { $regex: name, $options: 'i' }, // Case-insensitive search
      },
    });
  }
}