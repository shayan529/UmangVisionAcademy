import axios from "axios";

// ── Environment detection ─────────────────────────────────────────────────────
const IS_LOCAL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10."));

// Vercel hosts both frontend and backend on the SAME origin.
// vercel.json rewrites: /api/* → server/server.js, /socket.io/* → server/server.js
const IS_VERCEL =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") ||
    window.location.hostname.includes("umangvisionacademy.com"));

// Fallback for when served from Render directly
const IS_RENDER =
  typeof window !== "undefined" &&
  window.location.hostname.includes("onrender.com");

const getDefaultApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    if (IS_LOCAL) return `http://${window.location.hostname}:5000/api`;
    // Same-origin proxy on Vercel — no CORS needed
    if (IS_VERCEL || IS_RENDER) return `${window.location.origin}/api`;
  }
  return "https://umangvisionacademy.onrender.com/api";
};

const getDefaultSocketUrl = () => {
  if (typeof window !== "undefined") {
    if (IS_LOCAL) return `http://${window.location.hostname}:5000`;
    // On Vercel: socket.io is routed via vercel.json → server/server.js
    // Use same origin so the /socket.io/* rewrite applies.
    if (IS_VERCEL || IS_RENDER) return window.location.origin;
  }
  return "https://umangvisionacademy.onrender.com";
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  getDefaultApiBaseUrl();

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || getDefaultSocketUrl();

// ── Socket.IO transport options ───────────────────────────────────────────────
// Vercel serverless functions do NOT support the WebSocket protocol upgrade —
// every request is a new HTTP invocation, so long-lived connections are killed.
// Solution: use polling-only on Vercel (HTTP long-poll works fine through
// serverless). On local dev, start with polling then upgrade to WS as usual.
export const SOCKET_OPTIONS =
  IS_VERCEL || IS_RENDER
    ? {
        // Polling only — no WebSocket upgrade attempted.
        // This is reliable on Vercel serverless even though it's slightly less
        // efficient than WebSockets (latency is ~200–500 ms per poll cycle).
        transports: ["polling"],
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
        path: "/socket.io",
      }
    : {
        // Local dev: start with polling and auto-upgrade to WS when available
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        path: "/socket.io",
      };

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
    INSTRUCTOR_COURSES: "/sessions/instructor-courses",
  },

  // Ask-Instructor chat endpoints
  INSTRUCTOR_CHAT: {
    AVAILABLE_INSTRUCTORS: "/instructor-chat/available-instructors",
    CONVERSATIONS: "/instructor-chat/conversations",
    CONVERSATION: (id) => `/instructor-chat/conversations/${id}`,
    ARCHIVE: (id) => `/instructor-chat/conversations/${id}/archive`,
    DELETE_CONVERSATION: (id) => `/instructor-chat/conversations/${id}`,
    BLOCK_CONVERSATION: (id) => `/instructor-chat/conversations/${id}/block`,
    REPORT_CONVERSATION: (id) => `/instructor-chat/conversations/${id}/report`,
    DELETE_MESSAGE: (id, mid) =>
      `/instructor-chat/conversations/${id}/messages/${mid}`,
    CALL_REQUESTS: "/instructor-chat/call-requests",
    CALL_REQUEST: (id) => `/instructor-chat/call-requests/${id}`,
    CALL_REQUEST_APPROVE: (id) =>
      `/instructor-chat/call-requests/${id}/approve`,
    CALL_REQUEST_REJECT: (id) => `/instructor-chat/call-requests/${id}/reject`,
    ADMIN_REPORTS: "/instructor-chat/admin/reports",
    ADMIN_REPORT_MESSAGES: (id) =>
      `/instructor-chat/admin/reports/${id}/messages`,
    ADMIN_REPORT_ACTION: (id) => `/instructor-chat/admin/reports/${id}/action`,
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

// Only needed in local development where the server returns localhost URLs.
// In production / deployed environments, URLs are already correct — running
// this recursive deep-clone on every response wastes CPU (especially for
// large payloads like course listings or user lists).
const IS_LOCAL_DEV =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10."));

const replaceLocalhostUrls = (obj) => {
  if (typeof obj === "string") {
    return obj.replace(
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+/,
      SOCKET_URL,
    );
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceLocalhostUrls);
  }
  if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = replaceLocalhostUrls(obj[key]);
    }
    return newObj;
  }
  return obj;
};

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
  (response) => {
    if (IS_LOCAL_DEV && response.data) {
      response.data = replaceLocalhostUrls(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const serverData = error.response.data;

      if (status >= 500) {
        // More descriptive error for debugging in the APK
        const message =
          serverData?.message || serverData?.error || "Internal Server Error";
        const code = serverData?.code || status;
        error.response.data = {
          ...serverData,
          message: `Server Error [${code}]: ${message}`,
        };
      }
    } else if (error.request) {
      // Network error (no response received)
      error.message =
        "Unable to connect to the server. Please check your internet connection.";
    }
    return Promise.reject(error);
  },
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
  (response) => {
    if (IS_LOCAL_DEV && response.data) {
      response.data = replaceLocalhostUrls(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status >= 500) {
        error.response.data = {
          ...error.response.data,
          message:
            "An unexpected server error occurred. Please try again later.",
        };
      }
    } else if (error.request) {
      error.message =
        "Unable to connect to the server. Please check your internet connection.";
    }
    return Promise.reject(error);
  },
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
            (h) => h[0]?.toLowerCase() === "authorization",
          );
          if (!hasAuth) {
            init.headers.push(["Authorization", `Bearer ${token}`]);
          }
        } else {
          if (
            !init.headers["Authorization"] &&
            !init.headers["authorization"]
          ) {
            init.headers["Authorization"] = `Bearer ${token}`;
          }
        }
      }
    }
    return originalFetch.call(this, input, init);
  };
}

export default api;
