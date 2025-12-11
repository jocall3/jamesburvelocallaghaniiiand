import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Assuming these types and figmaApiClient are defined in a separate API client file, e.g., 'src/api/figma.ts'
// import { ProjectFile, GetProjectFilesResponse, figmaApiClient } from '../../api/figma';

// Placeholder for ProjectFile type, assuming it's defined elsewhere
interface ProjectFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string; // ISO 8601 date-time
}

// Placeholder for GetProjectFilesResponse type, assuming it's defined elsewhere
interface GetProjectFilesResponse {
  name?: string; // Project name
  files?: ProjectFile[];
  error?: boolean;
  status?: number;
  message?: string;
  err?: string; // For some error response types
}

// Placeholder for figmaApiClient, assuming it's an instantiated API client
// In a real application, this would be an actual import.
const figmaApiClient = {
  getProjectFiles: async (projectId: string, authToken: string): Promise<GetProjectFilesResponse> => {
    // This is a mock implementation for demonstration purposes.
    // In a real application, this would make an actual HTTP request to the Figma API.
    console.log(`[Mock API] Fetching files for project: ${projectId} with token: ${authToken ? authToken.substring(0, 5) + '...' : 'none'}`);
    return new Promise(resolve => {
      setTimeout(() => {
        if (!authToken || authToken === 'invalid') {
            resolve({ error: true, status: 401, message: 'Unauthorized: Invalid or missing token.' });
            return;
        }
        if (projectId === 'proj123') {
          resolve({
            name: 'My Awesome Project',
            files: [
              { key: 'fileA', name: 'Design System V1', thumbnail_url: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=DS1', last_modified: '2023-10-26T10:00:00Z' },
              { key: 'fileB', name: 'Homepage Redesign', thumbnail_url: 'https://via.placeholder.com/150/00FF00/FFFFFF?text=HP_Redesign', last_modified: '2023-10-25T14:30:00Z' },
              { key: 'fileC', name: 'Mobile App Flow', thumbnail_url: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=MobileApp', last_modified: '2023-10-24T09:00:00Z' },
              { key: 'fileD', name: 'Component Library', thumbnail_url: 'https://via.placeholder.com/150/FFFF00/000000?text=CompLib', last_modified: '2023-10-23T11:00:00Z' },
              { key: 'fileE', name: 'Website Mockups', thumbnail_url: 'https://via.placeholder.com/150/FF00FF/FFFFFF?text=Website', last_modified: '2023-10-22T16:00:00Z' },
              { key: 'fileF', name: 'Landing Page v2', thumbnail_url: 'https://via.placeholder.com/150/00FFFF/000000?text=LP_v2', last_modified: '2023-10-21T18:00:00Z' },
            ],
          });
        } else if (projectId === 'proj404') {
            resolve({
                error: true,
                status: 404,
                message: 'Project not found.'
            });
        } else {
          resolve({
            name: 'Empty Project',
            files: [],
          });
        }
      }, 800);
    });
  },
};


interface FileBrowserProps {
  projectId: string;
  authToken: string; // Authentication token for Figma API calls
  onFileSelect?: (fileKey: string) => void;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ projectId, authToken, onFileSelect }) => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFiles([]); // Clear previous files
    setProjectName(''); // Clear previous project name

    if (!projectId) {
      setError('Project ID is required.');
      setLoading(false);
      return;
    }
    if (!authToken) {
      setError('Authentication token is required.');
      setLoading(false);
      return;
    }

    try {
      const response = await figmaApiClient.getProjectFiles(projectId, authToken);
      if (response.error) {
        setError(response.message || response.err || `Failed with status ${response.status || 'unknown'}.`);
      } else {
        setFiles(response.files || []);
        setProjectName(response.name || `Project ${projectId}`);
      }
    } catch (err) {
      console.error("Error fetching project files:", err);
      setError('An unexpected error occurred while fetching project files.');
    } finally {
      setLoading(false);
    }
  }, [projectId, authToken]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) {
      return files;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return files.filter(file =>
      file.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [files, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFileClick = (fileKey: string) => {
    if (onFileSelect) {
      onFileSelect(fileKey);
    }
    console.log(`File with key "${fileKey}" clicked.`);
  };

  return (
    <div className="figma-file-browser">
      <h2>{projectName || 'Project Files'}</h2>

      <input
        type="text"
        placeholder="Search files..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="figma-file-browser__search-input"
        disabled={loading}
      />

      {loading && <div className="figma-file-browser__message">Loading files...</div>}
      {error && <div className="figma-file-browser__error">Error: {error}</div>}

      {!loading && !error && filteredFiles.length === 0 && (
        <div className="figma-file-browser__message">
          {searchTerm ? `No files match "${searchTerm}".` : 'No files found in this project.'}
        </div>
      )}

      {!loading && !error && filteredFiles.length > 0 && (
        <div className="figma-file-browser__file-list">
          {filteredFiles.map(file => (
            <div
              key={file.key}
              className="figma-file-browser__file-card"
              onClick={() => handleFileClick(file.key)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter') handleFileClick(file.key); }}
            >
              <img src={file.thumbnail_url} alt={`Thumbnail for ${file.name}`} className="figma-file-browser__file-thumbnail" />
              <div className="figma-file-browser__file-details">
                <h3 className="figma-file-browser__file-name">{file.name}</h3>
                <p className="figma-file-browser__file-last-modified">
                  Last modified: {new Date(file.last_modified).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileBrowser;