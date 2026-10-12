import { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material';
import {

  InstallMobile as InstallIcon,
  CloudOff as OfflineIcon,
  Wifi as OnlineIcon,
  Update as UpdateIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { usePwaInstall } from '../pwa/usePwaInstall';
import { offlineManager, updateServiceWorker } from '../pwa/serviceWorker';

export default function PWAStatus() {
  const location = useLocation();
  const { canInstall, isInstalled, install } = usePwaInstall();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [notification, setNotification] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    // Listen to offline manager events
    const unsubscribe = offlineManager.addListener((event) => {
      switch (event.type) {
        case 'online':
          setIsOnline(true);
          setNotification({
            message: 'Connection restored',
            severity: 'success'
          });
          break;
        case 'offline':
          setIsOnline(false);
          setNotification({
            message: 'You are offline. Some features may be limited.',
            severity: 'warning'
          });
          break;
        case 'cache-updated':
          setShowUpdatePrompt(true);
          break;
      }
      setPendingRequests(offlineManager.getPendingRequestsCount());
    });

    // Listen for PWA notifications
    const handlePWANotification = (event) => {
      setNotification({
        message: event.detail.message,
        severity: event.detail.type
      });
    };

    window.addEventListener('pwa-notification', handlePWANotification);

    let promptIntervalId;
    if (canInstall && !isInstalled && location.pathname !== '/login') {
      const checkPrompt = () => {
        const lastDismissed = localStorage.getItem('kiddos_pwa_postlogin_dismissed');
        const now = Date.now();
        if (!lastDismissed || now - parseInt(lastDismissed) >= 5 * 60 * 1000) {
          setShowInstallPrompt(true);
        } else {
          setShowInstallPrompt(false);
        }
      };

      checkPrompt();
      promptIntervalId = setInterval(checkPrompt, 60 * 1000);
    } else {
      setShowInstallPrompt(false);
    }

    return () => {
      if (promptIntervalId) clearInterval(promptIntervalId);
      unsubscribe();
      window.removeEventListener('pwa-notification', handlePWANotification);
    };
  }, [canInstall, isInstalled, location.pathname]);

  const handleInstall = async () => {
    try {
      const installed = await install();
      setShowInstallPrompt(false);
      setNotification({
        message: installed
          ? 'Kiddos app install started successfully.'
          : 'Install prompt dismissed. You can install it later from the browser menu.',
        severity: installed ? 'success' : 'info'
      });
    } catch (error) {
      console.error('Installation failed:', error);
      setNotification({
        message: 'Installation failed. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleUpdate = () => {
    updateServiceWorker();
    setShowUpdatePrompt(false);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <>
      {/* Floating Install App Reminder */}
      <Box
        sx={{
          position: 'fixed',
          bottom: showInstallPrompt && location.pathname !== '/login' ? 24 : -200,
          right: 24,
          zIndex: 9999,
          width: 320,
          maxWidth: 'calc(100vw - 48px)',
          backgroundColor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          p: 2.5,
          transition: 'bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: showInstallPrompt && location.pathname !== '/login' ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <InstallIcon color="primary" fontSize="small" />
          Install Kiddoshadow
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
          Install Kiddoshadow for a better experience with faster access and instant notifications.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 0.5 }}>
          <Button 
            size="small" 
            sx={{ fontWeight: 600, color: 'text.secondary' }} 
            onClick={() => {
              setShowInstallPrompt(false);
              localStorage.setItem('kiddos_pwa_postlogin_dismissed', Date.now().toString());
            }}
          >
            Dismiss
          </Button>
          <Button 
            size="small" 
            variant="contained" 
            sx={{ 
              fontWeight: 600, 
              borderRadius: 1.5, 
              backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
            }} 
            onClick={handleInstall}
          >
            Install
          </Button>
        </Box>
      </Box>

      {/* Update Available Dialog */}
      <Dialog
        open={showUpdatePrompt}
        onClose={() => setShowUpdatePrompt(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UpdateIcon color="primary" />
          Update Available
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            A new version of Kiddos PWA is available. Update now to get the latest features and improvements.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdatePrompt(false)}>Later</Button>
          <Button onClick={handleUpdate} variant="contained" startIcon={<UpdateIcon />}>
            Update Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* General Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert
            onClose={closeNotification}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        ) : <></>}
      </Snackbar>
    </>
  );
}
