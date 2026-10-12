import { useEffect, useState } from "react";
import { updateThemeColor } from "./manifest.js";

export function usePwaInstall() {
  const [prompt, setPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = () => {
      // Check for standalone mode (iOS)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for PWA mode (Android)
      const isPWA = window.navigator.standalone === true;
      
      setIsInstalled(isStandalone || isPWA);
    };

    checkInstallation();

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setPrompt(null);
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      checkInstallation();
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener?.("change", handleDisplayModeChange);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener?.("change", handleDisplayModeChange);
    };
  }, []);

  async function install() {
    if (!prompt) return false;
    
    try {
      prompt.prompt();
      const result = await prompt.userChoice;
      
      if (result.outcome === 'accepted') {
        setPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Installation failed:', error);
      return false;
    }
  }

  // Update theme color based on current theme
  const updatePWATheme = (theme) => {
    updateThemeColor(theme);
  };

  return { 
    canInstall: !!prompt, 
    isInstalled,
    install,
    updatePWATheme
  };
}
