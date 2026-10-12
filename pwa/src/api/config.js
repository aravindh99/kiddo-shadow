// Centralised API/socket configuration so we don't scatter env parsing.
const FALLBACK_API_BASE_URL = "http://192.168.1.63:3002/api";
const configuredBase =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  FALLBACK_API_BASE_URL;

const shouldUseDevProxy =
  import.meta.env.DEV && import.meta.env.VITE_USE_DEV_PROXY !== "false";
const rawBase = shouldUseDevProxy ? "/api" : configuredBase;

const isRelativeApiBase = rawBase?.startsWith("/");
const browserOrigin =
  typeof window !== "undefined" ? window.location.origin : undefined;

// If the base ends with /api, strip it for sockets (which mount at root).
const derivedSocket =
  isRelativeApiBase
    ? browserOrigin
    : rawBase?.replace(/\/api$/, "") || rawBase || undefined;

export const API_BASE_URL = rawBase;
export const SOCKET_BASE_URL =
  (shouldUseDevProxy ? "" : import.meta.env.VITE_SOCKET_URL || "").replace(
    /\/$/,
    ""
  ) ||
  derivedSocket ||
  API_BASE_URL;

export const VOICE_SERVICE_URL =
  (import.meta.env.VITE_VOICE_SERVICE_URL || "").replace(/\/$/, "");

export const DEFAULT_PAGE_SIZE = 20;
