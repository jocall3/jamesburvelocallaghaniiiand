```typescript
import { useState, useEffect, useCallback } from 'react';
import { useFigma } from './useFigma';

interface DevResource {
  id?: string;
  name: string;
  url: string;
  file_key: string;
  node_id: string;
}

interface UseDevResourcesProps {
  fileKey: string;
  nodeId: string;
}

interface UseDevResourcesReturn {
  devResources: DevResource[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createDevResource: (devResource: Omit<DevResource, 'id'>) => Promise<void>;
  updateDevResource: (devResource: DevResource) => Promise<void>;
  deleteDevResource: (devResourceId: string) => Promise<void>;
}

export const useDevResources = ({
  fileKey,
  nodeId,
}: UseDevResourcesProps): UseDevResourcesReturn => {
  const [devResources, setDevResources] = useState<DevResource[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { fetchFigma, postFigma, putFigma, deleteFigma } = useFigma();

  const fetchDevResources = useCallback(async () => {
    if (!fileKey || !nodeId) {
      setDevResources(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchFigma<{ dev_resources: DevResource[] }>(
        `/v1/files/${fileKey}/dev_resources?node_ids=${nodeId}`,
      );
      setDevResources(data.dev_resources);
    } catch (err: any) {
      setError(err);
      console.error("Error fetching dev resources:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fileKey, nodeId, fetchFigma]);

  useEffect(() => {
    fetchDevResources();
  }, [fetchDevResources]);

  const createDevResource = useCallback(
    async (devResource: Omit<DevResource, 'id'>) => {
      if (!fileKey || !nodeId) {
          console.warn("File key or node id missing. Cannot create dev resource.");
          return;
      }

      try {
        await postFigma<{ links_created: DevResource[]; errors: any[] }>(
          '/v1/dev_resources',
          {
            dev_resources: [{ ...devResource, file_key: fileKey, node_id: nodeId }],
          },
        );
        await fetchDevResources();
      } catch (err: any) {
        setError(err);
        console.error("Error creating dev resource:", err);
      }
    },
    [fileKey, nodeId, postFigma, fetchDevResources],
  );

  const updateDevResource = useCallback(
    async (devResource: DevResource) => {
        if (!fileKey || !nodeId) {
            console.warn("File key or node id missing. Cannot update dev resource.");
            return;
        }

      try {
        await putFigma<{ links_updated: DevResource[]; errors: any[] }>(
          '/v1/dev_resources',
          {
            dev_resources: [devResource],
          },
        );
        await fetchDevResources();
      } catch (err: any) {
        setError(err);
        console.error("Error updating dev resource:", err);
      }
    },
    [fileKey, nodeId, putFigma, fetchDevResources],
  );

  const deleteDevResource = useCallback(
    async (devResourceId: string) => {
        if (!fileKey || !nodeId) {
            console.warn("File key or node id missing. Cannot delete dev resource.");
            return;
        }

      try {
        await deleteFigma(`/v1/files/${fileKey}/dev_resources/${devResourceId}`);
        await fetchDevResources();
      } catch (err: any) {
        setError(err);
        console.error("Error deleting dev resource:", err);
      }
    },
    [fileKey, nodeId, deleteFigma, fetchDevResources],
  );

  return {
    devResources,
    isLoading,
    error,
    refetch: fetchDevResources,
    createDevResource,
    updateDevResource,
    deleteDevResource,
  };
};
```