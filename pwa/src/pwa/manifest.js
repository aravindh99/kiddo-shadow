// PWA Manifest Configuration
export const pwaManifest = {
  name: 'kiddoshadow',
  short_name: 'kiddoshadow',
  description: 'kiddoshadow PWA',
  theme_color: '#1976d2',
  background_color: '#ffffff',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/login',
  categories: ['education', 'productivity', 'social'],
  lang: 'en',
  dir: 'ltr',
  icons: [
    {
      src: '/assets/app-icon-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/assets/app-icon-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/assets/app-icon-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/assets/app-icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    }
  ],
  screenshots: [
    {
      src: '/screenshot-mobile.png',
      sizes: '390x844',
      type: 'image/png',
      form_factor: 'narrow'
    },
    {
      src: '/screenshot-desktop.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide'
    }
  ],
  shortcuts: [
    {
      name: 'Dashboard',
      short_name: 'Dashboard',
      description: 'Go to your dashboard',
      url: '/student/dashboard',
      icons: [{ src: '/assets/app-icon-192.png', sizes: '192x192' }]
    },
    {
      name: 'AI Chat',
      short_name: 'AI Chat',
      description: 'Start AI conversation',
      url: '/student/ai-chat',
      icons: [{ src: '/assets/app-icon-192.png', sizes: '192x192' }]
    },
    {
      name: 'Homework',
      short_name: 'Homework',
      description: 'View homework assignments',
      url: '/student/diary',
      icons: [{ src: '/assets/app-icon-192.png', sizes: '192x192' }]
    }
  ]
};

// Theme color management for PWA
export const themeColors = {
  light: '#1976d2',
  dark: '#90caf9',
  amber: '#ff8f00',
  custom: '#6a1b9a'
};

export function updateThemeColor(theme = 'light') {
  const color = themeColors[theme] || themeColors.light;
  
  // Update theme-color meta tag
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
  
  // Update status bar style for iOS
  let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!statusBarMeta) {
    statusBarMeta = document.createElement('meta');
    statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
    document.head.appendChild(statusBarMeta);
  }
  statusBarMeta.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default');
}

