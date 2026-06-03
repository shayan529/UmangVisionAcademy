import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api, { API_ENDPOINTS } from "../../config/api.js";

// ── Thunks ──────────────────────────────────────────────────────────────────

export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.COURSES.LIST);
      // Handle: plain array, { courses: [] }, { data: [] }
      const raw = Array.isArray(data)
        ? data
        : (data.courses ?? data.data ?? []);
      // Filter out any null/undefined items so .map(c => c._id) never crashes
      return raw.filter(Boolean);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchCourseById = createAsyncThunk(
  "courses/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.COURSES.GET(id));
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const createCourse = createAsyncThunk(
  "courses/create",
  async (courseData, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API_ENDPOINTS.COURSES.CREATE, courseData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const updateCourse = createAsyncThunk(
  "courses/update",
  async ({ id, courseData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        API_ENDPOINTS.COURSES.UPDATE(id),
        courseData,
      );
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const deleteCourse = createAsyncThunk(
  "courses/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(API_ENDPOINTS.COURSES.DELETE(id));
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Initial State ────────────────────────────────────────────────────────────

const initialState = {
  courses: [], // all courses list
  selectedCourse: null, // single course detail
  loading: false,
  detailLoading: false, // separate loader for getCourseById
  error: null,
  success: null, // e.g. "Course created successfully"
};

// ── Slice ────────────────────────────────────────────────────────────────────

const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    clearCourseError: (state) => {
      state.error = null;
    },
    clearCourseSuccess: (state) => {
      state.success = null;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ── fetchCourses ──
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── fetchCourseById ──
      .addCase(fetchCourseById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
        state.selectedCourse = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })

      // ── createCourse ──
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?._id) {
          state.courses.unshift(action.payload);
        }
        state.success = "Course created successfully";
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── updateCourse ──
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        // Unwrap if needed
        const updated = action.payload?._id
          ? action.payload
          : (action.payload?.course ?? action.payload);
        state.courses = state.courses.map((c) =>
          c._id === updated._id ? updated : c,
        );
        if (state.selectedCourse?._id === updated._id) {
          state.selectedCourse = updated;
        }
        state.success = "Course updated successfully";
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── deleteCourse ──
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter((c) => c._id !== action.payload);
        if (state.selectedCourse?._id === action.payload) {
          state.selectedCourse = null;
        }
        state.success = "Course deleted successfully";
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ── Actions ──────────────────────────────────────────────────────────────────

export const { clearCourseError, clearCourseSuccess, clearSelectedCourse } =
  courseSlice.actions;

export default courseSlice.reducer;
