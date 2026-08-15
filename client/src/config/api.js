import axios from "axios";

// ── Environment detection ─────────────────────────────────────────────────────
const IS_LOCAL =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10."));

// ── Production Backend URLs with High-Availability Failover ────────────────────
export const PRIMARY_BACKEND_URL = "https://umangvisionacademy-42sz.onrender.com";
export const SECONDARY_BACKEND_URL = "https://umangvisionacademy.onrender.com";

let activeBackendUrl = PRIMARY_BACKEND_URL;

export const getActiveBackendUrl = () => {
  if (typeof window !== "undefined" && IS_LOCAL) {
    return `http://${window.location.hostname}:5000`;
  }
  return activeBackendUrl;
};

export const getActiveApiBaseUrl = () => {
  return `${getActiveBackendUrl()}/api`;
};

export const switchToBackupBackend = () => {
  if (activeBackendUrl !== SECONDARY_BACKEND_URL) {
    console.warn(
      `[API Failover] Primary backend (${PRIMARY_BACKEND_URL}) failed. Automatically switching to secondary backup backend: ${SECONDARY_BACKEND_URL}`
    );
    activeBackendUrl = SECONDARY_BACKEND_URL;
    api.defaults.baseURL = `${SECONDARY_BACKEND_URL}/api`;
    axios.defaults.baseURL = `${SECONDARY_BACKEND_URL}/api`;
  }
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  getActiveApiBaseUrl();

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || getActiveBackendUrl();

// ── Socket.IO transport options ───────────────────────────────────────────────
// Use polling-only in production if the backend is hosted on Render or another
// serverless-style host that may not support WebSocket upgrades reliably.
export const SOCKET_OPTIONS = {
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
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
    REQUEST_CALL: (id) => "/instructor-chat/call-requests",
    CALL_REQUEST: (id) => `/instructor-chat/call-requests/${id}`,
    CALL_REQUEST_APPROVE: (id) =>
      `/instructor-chat/call-requests/${id}/approve`,
    APPROVE_CALL: (id) => `/instructor-chat/call-requests/${id}/approve`,
    CALL_REQUEST_REJECT: (id) => `/instructor-chat/call-requests/${id}/reject`,
    REJECT_CALL: (id) => `/instructor-chat/call-requests/${id}/reject`,
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

// Global interceptor to sanitize 5xx (Internal Server Errors) and handle auto-failover to backup backend
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = replaceLocalhostUrls(response.data);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    const isNetworkOrDown =
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.code === "ERR_NETWORK" ||
      [502, 503, 504].includes(error.response?.status);

    // Failover: If primary backend is down/unreachable, switch to backup and retry once
    if (
      !IS_LOCAL &&
      isNetworkOrDown &&
      config &&
      !config._isRetryBackup &&
      activeBackendUrl === PRIMARY_BACKEND_URL
    ) {
      config._isRetryBackup = true;
      switchToBackupBackend();

      if (config.baseURL) {
        config.baseURL = `${SECONDARY_BACKEND_URL}/api`;
      }
      if (config.url && config.url.includes(PRIMARY_BACKEND_URL)) {
        config.url = config.url.replace(PRIMARY_BACKEND_URL, SECONDARY_BACKEND_URL);
      }

      console.info(`[API Failover] Retrying request on backup backend (${SECONDARY_BACKEND_URL})...`);
      return api(config);
    }

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
    if (response.data) {
      response.data = replaceLocalhostUrls(response.data);
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    const isNetworkOrDown =
      !error.response ||
      error.code === "ECONNABORTED" ||
      error.code === "ERR_NETWORK" ||
      [502, 503, 504].includes(error.response?.status);

    if (
      !IS_LOCAL &&
      isNetworkOrDown &&
      config &&
      !config._isRetryBackup &&
      activeBackendUrl === PRIMARY_BACKEND_URL
    ) {
      config._isRetryBackup = true;
      switchToBackupBackend();

      if (config.baseURL) {
        config.baseURL = `${SECONDARY_BACKEND_URL}/api`;
      }
      if (config.url && config.url.includes(PRIMARY_BACKEND_URL)) {
        config.url = config.url.replace(PRIMARY_BACKEND_URL, SECONDARY_BACKEND_URL);
      }

      console.info(`[Axios Failover] Retrying request on backup backend (${SECONDARY_BACKEND_URL})...`);
      return axios(config);
    }

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
  window.fetch = async function (input, init) {
    if (typeof input === "string" && input.startsWith("/api/")) {
      const baseDomain = getActiveBackendUrl();
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

      try {
        const res = await originalFetch.call(this, input, init);
        if (!res.ok && [502, 503, 504].includes(res.status) && activeBackendUrl === PRIMARY_BACKEND_URL && !IS_LOCAL) {
          switchToBackupBackend();
          const fallbackInput = input.replace(PRIMARY_BACKEND_URL, SECONDARY_BACKEND_URL);
          return originalFetch.call(this, fallbackInput, init);
        }
        return res;
      } catch (err) {
        if (!IS_LOCAL && activeBackendUrl === PRIMARY_BACKEND_URL) {
          switchToBackupBackend();
          const fallbackInput = input.replace(PRIMARY_BACKEND_URL, SECONDARY_BACKEND_URL);
          return originalFetch.call(this, fallbackInput, init);
        }
        throw err;
      }
    }
    return originalFetch.call(this, input, init);
  };
}

export default api;
