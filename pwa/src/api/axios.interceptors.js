import api from "./axios";
import { jwtDecode } from "jwt-decode";
import { getRetryDelay, shouldRetry, isAuthError } from "../utils/apiErrorHandler";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function setupAxiosInterceptors({ onLogout, onTokenRefresh }) {
  // ----- Request -----
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");

      if (token) {
        // Check if token is expired before making request
        if (isTokenExpired(token)) {
          onLogout();
          return Promise.reject(new Error("Token expired"));
        }
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add retry configuration to request
      config.retryCount = config.retryCount ?? 0;
      config.maxRetries = config.maxRetries ?? (import.meta.env.DEV ? 1 : 3);

      return config;
    },
    (error) => Promise.reject(error)
  );

  // ----- Response -----
  api.interceptors.response.use(
    (response) => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("forbidden-role-redirecting");
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle retry logic for network and server errors
      if (
        originalRequest &&
        shouldRetry(error, originalRequest.retryCount, originalRequest.maxRetries)
      ) {
        originalRequest.retryCount += 1;
        const delayTime = getRetryDelay(originalRequest.retryCount);

        if (import.meta.env.DEV) {
          console.log(`Retrying request (${originalRequest.retryCount}/${originalRequest.maxRetries}) after ${delayTime}ms`);
        }

        await delay(delayTime);
        return api(originalRequest);
      }

      // Handle 401 errors (unauthorized)
      if (error.response?.status === 401) {
        // If we get a 401, it means the token is invalid or expired
        // Since we don't have a reliable refresh token flow yet, we just logout
        onLogout();
        return Promise.reject(error);
      }

      // Handle 403 errors (forbidden) - could be profile completion required
      if (error.response?.status === 403) {
        const errorMessage = error.response.data?.message || "Access forbidden";

        if (errorMessage.includes("Profile completion required")) {
          // Let the app handle profile completion redirect
          console.log("Profile completion required");
        } else if (errorMessage.includes("approval")) {
          // User needs approval - show appropriate message
          console.log("User approval required");
        } else if (errorMessage.includes("Forbidden role")) {
          // Role/token mismatch: end this session and send user to login to stop repeated failing calls.
          if (typeof window !== "undefined") {
            const alreadyRedirecting = sessionStorage.getItem("forbidden-role-redirecting");
            const onLoginPage = window.location.pathname.startsWith("/login");
            if (!alreadyRedirecting && !onLoginPage) {
              sessionStorage.setItem("forbidden-role-redirecting", "1");
              await onLogout();
              window.location.replace("/login");
            }
          }
        }
      }

      // Enhanced error logging in development
      if (import.meta.env.DEV) {
        console.error("API Error:", {
          url: originalRequest?.url,
          method: originalRequest?.method,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          retryCount: originalRequest?.retryCount || 0,
        });
      }

      return Promise.reject(error);
    }
  );
}
