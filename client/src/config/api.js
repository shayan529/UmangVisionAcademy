import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

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
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
