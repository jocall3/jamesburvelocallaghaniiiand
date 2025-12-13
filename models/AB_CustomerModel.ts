import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';

/**
 * Interface representing the core attributes of a Customer.
 * This defines the shape of customer data throughout the application,
 * ensuring type consistency before mapping to a database schema.
 */
export interface E_Customer {
  /**
   * Unique identifier for the customer.
   */
  id: string;

  /**
   * The customer's email address. Must be unique.
   */
  email: string;

  /**
   * The customer's first name. Optional.
   */
  firstName?: string;

  /**
   * The customer's last name. Optional.
   */
  lastName?: string;

  /**
   * The current subscription status of the customer.
   * Defines whether they have an active, inactive, trial, or cancelled subscription.
   */
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';

  /**
   * The ID of the subscription plan the customer is currently on. Optional.
   * This could be a foreign key to a SubscriptionPlan model.
   */
  subscriptionPlanId?: string;

  /**
   * Timestamp of the customer's last successful login. Optional.
   */
  lastLoginAt?: Date;

  /**
   * Timestamp when the customer record was created.
   */
  createdAt: Date;

  /**
   * Timestamp when the customer record was last updated.
   */
  updatedAt: Date;
}

/**
 * Database model definition for customers.
 * This class maps the E_Customer interface to a database schema using TypeORM decorators.
 * It defines the table structure, columns, and their properties, facilitating
 * interaction with the underlying database.
 */
@Entity('customers') // Specifies the table name in the database
@Unique(['email']) // Ensures that the email address is unique across all customers
export class AB_CustomerModel implements E_Customer {
  /**
   * Unique identifier for the customer.
   * Automatically generated primary key using UUID.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The customer's email address.
   * Must be unique and is used for login and communication.
   * It is a required field.
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  /**
   * The customer's first name. Optional field.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  /**
   * The customer's last name. Optional field.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  /**
   * The current subscription status of the customer.
   * Defines whether they have an active, inactive, trial, or cancelled subscription.
   * Defaults to 'inactive' if not specified.
   */
  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'trial', 'cancelled'],
    default: 'inactive',
    nullable: false,
  })
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';

  /**
   * The ID of the subscription plan the customer is currently on. Optional field.
   * This could be a foreign key referencing a SubscriptionPlan entity.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  subscriptionPlanId?: string;

  /**
   * Timestamp of the customer's last successful login. Optional field.
   */
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  /**
   * Timestamp when the customer record was created.
   * Automatically set upon creation of the entity.
   */
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /**
   * Timestamp when the customer record was last updated.
   * Automatically updated on each save operation.
   */
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  /**
   * Constructor for the AB_CustomerModel.
   * Allows for partial initialization of properties.
   * @param data Optional partial data to initialize the customer model.
   */
  constructor(data?: Partial<E_Customer>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}