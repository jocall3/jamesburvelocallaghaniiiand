
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, DollarSign } from 'lucide-react';

export const DealFlow: React.FC = () => {
  const deals = [
    { id: 1, name: "QuantumCompute Inc", stage: "Series A", amount: "15M", sector: "Deep Tech", probability: "High" },
    { id: 2, name: "BioSynth Labs", stage: "Seed", amount: "2.5M", sector: "Biotech", probability: "Medium" },
    { id: 3, name: "Stellar Logistics", stage: "Series B", amount: "40M", sector: "Supply Chain", probability: "Medium" },
    { id: 4, name: "NeuroLink", stage: "Pre-Seed", amount: "500K", sector: "HealthTech", probability: "High" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Active Deal Flow</h3>
        <Button variant="outline" className="text-xs">View All Pipeline</Button>
      </div>
      <div className="grid gap-4">
        {deals.map(deal => (
          <Card key={deal.id} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg text-white">{deal.name}</h4>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{deal.stage}</Badge>
                  <Badge variant="outline" className="text-xs border-cyan-500 text-cyan-400">{deal.sector}</Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-400 font-mono font-bold">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {deal.amount}
                </div>
                <div className="flex items-center text-gray-400 text-xs mt-1 justify-end">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {deal.probability}
                </div>
              </div>
              <Button size="sm" variant="ghost" className="ml-4">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
