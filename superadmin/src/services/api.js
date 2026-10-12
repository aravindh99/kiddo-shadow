// api.js

const BASE_URL = "";
// const BASE_URL = (
//   import.meta.env.VITE_API_URL || "https://schoolapi.xtown.in"
// ).trim();


class GravityLink {
  constructor() {
    this.token = localStorage.getItem("token") || null;
  }

  // ===============================
  // TOKEN MANAGEMENT
  // ===============================
  setToken(token) {
    this.token = token;

    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  // ===============================
  // CORE REQUEST METHOD
  // ===============================
  async request(endpoint = "", options = {}) {
    if (typeof endpoint !== "string") {
      throw new Error("Endpoint must be a string");
    }

    const isLoginApi = endpoint.includes("/auth/login");

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // Attach token except login
    if (this.token && !isLoginApi) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Build URL
    let url = `${BASE_URL}${endpoint}`;

    // Query params support
    if (options.params && typeof options.params === "object") {
      const query = new URLSearchParams(options.params).toString();
      if (query) url += `?${query}`;
    }

    console.log(
      `GravityLink → ${options.method || "GET"} ${url}`
    );

    const fetchOptions = {
      method: options.method || "GET",
      headers,
      credentials: "include", // important if backend uses cookies
    };

    // Attach body only if exists
    if (options.body) {
      fetchOptions.body = options.body;
    }

    let response;

    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      console.error("Network error:", err);
      throw new Error("Network Error - Unable to reach server");
    }

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    // Auto logout on 401
    if (response.status === 401 && !isLoginApi) {
      this.setToken(null);
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      const error = new Error(
        data?.message || "Request failed"
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  // ===============================
  // HTTP METHODS
  // ===============================
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  }

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Create single instance
export const api = new GravityLink();
