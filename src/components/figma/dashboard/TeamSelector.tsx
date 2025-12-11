import React, { useState, useEffect, useCallback } from 'react';

// Define a type for a Figma team, based on typical API object structures.
// The Figma API does not directly expose an endpoint to list all teams for a user.
// In a real application, you might obtain team IDs from user configuration,
// or other parts of the Figma ecosystem. For this component, we'll use mock data.
interface Team {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  /**
   * Callback function to be called when a team is selected.
   * `teamId` will be `null` if no teams are available.
   */
  onTeamSelect: (teamId: string | null) => void;
  /**
   * The ID of the team that should be pre-selected when the component loads.
   * If not provided, or if the ID is not found, the first available team will be selected.
   */
  initialSelectedTeamId?: string;
  /**
   * Optional: A list of teams to display. If not provided, mock data will be used.
   * In a real application, this would likely come from an API call or a global state.
   */
  teams?: Team[];
}

// Mock data for demonstration purposes, as there is no direct API endpoint
// in the provided OpenAPI spec to list all teams a user belongs to.
const MOCK_TEAMS: Team[] = [
  { id: '12345', name: 'Acme Inc. Design Team' },
  { id: '67890', name: 'Product Engineering' },
  { id: '11223', name: 'Marketing Assets Library' },
];

/**
 * A dropdown or list component for users to select their active Figma team.
 * This component handles fetching teams (using mock data or provided props),
 * managing selection state, and communicating the selected team to a parent component.
 */
const TeamSelector: React.FC<TeamSelectorProps> = ({ onTeamSelect, initialSelectedTeamId, teams: propTeams }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(initialSelectedTeamId || null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the API call simulation or actual fetch to prevent unnecessary re-renders
  const fetchTeams = useCallback(async (): Promise<Team[]> => {
    if (propTeams) {
      return propTeams;
    }
    // Simulate API call delay for mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_TEAMS);
      }, 500);
    });
  }, [propTeams]);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        const fetchedTeams = await fetchTeams();
        setTeams(fetchedTeams);

        let newSelectedTeamId: string | null = null;
        if (initialSelectedTeamId && fetchedTeams.some(team => team.id === initialSelectedTeamId)) {
          newSelectedTeamId = initialSelectedTeamId;
        } else if (fetchedTeams.length > 0) {
          newSelectedTeamId = fetchedTeams[0].id;
        }

        setSelectedTeamId(newSelectedTeamId);
        onTeamSelect(newSelectedTeamId);

      } catch (err) {
        setError('Failed to load Figma teams. Please check your network or API access.');
        console.error('Error fetching Figma teams:', err);
        onTeamSelect(null); // Indicate no team could be selected due to error
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
    // `fetchTeams` is memoized, `onTeamSelect` is a prop callback.
    // `initialSelectedTeamId` is a primitive, safe to include.
  }, [fetchTeams, onTeamSelect, initialSelectedTeamId]);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTeamId = event.target.value;
    setSelectedTeamId(newTeamId);
    onTeamSelect(newTeamId);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
        <label htmlFor="team-select" className="block text-sm font-medium text-gray-700">Select Figma Team:</label>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
        <p className="text-sm text-gray-500">Loading teams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 p-4 border border-red-300 rounded-md bg-red-50 shadow-sm">
        <label htmlFor="team-select" className="block text-sm font-medium text-red-700">Error Loading Teams:</label>
        <p className="text-sm text-red-600">{error}</p>
        <p className="text-xs text-red-500">
          Tip: Ensure your Figma API token has the necessary permissions. The Figma API does not provide a direct endpoint to list all teams a user belongs to, so teams might need to be pre-configured or discovered through other means in a production setup.
        </p>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-4 border border-yellow-300 rounded-md bg-yellow-50 shadow-sm">
        <p className="text-sm text-yellow-800">No Figma teams found.</p>
        <p className="text-xs text-yellow-700">Please ensure you are part of at least one team and that the provided API key (or OAuth scope) has access to it.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
      <label htmlFor="team-select" className="block text-sm font-medium text-gray-700">Select Figma Team:</label>
      <select
        id="team-select"
        name="team-select"
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        value={selectedTeamId || ''}
        onChange={handleChange}
        disabled={loading}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Team ID: <span className="font-mono text-gray-700">{selectedTeamId || 'None selected'}</span>
      </p>
    </div>
  );
};

export default TeamSelector;