import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api";

// Async thunks
export const submitApplication = createAsyncThunk(
  "applications/submitApplication",
  async (applicationData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/instructor-applications",
        applicationData,
        {
          headers: { "Content-Type": "multipart/form-data" }, // ← required for resume upload
        },
      );
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchApplications = createAsyncThunk(
  "applications/fetchApplications",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/instructor-applications");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const approveApplication = createAsyncThunk(
  "applications/approveApplication",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/instructor-applications/${id}/approve`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const fetchMyApplication = createAsyncThunk(
  "applications/fetchMyApplication",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/instructor-applications/me");
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

export const rejectApplication = createAsyncThunk(
  "applications/rejectApplication",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/instructor-applications/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const initialState = {
  applications: [],
  submitted: false,
  loading: false,
  myApplication: null,
  error: null,
  success: null,
};

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    resetSubmitted: (state) => {
      state.submitted = false;
    },
  },
  extraReducers: (builder) => {
    // Submit Application
    builder
      .addCase(submitApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.submitted = true;
        state.success = "Application submitted successfully!";
      })
      .addCase(submitApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Applications
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload; // ✅ was incorrectly setting myApplication = null
      });

    // Fetch My Application (was completely missing)
    builder
      .addCase(fetchMyApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.myApplication = action.payload; // ✅ was never being set
      })
      .addCase(fetchMyApplication.rejected, (state, action) => {
        state.loading = false;
        state.myApplication = null;
        state.error = action.payload;
      });

    // Approve Application
    builder
      .addCase(approveApplication.pending, (state) => {
        state.loading = true;
      })
      .addCase(approveApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = state.applications.filter(
          (a) => a._id !== action.payload._id,
        );
      })
      .addCase(approveApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Reject Application
    builder
      .addCase(rejectApplication.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = state.applications.filter(
          (a) => a._id !== action.meta.arg,
        );
      })
      .addCase(rejectApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, resetSubmitted } =
  applicationsSlice.actions;
export default applicationsSlice.reducer;
