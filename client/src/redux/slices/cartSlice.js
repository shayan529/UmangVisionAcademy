import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api.js";

// ── Thunks ────────────────────────────────────────────────────────────────────

/**
 * Fetch all published courses available to add to cart.
 * Reuses the existing courses list endpoint.
 */
export const fetchAvailableCourses = createAsyncThunk(
  "cart/fetchAvailable",
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

/**
 * Enroll the current student in all courses currently in the cart.
 * POST /courses/enroll  — body: { courseIds: string[] }
 * Returns: { enrolled: string[], alreadyEnrolled: string[] }
 */
export const checkoutAndEnroll = createAsyncThunk(
  "cart/checkoutAndEnroll",
  async (courseIds, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API_ENDPOINTS.COURSES.ENROLL, {
        courseIds,
      });
      return data; // { enrolled, alreadyEnrolled, message }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  // IDs of courses the user has added to their cart (persisted to localStorage)
  cartIds: (() => {
    try {
      return JSON.parse(localStorage.getItem("cartIds") ?? "[]");
    } catch {
      return [];
    }
  })(),

  availableCourses: [], // all courses fetched from backend
  availableLoading: false,

  checkoutLoading: false,
  checkoutSuccess: false, // true after successful enrollment
  enrolledIds: [], // course IDs that were just enrolled
  error: null,
};

const persist = (ids) => localStorage.setItem("cartIds", JSON.stringify(ids));

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, { payload }) => {
      if (!state.cartIds.includes(payload)) {
        state.cartIds.push(payload);
        persist(state.cartIds);
      }
    },
    removeFromCart: (state, { payload }) => {
      state.cartIds = state.cartIds.filter((id) => id !== payload);
      persist(state.cartIds);
    },
    clearCart: (state) => {
      state.cartIds = [];
      persist([]);
    },
    clearCartError: (state) => {
      state.error = null;
    },
    resetCheckout: (state) => {
      state.checkoutSuccess = false;
      state.enrolledIds = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // ── fetchAvailableCourses ────────────────────────────────────────────
      .addCase(fetchAvailableCourses.pending, (state) => {
        state.availableLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableCourses.fulfilled, (state, action) => {
        state.availableLoading = false;
        state.availableCourses = action.payload;
      })
      .addCase(fetchAvailableCourses.rejected, (state, action) => {
        state.availableLoading = false;
        state.error = action.payload;
      })

      // ── checkoutAndEnroll ────────────────────────────────────────────────
      .addCase(checkoutAndEnroll.pending, (state) => {
        state.checkoutLoading = true;
        state.checkoutSuccess = false;
        state.error = null;
      })
      .addCase(checkoutAndEnroll.fulfilled, (state, action) => {
        state.checkoutLoading = false;
        state.checkoutSuccess = true;
        state.enrolledIds = action.payload.enrolled ?? [];
        // Clear cart after successful enrollment
        state.cartIds = [];
        persist([]);
      })
      .addCase(checkoutAndEnroll.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  clearCartError,
  resetCheckout,
} = cartSlice.actions;

export default cartSlice.reducer;
