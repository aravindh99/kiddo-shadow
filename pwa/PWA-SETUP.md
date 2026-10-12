# PWA Setup Guide

This document explains the PWA (Progressive Web App) configuration for the PWA Kiddo educational app.

## Overview

The PWA Kiddo app is configured as a Progressive Web Application with the following features:

- **Offline Support**: Service worker caches essential resources for offline use
- **App Installation**: Users can install the app on their devices
- **Push Notifications**: Real-time notifications for educational updates
- **HTTPS Support**: Secure connections for PWA features
- **Responsive Design**: Mobile-first design that works across devices

## Development Setup

### 1. HTTPS Configuration

PWA features require HTTPS. For local development:

```bash
# Generate HTTPS certificates (recommended - uses mkcert)
npm run generate-certs

# Start development server with HTTPS
npm run dev:https
```

#### Installing mkcert (recommended)

**macOS:**
```bash
brew install mkcert
mkcert -install
```

**Windows:**
```bash
choco install mkcert
mkcert -install
```

**Linux:**
Follow instructions at: https://github.com/FiloSottile/mkcert#installation

#### Alternative: OpenSSL certificates

If mkcert is not available:
```bash
npm run generate-certs -- --openssl
```

Note: OpenSSL certificates will show security warnings in browsers.

### 2. PWA Features

#### Service Worker
- Automatically registered in `src/main.jsx`
- Handles offline caching and background sync
- Manages app updates and notifications

#### Manifest
- Configured in `vite.config.js` with VitePWA plugin
- Defines app metadata, icons, and display options
- Enables app installation prompts

#### Icons
Replace placeholder icon files in `public/` with actual app icons:
- `pwa-64x64.png` - Small icon
- `pwa-192x192.png` - Standard icon
- `pwa-512x512.png` - Large icon (also used as maskable)
- `apple-touch-icon.png` - iOS home screen icon
- `favicon-32x32.png` - Browser tab icon
- `favicon-16x16.png` - Small browser tab icon
- `safari-pinned-tab.svg` - Safari pinned tab icon
- `mstile-150x150.png` - Windows tile icon

## Production Deployment

### 1. Build Configuration

```bash
# Build for production
npm run build

# Preview production build with HTTPS
npm run preview:https
```

### 2. Server Requirements

- **HTTPS**: Required for PWA features
- **Service Worker**: Serve from root domain
- **Headers**: Configure proper caching headers
- **Fallback**: Serve `index.html` for client-side routing

### 3. Nginx Configuration Example

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # PWA files
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Don't cache service worker
        location /sw.js {
            expires 0;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
        
        # Don't cache manifest
        location /manifest.webmanifest {
            expires 0;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
}
```

## PWA Components

### PWAStatus Component
- Shows installation prompts
- Displays online/offline status
- Handles app updates
- Shows pending sync operations

Usage:
```jsx
import PWAStatus from './components/PWAStatus';

function App() {
  return (
    <div>
      {/* Your app content */}
      <PWAStatus />
    </div>
  );
}
```

### usePwaInstall Hook
- Detects installation capability
- Handles installation flow
- Updates theme colors

Usage:
```jsx
import { usePwaInstall } from './pwa/usePwaInstall';

function InstallButton() {
  const { canInstall, install, isInstalled } = usePwaInstall();
  
  if (isInstalled || !canInstall) return null;
  
  return (
    <button onClick={install}>
      Install App
    </button>
  );
}
```

### Service Worker Management
- Automatic registration and updates
- Offline request queuing
- Cache management utilities

Usage:
```jsx
import { offlineManager, CacheManager } from './pwa/serviceWorker';

// Listen to offline events
const unsubscribe = offlineManager.addListener((event) => {
  console.log('Offline event:', event.type);
});

// Check cache size
const cacheInfo = await CacheManager.getCacheSize();
console.log('Cache usage:', cacheInfo);
```

## Testing PWA Features

### 1. Installation Testing
- Open app in Chrome/Edge
- Look for install prompt in address bar
- Test installation flow
- Verify app appears in app drawer/start menu

### 2. Offline Testing
- Open Chrome DevTools
- Go to Network tab
- Check "Offline" checkbox
- Refresh page - should work offline
- Test offline functionality

### 3. Service Worker Testing
- Open Chrome DevTools
- Go to Application tab
- Check Service Workers section
- Verify registration and updates

### 4. Manifest Testing
- Chrome DevTools > Application > Manifest
- Verify all fields are correct
- Test icon display
- Check installability criteria

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Check HTTPS requirement
   - Verify file paths in vite.config.js
   - Check browser console for errors

2. **Install Prompt Not Showing**
   - Ensure HTTPS is enabled
   - Check PWA criteria in DevTools
   - Verify manifest configuration

3. **Offline Features Not Working**
   - Check service worker registration
   - Verify cache configuration
   - Test network conditions

4. **Icons Not Displaying**
   - Replace placeholder icon files
   - Verify file paths in manifest
   - Check icon sizes and formats

### Debug Commands

```bash
# Check PWA score
npx lighthouse http://localhost:3000 --only-categories=pwa

# Analyze bundle
npm run build
npx vite-bundle-analyzer dist

# Test service worker
npm run build
npm run preview:https
```

## Security Considerations

- Always use HTTPS in production
- Validate service worker scope
- Implement proper CSP headers
- Secure API endpoints
- Validate push notification permissions

## Performance Optimization

- Minimize service worker scope
- Cache only essential resources
- Implement proper cache invalidation
- Use compression for static assets
- Monitor cache storage usage

## Browser Support

- **Chrome/Edge**: Full PWA support
- **Firefox**: Partial support (no installation)
- **Safari**: Limited support (iOS 11.3+)
- **Samsung Internet**: Full support

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)