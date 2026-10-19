
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./styles/global.css";
import "./styles/layout.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Could not find the "#root" element in index.html');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
