import { AD_PlanModel, IPlan } from '../models/AD_PlanModel';

/**
 * Data access layer for plans, providing methods to interact with the AD_PlanModel.
 * This repository abstracts the database operations for plan management.
 */
export class BD_PlanRepository {

    /**
     * Creates a new plan in the database.
     * @param planData The data for the new plan.
     * @returns A promise that resolves to the created plan document as a plain object.
     * @throws {Error} If the plan creation fails.
     */
    public async createPlan(planData: Partial<IPlan>): Promise<IPlan> {
        try {
            const newPlan = await AD_PlanModel.create(planData);
            return newPlan.toObject(); // Convert Mongoose document to a plain JavaScript object
        } catch (error) {
            console.error('BD_PlanRepository: Error creating plan:', error);
            throw new Error('Failed to create plan.');
        }
    }

    /**
     * Retrieves a plan by its unique ID.
     * @param id The ID of the plan to retrieve.
     * @returns A promise that resolves to the plan document as a plain object, or null if not found.
     * @throws {Error} If there's a database error during retrieval.
     */
    public async getPlanById(id: string): Promise<IPlan | null> {
        try {
            // .lean() makes Mongoose return a plain JavaScript object instead of a Mongoose Document,
            // which is generally faster for read operations when you don't need Mongoose's full document features.
            const plan = await AD_PlanModel.findById(id).lean();
            return plan;
        } catch (error) {
            console.error(`BD_PlanRepository: Error getting plan by ID ${id}:`, error);
            throw new Error(`Failed to retrieve plan with ID ${id}.`);
        }
    }

    /**
     * Retrieves all plans from the database.
     * @returns A promise that resolves to an array of plan documents as plain objects.
     * @throws {Error} If there's a database error during retrieval.
     */
    public async getAllPlans(): Promise<IPlan[]> {
        try {
            const plans = await AD_PlanModel.find({}).lean();
            return plans;
        } catch (error) {
            console.error('BD_PlanRepository: Error getting all plans:', error);
            throw new Error('Failed to retrieve all plans.');
        }
    }

    /**
     * Retrieves a plan by its name.
     * @param name The name of the plan to retrieve.
     * @returns A promise that resolves to the plan document as a plain object, or null if not found.
     * @throws {Error} If there's a database error during retrieval.
     */
    public async getPlanByName(name: string): Promise<IPlan | null> {
        try {
            const plan = await AD_PlanModel.findOne({ name }).lean();
            return plan;
        } catch (error) {
            console.error(`BD_PlanRepository: Error getting plan by name "${name}":`, error);
            throw new Error(`Failed to retrieve plan with name "${name}".`);
        }
    }

    /**
     * Updates an existing plan by its ID.
     * @param id The ID of the plan to update.
     * @param planData The data to update the plan with.
     * @returns A promise that resolves to the updated plan document as a plain object, or null if not found.
     * @throws {Error} If the plan update fails.
     */
    public async updatePlan(id: string, planData: Partial<IPlan>): Promise<IPlan | null> {
        try {
            const updatedPlan = await AD_PlanModel.findByIdAndUpdate(
                id,
                { $set: planData }, // Use $set to update specific fields
                { new: true, runValidators: true } // Return the new document, run schema validators
            ).lean();
            return updatedPlan;
        } catch (error) {
            console.error(`BD_PlanRepository: Error updating plan with ID ${id}:`, error);
            throw new Error(`Failed to update plan with ID ${id}.`);
        }
    }

    /**
     * Deletes a plan by its ID.
     * @param id The ID of the plan to delete.
     * @returns A promise that resolves to true if the plan was deleted, false otherwise.
     * @throws {Error} If the plan deletion fails.
     */
    public async deletePlan(id: string): Promise<boolean> {
        try {
            const result = await AD_PlanModel.findByIdAndDelete(id);
            return result !== null; // If result is null, the document was not found/deleted
        } catch (error) {
            console.error(`BD_PlanRepository: Error deleting plan with ID ${id}:`, error);
            throw new Error(`Failed to delete plan with ID ${id}.`);
        }
    }
}