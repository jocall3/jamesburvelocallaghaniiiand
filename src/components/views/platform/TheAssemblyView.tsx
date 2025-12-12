import React from 'react';

const TheAssemblyView: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">The Assembly</h1>
      <p className="mb-4">
        Orchestration layer for Citibankdemobusinessinc's open banking ecosystem.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder for dynamically generated business model cards */}
        <BusinessModelCard
          title="Citibankdemobusinessinc.viewit.movieplayform"
          description="A platform for streaming and discovering independent films."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.lendfast.microloans"
          description="Instant microloans for small businesses and entrepreneurs."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.wealthwise.roboadvisor"
          description="AI-powered robo-advisor for personalized wealth management."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.safeguard.cybersecurity"
          description="Advanced cybersecurity solutions for open banking infrastructure."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.tradeflow.supplychainfinance"
          description="Optimizing supply chain finance through blockchain technology."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.futurefund.esginvesting"
          description="ESG-focused investment platform for sustainable development."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.healthhub.telemedicine"
          description="Telemedicine platform integrated with financial wellness programs."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.edufin.studentloans"
          description="Innovative student loan solutions with income-based repayment options."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.greenpay.carboncredits"
          description="Platform for trading and managing carbon credits."
          status="Active"
        />
        <BusinessModelCard
          title="Citibankdemobusinessinc.globalreach.remittances"
          description="Secure and affordable international remittance services."
          status="Active"
        />
      </div>
    </div>
  );
};

interface BusinessModelCardProps {
  title: string;
  description: string;
  status: string;
}

const BusinessModelCard: React.FC<BusinessModelCardProps> = ({ title, description, status }) => {
  return (
    <div className="border rounded-md p-4">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 mb-2">{description}</p>
      <p className="text-sm">Status: {status}</p>
    </div>
  );
};

export default TheAssemblyView;