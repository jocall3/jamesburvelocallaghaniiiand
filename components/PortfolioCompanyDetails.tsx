
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Activity, Users, FileText, Globe } from 'lucide-react';

interface PortfolioCompanyDetailsProps {
  companyId: string;
}

export const PortfolioCompanyDetails: React.FC<PortfolioCompanyDetailsProps> = ({ companyId }) => {
  // Mock details fetch based on ID
  const company = {
    id: companyId,
    name: 'Nexus AI',
    description: 'Next-generation artificial intelligence infrastructure for decentralized finance.',
    founded: 2022,
    headquarters: 'San Francisco, CA',
    website: 'https://nexus.ai',
    metrics: {
      arr: '$12.5M',
      growth: '140%',
      burn: '$450k/mo',
      runway: '18 months'
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl text-white">{company.name}</CardTitle>
              <a href={company.website} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 mt-1 text-sm">
                <Globe className="w-3 h-3" /> {company.website}
              </a>
            </div>
            <div className="text-right text-gray-400 text-sm">
              <p>Founded {company.founded}</p>
              <p>{company.headquarters}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 mb-6">{company.description}</p>
          
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" /> Key Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">ARR</div>
              <div className="text-xl font-mono text-white">{company.metrics.arr}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">YoY Growth</div>
              <div className="text-xl font-mono text-green-400">{company.metrics.growth}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">Burn Rate</div>
              <div className="text-xl font-mono text-red-400">{company.metrics.burn}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded border border-gray-700">
              <div className="text-xs text-gray-500 uppercase">Runway</div>
              <div className="text-xl font-mono text-yellow-400">{company.metrics.runway}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Board & Observers
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                <li>Sarah Chen (Partner, Sequoia)</li>
                <li>David Kim (Partner, a16z)</li>
                <li>James O'Callaghan (Board Observer)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" /> Recent Documents
              </h4>
              <ul className="text-sm text-cyan-400 space-y-1">
                <li className="cursor-pointer hover:underline">Q3 2024 Board Deck.pdf</li>
                <li className="cursor-pointer hover:underline">Oct 2024 Financials.xlsx</li>
                <li className="cursor-pointer hover:underline">Series B Term Sheet.pdf</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
