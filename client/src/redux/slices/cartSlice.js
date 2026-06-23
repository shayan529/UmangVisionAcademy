import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { API_ENDPOINTS } from "../../config/api.js";

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAvailableCourses = createAsyncThunk(
  "cart/fetchAvailable",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.COURSES.PUBLIC);
      const raw = Array.isArray(data)
        ? data
        : (data.courses ?? data.data ?? []);
      return raw.filter(Boolean);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get(API_ENDPOINTS.CART.GET);
      const courses = data.courses || [];
      return courses.map((c) =>
        typeof c === "object" && c !== null ? (c._id ?? c.id) : c,
      );
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async (courseId, { rejectWithValue }) => {
    try {
      const { data } = await api.post(API_ENDPOINTS.CART.ADD, { courseId });
      const courses = data.courses || [];
      return courses.map((c) =>
        typeof c === "object" && c !== null ? (c._id ?? c.id) : c,
      );
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (courseId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(API_ENDPOINTS.CART.REMOVE(courseId));
      const courses = data.courses || [];
      return courses.map((c) =>
        typeof c === "object" && c !== null ? (c._id ?? c.id) : c,
      );
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      await api.delete(API_ENDPOINTS.CART.CLEAR);
      return [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

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
  cartIds: [], // IDs of courses the user has added to their cart (fetched from MongoDB)

  availableCourses: [], // all courses fetched from backend
  availableLoading: false,

  checkoutLoading: false,
  checkoutSuccess: false, // true after successful enrollment
  enrolledIds: [], // course IDs that were just enrolled
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
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

      // ── fetchCart ────────────────────────────────────────────────────────
      .addCase(fetchCart.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cartIds = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── addToCart ────────────────────────────────────────────────────────
      .addCase(addToCart.pending, (state) => {
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.cartIds = action.payload;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── removeFromCart ───────────────────────────────────────────────────
      .addCase(removeFromCart.pending, (state) => {
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cartIds = action.payload;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ── clearCart ────────────────────────────────────────────────────────
      .addCase(clearCart.pending, (state) => {
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.cartIds = [];
      })
      .addCase(clearCart.rejected, (state, action) => {
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
        state.cartIds = [];
      })
      .addCase(checkoutAndEnroll.rejected, (state, action) => {
        state.checkoutLoading = false;
        state.error = action.payload;
      })

      // ── logout ───────────────────────────────────────────────────────────
      .addCase("auth/logout/fulfilled", (state) => {
        state.cartIds = [];
      });
  },
});

export const { clearCartError, resetCheckout } = cartSlice.actions;

export default cartSlice.reducer;
