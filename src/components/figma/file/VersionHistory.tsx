import { ComponentProps } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getFileVersions } from '@/api/figma';
import { Version } from '@/types/figma';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type VersionHistoryProps = ComponentProps<'div'> & {
  fileKey: string;
  selectedVersion: string;
  onVersionSelect: (versionId: string) => void;
};

export const VersionHistory = ({
  fileKey,
  selectedVersion,
  onVersionSelect,
  className,
}: VersionHistoryProps) => {
  const { data, isLoading, isError, error } = useQuery<
    { versions: Version[] },
    Error
  >({
    queryKey: ['fileVersions', fileKey],
    queryFn: () => getFileVersions(fileKey),
  });

  if (isLoading) {
    return <p>Loading versions...</p>;
  }

  if (isError) {
    return <p>Error loading versions: {error.message}</p>;
  }

  const versions = data?.versions || [];

  return (
    <div className={className}>
      <Select
        value={selectedVersion}
        onValueChange={onVersionSelect}
        defaultValue={selectedVersion}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a version" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-72 w-48">
            {versions.map((version) => (
              <SelectItem key={version.id} value={version.id}>
                {version.label || `Version ${version.id}`}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
};