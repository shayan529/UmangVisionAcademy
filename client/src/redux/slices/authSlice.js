import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api";

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

const initialState = {
  user: null,
  loading: true, // ← true on boot so ProtectedRoute shows spinner
  error: null,
  isAuthenticated: false,
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
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user ?? action.payload;
        state.isAuthenticated = true;
        persistToken(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Register ───────────────────────────────────────────────────────────
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user ?? action.payload;
        state.isAuthenticated = true;
        persistToken(action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Load current user (called on every page load / refresh) ───────────
    builder
      .addCase(loadCurrentUser.pending, (state) => {
        if (!state.isAuthenticated) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user ?? action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        // Session expired or no cookie/token — user must log in again
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        clearPersistedToken();
      });

    // ── Logout ─────────────────────────────────────────────────────────────
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      clearPersistedToken();
    });

    // ── Profile Updates ──────────────────────────────────────────────────
    builder.addCase("settings/updateProfile/fulfilled", (state, action) => {
      state.user = action.payload;
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
