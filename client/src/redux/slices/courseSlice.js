import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api.js";
import { clearAuth } from "./authSlice.js";

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.COURSES.LIST);
      const raw = Array.isArray(data)
        ? data
        : (data.courses ?? data.data ?? []);
      return raw.filter(Boolean);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchPublishedCourses = createAsyncThunk(
  "courses/fetchPublished",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.COURSES.PUBLIC, {
        params,
      });
      const raw = Array.isArray(data)
        ? data
        : (data.courses ?? data.data ?? []);
      return raw.filter(Boolean);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    condition: (params, { getState }) => {
      const { loading } = getState().courses || {};
      // If currently fetching without custom query params, skip duplicate fetch
      if (loading && (!params || Object.keys(params).length === 0)) {
        return false;
      }
      return true;
    },
  },
);

export const fetchEnrolledCourses = createAsyncThunk(
  "courses/fetchEnrolled",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.COURSES.ENROLLED); // e.g. "/courses/enrolled"
      const raw = Array.isArray(data)
        ? data
        : (data.courses ?? data.data ?? []);
      return raw.filter(Boolean);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const { user, isAuthenticated } = getState().auth || {};
      if (!token && !user && !isAuthenticated) {
        return false;
      }
      return true;
    },
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

export const fetchAllCoursesAdmin = createAsyncThunk(
  "courses/fetchAllAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/courses/admin/all");
      const raw = Array.isArray(data)
        ? data
        : (data.courses ?? data.data ?? []);
      return raw.filter(Boolean);
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

const PUBLISHED_COURSES_KEY = "published_courses_v1";

const loadPublishedCoursesCache = () => {
  try {
    const raw = localStorage.getItem(PUBLISHED_COURSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const persistPublishedCourses = (courses) => {
  try {
    if (Array.isArray(courses)) {
      localStorage.setItem(
        PUBLISHED_COURSES_KEY,
        JSON.stringify(courses.slice(0, 30)),
      );
    }
  } catch {
    // ignore
  }
};

const initialPublishedCourses = loadPublishedCoursesCache();

const initialState = {
  courses: initialPublishedCourses, // cached published courses for instant 0ms initial render
  enrolled: [], // courses the current student is enrolled in
  selectedCourse: null,
  loading: false,
  enrolledLoading: false,
  detailLoading: false,
  error: null,
  success: null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────

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

    /**
     * Call this when a student completes a lesson to optimistically update
     * progress in the UI without a full refetch.
     * Payload: { courseId: string, progress: number (0-100) }
     */
    updateEnrolledProgress: (state, { payload }) => {
      const course = state.enrolled.find(
        (c) => c._id === payload.courseId || c.id === payload.courseId,
      );
      if (course) course.progress = payload.progress;
    },
  },
  extraReducers: (builder) => {
    builder

      // ── fetchCourses ──────────────────────────────────────────────────────
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

      .addCase(fetchAllCoursesAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCoursesAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload; // reuses same courses array
      })
      .addCase(fetchAllCoursesAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchPublishedCourses.pending, (state) => {
        if (state.courses.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchPublishedCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
        persistPublishedCourses(action.payload);
      })
      .addCase(fetchPublishedCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── fetchEnrolledCourses ──────────────────────────────────────────────
      .addCase(fetchEnrolledCourses.pending, (state) => {
        state.enrolledLoading = true;
        state.error = null;
      })
      .addCase(fetchEnrolledCourses.fulfilled, (state, action) => {
        state.enrolledLoading = false;
        // Normalise: guarantee every enrolled course has a progress field
        state.enrolled = action.payload.map((c) => ({
          ...c,
          progress: c.progress ?? 0,
          completedLessons: c.completedLessons ?? 0,
          lastWatched: c.lastWatched ?? null,
          nextLesson: c.nextLesson ?? null,
        }));
      })
      .addCase(fetchEnrolledCourses.rejected, (state, action) => {
        state.enrolledLoading = false;
        state.error = action.payload;
      })

      // ── fetchCourseById ───────────────────────────────────────────────────
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

      // ── createCourse ──────────────────────────────────────────────────────
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?._id) state.courses.unshift(action.payload);
        state.success = "Course created successfully";
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── updateCourse ──────────────────────────────────────────────────────
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload?._id
          ? action.payload
          : (action.payload?.course ?? action.payload);
        state.courses = state.courses.map((c) =>
          c._id === updated._id ? updated : c,
        );
        if (state.selectedCourse?._id === updated._id)
          state.selectedCourse = updated;
        state.success = "Course updated successfully";
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ── deleteCourse ──────────────────────────────────────────────────────
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter((c) => c._id !== action.payload);
        state.enrolled = state.enrolled.filter((c) => c._id !== action.payload);
        if (state.selectedCourse?._id === action.payload)
          state.selectedCourse = null;
        state.success = "Course deleted successfully";
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear user-specific enrolled data on logout
      .addCase(clearAuth, (state) => {
        state.enrolled = [];
      });
  },
});

export const {
  clearCourseError,
  clearCourseSuccess,
  clearSelectedCourse,
  updateEnrolledProgress,
} = courseSlice.actions;

export default courseSlice.reducer;
