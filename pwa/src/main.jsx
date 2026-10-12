import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./app/App.jsx";
import ThemeProvider from "./theme/ThemeProvider";
import { AuthProvider } from "./auth/AuthProvider";
import { registerServiceWorker } from "./pwa/serviceWorker.js";

// Register service worker for PWA functionality
registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);
