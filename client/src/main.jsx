import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// --- Global Stylesheets ---
import './index.css';

// --- Core Application Component ---
import App from './App.jsx';

/**
 * Application Entry Point
 * Bootstraps the React application and mounts it to the browser's DOM.
 */
const initializeApp = () => {
  const rootNode = document.getElementById('root');

  // Safeguard: Ensure the target mounting element exists in the HTML file
  if (!rootNode) {
    throw new Error("Initialization Failure: Target container with ID 'root' was not found in the DOM.");
  }

  const root = createRoot(rootNode);

  // Render the application within StrictMode to highlight potential problems
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// Execute the initialization
initializeApp();