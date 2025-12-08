import { v4 as uuidv4 } from 'uuid';

/**
 * Supported entity types within the system that can have Drive files attached.
 * This aligns with the project goals of handling workflows, operations, and APIs.
 */
export type EntityType = 
  | 'workflow' 
  | 'operation' 
  | 'project' 
  | 'api_definition' 
  | 'script_pre' 
  | 'script_post' 
  | 'github_repo';

/**
 * Represents the link between an internal system entity and a Google Drive file.
 */
export interface DriveFileLink {
  id: string;
  entityType: EntityType;
  entityId: string;
  driveFileId: string;
  driveWebViewLink?: string;
  mimeType?: string;
  fileName?: string;
  createdByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface for the persistence layer handling file links.
 * Allows for swapping between in-memory, SQL, or NoSQL implementations.
 */
export interface ILinkRepository {
  create(link: DriveFileLink): Promise<DriveFileLink>;
  findByEntity(entityType: EntityType, entityId: string): Promise<DriveFileLink[]>;
  findByDriveId(driveFileId: string): Promise<DriveFileLink | null>;
  delete(id: string): Promise<boolean>;
  deleteByDriveId(driveFileId: string): Promise<boolean>;
  update(id: string, updates: Partial<DriveFileLink>): Promise<DriveFileLink | null>;
}

/**
 * In-memory implementation of the repository for rapid prototyping and testing.
 * In a production environment with persistent storage requirements, 
 * this should be replaced by a database-backed implementation (e.g., TypeORM, Prisma).
 */
class InMemoryLinkRepository implements ILinkRepository {
  private storage: Map<string, DriveFileLink> = new Map();

  async create(link: DriveFileLink): Promise<DriveFileLink> {
    this.storage.set(link.id, link);
    return link;
  }

  async findByEntity(entityType: EntityType, entityId: string): Promise<DriveFileLink[]> {
    return Array.from(this.storage.values()).filter(
      (link) => link.entityType === entityType && link.entityId === entityId
    );
  }

  async findByDriveId(driveFileId: string): Promise<DriveFileLink | null> {
    for (const link of this.storage.values()) {
      if (link.driveFileId === driveFileId) return link;
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async deleteByDriveId(driveFileId: string): Promise<boolean> {
    let idToDelete: string | null = null;
    for (const link of this.storage.values()) {
      if (link.driveFileId === driveFileId) {
        idToDelete = link.id;
        break;
      }
    }
    if (idToDelete) {
      return this.storage.delete(idToDelete);
    }
    return false;
  }

  async update(id: string, updates: Partial<DriveFileLink>): Promise<DriveFileLink | null> {
    const existing = this.storage.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.storage.set(id, updated);
    return updated;
  }
}

/**
 * Service to create associations between Google Drive file IDs and internal system entities.
 * Facilitates attaching documentation, OpenAPI specs, and logs to Workflows and Operations.
 */
export class DriveFileLinker {
  private repository: ILinkRepository;

  constructor(repository?: ILinkRepository) {
    this.repository = repository || new InMemoryLinkRepository();
  }

  /**
   * Creates a link between a Google Drive file and an internal entity.
   * 
   * @param entityType The type of the internal entity (e.g., 'workflow').
   * @param entityId The unique identifier of the internal entity.
   * @param fileInfo Information about the Drive file being linked.
   * @param userId Optional ID of the user performing the action (for audit trails).
   */
  public async linkFile(
    entityType: EntityType,
    entityId: string,
    fileInfo: {
      driveFileId: string;
      driveWebViewLink?: string;
      mimeType?: string;
      fileName?: string;
      metadata?: Record<string, any>;
    },
    userId?: string
  ): Promise<DriveFileLink> {
    if (!entityId || !fileInfo.driveFileId) {
      throw new Error('Entity ID and Drive File ID are required to create a link.');
    }

    // Check for existing link to avoid duplicates
    const existing = await this.repository.findByDriveId(fileInfo.driveFileId);
    if (existing && existing.entityId === entityId && existing.entityType === entityType) {
      // Update existing link with new metadata if provided
      if (fileInfo.metadata || fileInfo.driveWebViewLink) {
        return (await this.repository.update(existing.id, {
          driveWebViewLink: fileInfo.driveWebViewLink || existing.driveWebViewLink,
          metadata: { ...existing.metadata, ...fileInfo.metadata },
          fileName: fileInfo.fileName || existing.fileName,
          mimeType: fileInfo.mimeType || existing.mimeType
        })) as DriveFileLink;
      }
      return existing;
    }

    const newLink: DriveFileLink = {
      id: uuidv4(),
      entityType,
      entityId,
      driveFileId: fileInfo.driveFileId,
      driveWebViewLink: fileInfo.driveWebViewLink,
      mimeType: fileInfo.mimeType,
      fileName: fileInfo.fileName,
      createdByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: fileInfo.metadata || {},
    };

    const created = await this.repository.create(newLink);
    // In a real app, we might emit an event here like 'file.linked'
    return created;
  }

  /**
   * Retrieves all Drive files associated with a specific entity.
   * Useful for populating UI lists of attachments for a Workflow or API Definition.
   */
  public async getFilesForEntity(entityType: EntityType, entityId: string): Promise<DriveFileLink[]> {
    return this.repository.findByEntity(entityType, entityId);
  }

  /**
   * Retrieves the internal link details for a specific Drive File ID.
   */
  public async getLinkDetails(driveFileId: string): Promise<DriveFileLink | null> {
    return this.repository.findByDriveId(driveFileId);
  }

  /**
   * Removes the association between a Drive file and the internal system.
   * This does NOT delete the file from Google Drive, only the reference in this system.
   */
  public async unlinkFile(driveFileId: string): Promise<boolean> {
    return this.repository.deleteByDriveId(driveFileId);
  }

  /**
   * Removes all file associations for a specific entity.
   * Should be called when an entity (like a Workflow) is deleted.
   */
  public async unlinkAllForEntity(entityType: EntityType, entityId: string): Promise<void> {
    const links = await this.repository.findByEntity(entityType, entityId);
    for (const link of links) {
      await this.repository.delete(link.id);
    }
  }

  /**
   * Batch links multiple files to a single entity.
   */
  public async batchLinkFiles(
    entityType: EntityType,
    entityId: string,
    files: Array<{ 
      driveFileId: string; 
      driveWebViewLink?: string; 
      mimeType?: string; 
      fileName?: string;
      metadata?: Record<string, any> 
    }>,
    userId?: string
  ): Promise<DriveFileLink[]> {
    const results: DriveFileLink[] = [];
    const errors: any[] = [];

    for (const file of files) {
      try {
        const link = await this.linkFile(entityType, entityId, file, userId);
        results.push(link);
      } catch (error) {
        errors.push({ fileId: file.driveFileId, error });
      }
    }

    if (errors.length > 0) {
      console.error(`[DriveFileLinker] Encountered ${errors.length} errors during batch link.`, errors);
    }

    return results;
  }
}

// Export singleton instance
export const driveFileLinker = new DriveFileLinker();