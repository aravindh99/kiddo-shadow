// Service Worker Registration and Management
import { registerSW } from 'virtual:pwa-register';

let updateSW = null;

// Register service worker with update handling
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    updateSW = registerSW({
      onNeedRefresh() {
        updateSW(true);
      },
      onOfflineReady() {
        console.log('App ready to work offline');
        // Show offline ready notification
        showNotification('App is ready to work offline!', 'success');
      },
      onRegistered(registration) {
        console.log('SW Registered: ', registration);
        registration?.update();
      },
      onRegisterError(error) {
        console.log('SW registration error', error);
      }
    });
  }
}

// Manual service worker update
export function updateServiceWorker() {
  if (updateSW) {
    updateSW(true);
  }
}

// Check for service worker updates
export function checkForUpdates() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
}

// Offline status management
export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.pendingRequests = new Map();
    
    this.init();
  }
  
  init() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.handleSWMessage.bind(this));
    }
  }
  
  handleOnline() {
    this.isOnline = true;
    this.notifyListeners('online');
    this.processPendingRequests();
    showNotification('Connection restored', 'success');
  }
  
  handleOffline() {
    this.isOnline = false;
    this.notifyListeners('offline');
    showNotification('You are offline. Some features may be limited.', 'warning');
  }
  
  handleSWMessage(event) {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      this.notifyListeners('cache-updated', event.data.payload);
    }
  }
  
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners(type, data = null) {
    this.listeners.forEach(callback => callback({ type, data }));
  }
  
  // Queue requests when offline
  queueRequest(request) {
    if (!this.isOnline) {
      const id = Date.now().toString();
      this.pendingRequests.set(id, request);
      return id;
    }
    return null;
  }
  
  // Process queued requests when back online
  async processPendingRequests() {
    if (this.pendingRequests.size === 0) return;
    
    const requests = Array.from(this.pendingRequests.entries());
    this.pendingRequests.clear();
    
    for (const [id, request] of requests) {
      try {
        await request();
        console.log(`Processed pending request ${id}`);
      } catch (error) {
        console.error(`Failed to process pending request ${id}:`, error);
        // Re-queue failed requests
        this.pendingRequests.set(id, request);
      }
    }
  }
  
  getPendingRequestsCount() {
    return this.pendingRequests.size;
  }
}

// Global offline manager instance
export const offlineManager = new OfflineManager();

// Cache management utilities
export class CacheManager {
  static async clearOldCaches() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.includes('workbox-precache') && !name.includes(self.location.href)
      );
      
      await Promise.all(oldCaches.map(name => caches.delete(name)));
    }
  }
  
  static async getCacheSize() {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage,
        available: estimate.quota,
        percentage: Math.round((estimate.usage / estimate.quota) * 100)
      };
    }
    return null;
  }
  
  static async clearAppCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Reload to get fresh content
      window.location.reload();
    }
  }
}

// Notification helper
function showNotification(message, type = 'info') {
  // This would integrate with your app's notification system
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // You can dispatch a custom event that your app can listen to
  window.dispatchEvent(new CustomEvent('pwa-notification', {
    detail: { message, type }
  }));
}
