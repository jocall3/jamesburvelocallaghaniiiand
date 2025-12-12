import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getTeamComponents, getFileComponents, GetTeamComponentsResponse, GetFileComponentsResponse, PublishedComponent } from '../../../api/figma';
import { Team, File } from '../../../types/figma-types';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, LayoutGrid, AlertCircle } from 'lucide-react';

interface ComponentLibraryBrowserProps {
  librarySource: { type: 'team', id: string } | { type: 'file', id: string } | null;
}

const ComponentCard: React.FC<{ component: PublishedComponent }> = ({ component }) => (
  <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer space-y-2">
    <div className="flex items-center space-x-2">
      <LayoutGrid className="w-5 h-5 text-indigo-500 flex-shrink-0" />
      <h4 className="font-semibold truncate">{component.name}</h4>
    </div>
    {component.thumbnail_url && (
      <img
        src={component.thumbnail_url}
        alt={component.name}
        className="w-full h-auto object-cover rounded aspect-video bg-gray-100"
        onError={(e) => {
          (e.target as HTMLImageElement).onerror = null;
          (e.target as HTMLImageElement).src = '/placeholder.svg'; // Fallback
        }}
      />
    )}
    {component.description && (
      <p className="text-sm text-muted-foreground line-clamp-2">{component.description}</p>
    )}
    <div className="text-xs text-gray-500">
      Last modified: {new Date(component.updated_at).toLocaleDateString()}
    </div>
  </div>
);

const ComponentLibraryBrowser: React.FC<ComponentLibraryBrowserProps> = ({ librarySource }) => {
  const { accessToken } = useAuth();
  const [components, setComponents] = useState<PublishedComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(false);

  const isTeamSource = librarySource?.type === 'team';

  const fetchComponents = useCallback(async (initialFetch = true, afterCursor?: number, beforeCursor?: number) => {
    if (!accessToken || !librarySource) return;

    setLoading(true);
    setError(null);

    const params: any = { access_token: accessToken };

    if (isTeamSource) {
      params.team_id = librarySource.id;
      if (!initialFetch) {
        if (afterCursor) params.after = afterCursor;
        if (beforeCursor) params.before = beforeCursor;
      }
    } else { // file source
      params.file_key = librarySource.id;
      // File components endpoint does not support pagination
    }

    try {
      if (isTeamSource) {
        const response: GetTeamComponentsResponse = await getTeamComponents(params);
        if (response.error) {
          throw new Error(response.message || 'Failed to fetch team components.');
        }

        const newComponents = response.meta.components || [];

        if (initialFetch) {
          setComponents(newComponents);
        } else if (afterCursor) {
          setComponents(prev => [...prev, ...newComponents]);
        } else if (beforeCursor) {
          setComponents(prev => [...newComponents, ...prev]);
        }

        const nextCursor = response.meta.cursor?.after;
        setCursor(nextCursor);
        setHasNextPage(!!nextCursor);
      } else {
        const response: GetFileComponentsResponse = await getFileComponents(params);
        if (response.error) {
          throw new Error(response.message || 'Failed to fetch file components.');
        }
        setComponents(response.meta.components || []);
        setCursor(undefined);
        setHasNextPage(false);
      }
    } catch (err: any) {
      console.error("Figma API Error:", err);
      setError(err.message || "An unexpected error occurred while fetching components.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, librarySource, isTeamSource]);

  useEffect(() => {
    if (librarySource) {
      fetchComponents(true);
    } else {
      setComponents([]);
      setError('Please select a team or file library source.');
    }
  }, [librarySource, fetchComponents]);

  const filteredComponents = useMemo(() => {
    if (!searchTerm) return components;
    return components.filter(component =>
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [components, searchTerm]);

  const handleLoadMore = () => {
    if (hasNextPage && cursor !== undefined) {
      fetchComponents(false, cursor);
    }
  };

  if (!librarySource) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full bg-background rounded-xl border">
        <Zap className="w-10 h-10 text-gray-400 mb-3" />
        <h3 className="text-lg font-semibold text-gray-700">Select a Library Source</h3>
        <p className="text-sm text-muted-foreground text-center">
          Choose a Team or File in the settings to browse published components.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card p-4 rounded-xl shadow-inner border">
      <div className="mb-4">
        <Input
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading && components.length === 0}
        />
      </div>

      <div className="flex-grow min-h-0">
        {loading && components.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Loading components...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <h3 className="font-semibold text-red-600">Error Loading Library</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && filteredComponents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <LayoutGrid className="w-8 h-8 text-gray-400 mb-3" />
            <p className="text-sm text-muted-foreground">No components found matching your criteria.</p>
          </div>
        )}

        {!error && (
          <ScrollArea className="h-full pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredComponents.map(component => (
                <ComponentCard key={component.key} component={component} />
              ))}
            </div>

            {/* Load More Button (only for team library which is paginated) */}
            {isTeamSource && hasNextPage && (
              <div className="mt-4 text-center">
                <Button onClick={handleLoadMore} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default ComponentLibraryBrowser;