import axios from "axios";
import { API_BASE_URL } from "./config";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request ID for tracking
api.interceptors.request.use((config) => {
  config.metadata = { startTime: new Date() };
  return config;
});

// Add response time logging
api.interceptors.response.use(
  (response) => {
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    if (import.meta.env.DEV) {
      console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    if (error.config?.metadata) {
      const endTime = new Date();
      const duration = endTime - error.config.metadata.startTime;
      
      if (import.meta.env.DEV) {
        console.error(`API Request Failed: ${error.config.method?.toUpperCase()} ${error.config.url} - ${duration}ms`, error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
