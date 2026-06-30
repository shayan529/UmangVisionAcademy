import axios from "axios";

const getDefaultApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:5000/api";
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl();

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

// Global interceptor to sanitize 5xx (Internal Server Errors) and handle network errors cleanly on the frontend
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      // In production, sanitize 5xx (Server) errors to keep it clean and friendly for UI toasts
      if (status >= 500) {
        error.response.data = {
          ...error.response.data,
          message: "An unexpected server error occurred. Please try again later.",
        };
      }
    } else if (error.request) {
      // Network error (no response received)
      error.message = "Unable to connect to the server. Please check your internet connection.";
    }
    return Promise.reject(error);
  }
);

export default api;
