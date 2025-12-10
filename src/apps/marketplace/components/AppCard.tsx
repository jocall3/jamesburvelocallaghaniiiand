import React, { FC, useMemo } from 'react';
import { AppMarketplaceItem } from '../types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Globe, Tag, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { formatDistanceToNowStrict } from 'date-fns';

interface AppCardProps {
  app: AppMarketplaceItem;
  isInstalled?: boolean;
  onInstall: (appId: string) => void;
  onViewDetails: (appId: string) => void;
  isLoading?: boolean;
}

const AppCard: FC<AppCardProps> = ({ app, isInstalled = false, onInstall, onViewDetails, isLoading }) => {

  const handleInstallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInstall(app.id);
  };

  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(app.id);
  };

  const formattedDate = useMemo(() => {
    if (app.lastUpdated) {
      return formatDistanceToNowStrict(new Date(app.lastUpdated), { addSuffix: true });
    }
    return 'N/A';
  }, [app.lastUpdated]);

  const primaryAction = useMemo(() => {
    if (isInstalled) {
      return (
        <Button
          variant="secondary"
          disabled
          className="w-full text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
          aria-label="Installed"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Installed
        </Button>
      );
    }

    return (
      <Button
        onClick={handleInstallClick}
        disabled={isLoading || app.isPremium && !app.isPurchased}
        className="w-full"
        isLoading={isLoading}
        aria-label={`Install ${app.name}`}
      >
        <Package className="mr-2 h-4 w-4" />
        {app.isPremium && !app.isPurchased ? `Buy for $${app.price}` : 'Install'}
      </Button>
    );
  }, [isInstalled, handleInstallClick, isLoading, app.isPremium, app.isPurchased, app.price, app.name]);

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg cursor-pointer",
        isInstalled ? "border-green-500/50" : "hover:border-primary"
      )}
      onClick={() => onViewDetails(app.id)}
    >
      <CardHeader className="p-4 flex flex-row items-start space-x-4">
        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border">
          {app.iconUrl ? (
            <Image
              src={app.iconUrl}
              alt={`${app.name} icon`}
              layout="fill"
              objectFit="cover"
              className="p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg font-semibold truncate" title={app.name}>
            {app.name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground truncate" title={app.publisher.name}>
            {app.publisher.name}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 pt-0 space-y-3">
        <div className="text-sm line-clamp-3 text-gray-600 dark:text-gray-300 h-[60px]">
          {app.shortDescription}
        </div>
        <div className="flex flex-wrap gap-2">
          {app.isPremium && (
            <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-500/80 text-white">Premium</Badge>
          )}
          {app.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary">
              {tag}
            </Badge>
          ))}
          {app.tags.length > 2 && (
            <Badge variant="outline">
              +{app.tags.length - 2} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t bg-gray-50 dark:bg-gray-900/50 flex flex-col space-y-3">
        <div className="flex justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center" title="Current Version">
              <Tag className="w-3 h-3 mr-1" />
              <span>v{app.currentVersion}</span>
            </div>
            <div className="flex items-center" title="Last Updated">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <div className="flex items-center" title="Installs">
            <Globe className="w-3 h-3 mr-1" />
            <span>{app.installCount} Installs</span>
          </div>
        </div>
        <div className="flex space-x-2 w-full">
          {primaryAction}
          <Button variant="outline" onClick={handleViewDetailsClick} aria-label={`View details for ${app.name}`}>
            Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AppCard;