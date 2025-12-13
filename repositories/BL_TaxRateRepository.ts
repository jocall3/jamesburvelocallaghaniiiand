import { AL_TaxRateModel } from '../models/AL_TaxRateModel';
import { ITaxRate } from '../interfaces/ITaxRate';

/**
 * Data access layer for tax rates, providing methods to interact with the AL_TaxRateModel.
 */
export class BL_TaxRateRepository {
  /**
   * Retrieves all tax rates from the database.
   * @returns A promise that resolves to an array of ITaxRate objects.
   */
  public async getAllTaxRates(): Promise<ITaxRate[]> {
    try {
      const taxRates = await AL_TaxRateModel.findAll();
      return taxRates.map(rate => rate.toJSON());
    } catch (error) {
      console.error('Error fetching all tax rates:', error);
      throw error;
    }
  }

  /**
   * Retrieves a specific tax rate by its ID.
   * @param id The ID of the tax rate to retrieve.
   * @returns A promise that resolves to the ITaxRate object, or null if not found.
   */
  public async getTaxRateById(id: number): Promise<ITaxRate | null> {
    try {
      const taxRate = await AL_TaxRateModel.findByPk(id);
      return taxRate ? taxRate.toJSON() : null;
    } catch (error) {
      console.error(`Error fetching tax rate with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new tax rate.
   * @param taxRateData The data for the new tax rate.
   * @returns A promise that resolves to the created ITaxRate object.
   */
  public async createTaxRate(taxRateData: Omit<ITaxRate, 'id'>): Promise<ITaxRate> {
    try {
      const newTaxRate = await AL_TaxRateModel.create(taxRateData);
      return newTaxRate.toJSON();
    } catch (error) {
      console.error('Error creating tax rate:', error);
      throw error;
    }
  }

  /**
   * Updates an existing tax rate.
   * @param id The ID of the tax rate to update.
   * @param taxRateData The updated data for the tax rate.
   * @returns A promise that resolves to the updated ITaxRate object, or null if not found.
   */
  public async updateTaxRate(id: number, taxRateData: Partial<ITaxRate>): Promise<ITaxRate | null> {
    try {
      const taxRate = await AL_TaxRateModel.findByPk(id);
      if (!taxRate) {
        return null;
      }
      await taxRate.update(taxRateData);
      return taxRate.toJSON();
    } catch (error) {
      console.error(`Error updating tax rate with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a tax rate by its ID.
   * @param id The ID of the tax rate to delete.
   * @returns A promise that resolves to a boolean indicating success or failure.
   */
  public async deleteTaxRate(id: number): Promise<boolean> {
    try {
      const deletedCount = await AL_TaxRateModel.destroy({ where: { id } });
      return deletedCount > 0;
    } catch (error) {
      console.error(`Error deleting tax rate with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves tax rates by country code.
   * @param countryCode The country code to filter by.
   * @returns A promise that resolves to an array of ITaxRate objects.
   */
  public async getTaxRatesByCountry(countryCode: string): Promise<ITaxRate[]> {
    try {
      const taxRates = await AL_TaxRateModel.findAll({ where: { countryCode } });
      return taxRates.map(rate => rate.toJSON());
    } catch (error) {
      console.error(`Error fetching tax rates for country ${countryCode}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves tax rates by region (e.g., state, province).
   * @param region The region to filter by.
   * @returns A promise that resolves to an array of ITaxRate objects.
   */
  public async getTaxRatesByRegion(region: string): Promise<ITaxRate[]> {
    try {
      const taxRates = await AL_TaxRateModel.findAll({ where: { region } });
      return taxRates.map(rate => rate.toJSON());
    } catch (error) {
      console.error(`Error fetching tax rates for region ${region}:`, error);
      throw error;
    }
  }
}