import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api";

// ── Persisted user cache ──────────────────────────────────────────────────────
// Store a slim copy of the user in localStorage so the auth state is
// immediately available on the next page load without waiting for /users/me.
// We only store the fields the UI actually needs for routing and display.
const USER_CACHE_KEY = "auth_user_v2";

const SLIM_FIELDS = [
  "_id", "name", "email", "phoneNumber", "avatarUrl",
  "role", "assignedRoles", "coins", "subscription",
  "selectedClass", "referralCode", "isActive",
  "enrolledCourses", "teachingCourses", "notificationSettings",
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
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
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

// Boot from localStorage so the UI renders immediately on refresh —
// no spinner, no /users/me round-trip before the page is usable.
const _cachedUser = loadUserCache();
const _hasToken = !!localStorage.getItem("authToken");

const initialState = {
  user: _cachedUser || null,
  // loading=false when we have a cached user (we background-refresh below).
  // loading=true only when there is no cached user and we must wait for /me.
  loading: !_cachedUser && _hasToken,
  error: null,
  isAuthenticated: !!(_cachedUser && _hasToken),
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
      }
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
        if (!state.isAuthenticated) {
          state.loading = true;
        }
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
} = authSlice.actions;
export default authSlice.reducer;
