export abstract class Thing {
  /**
   * A unique identifier for the thing, typically a GUID.
   */
  id: string;

  /**
   * The name of the thing.
   */
  name: string;

  /**
   * A brief description of the thing.
   */
  description: string;

  /**
   * Indicates whether the thing is visible to the user.
   */
  userVisible: boolean;

  /**
   * Creates an instance of Thing.
   * @param id A unique identifier for the thing.
   * @param name The name of the thing.
   * @param description A brief description of the thing.
   * @param userVisible Indicates whether the thing is visible to the user. Defaults to true.
   */
  constructor(id: string, name: string, description: string, userVisible: boolean = true) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.userVisible = userVisible;
  }
}