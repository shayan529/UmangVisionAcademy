import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../config/api.js";

// ── Thunks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the current user's active subscription from the backend.
 * GET /billing/subscription
 */
export const fetchSubscription = createAsyncThunk(
  "billing/fetchSubscription",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/billing/subscription");
      return data; // { plan, status, startDate, endDate, razorpaySubscriptionId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

export const createOrder = createAsyncThunk(
  "billing/createOrder",
  async ({ planId, courseIds }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/billing/create-order", {
        planId,
        courseIds,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

/**
 * Verify the Razorpay payment signature on the backend and activate the plan.
 * POST /billing/verify-payment
 * body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId }
 */
export const verifyPayment = createAsyncThunk(
  "billing/verifyPayment",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/billing/verify-payment", payload);
      return data; // { subscription }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

/**
 * Cancel the active subscription.
 * POST /billing/cancel
 */
export const cancelSubscription = createAsyncThunk(
  "billing/cancel",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/billing/cancel");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
  subscription: null, // { plan, status, startDate, endDate }
  order: null, // current Razorpay order
  loading: false,
  orderLoading: false,
  paymentLoading: false,
  paymentSuccess: false,
  error: null,
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    clearBillingError: (state) => {
      state.error = null;
    },
    resetPaymentSuccess: (state) => {
      state.paymentSuccess = false;
    },
    clearOrder: (state) => {
      state.order = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // fetchSubscription
      .addCase(fetchSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.subscription = payload;
      })
      .addCase(fetchSubscription.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })

      // createOrder
      .addCase(createOrder.pending, (state) => {
        state.orderLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, { payload }) => {
        state.orderLoading = false;
        state.order = payload;
      })
      .addCase(createOrder.rejected, (state, { payload }) => {
        state.orderLoading = false;
        state.error = payload;
      })

      // verifyPayment
      .addCase(verifyPayment.pending, (state) => {
        state.paymentLoading = true;
        state.error = null;
        state.paymentSuccess = false;
      })
      .addCase(verifyPayment.fulfilled, (state, { payload }) => {
        state.paymentLoading = false;
        state.paymentSuccess = true;
        state.subscription = payload.subscription ?? state.subscription;
        state.order = null;
      })
      .addCase(verifyPayment.rejected, (state, { payload }) => {
        state.paymentLoading = false;
        state.error = payload;
      })

      // cancelSubscription
      .addCase(cancelSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.loading = false;
        state.subscription = null;
      })
      .addCase(cancelSubscription.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });
  },
});

export const { clearBillingError, resetPaymentSuccess, clearOrder } =
  billingSlice.actions;
export default billingSlice.reducer;
