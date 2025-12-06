
import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface PortfolioCompanyListProps {
  onSelectCompany: (id: string) => void;
}

export const PortfolioCompanyList: React.FC<PortfolioCompanyListProps> = ({ onSelectCompany }) => {
  const companies = [
    { id: 'c1', name: 'Nexus AI', valuation: '120M', ownership: '12%', status: 'Growth' },
    { id: 'c2', name: 'Solaris Energy', valuation: '85M', ownership: '8%', status: 'Stable' },
    { id: 'c3', name: 'Orbital Dynamics', valuation: '250M', ownership: '5%', status: 'Breakout' },
    { id: 'c4', name: 'Cipher Security', valuation: '45M', ownership: '15%', status: 'Early' },
    { id: 'c5', name: 'AgroFuture', valuation: '60M', ownership: '10%', status: 'Stable' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map(company => (
        <Card 
          key={company.id} 
          className="bg-gray-800 border-gray-700 hover:border-cyan-500 cursor-pointer transition-all"
          onClick={() => onSelectCompany(company.id)}
        >
          <div className="p-5 space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-lg text-white">{company.name}</h4>
              <Badge variant={company.status === 'Breakout' ? 'default' : 'secondary'}>
                {company.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">Valuation</div>
              <div className="text-right text-white font-mono">${company.valuation}</div>
              <div className="text-gray-400">Ownership</div>
              <div className="text-right text-white font-mono">{company.ownership}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
