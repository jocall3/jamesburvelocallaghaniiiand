import React, { useState, useMemo } from 'react';
import { EyeOff, Zap, Cpu, FileText, Lightbulb, TrendingUp, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Prototype, PrototypeStatus } from '../../types';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface PrototypeCardProps {
    prototype: Prototype;
    onViewDetails: (id: string) => void;
    onStatusChange: (id: string, newStatus: PrototypeStatus) => void;
    onSimulate: (id: string) => void;
}

const getStatusStyles = (status: PrototypeStatus) => {
    switch (status) {
        case 'Conceptual':
            return { badge: 'bg-blue-500/20 text-blue-300 border-blue-600', icon: Lightbulb, color: 'text-blue-400' };
        case 'In Development':
            return { badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-600', icon: Cpu, color: 'text-yellow-400' };
        case 'Awaiting Testing':
            return { badge: 'bg-purple-500/20 text-purple-300 border-purple-600', icon: FileText, color: 'text-purple-400' };
        case 'In Testing':
            return { badge: 'bg-orange-500/20 text-orange-300 border-orange-600', icon: Zap, color: 'text-orange-400' };
        case 'Validated':
            return { badge: 'bg-green-500/20 text-green-300 border-green-600', icon: CheckCircle, color: 'text-green-400' };
        case 'Archived':
            return { badge: 'bg-gray-500/20 text-gray-400 border-gray-600', icon: EyeOff, color: 'text-gray-400' };
        case 'Failed':
            return { badge: 'bg-red-500/20 text-red-400 border-red-600', icon: XCircle, color: 'text-red-400' };
        default:
            return { badge: 'bg-gray-500/20 text-gray-400 border-gray-600', icon: AlertTriangle, color: 'text-gray-400' };
    }
};

const PrototypeCard: React.FC<PrototypeCardProps> = ({ prototype, onViewDetails, onStatusChange, onSimulate }) => {
    const { badge, icon: StatusIcon, color } = getStatusStyles(prototype.status);
    const progressValue = prototype.progress || 0;
    const impactColor = prototype.projectedImpact > 0 ? 'text-green-400' : prototype.projectedImpact < 0 ? 'text-red-400' : 'text-gray-400';

    const handleStatusClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Simple example: cycling through a few statuses for demonstration
        const statuses: PrototypeStatus[] = ['Conceptual', 'In Development', 'Awaiting Testing', 'In Testing', 'Validated', 'Failed'];
        const currentIndex = statuses.indexOf(prototype.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        onStatusChange(prototype.id, nextStatus);
    };

    const ImpactTooltip = useMemo(() => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={`flex items-center space-x-1 cursor-pointer ${impactColor}`}>
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">{prototype.projectedImpact > 0 ? `+${(prototype.projectedImpact * 100).toFixed(0)}%` : `${(prototype.projectedImpact * 100).toFixed(0)}%`}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-800 border-gray-700 text-white shadow-lg">
                    <p className="text-xs font-semibold mb-1">Projected Economic Impact (Year 1)</p>
                    <p className="text-lg font-bold">${(prototype.projectedImpact * 1000000000).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</p>
                    <p className="text-xs mt-2 text-gray-400">Powered by the Economic Synthesis Engine.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ), [prototype.projectedImpact]);

    return (
        <Card 
            className="transition-all duration-300 hover:shadow-2xl hover:ring-2 hover:ring-cyan-500/50 border-gray-800 bg-gray-900/70 cursor-pointer flex flex-col h-full"
            onClick={() => onViewDetails(prototype.id)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg truncate">{prototype.name}</CardTitle>
                    <Badge variant="outline" className={badge}>
                        <StatusIcon className={`w-4 h-4 mr-1 ${color}`} />
                        {prototype.status}
                    </Badge>
                </div>
                <CardDescription className="text-xs text-gray-400 pt-1 line-clamp-2">{prototype.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow space-y-3 p-4 pt-0">
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Progress:</span>
                    <span>{Math.round(progressValue)}%</span>
                </div>
                <Progress value={progressValue} className="h-1.5 bg-gray-700" />

                <div className="flex justify-between text-xs pt-2">
                    <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-400">Created: {prototype.creationDate.substring(0, 10)}</span>
                    </div>
                    {ImpactTooltip}
                </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-0 p-4 border-t border-gray-800">
                <div className="flex space-x-2">
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={(e) => { e.stopPropagation(); onSimulate(prototype.id); }}
                    >
                        Simulate
                    </Button>
                    <Button 
                        size="sm" 
                        variant="secondary" 
                        className="text-xs h-8"
                        onClick={handleStatusClick}
                    >
                        Advance Status
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-cyan-400 hover:bg-gray-800/50 h-8">
                    View Plan
                </Button>
            </CardFooter>
        </Card>
    );
};

export default PrototypeCard;
