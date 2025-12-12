import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import LicensingView from './features/compliance/views/LicensingView';

const App: React.FC = () => {
    return (
        <DataProvider>
            <Router>
                <div className="min-h-screen bg-gray-900 text-gray-100">
                    <Routes>
                        <Route path="/" element={<Navigate to="/compliance/licensing" replace />} />
                        <Route path="/compliance/licensing" element={<LicensingView />} />
                    </Routes>
                </div>
            </Router>
        </DataProvider>
    );
};

export default App;