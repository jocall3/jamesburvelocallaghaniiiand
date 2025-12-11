import React, { useState, useEffect } from 'react';

// Define interfaces based on the OpenAPI specification
interface Project {
  id: string;
  name: string;
}

interface GetTeamProjectsResponse {
  name: string;
  projects: Project[];
}

interface ProjectBrowserProps {
  teamId?: string; // Optional teamId prop
  personalAccessToken: string; // Figma Personal Access Token
  onProjectSelect?: (projectId: string) => void;
}

const API_BASE_URL = 'https://api.figma.com';

const ProjectBrowser: React.FC<ProjectBrowserProps> = ({ teamId, personalAccessToken, onProjectSelect }) => {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!teamId) {
        setProjects(null);
        setTeamName(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      setProjects(null);
      setTeamName(null);

      try {
        const response = await fetch(`${API_BASE_URL}/v1/teams/${teamId}/projects`, {
          headers: {
            'X-Figma-Token': personalAccessToken,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.err || errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data: GetTeamProjectsResponse = await response.json();
        setTeamName(data.name);
        setProjects(data.projects);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch projects');
        console.error('Error fetching Figma projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [teamId, personalAccessToken]);

  if (!teamId) {
    return (
      <div style={styles.container}>
        <p style={styles.message}>Please select a team to view its projects.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.message}>Loading projects for team "{teamId}"...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.errorMessage}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {teamName && <h2 style={styles.header}>Projects in Team: {teamName}</h2>}
      {projects && projects.length > 0 ? (
        <div style={styles.projectGrid}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={styles.projectCard}
              onClick={() => onProjectSelect && onProjectSelect(project.id)}
            >
              <h3 style={styles.projectTitle}>{project.name}</h3>
              <p style={styles.projectId}>ID: {project.id}</p>
            </div>
          ))}
        </div>
      ) : (
        <p style={styles.message}>No projects found for this team.</p>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    fontSize: '2em',
    marginBottom: '20px',
    color: '#ffffff',
    borderBottom: '1px solid #333',
    paddingBottom: '10px',
  },
  message: {
    fontSize: '1.2em',
    color: '#cccccc',
  },
  errorMessage: {
    fontSize: '1.2em',
    color: '#ff6b6b',
    fontWeight: 'bold',
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  projectCard: {
    backgroundColor: '#282828',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
    },
  },
  projectTitle: {
    fontSize: '1.4em',
    margin: '0 0 10px 0',
    color: '#8be9fd', // Light blue for titles
  },
  projectId: {
    fontSize: '0.9em',
    color: '#a0a0a0',
  },
};

export default ProjectBrowser;