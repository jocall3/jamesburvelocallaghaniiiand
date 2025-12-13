import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Assuming a global CSS file for basic styling
import App from './App'; // The main application component

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element with ID "root" not found in the DOM.');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);