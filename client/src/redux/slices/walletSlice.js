import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: BASE, withCredentials: true });

// ── Thunks ───────────────────────────────────────────────────────────────────

export const fetchWallet = createAsyncThunk(
    "wallet/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/wallet");
            return data; // { balance, transactions }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to fetch wallet.");
        }
    }
);

export const createDepositOrder = createAsyncThunk(
    "wallet/createOrder",
    async (amount, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/wallet/deposit/order", { amount });
            return data; // { orderId, amount, currency, keyId }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Failed to create order.");
        }
    }
);

export const verifyDeposit = createAsyncThunk(
    "wallet/verifyDeposit",
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/wallet/deposit/verify", payload);
            return data; // { message, balance }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Payment verification failed.");
        }
    }
);

export const mockDeposit = createAsyncThunk(
    "wallet/mockDeposit",
    async (amount, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/wallet/deposit/mock", { amount });
            return data; // { message, balance }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Mock deposit failed.");
        }
    }
);

export const payWithWallet = createAsyncThunk(
    "wallet/pay",
    async (courseId, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/wallet/pay", { courseId });
            return data; // { message, balance }
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Payment failed.");
        }
    }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const walletSlice = createSlice({
    name: "wallet",
    initialState: {
        balance: 0,
        transactions: [],
        loading: false,
        depositLoading: false,
        payLoading: false,
        error: null,
    },
    reducers: {
        clearWalletError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        // fetchWallet
        builder
            .addCase(fetchWallet.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchWallet.fulfilled, (state, { payload }) => {
                state.loading = false;
                state.balance = payload.balance;
                state.transactions = payload.transactions;
            })
            .addCase(fetchWallet.rejected, (state, { payload }) => {
                state.loading = false;
                state.error = payload;
            });

        // createDepositOrder — just loading state, result handled in component
        builder
            .addCase(createDepositOrder.pending, (state) => { state.depositLoading = true; state.error = null; })
            .addCase(createDepositOrder.fulfilled, (state) => { state.depositLoading = false; })
            .addCase(createDepositOrder.rejected, (state, { payload }) => {
                state.depositLoading = false;
                state.error = payload;
            });

        // verifyDeposit — update balance after successful payment
        builder
            .addCase(verifyDeposit.pending, (state) => { state.depositLoading = true; })
            .addCase(verifyDeposit.fulfilled, (state, { payload }) => {
                state.depositLoading = false;
                state.balance = payload.balance;
            })
            .addCase(verifyDeposit.rejected, (state, { payload }) => {
                state.depositLoading = false;
                state.error = payload;
            });

        // mockDeposit
        builder
            .addCase(mockDeposit.pending, (state) => { state.depositLoading = true; state.error = null; })
            .addCase(mockDeposit.fulfilled, (state, { payload }) => {
                state.depositLoading = false;
                state.balance = payload.balance;
            })
            .addCase(mockDeposit.rejected, (state, { payload }) => {
                state.depositLoading = false;
                state.error = payload;
            });

        // payWithWallet
        builder
            .addCase(payWithWallet.pending, (state) => { state.payLoading = true; state.error = null; })
            .addCase(payWithWallet.fulfilled, (state, { payload }) => {
                state.payLoading = false;
                state.balance = payload.balance;
            })
            .addCase(payWithWallet.rejected, (state, { payload }) => {
                state.payLoading = false;
                state.error = payload;
            });
    },
});

export const { clearWalletError } = walletSlice.actions;
export default walletSlice.reducer;