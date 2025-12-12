import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection } from '../../domain/entities/Connection';
import { IConnectionRepository } from '../../domain/interfaces/IConnectionRepository';
import { ConnectionEntity } from '../entities/ConnectionEntity';
import { ConnectionMapper } from '../mappers/ConnectionMapper';

@Injectable()
export class ConnectionRepository implements IConnectionRepository {
  constructor(
    @InjectRepository(ConnectionEntity)
    private readonly connectionEntityRepository: Repository<ConnectionEntity>,
    private readonly connectionMapper: ConnectionMapper,
  ) {}

  async create(connection: Connection): Promise<Connection> {
    const connectionEntity = this.connectionMapper.toPersistence(connection);
    const savedConnectionEntity = await this.connectionEntityRepository.save(connectionEntity);
    return this.connectionMapper.toDomain(savedConnectionEntity);
  }

  async update(connection: Connection): Promise<Connection> {
    const connectionEntity = this.connectionMapper.toPersistence(connection);
    const updatedConnectionEntity = await this.connectionEntityRepository.save(connectionEntity);
    return this.connectionMapper.toDomain(updatedConnectionEntity);
  }

  async findById(id: string): Promise<Connection | null> {
    const connectionEntity = await this.connectionEntityRepository.findOne({ where: { id } });
    if (!connectionEntity) {
      return null;
    }
    return this.connectionMapper.toDomain(connectionEntity);
  }

  async findByUserId(userId: string): Promise<Connection[]> {
    const connectionEntities = await this.connectionEntityRepository.find({ where: { userId } });
    return connectionEntities.map((entity) => this.connectionMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.connectionEntityRepository.delete(id);
  }

  async findAll(): Promise<Connection[]> {
    const connectionEntities = await this.connectionEntityRepository.find();
    return connectionEntities.map((entity) => this.connectionMapper.toDomain(entity));
  }

  async findByInstitutionIdAndUserId(institutionId: string, userId: string): Promise<Connection | null> {
    const connectionEntity = await this.connectionEntityRepository.findOne({
      where: { institutionId, userId },
    });

    if (!connectionEntity) {
      return null;
    }

    return this.connectionMapper.toDomain(connectionEntity);
  }

  async exists(id: string): Promise<boolean> {
    const connectionEntity = await this.connectionEntityRepository.findOne({ where: { id } });
    return !!connectionEntity;
  }
}