import React from 'react';
import { Routes, Route } from 'react-router-dom';
import IdentityOverviewPage from '../pages/IdentityOverviewPage'; // Assuming this page will be created
import IdentityDetailsPage from '../pages/IdentityDetailsPage'; // Assuming this page will be created

const IdentityRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<IdentityOverviewPage />} />
      <Route path=":id" element={<IdentityDetailsPage />} />
      {/* Add more identity-related routes here as needed */}
    </Routes>
  );
};

export default IdentityRoutes;