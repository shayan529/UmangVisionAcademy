import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api.js";

export const fetchSessions = createAsyncThunk(
  "sessions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.SESSIONS.LIST);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const createSession = createAsyncThunk(
  "sessions/create",
  async (sessionData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        API_ENDPOINTS.SESSIONS.CREATE,
        sessionData,
      );
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const deleteSession = createAsyncThunk(
  "sessions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(API_ENDPOINTS.SESSIONS.DELETE(id));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const updateSession = createAsyncThunk(
  "sessions/update",
  async ({ id, sessionData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        API_ENDPOINTS.SESSIONS.UPDATE(id),
        sessionData,
      );
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

const initialState = {
  sessions: [],
  loading: false,
  error: null,
  success: null,
};

const sessionSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    clearSessionError: (state) => {
      state.error = null;
    },
    clearSessionSuccess: (state) => {
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        console.log("✅ sessions payload:", action.payload);

        // Handle: [], { sessions: [] }, { data: [] }, { data: { sessions: [] } }
        if (Array.isArray(payload)) {
          state.sessions = payload;
        } else if (Array.isArray(payload?.sessions)) {
          state.sessions = payload.sessions;
        } else if (Array.isArray(payload?.data)) {
          state.sessions = payload.data;
        } else if (Array.isArray(payload?.data?.sessions)) {
          state.sessions = payload.data.sessions;
        } else {
          state.sessions = [];
        }
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createSession
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading = false;
        const session =
          action.payload?.session ?? action.payload?.data ?? action.payload;
        state.sessions.push(session);
        state.success = "Session scheduled!";
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateSession
      .addCase(updateSession.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        state.loading = false;
        const updated =
          action.payload?.session ?? action.payload?.data ?? action.payload;
        if (updated?._id) {
          state.sessions = state.sessions.map((s) =>
            s._id === updated._id ? updated : s,
          );
        }
        state.success = "Session updated";
      })
      .addCase(updateSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // deleteSession
      .addCase(deleteSession.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = state.sessions.filter((s) => s._id !== action.payload);
        state.success = "Session removed";
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSessionError, clearSessionSuccess } = sessionSlice.actions;
export default sessionSlice.reducer;
