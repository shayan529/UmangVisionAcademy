import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { API_ENDPOINTS } from '../../config/api';

// ── Async thunks ──────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (values, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API_ENDPOINTS.AUTH.REGISTER, values);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const loadCurrentUser = createAsyncThunk(
  'auth/loadCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.AUTH.ME);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  loading: true, // ← true on boot so ProtectedRoute shows spinner
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserScoreAndSubmissions: (state, action) => {
      if (!state.user) return;
      state.user.score = action.payload.score ?? state.user.score;
      state.user.quizSubmissions =
        action.payload.quizSubmissions ?? state.user.quizSubmissions;
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
        state.user = action.payload;
        state.isAuthenticated = true;
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
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Load current user (called on every page load / refresh) ───────────
    builder
      .addCase(loadCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        // Session expired or no cookie — user must log in again
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });

    // ── Logout ─────────────────────────────────────────────────────────────
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    });

    // ── Profile Updates ──────────────────────────────────────────────────
    builder.addCase("settings/updateProfile/fulfilled", (state, action) => {
      state.user = action.payload;
    });
  },
});

export const { clearError, updateUserScoreAndSubmissions } = authSlice.actions;
export default authSlice.reducer;
