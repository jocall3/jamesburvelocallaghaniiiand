import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Define the types based on the OpenAPI specification
interface FileDetail {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string; // ISO 8601 date-time string
}

interface GetProjectFilesResponse {
  name: string;
  files: FileDetail[];
}

interface ProjectDetailParams {
  projectId: string;
}

// Mock API client for demonstration purposes.
// In a real application, this would be a proper client generated from the OpenAPI spec.
const figmaApiClient = {
  getProjectFiles: (projectId: string): Promise<GetProjectFilesResponse> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (projectId === '12345') { // Example project ID
          resolve({
            name: 'My Design System Project',
            files: [
              {
                key: 'filekey1',
                name: 'Main Design Library',
                thumbnail_url: 'https://via.placeholder.com/200x150/FF6347/FFFFFF?text=Lib',
                last_modified: '2023-10-26T10:30:00Z',
              },
              {
                key: 'filekey2',
                name: 'Website Redesign Mockups',
                thumbnail_url: 'https://via.placeholder.com/200x150/4682B4/FFFFFF?text=Web',
                last_modified: '2023-10-25T15:00:00Z',
              },
              {
                key: 'filekey3',
                name: 'Mobile App Wireframes',
                thumbnail_url: 'https://via.placeholder.com/200x150/32CD32/FFFFFF?text=App',
                last_modified: '2023-10-24T09:45:00Z',
              },
              {
                key: 'filekey4',
                name: 'Marketing Banners',
                thumbnail_url: 'https://via.placeholder.com/200x150/DAA520/FFFFFF?text=Mkt',
                last_modified: '2023-10-23T11:00:00Z',
              },
            ],
          });
        } else if (projectId === 'error123') { // Example error state
          reject(new Error('Failed to load project files due to an API error.'));
        } else {
          reject(new Error('Project not found. Please check the ID.'));
        }
      }, 1000); // Simulate network delay
    });
  },
};

const ProjectDetailView: React.FC = () => {
  const { projectId } = useParams<ProjectDetailParams>();
  const [projectData, setProjectData] = useState<GetProjectFilesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setError('Project ID is missing from the URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setProjectData(null); // Clear previous data when project ID changes

    figmaApiClient.getProjectFiles(projectId)
      .then(response => {
        setProjectData(response);
      })
      .catch(err => {
        console.error("Error fetching project files:", err);
        setError(err.message || 'An unexpected error occurred while fetching project details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]); // Re-fetch data if projectId changes

  const formatLastModifiedDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-gray-600">Loading project files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-red-600 font-semibold">Error: {error}</p>
      </div>
    );
  }

  if (!projectData || projectData.files.length === 0) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Project: {projectData?.name || 'Unknown Project'}</h1>
        <p className="text-lg text-gray-600">No files found for this project.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 border-b-2 border-indigo-500 pb-2">
        Project: {projectData.name}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {projectData.files.map((file) => (
          <div
            key={file.key}
            className="bg-white rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
          >
            <a
              href={`https://www.figma.com/file/${file.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={file.thumbnail_url}
                alt={`Thumbnail for ${file.name}`}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-5">
                <h2 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                  {file.name}
                </h2>
                <p className="text-sm text-gray-600">
                  Last Modified: {formatLastModifiedDate(file.last_modified)}
                </p>
              </div>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectDetailView;