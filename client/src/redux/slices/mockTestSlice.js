// store/slices/mockTestSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = "/api/mock-tests";

// ── Thunks ──────────────────────────────────────────────────

export const fetchAvailableTests = createAsyncThunk(
  "mockTest/fetchAvailable",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await axios.get(`${BASE}?${params}`);
      return data.tests;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const startMockTest = createAsyncThunk(
  "mockTest/start",
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE}/${testId}/start`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const submitMockTest = createAsyncThunk(
  "mockTest/submit",
  async ({ attemptId, answers, timeTaken }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${BASE}/attempts/${attemptId}/submit`,
        { answers, timeTaken },
      );
      return data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchAttemptResult = createAsyncThunk(
  "mockTest/fetchResult",
  async (attemptId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE}/attempts/${attemptId}/result`);
      return data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchMyResults = createAsyncThunk(
  "mockTest/fetchMyResults",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE}/my-results`);
      return data.attempts;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchAnalytics = createAsyncThunk(
  "mockTest/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE}/analytics`);
      return data.analytics;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchLeaderboard = createAsyncThunk(
  "mockTest/fetchLeaderboard",
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE}/${testId}/leaderboard`);
      return data.leaderboard;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Instructor thunks ───────────────────────────────────────

export const createMockTest = createAsyncThunk(
  "mockTest/create",
  async (testData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${BASE}/instructor`, testData);
      return data.mockTest;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchInstructorTests = createAsyncThunk(
  "mockTest/fetchInstructorTests",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${BASE}/instructor/list`);
      return data.tests;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const togglePublishTest = createAsyncThunk(
  "mockTest/togglePublish",
  async (testId, { rejectWithValue }) => {
    try {
      const { data } = await axios.patch(`${BASE}/${testId}/publish`);
      return { testId, isPublished: data.isPublished };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const deleteMockTest = createAsyncThunk(
  "mockTest/delete",
  async (testId, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE}/${testId}`);
      return testId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Slice ────────────────────────────────────────────────────

const mockTestSlice = createSlice({
  name: "mockTest",
  initialState: {
    availableTests: [],
    instructorTests: [],
    activeTest: null, // { test, attemptId, startedAt, existingAnswers }
    currentResult: null, // detailed result after submit
    myResults: [],
    analytics: null,
    leaderboard: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearActiveTest: (state) => {
      state.activeTest = null;
      state.currentResult = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state) => {
      state.loading = true;
      state.error = null;
    };
    const setError = (state, action) => {
      state.loading = false;
      state.error = action.payload;
    };

    builder
      // Available tests
      .addCase(fetchAvailableTests.pending, setLoading)
      .addCase(fetchAvailableTests.fulfilled, (state, action) => {
        state.loading = false;
        state.availableTests = action.payload;
      })
      .addCase(fetchAvailableTests.rejected, setError)

      // Start test
      .addCase(startMockTest.pending, setLoading)
      .addCase(startMockTest.fulfilled, (state, action) => {
        state.loading = false;
        state.activeTest = action.payload;
      })
      .addCase(startMockTest.rejected, setError)

      // Submit test
      .addCase(submitMockTest.pending, setLoading)
      .addCase(submitMockTest.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResult = action.payload;
        state.activeTest = null;
      })
      .addCase(submitMockTest.rejected, setError)

      // Fetch result
      .addCase(fetchAttemptResult.pending, setLoading)
      .addCase(fetchAttemptResult.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResult = action.payload;
      })
      .addCase(fetchAttemptResult.rejected, setError)

      // My results
      .addCase(fetchMyResults.pending, setLoading)
      .addCase(fetchMyResults.fulfilled, (state, action) => {
        state.loading = false;
        state.myResults = action.payload;
      })
      .addCase(fetchMyResults.rejected, setError)

      // Analytics
      .addCase(fetchAnalytics.pending, setLoading)
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, setError)

      // Leaderboard
      .addCase(fetchLeaderboard.pending, setLoading)
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, setError)

      // Instructor: create
      .addCase(createMockTest.pending, setLoading)
      .addCase(createMockTest.fulfilled, (state, action) => {
        state.loading = false;
        state.instructorTests.unshift(action.payload);
      })
      .addCase(createMockTest.rejected, setError)

      // Instructor: list
      .addCase(fetchInstructorTests.pending, setLoading)
      .addCase(fetchInstructorTests.fulfilled, (state, action) => {
        state.loading = false;
        state.instructorTests = action.payload;
      })
      .addCase(fetchInstructorTests.rejected, setError)

      // Instructor: toggle publish
      .addCase(togglePublishTest.fulfilled, (state, action) => {
        const test = state.instructorTests.find(
          (t) => t._id === action.payload.testId,
        );
        if (test) test.isPublished = action.payload.isPublished;
      })

      // Instructor: delete
      .addCase(deleteMockTest.fulfilled, (state, action) => {
        state.instructorTests = state.instructorTests.filter(
          (t) => t._id !== action.payload,
        );
      });
  },
});

export const { clearActiveTest, clearError } = mockTestSlice.actions;
export default mockTestSlice.reducer;
