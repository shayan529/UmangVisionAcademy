import axios from "axios";

// IMPORTANT: Do NOT use window.location.origin here.
// In a normal browser tab this correctly resolves to your real domain.
// But inside the Capacitor Android WebView, window.location.origin points
// to the WebView's internal origin (e.g. "capacitor://localhost" or
// "http://localhost"), NOT your deployed backend — so every request would
// silently fail to reach the real server. We hardcode the production URL
// instead so both the website AND the APK always hit the right place.
const PRODUCTION_API_BASE_URL = "https://umangvisionacademy.onrender.com/api";

const getDefaultApiBaseUrl = () => {
  // Local dev convenience: if running on localhost in a normal browser
  // (npm run dev), keep hitting the local backend.
  // Note: inside Capacitor Android WebView, window.location.hostname is also "localhost"
  // but window.Capacitor is defined, so we check !window.Capacitor to avoid
  // hitting localhost:5000 on the device.
  if (
    typeof window !== "undefined" &&
    !window.Capacitor &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000/api";
  }
  return PRODUCTION_API_BASE_URL;
};

const PRODUCTION_SOCKET_URL = "https://umangvisionacademy.onrender.com";

const getDefaultSocketUrl = () => {
  if (
    typeof window !== "undefined" &&
    !window.Capacitor &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000";
  }
  return PRODUCTION_SOCKET_URL;
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  getDefaultApiBaseUrl();

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || getDefaultSocketUrl();


export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: "/users/login",
    REGISTER: "/users/register",
    LOGOUT: "/users/logout",
    ME: "/users/me",
  },

  // User endpoints
  USERS: {
    LIST: "/users",
    GET: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
  },

  // Course endpoints
  COURSES: {
    LIST: "/courses",
    PUBLIC: "/courses/public", // GET — all published courses
    ENROLLED: "/courses/enrolled", // GET  — courses student is enrolled in
    ENROLL: "/courses/enroll", // POST — enroll in one or more courses
    GET: (id) => `/courses/${id}`,
    CREATE: "/courses",
    UPDATE: (id) => `/courses/${id}`,
    DELETE: (id) => `/courses/${id}`,
  },

  // Instructor application endpoints
  INSTRUCTOR_APPLICATIONS: {
    SUBMIT: "/instructor-applications",
    ME: "/instructor-applications/me",
    ALL: "/instructor-applications",
    APPROVE: (id) => `/instructor-applications/${id}/approve`,
    REJECT: (id) => `/instructor-applications/${id}`,
  },

  // Session endpoints  ← new
  SESSIONS: {
    LIST: "/sessions",
    GET: (id) => `/sessions/${id}`,
    CREATE: "/sessions",
    UPDATE: (id) => `/sessions/${id}`,
    DELETE: (id) => `/sessions/${id}`,
  },

  // Student endpoints  ← new
  STUDENTS: {
    LIST: "/students",
    GET: (id) => `/students/${id}`,
    ACTIVITY: "/students/activity",
    LEADERBOARD: "/students/leaderboard",
  },
  AI: {
    GENERATE_QUIZ: "/ai/generate-quiz",
  },

  // Cart endpoints
  CART: {
    GET: "/cart",
    ADD: "/cart/add",
    REMOVE: (courseId) => `/cart/${courseId}`,
    CLEAR: "/cart",
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach a Bearer token if we have one saved locally. This is a fallback
// auth path alongside the existing httpOnly cookie: cross-origin/cross-scheme
// cookies (e.g. "capacitor://localhost" talking to your real domain) are
// unreliable across Android WebView versions even with SameSite=None, so the
// native app needs a token-based path that doesn't depend on cookies working.
// On web this header is simply absent/unused if you're not storing a token.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global interceptor to sanitize 5xx (Internal Server Errors) and handle network errors cleanly on the frontend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      // In production, sanitize 5xx (Server) errors but keep the original message if it exists
      if (status >= 500) {
        const serverMessage = error.response.data?.message;
        error.response.data = {
          ...error.response.data,
          message: serverMessage || "An unexpected server error occurred. Please try again later.",
        };
      }
    } else if (error.request) {
      // Network error (no response received)
      error.message = "Unable to connect to the server. Please check your internet connection.";
    }
    return Promise.reject(error);
  }
);

// ── Global overrides for raw axios and native fetch ──────────────────────────
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status >= 500) {
        error.response.data = {
          ...error.response.data,
          message: "An unexpected server error occurred. Please try again later.",
        };
      }
    } else if (error.request) {
      error.message = "Unable to connect to the server. Please check your internet connection.";
    }
    return Promise.reject(error);
  }
);

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === "string" && input.startsWith("/api/")) {
      const apiPrefix = "/api";
      const baseDomain = API_BASE_URL.endsWith(apiPrefix)
        ? API_BASE_URL.slice(0, -apiPrefix.length)
        : API_BASE_URL;
      
      input = `${baseDomain}${input}`;

      // Auto-inject Authorization header for native webview environment
      const token = localStorage.getItem("authToken");
      if (token) {
        init = init || {};
        init.headers = init.headers || {};
        if (init.headers instanceof Headers) {
          if (!init.headers.has("Authorization")) {
            init.headers.set("Authorization", `Bearer ${token}`);
          }
        } else if (Array.isArray(init.headers)) {
          const hasAuth = init.headers.some(
            (h) => h[0]?.toLowerCase() === "authorization"
          );
          if (!hasAuth) {
            init.headers.push(["Authorization", `Bearer ${token}`]);
          }
        } else {
          if (!init.headers["Authorization"] && !init.headers["authorization"]) {
            init.headers["Authorization"] = `Bearer ${token}`;
          }
        }
      }
    }
    return originalFetch.call(this, input, init);
  };
}

export default api;