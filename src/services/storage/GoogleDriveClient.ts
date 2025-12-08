import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Readable } from 'stream';

/**
 * Custom error class for Google Drive API interactions.
 */
export class GoogleDriveError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'GoogleDriveError';
  }
}

/**
 * Represents the response from listing files.
 */
export interface ListFilesResponse {
  files: drive_v3.Schema$File[];
  nextPageToken?: string | null;
}

/**
 * Options for uploading a file.
 */
export interface UploadFileOptions {
  /** The name of the file to be created in Google Drive. */
  fileName: string;
  /** The MIME type of the file. */
  mimeType: string;
  /** The content of the file, as a Readable stream or a string. */
  content: Readable | string;
  /** The ID of the parent folder. If not provided, the file is uploaded to the root. */
  parentFolderId?: string;
}

/**
 * Client for the Google Drive API.
 * Handles authentication, file listing, uploading, downloading, and linking files
 * to the application's internal projects using appProperties.
 */
export class GoogleDriveClient {
  private readonly drive: drive_v3.Drive;
  private static readonly APP_FOLDER_NAME = 'OpenAPI_Project_Generator_Files';
  private static readonly DEFAULT_FIELDS = 'id, name, mimeType, modifiedTime, webViewLink, parents, appProperties';

  /**
   * Creates an instance of the GoogleDriveClient.
   * @param auth - An authenticated OAuth2Client instance with the 'https://www.googleapis.com/auth/drive' scope.
   */
  constructor(auth: OAuth2Client) {
    if (!auth) {
      throw new GoogleDriveError('OAuth2Client is required for GoogleDriveClient.');
    }
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * Handles API errors, wrapping them in a custom error type.
   * @param error - The error caught from the googleapis library.
   * @param context - A string describing the operation that failed.
   * @throws {GoogleDriveError}
   */
  private handleError(error: any, context: string): never {
    const message = error.response?.data?.error?.message || error.message || 'An unknown error occurred';
    throw new GoogleDriveError(`Failed to ${context}: ${message}`, error);
  }

  /**
   * Finds the dedicated application folder, creating it if it doesn't exist.
   * This helps keep the user's root Drive folder clean.
   * @returns The ID of the application folder.
   */
  public async findOrCreateAppFolder(): Promise<string> {
    try {
      const query = `mimeType='application/vnd.google-apps.folder' and name='${GoogleDriveClient.APP_FOLDER_NAME}' and trashed=false`;
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id)',
        spaces: 'drive',
      });

      if (response.data.files && response.data.files.length > 0 && response.data.files[0].id) {
        return response.data.files[0].id;
      }

      const fileMetadata = {
        name: GoogleDriveClient.APP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const newFolder = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      if (!newFolder.data.id) {
        throw new Error('Failed to retrieve ID for newly created app folder.');
      }
      return newFolder.data.id;
    } catch (error) {
      this.handleError(error, 'find or create app folder');
    }
  }

  /**
   * Lists files in the user's Google Drive.
   * @param query - An optional Google Drive API query string to filter files.
   * @param pageSize - The number of files to return per page.
   * @param pageToken - The token for the next page of results.
   * @returns A promise that resolves to a list of files and a potential next page token.
   */
  public async listFiles(query?: string, pageSize = 100, pageToken?: string): Promise<ListFilesResponse> {
    try {
      const response = await this.drive.files.list({
        q: query,
        pageSize,
        pageToken,
        fields: `nextPageToken, files(${GoogleDriveClient.DEFAULT_FIELDS})`,
        spaces: 'drive',
      });
      return {
        files: response.data.files || [],
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      this.handleError(error, 'list files');
    }
  }

  /**
   * Uploads a file to Google Drive.
   * @param options - The options for the file upload.
   * @returns A promise that resolves to the metadata of the created file.
   */
  public async uploadFile(options: UploadFileOptions): Promise<drive_v3.Schema$File> {
    const { fileName, mimeType, content, parentFolderId } = options;
    try {
      const fileMetadata: drive_v3.Schema$File = {
        name: fileName,
        parents: parentFolderId ? [parentFolderId] : [],
      };

      const media = {
        mimeType: mimeType,
        body: content,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: GoogleDriveClient.DEFAULT_FIELDS,
      });

      return response.data;
    } catch (error) {
      this.handleError(error, `upload file '${fileName}'`);
    }
  }

  /**
   * Downloads a file from Google Drive.
   * Note: For Google Docs, Sheets, and Slides, this will export the file to a specified format.
   * @param fileId - The ID of the file to download.
   * @param exportMimeType - The MIME type to export to (e.g., 'application/pdf' for a Google Doc). Required for Google Workspace files.
   * @returns A promise that resolves to a Readable stream of the file's content.
   */
  public async downloadFile(fileId: string, exportMimeType?: string): Promise<Readable> {
    try {
      // First, get metadata to check if it's a Google Workspace file type
      const meta = await this.getFileMetadata(fileId);
      const isGoogleWorkspaceFile = meta.mimeType?.startsWith('application/vnd.google-apps');

      if (isGoogleWorkspaceFile) {
        if (!exportMimeType) {
          throw new GoogleDriveError('An export MIME type is required to download Google Workspace files.');
        }
        const response = await this.drive.files.export(
          { fileId, mimeType: exportMimeType },
          { responseType: 'stream' }
        );
        return response.data as Readable;
      } else {
        const response = await this.drive.files.get(
          { fileId, alt: 'media' },
          { responseType: 'stream' }
        );
        return response.data as Readable;
      }
    } catch (error) {
      this.handleError(error, `download file with ID '${fileId}'`);
    }
  }

  /**
   * Retrieves the metadata for a specific file.
   * @param fileId - The ID of the file.
   * @returns A promise that resolves to the file's metadata.
   */
  public async getFileMetadata(fileId: string): Promise<drive_v3.Schema$File> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: '*', // Get all fields for detailed metadata
      });
      return response.data;
    } catch (error) {
      this.handleError(error, `get metadata for file ID '${fileId}'`);
    }
  }

  /**
   * Links a Google Drive file to an internal project ID by setting a custom app property.
   * This property is only visible to this application.
   * @param fileId - The ID of the file in Google Drive.
   * @param projectId - The internal project ID to associate with the file.
   */
  public async linkFileToProject(fileId: string, projectId: string): Promise<void> {
    try {
      await this.drive.files.update({
        fileId,
        requestBody: {
          appProperties: {
            projectId: projectId,
          },
        },
      });
    } catch (error) {
      this.handleError(error, `link file '${fileId}' to project '${projectId}'`);
    }
  }

  /**
   * Finds all files in Google Drive associated with a specific internal project ID.
   * @param projectId - The internal project ID to search for.
   * @returns A promise that resolves to an array of file metadata objects.
   */
  public async findFilesForProject(projectId: string): Promise<drive_v3.Schema$File[]> {
    try {
      const query = `appProperties has { key='projectId' and value='${projectId}' } and trashed=false`;
      const response = await this.drive.files.list({
        q: query,
        fields: `files(${GoogleDriveClient.DEFAULT_FIELDS})`,
        spaces: 'drive',
      });
      return response.data.files || [];
    } catch (error) {
      this.handleError(error, `find files for project '${projectId}'`);
    }
  }
}