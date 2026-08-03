import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api";

// ── Persisted user cache ──────────────────────────────────────────────────────
// Store a slim copy of the user in localStorage so the auth state is
// immediately available on the next page load without waiting for /users/me.
// We only store the fields the UI actually needs for routing and display.
const USER_CACHE_KEY = "auth_user_v2";
const USER_CACHE_TS_KEY = "auth_user_v2_ts"; // timestamp of last successful /me fetch
const ME_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes — skip /me if cache is younger

const SLIM_FIELDS = [
  "_id", "name", "email", "phoneNumber", "avatarUrl",
  "role", "assignedRoles", "coins", "subscription",
  "selectedClass", "referralCode", "isActive",
  "enrolledCourses", "teachingCourses", "notificationSettings",
  "earnedCertificates", "quizSubmissions", "courseProgress", "score",
  // Role-related fields hydrated server-side — must survive the cache round-trip
  // so the sidebar and permission gates work correctly on page reload without
  // waiting for the background /me fetch to complete.
  "dashboardModules", "basePermissions",
];

const slimUser = (user) => {
  if (!user) return null;
  const out = {};
  for (const key of SLIM_FIELDS) {
    if (key in user) out[key] = user[key];
  }
  return out;
};

export const persistUserCache = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(slimUser(user)));
      localStorage.setItem(USER_CACHE_TS_KEY, String(Date.now()));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
      localStorage.removeItem(USER_CACHE_TS_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export const loadUserCache = () => {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Async thunks ──────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const loginWithOtp = createAsyncThunk(
  "auth/loginWithOtp",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/users/login-otp", credentials);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (values, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API_ENDPOINTS.AUTH.REGISTER, values);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const loadCurrentUser = createAsyncThunk(
  "auth/loadCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.AUTH.ME);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
  {
    // Skip the network call if the locally-cached user is still fresh.
    // "Fresh" = fetched less than 5 minutes ago AND the role is already
    // hydrated (not a raw ObjectId). This avoids a blocking or background
    // /users/me call on every page load — saving ~300–800ms.
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("authToken") : null;
      const { user, isAuthenticated } = getState().auth;

      // Skip the network call if guest user has no token and no cached user state
      if (!token && !isAuthenticated && !user) {
        return false;
      }

      const role = user?.role;
      // Raw ObjectId string — must re-fetch to get hydrated role
      if (
        role &&
        typeof role === "string" &&
        !BASE_ROLE_STRINGS.has(role.toLowerCase()) &&
        IS_OBJECT_ID.test(role)
      ) return true;

      // If cache was fetched recently, skip the background refresh
      try {
        const ts = Number(localStorage.getItem(USER_CACHE_TS_KEY));
        if (ts && Date.now() - ts < ME_DEBOUNCE_MS) {
          return false;
        }
      } catch {
        // storage error — proceed with refresh
      }

      return true; // refresh background user state if token/user exists
    },
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      // Clear persisted client-side auth/token and AI chat state so a fresh
      // login starts with a clean AI conversation history.
      try {
        localStorage.removeItem("authToken");
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem("student-ai-chat-state-v1");
        localStorage.removeItem("instructor-ai-chat-state-v1");
        localStorage.removeItem("mobile-chat-role");
        localStorage.removeItem("desktop-ai-chat-state-v1");
      } catch (e) {
        // ignore storage failures
      }
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const IS_OBJECT_ID = /^[a-f0-9]{24}$/i;
const BASE_ROLE_STRINGS = new Set(["student", "instructor", "admin", "staff"]);

// If the cached user has an unpopulated ObjectId as their role, discard the
// cache so the app waits for the server to return the hydrated Role object.
const _rawCached = loadUserCache();
const _cachedRoleIsObjectId =
  _rawCached?.role &&
  typeof _rawCached.role === "string" &&
  !BASE_ROLE_STRINGS.has(_rawCached.role.toLowerCase()) &&
  IS_OBJECT_ID.test(_rawCached.role);

if (_cachedRoleIsObjectId) {
  persistUserCache(null); // wipe stale cache
}

const _cachedUser = _cachedRoleIsObjectId ? null : _rawCached;

const initialState = {
  user: _cachedUser || null,
  loading: false,
  error: null,
  isAuthenticated: !!_cachedUser,
};

// Login/Register responses now come back as { user, token } — the cookie is
// still set server-side for browser sessions, but we also persist the token
// locally so the axios interceptor (see config/api.js) can send it as a
// Bearer header. This is required for the Capacitor Android app, where
// cross-origin cookies from the native WebView aren't reliably sent/accepted.
const persistToken = (payload) => {
  if (payload?.token) {
    localStorage.setItem("authToken", payload.token);
  }
};

const clearPersistedToken = () => {
  localStorage.removeItem("authToken");
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserScoreAndSubmissions: (state, action) => {
      if (!state.user) return;
      const { score, coins, quizSubmissionUpdate, earnedCertificates } =
        action.payload;

      state.user.score = score ?? state.user.score;
      state.user.coins = coins ?? state.user.coins;

      if (quizSubmissionUpdate) {
        const subs = state.user.quizSubmissions ?? [];
        const idx = subs.findIndex(
          (s) =>
            s.courseId?.toString() ===
            quizSubmissionUpdate.courseId?.toString(),
        );
        if (idx !== -1) {
          if (quizSubmissionUpdate.score > subs[idx].score)
            subs[idx] = { ...subs[idx], ...quizSubmissionUpdate };
        } else {
          subs.push(quizSubmissionUpdate);
        }
        state.user.quizSubmissions = subs;
      }

      if (earnedCertificates) {
        state.user.earnedCertificates = earnedCertificates;
      }
    },
    setSelectedClass: (state, action) => {
      if (state.user) {
        state.user.selectedClass = action.payload;
      }
    },
    replaceCurrentUser: (state, action) => {
      if (action.payload?._id === state.user?._id) {
        state.user = action.payload;
        persistUserCache(action.payload);
      }
    },
    // Synchronously wipe auth state — call this before navigating away on
    // logout so ProtectedRoute doesn't race-redirect to /login first.
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      clearPersistedToken();
      persistUserCache(null);
    },
  },
  extraReducers: (builder) => {
    // ── Login ──────────────────────────────────────────────────────────────
    builder
      .addCase(login.pending, (state) => {
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload.user ?? action.payload;
        state.user = user;
        state.isAuthenticated = true;
        persistToken(action.payload);
        persistUserCache(user);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loginWithOtp.pending, (state) => {
        state.error = null;
      })
      .addCase(loginWithOtp.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload.user ?? action.payload;
        state.user = user;
        state.isAuthenticated = true;
        persistToken(action.payload);
        persistUserCache(user);
      })
      .addCase(loginWithOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Register ───────────────────────────────────────────────────────────
    builder
      .addCase(register.pending, (state) => {
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload.user ?? action.payload;
        state.user = user;
        state.isAuthenticated = true;
        persistToken(action.payload);
        persistUserCache(user);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Load current user ─────────────────────────────────────────────────
    // When a cached user exists this runs silently in the background —
    // loading stays false so the UI doesn't show a spinner.
    builder
      .addCase(loadCurrentUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload.user ?? action.payload;
        state.user = user;
        state.isAuthenticated = true;
        persistUserCache(user);
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        // Session expired or no cookie/token — clear everything
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        clearPersistedToken();
        persistUserCache(null);
      });

    // ── Logout ─────────────────────────────────────────────────────────────
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      clearPersistedToken();
      persistUserCache(null);
    });

    // ── Profile Updates ──────────────────────────────────────────────────
    builder.addCase("settings/updateProfile/fulfilled", (state, action) => {
      state.user = action.payload;
      persistUserCache(action.payload);
    });
  },
});

export const {
  clearError,
  updateUserScoreAndSubmissions,
  setSelectedClass,
  replaceCurrentUser,
  clearAuth,
} = authSlice.actions;
export default authSlice.reducer;
