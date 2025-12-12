import { FindOptionsWhere, ObjectType, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class BaseRepository<T> {
  private readonly repository: Repository<T>;

  constructor(private readonly entity: ObjectType<T>) {
    // NOTE: The repository is injected in the derived classes.
    //       This is because the connection is not available in the base class constructor.
    //       See: https://github.com/typeorm/typeorm/issues/548
  }

  setRepository(repository: Repository<T>): void {
    this.repository = repository;
  }

  async create(entity: QueryDeepPartialEntity<T>): Promise<T> {
    return this.repository.create(entity) as T;
  }

  async save(entity: QueryDeepPartialEntity<T>): Promise<T> {
    return this.repository.save(entity as any) as T; // Type assertion needed due to QueryDeepPartialEntity
  }

  async findOne(id: string | number): Promise<T | null> {
    return this.repository.findOne({ where: { id } as FindOptionsWhere<T> }) || null;
  }

  async findOneBy(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where }) || null;
  }

  async find(where?: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where });
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async update(id: string | number, entity: QueryDeepPartialEntity<T>): Promise<void> {
    await this.repository.update(id, entity);
  }

  async delete(id: string | number): Promise<void> {
    await this.repository.delete(id);
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }

  getRepository(): Repository<T> {
    return this.repository;
  }
}