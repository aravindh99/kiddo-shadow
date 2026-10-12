import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const localApiTarget =
    env.VITE_LOCAL_API_TARGET && env.VITE_LOCAL_API_TARGET !== ""
      ? env.VITE_LOCAL_API_TARGET
      : "http://127.0.0.1:3002";

  const devHost = env.VITE_DEV_HOST || "0.0.0.0";
  const devPort = Number(env.VITE_DEV_PORT || 5176);
  const devOrigin = env.VITE_DEV_ORIGIN || undefined;
  const devHmrHost = env.VITE_DEV_HMR_HOST || undefined;

  console.log("=================================");
  console.log("MODE:", mode);
  console.log("ENV API TARGET:", env.VITE_LOCAL_API_TARGET);
  console.log("FINAL API TARGET:", localApiTarget);
  console.log("=================================");

  const createProxyConfig = () => ({
    target: localApiTarget,
    changeOrigin: true,
    secure: false,
    ws: true,
    timeout: 60000,
    proxyTimeout: 60000,
    configure: (proxy) => {
      proxy.on("error", (err) => {
        if (err?.code === "ECONNRESET" || err?.code === "ECONNABORTED") {
          return;
        }
        console.error("[vite-proxy]", err?.message || err);
      });
    },
  });

  return {
    plugins: [
      react(),
      VitePWA({
        selfDestroying: true,
        registerType: "autoUpdate",
        injectRegister: "auto",
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
        includeAssets: [
          "favicon-16x16.png",
          "favicon-32x32.png",
          "assets/app-icon-192.png",
          "safari-pinned-tab.svg",
          "maps/india outline.jpg",
          "maps/india outline empty.jpg",
          "maps/world ocean map.jpg",
          "maps/world ocean empty.webp",
        ],
        manifest: {
          id: "/login",
          name: "Kiddos PWA",
          short_name: "Kiddos",
          description: "Kiddos PWA",
          theme_color: "#1976d2",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/login",
          icons: [
            {
              src: "/assets/app-icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/assets/app-icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/assets/app-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],

    // 👇 Added only for debugging
    build: {
      sourcemap: true,
    },

    server: {
      host: devHost,
      port: devPort,
      strictPort: true,
      origin: devOrigin,

      hmr: devHmrHost
        ? {
          host: devHmrHost,
          port: devPort,
          clientPort: devPort,
        }
        : undefined,

      proxy: {
        "/api": createProxyConfig(),
        "/socket.io": createProxyConfig(),
      },
    },

    preview: {
      host: devHost,
      port: devPort,
      strictPort: true,
    },
  };
});