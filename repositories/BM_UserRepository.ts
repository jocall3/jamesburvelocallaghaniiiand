import { AM_UserModel } from '../models/AM_UserModel';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

/**
 * Data access layer for users.
 * Provides methods to interact with user data, abstracting the underlying storage mechanism.
 *
 * This implementation uses an in-memory store for demonstration purposes.
 * In a production environment, this would interact with a database (e.g., PostgreSQL, MongoDB)
 * via an ORM/ODM (e.g., TypeORM, Prisma, Mongoose).
 */
export class BM_UserRepository {
  // In-memory store for demonstration. Replace with actual database client.
  private users: AM_UserModel[] = [];

  constructor() {
    // In a real application, you might inject a database client here.
    // e.g., constructor(private dbClient: DatabaseClient) {}
  }

  /**
   * Creates a new user record in the data store.
   * @param userData Partial user data to create the user.
   * @returns A promise that resolves with the created user model.
   */
  public async create(userData: Partial<AM_UserModel>): Promise<AM_UserModel> {
    const now = new Date();
    const newUser: AM_UserModel = {
      id: uuidv4(),
      email: userData.email!, // Assuming email is always provided for creation
      passwordHash: userData.passwordHash!, // Assuming passwordHash is always provided
      username: userData.username || null,
      createdAt: now,
      updatedAt: now,
      // Add other default fields or validation as necessary
      ...userData, // Overwrite defaults with provided data
    };

    // In a real application, this would be a database insert operation.
    this.users.push(newUser);
    return newUser;
  }

  /**
   * Finds a user by their unique ID.
   * @param id The unique identifier of the user.
   * @returns A promise that resolves with the user model if found, otherwise null.
   */
  public async findById(id: string): Promise<AM_UserModel | null> {
    // In a real application, this would be a database query by ID.
    const user = this.users.find(u => u.id === id);
    return user || null;
  }

  /**
   * Finds a user by their email address.
   * @param email The email address of the user.
   * @returns A promise that resolves with the user model if found, otherwise null.
   */
  public async findByEmail(email: string): Promise<AM_UserModel | null> {
    // In a real application, this would be a database query by email.
    const user = this.users.find(u => u.email === email);
    return user || null;
  }

  /**
   * Retrieves all user records.
   * @returns A promise that resolves with an array of all user models.
   */
  public async findAll(): Promise<AM_UserModel[]> {
    // In a real application, this would be a database query to fetch all users.
    return [...this.users]; // Return a copy to prevent external modification of the internal array
  }

  /**
   * Updates an existing user record.
   * @param id The unique identifier of the user to update.
   * @param updates Partial user data containing the fields to update.
   * @returns A promise that resolves with the updated user model if found, otherwise null.
   */
  public async update(id: string, updates: Partial<AM_UserModel>): Promise<AM_UserModel | null> {
    const userIndex = this.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return null;
    }

    const existingUser = this.users[userIndex];
    const updatedUser: AM_UserModel = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(), // Always update the updatedAt timestamp
      id: existingUser.id, // Ensure ID is not changed
      createdAt: existingUser.createdAt, // Ensure createdAt is not changed
    };

    // In a real application, this would be a database update operation.
    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  /**
   * Deletes a user record by their unique ID.
   * @param id The unique identifier of the user to delete.
   * @returns A promise that resolves with true if the user was deleted, otherwise false.
   */
  public async delete(id: string): Promise<boolean> {
    const initialLength = this.users.length;
    // In a real application, this would be a database delete operation.
    this.users = this.users.filter(u => u.id !== id);
    return this.users.length < initialLength;
  }
}