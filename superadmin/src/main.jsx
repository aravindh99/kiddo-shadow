import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AppThemeProvider from "./context/ThemeContext";

createRoot(document.getElementById("root")).render(
  <AppThemeProvider>
    <App />
  </AppThemeProvider>
);
