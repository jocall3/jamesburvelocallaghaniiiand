import { DataSource, Repository, LessThanOrEqual, Not } from 'typeorm';
import { AK_SubscriptionScheduleModel } from '../models/AK_SubscriptionScheduleModel'; // Adjust path as necessary

/**
 * Data access layer for subscription schedules.
 * Provides methods to interact with the AK_SubscriptionScheduleModel in the database.
 */
export class BK_SubscriptionScheduleRepository {
    private scheduleRepository: Repository<AK_SubscriptionScheduleModel>;

    /**
     * Initializes the repository with a TypeORM DataSource.
     * @param dataSource The TypeORM DataSource instance.
     */
    constructor(dataSource: DataSource) {
        this.scheduleRepository = dataSource.getRepository(AK_SubscriptionScheduleModel);
    }

    /**
     * Creates a new subscription schedule entry in the database.
     * @param scheduleData The partial data for the new schedule.
     * @returns A promise that resolves to the created AK_SubscriptionScheduleModel instance.
     */
    async create(scheduleData: Partial<AK_SubscriptionScheduleModel>): Promise<AK_SubscriptionScheduleModel> {
        const newSchedule = this.scheduleRepository.create(scheduleData);
        return this.scheduleRepository.save(newSchedule);
    }

    /**
     * Finds a subscription schedule by its unique ID.
     * @param id The unique identifier of the subscription schedule.
     * @returns A promise that resolves to the AK_SubscriptionScheduleModel instance if found, otherwise null.
     */
    async findById(id: string): Promise<AK_SubscriptionScheduleModel | null> {
        return this.scheduleRepository.findOne({ where: { id } });
    }

    /**
     * Finds all subscription schedules associated with a specific subscription ID.
     * Schedules are ordered by their scheduled date in ascending order.
     * @param subscriptionId The ID of the parent subscription.
     * @returns A promise that resolves to an array of AK_SubscriptionScheduleModel instances.
     */
    async findBySubscriptionId(subscriptionId: string): Promise<AK_SubscriptionScheduleModel[]> {
        return this.scheduleRepository.find({
            where: { subscriptionId },
            order: { scheduledDate: 'ASC' }
        });
    }

    /**
     * Retrieves all subscription schedules from the database.
     * @returns A promise that resolves to an array of all AK_SubscriptionScheduleModel instances.
     */
    async findAll(): Promise<AK_SubscriptionScheduleModel[]> {
        return this.scheduleRepository.find();
    }

    /**
     * Updates an existing subscription schedule identified by its ID.
     * @param id The unique identifier of the subscription schedule to update.
     * @param updateData The partial data to update in the schedule.
     * @returns A promise that resolves to the updated AK_SubscriptionScheduleModel instance if found and updated, otherwise null.
     */
    async update(id: string, updateData: Partial<AK_SubscriptionScheduleModel>): Promise<AK_SubscriptionScheduleModel | null> {
        const schedule = await this.scheduleRepository.findOne({ where: { id } });
        if (!schedule) {
            return null;
        }
        Object.assign(schedule, updateData);
        return this.scheduleRepository.save(schedule);
    }

    /**
     * Deletes a subscription schedule by its unique ID.
     * @param id The unique identifier of the subscription schedule to delete.
     * @returns A promise that resolves to true if the schedule was deleted, false otherwise.
     */
    async delete(id: string): Promise<boolean> {
        const result = await this.scheduleRepository.delete(id);
        return result.affected === 1;
    }

    /**
     * Finds subscription schedules that are due for payment before or on a specific date,
     * are not yet paid, and are not marked as 'failed'.
     * Schedules are ordered by their scheduled date in ascending order.
     * @param dueDate The date before or on which schedules are considered due.
     * @returns A promise that resolves to an array of AK_SubscriptionScheduleModel instances.
     */
    async findDueSchedules(dueDate: Date): Promise<AK_SubscriptionScheduleModel[]> {
        return this.scheduleRepository.find({
            where: {
                scheduledDate: LessThanOrEqual(dueDate),
                isPaid: false,
                status: Not('failed') // Exclude schedules explicitly marked as failed
            },
            order: { scheduledDate: 'ASC' }
        });
    }

    /**
     * Marks a specific subscription schedule as paid.
     * Sets `isPaid` to true, updates `paymentDate` to the provided date (or current date), and sets status to 'paid'.
     * @param id The ID of the schedule to mark as paid.
     * @param paymentDate The date when the payment was made. Defaults to the current date.
     * @returns A promise that resolves to the updated AK_SubscriptionScheduleModel instance if found and updated, otherwise null.
     */
    async markAsPaid(id: string, paymentDate: Date = new Date()): Promise<AK_SubscriptionScheduleModel | null> {
        return this.update(id, { isPaid: true, paymentDate: paymentDate, status: 'paid' });
    }

    /**
     * Marks a specific subscription schedule as failed.
     * Sets `isPaid` to false and sets status to 'failed'.
     * @param id The ID of the schedule to mark as failed.
     * @returns A promise that resolves to the updated AK_SubscriptionScheduleModel instance if found and updated, otherwise null.
     */
    async markAsFailed(id: string): Promise<AK_SubscriptionScheduleModel | null> {
        return this.update(id, { isPaid: false, status: 'failed' });
    }
}